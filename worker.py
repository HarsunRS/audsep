#!/usr/bin/env python3
"""
AudSep Worker — polls Supabase for queued jobs, runs Demucs/denoiser,
uploads output stems to Supabase Storage, marks job done.

Run with:
  source .venv/bin/activate
  python worker.py

Requires env vars (copy from .env.local):
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  RESEND_API_KEY (optional, for stems-ready emails)
  NEXT_PUBLIC_APP_URL (optional)
"""

import os, sys, time, json, subprocess, tempfile, shutil, pathlib, requests, hashlib

# ── Config ─────────────────────────────────────────────────────────────────────
SUPABASE_URL         = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
APP_URL              = os.environ.get("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
POLL_INTERVAL        = 5  # seconds
VENV_BIN             = pathlib.Path(__file__).parent / ".venv" / "bin"

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
    sys.exit(1)

# ── Supabase REST helpers ──────────────────────────────────────────────────────
HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

def sb_get(table, params=""):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?{params}", headers=HEADERS)
    r.raise_for_status()
    return r.json()

def sb_patch(table, val_dict, match_dict):
    match_qs = "&".join(f"{k}=eq.{v}" for k, v in match_dict.items())
    r = requests.patch(f"{SUPABASE_URL}/rest/v1/{table}?{match_qs}", headers=HEADERS, json=val_dict)
    r.raise_for_status()

def sb_download(bucket, path):
    r = requests.get(
        f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}",
        headers={"Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"}
    )
    r.raise_for_status()
    return r.content

def sb_upload(bucket, path, data, content_type="audio/wav"):
    r = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}",
        headers={
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": content_type,
            "x-upsert": "true",
        },
        data=data,
    )
    r.raise_for_status()

# ── Email helper ───────────────────────────────────────────────────────────────
def send_stems_ready(email, name, job_id, stem_names):
    resend_key = os.environ.get("RESEND_API_KEY")
    if not resend_key or not email:
        return
    from_email = os.environ.get("RESEND_FROM_EMAIL", "noreply@audsep.com")
    stem_list = "".join(f"<li>{s}</li>" for s in stem_names)
    requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {resend_key}", "Content-Type": "application/json"},
        json={
            "from": f"AudSep <{from_email}>",
            "to": [email],
            "subject": "🎛️ Your stems are ready — AudSep",
            "html": f"""
                <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;">
                  <h1 style="font-size:24px;font-weight:900;color:#0a0a0a;">Your stems are ready, {name}!</h1>
                  <ul>{stem_list}</ul>
                  <a href="{APP_URL}/dashboard" style="display:inline-block;margin-top:20px;padding:12px 28px;
                     background:#111;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;">
                    View in Dashboard →</a>
                </div>"""
        }
    )

# ── Job processor ──────────────────────────────────────────────────────────────
def process_job(job):
    job_id    = job["id"]
    user_id   = job["user_id"]
    model     = job["model"] or "htdemucs"
    category  = job["category"] or "music"
    vocal_only = job.get("vocal_only", False)
    input_url = job["input_url"]
    filename  = job.get("filename", "audio.mp3")

    print(f"[worker] Processing job {job_id} — model={model}, category={category}")

    # Mark processing
    sb_patch("jobs", {"status": "processing"}, {"id": job_id})

    tmpdir = tempfile.mkdtemp(prefix="audsep-")
    try:
        # Download input from Supabase Storage
        audio_data = sb_download("inputs", input_url)
        safe_name = filename.replace(" ", "_")
        input_path = os.path.join(tmpdir, safe_name)
        with open(input_path, "wb") as f:
            f.write(audio_data)

        output_paths = {}

        if category in ("noise", "wind"):
            # Facebook denoiser
            mono_wav = os.path.join(tmpdir, "mono.wav")
            subprocess.run(["ffmpeg", "-i", input_path, "-ar", "16000", "-ac", "1", "-y", mono_wav], check=True, capture_output=True)
            enhanced_dir = os.path.join(tmpdir, "enhanced")
            os.makedirs(enhanced_dir, exist_ok=True)
            cmd = [str(VENV_BIN / "python"), "-m", "denoiser.enhance",
                   "--noisy_dir", os.path.dirname(mono_wav),
                   "--out_dir", enhanced_dir, "--device", "cpu"]
            if category == "wind":
                cmd.append("--dns64")
            subprocess.run(cmd, check=True, capture_output=True)
            base = pathlib.Path(mono_wav).stem
            enhanced_src = os.path.join(enhanced_dir, f"{base}_enhanced.wav")
            storage_path = f"{user_id}/{job_id}/enhanced.wav"
            with open(enhanced_src, "rb") as f:
                sb_upload("outputs", storage_path, f.read())
            output_paths["enhanced"] = storage_path
        else:
            # Demucs
            out_dir = os.path.join(tmpdir, "out")
            cmd = [str(VENV_BIN / "demucs"), "-n", model, "-o", out_dir]
            if vocal_only or category in ("speech", "speaker"):
                cmd += ["--two-stems", "vocals"]
            cmd.append(input_path)
            subprocess.run(cmd, check=True)

            base = pathlib.Path(input_path).stem
            model_out = os.path.join(out_dir, model, base)
            for f_name in os.listdir(model_out):
                stem = pathlib.Path(f_name).stem
                src = os.path.join(model_out, f_name)
                storage_path = f"{user_id}/{job_id}/{f_name}"
                with open(src, "rb") as f:
                    sb_upload("outputs", storage_path, f.read())
                output_paths[stem] = storage_path

        # Mark done
        sb_patch("jobs", {
            "status": "done",
            "output_urls": json.dumps(output_paths),
        }, {"id": job_id})

        # Send email
        users = sb_get("users", f"id=eq.{user_id}&select=email,name")
        if users:
            u = users[0]
            send_stems_ready(u.get("email"), u.get("name", "there"), job_id, list(output_paths.keys()))

        print(f"[worker] ✓ Job {job_id} done — stems: {list(output_paths.keys())}")

    except Exception as e:
        print(f"[worker] ✗ Job {job_id} failed: {e}")
        sb_patch("jobs", {"status": "failed", "error": str(e)}, {"id": job_id})
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

# ── Main poll loop ─────────────────────────────────────────────────────────────
def main():
    print(f"[worker] Started — polling every {POLL_INTERVAL}s")
    while True:
        try:
            jobs = sb_get("jobs", "status=eq.queued&order=created_at.asc&limit=1")
            if jobs:
                process_job(jobs[0])
            else:
                time.sleep(POLL_INTERVAL)
        except KeyboardInterrupt:
            print("\n[worker] Shutting down.")
            break
        except Exception as e:
            print(f"[worker] Poll error: {e}")
            time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
