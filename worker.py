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
  WORKER_CATEGORIES (optional, comma-separated, e.g. "music" or "noise,wind")
"""

import os, sys, time, json, subprocess, tempfile, shutil, pathlib, requests, threading
from http.server import HTTPServer, BaseHTTPRequestHandler

# ── Config ─────────────────────────────────────────────────────────────────────
SUPABASE_URL         = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip()
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
APP_URL              = os.environ.get("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
POLL_INTERVAL        = 5   # seconds between polls when queue is empty
JOB_TIMEOUT          = 600 # 10 minutes hard limit per job

# Which job categories this worker instance handles.
# Set via Railway service env var, e.g. "music" or "noise,wind".
# Defaults to all categories so a single un-configured worker still processes everything.
_raw_categories  = os.environ.get("WORKER_CATEGORIES", "music,speech,speaker,noise,wind")
WORKER_CATEGORIES = [c.strip() for c in _raw_categories.split(",") if c.strip()]

VALID_CATEGORIES = {"music", "speech", "speaker", "noise", "wind"}
_unknown = set(WORKER_CATEGORIES) - VALID_CATEGORIES
if _unknown:
    print(f"ERROR: Unknown categories in WORKER_CATEGORIES: {_unknown}")
    sys.exit(1)
if not WORKER_CATEGORIES:
    print("ERROR: WORKER_CATEGORIES is empty. Set it to e.g. 'music' or 'noise,wind'.")
    sys.exit(1)

# Use all available CPU cores for PyTorch/OpenMP thread pools — helps inference speed.
CPU_CORES = str(os.cpu_count() or 4)
os.environ.setdefault("OMP_NUM_THREADS",      CPU_CORES)
os.environ.setdefault("MKL_NUM_THREADS",      CPU_CORES)
os.environ.setdefault("OPENBLAS_NUM_THREADS", CPU_CORES)

# Cap parallel Demucs stem jobs at 2. --jobs N loads the full model N times in RAM
# simultaneously; on Railway (48 vCPUs but limited RAM) higher values cause SIGKILL.
DEMUCS_JOBS = "2"

VENV_BIN = pathlib.Path(__file__).parent / ".venv" / "bin"

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

def sb_rpc(func_name, params):
    """Call a Supabase Postgres RPC function. Returns list of rows."""
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/{func_name}",
        headers=HEADERS,
        json=params,
    )
    r.raise_for_status()
    return r.json() if r.content else []

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
            "subject": "Your stems are ready — AudSep",
            "html": f"""
                <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;">
                  <h1 style="font-size:24px;font-weight:900;color:#0a0a0a;">Your stems are ready, {name}!</h1>
                  <ul>{stem_list}</ul>
                  <a href="{APP_URL}/studio" style="display:inline-block;margin-top:20px;padding:12px 28px;
                     background:#111;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;">
                    Open Studio →</a>
                </div>"""
        }
    )

# ── Cancellable subprocess helper ─────────────────────────────────────────────
def run_cancellable(cmd, job_id, timeout=JOB_TIMEOUT):
    """
    Run cmd via Popen; poll the DB every 5 s for a 'cancelled' status.
    Kills the subprocess immediately if cancellation is detected.
    Returns 'cancelled' | 'done'. Raises on non-zero exit or timeout.
    """
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    start = time.time()
    while proc.poll() is None:
        elapsed = time.time() - start
        if elapsed > timeout:
            proc.kill()
            proc.wait()
            raise subprocess.TimeoutExpired(cmd, timeout)
        try:
            rows = sb_get("jobs", f"id=eq.{job_id}&select=status")
            if rows and rows[0].get("status") == "cancelled":
                proc.kill()
                proc.wait()
                return "cancelled"
        except Exception:
            pass  # DB hiccup — keep going
        time.sleep(5)
    if proc.returncode != 0:
        stderr_out = proc.stderr.read().decode(errors='replace') if proc.stderr else ''
        print(f"[worker] Demucs stderr:\n{stderr_out}")
        err = subprocess.CalledProcessError(proc.returncode, cmd)
        err.stderr = stderr_out
        raise err
    return "done"


# ── Job processor ──────────────────────────────────────────────────────────────
def process_job(job):
    job_id     = job["id"]
    user_id    = job["user_id"]
    # Normalise legacy/alias model names to actual Demucs model IDs
    MODEL_ALIASES = {
        "htdemucs_hybrid": "htdemucs_ft",  # Pro fine-tuned model
        "mdx_extra":       "mdx_extra",    # MDX v3 — available in demucs 4
    }
    raw_model  = job["model"] or "htdemucs"
    model      = MODEL_ALIASES.get(raw_model, raw_model)
    category   = job["category"] or "music"
    vocal_only = job.get("vocal_only", False)
    trim_start = job.get("trim_start") or 0
    trim_end   = job.get("trim_end") or 0
    input_url  = job["input_url"]
    filename   = job.get("filename", "audio.mp3")

    print(f"[worker] Processing job {job_id} — model={model}, category={category}")

    # ── Look up user plan for feature enforcement ──────────────────────────────
    plan_rows = sb_get("users", f"id=eq.{user_id}&select=plan")
    user_plan = plan_rows[0].get("plan", "free") if plan_rows else "free"

    # Duration limits per plan: free=5 min, basic=10 min, pro+=30 min
    def _plan_duration_limit(p):
        if not p or p == "free":            return 300
        if p.startswith("basic"):           return 600
        return 1800  # pro, team

    max_duration = _plan_duration_limit(user_plan)
    free_plan    = (not user_plan or user_plan == "free")

    # Job is already 'processing' — set by claim_job RPC atomically

    tmpdir = tempfile.mkdtemp(prefix="audsep-")
    try:
        # ── Download input ────────────────────────────────────────────────────
        audio_data = sb_download("inputs", input_url)
        safe_name  = filename.replace(" ", "_")
        raw_path   = os.path.join(tmpdir, safe_name)
        with open(raw_path, "wb") as f:
            f.write(audio_data)

        # ── Pre-convert to 44100 Hz stereo WAV (with optional trim) ─────────
        wav_path = os.path.join(tmpdir, "input.wav")
        ffmpeg_conv = ["ffmpeg", "-i", raw_path, "-ar", "44100", "-ac", "2"]
        if trim_end and trim_end > trim_start:
            ffmpeg_conv += ["-ss", str(trim_start), "-to", str(trim_end)]
        ffmpeg_conv += ["-y", wav_path]
        subprocess.run(ffmpeg_conv, check=True, capture_output=True, timeout=120)

        # ── Enforce duration limit ────────────────────────────────────────────
        dur_result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "csv=p=0", wav_path],
            capture_output=True, text=True, timeout=30,
        )
        audio_duration = float((dur_result.stdout.strip() or "0").split("\n")[0])
        if audio_duration > max_duration:
            limit_str = f"{max_duration // 60} min"
            raise ValueError(
                f"Audio is {int(audio_duration // 60)}m {int(audio_duration % 60)}s. "
                f"Your {user_plan or 'free'} plan supports up to {limit_str}. "
                f"Upgrade for longer files."
            )

        output_paths = {}

        if category in ("noise", "wind"):
            # ── Facebook denoiser ─────────────────────────────────────────────
            # Denoiser requires 16 kHz mono
            noisy_dir = os.path.join(tmpdir, "noisy")
            os.makedirs(noisy_dir, exist_ok=True)
            mono_wav = os.path.join(noisy_dir, "mono.wav")
            subprocess.run(
                ["ffmpeg", "-i", wav_path, "-ar", "16000", "-ac", "1", "-y", mono_wav],
                check=True, capture_output=True, timeout=60,
            )
            enhanced_dir = os.path.join(tmpdir, "enhanced")
            os.makedirs(enhanced_dir, exist_ok=True)
            cmd = [
                str(VENV_BIN / "python"), "-m", "denoiser.enhance",
                "--noisy_dir", noisy_dir,
                "--out_dir",   enhanced_dir,
                "--device",    "cpu",
            ]
            if category == "wind":
                cmd.append("--dns64")
            result = subprocess.run(cmd, capture_output=True, timeout=JOB_TIMEOUT)
            if result.returncode != 0:
                stderr_text = result.stderr.decode(errors='replace')
                print(f"[worker] denoiser stderr:\n{stderr_text}")
                raise RuntimeError(f"Denoiser failed (exit {result.returncode}):\n{stderr_text}")

            base         = pathlib.Path(mono_wav).stem
            enhanced_src = os.path.join(enhanced_dir, f"{base}_enhanced.wav")
            if free_plan:
                mp3_path = os.path.join(enhanced_dir, "enhanced.mp3")
                subprocess.run(
                    ["ffmpeg", "-i", enhanced_src, "-b:a", "192k", "-y", mp3_path],
                    check=True, capture_output=True, timeout=120,
                )
                storage_path = f"{user_id}/{job_id}/enhanced.mp3"
                with open(mp3_path, "rb") as f:
                    sb_upload("outputs", storage_path, f.read(), "audio/mpeg")
            else:
                storage_path = f"{user_id}/{job_id}/enhanced.wav"
                with open(enhanced_src, "rb") as f:
                    sb_upload("outputs", storage_path, f.read())
            output_paths["enhanced"] = storage_path

        else:
            # ── Demucs ────────────────────────────────────────────────────────
            out_dir = os.path.join(tmpdir, "out")
            cmd = [
                str(VENV_BIN / "demucs"),
                "-n", model,
                "-o", out_dir,
                # Process all stems in parallel threads — biggest speedup on CPU
                "--jobs", DEMUCS_JOBS,
                # Reduce overlap between segments (0.1 vs default 0.25)
                # Faster with negligible quality difference for most music
                "--overlap", "0.1",
            ]
            if vocal_only or category in ("speech", "speaker"):
                cmd += ["--two-stems", "vocals"]
            cmd.append(wav_path)

            result = run_cancellable(cmd, job_id)
            if result == "cancelled":
                print(f"[worker] Job {job_id} cancelled mid-processing.")
                return  # tmpdir cleaned up in finally

            base      = pathlib.Path(wav_path).stem  # "input"
            model_out = os.path.join(out_dir, model, base)
            for f_name in os.listdir(model_out):
                stem = pathlib.Path(f_name).stem
                src  = os.path.join(model_out, f_name)

                if free_plan:
                    # Free tier: convert output to MP3 (192kbps) before uploading
                    mp3_name = f"{stem}.mp3"
                    mp3_path = os.path.join(model_out, mp3_name)
                    subprocess.run(
                        ["ffmpeg", "-i", src, "-b:a", "192k", "-y", mp3_path],
                        check=True, capture_output=True, timeout=120,
                    )
                    storage_path = f"{user_id}/{job_id}/{mp3_name}"
                    with open(mp3_path, "rb") as f:
                        sb_upload("outputs", storage_path, f.read(), "audio/mpeg")
                else:
                    storage_path = f"{user_id}/{job_id}/{f_name}"
                    with open(src, "rb") as f:
                        sb_upload("outputs", storage_path, f.read())

                output_paths[stem] = storage_path

        # ── Mark done ─────────────────────────────────────────────────────────
        sb_patch("jobs", {
            "status": "done",
            "output_urls": output_paths,
        }, {"id": job_id})

        users = sb_get("users", f"id=eq.{user_id}&select=email,name")
        if users:
            u = users[0]
            send_stems_ready(u.get("email"), u.get("name", "there"), job_id, list(output_paths.keys()))

        print(f"[worker] Job {job_id} done — stems: {list(output_paths.keys())}")

    except subprocess.TimeoutExpired:
        msg = f"Processing timed out after {JOB_TIMEOUT // 60} minutes. Try a shorter clip or a lighter model."
        print(f"[worker] Job {job_id} timed out.")
        sb_patch("jobs", {"status": "failed", "error": msg}, {"id": job_id})

    except Exception as e:
        stderr_attr = getattr(e, 'stderr', None)
        if isinstance(stderr_attr, bytes):
            stderr_attr = stderr_attr.decode(errors='replace')
        detail = (stderr_attr or '').strip()
        msg = str(e) + (f"\n{detail}" if detail else '')
        print(f"[worker] Job {job_id} failed: {msg}")
        sb_patch("jobs", {"status": "failed", "error": msg[:2000]}, {"id": job_id})

    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

# ── Startup cleanup ────────────────────────────────────────────────────────────
def reset_stuck_jobs():
    """
    Reset 'processing' jobs for this worker's categories back to 'queued'.
    Scoped to WORKER_CATEGORIES so a restarting worker only reclaims jobs of
    its own type — other workers' active jobs are left untouched.
    """
    try:
        cats_qs = ",".join(WORKER_CATEGORIES)
        r = requests.patch(
            f"{SUPABASE_URL}/rest/v1/jobs?status=eq.processing&category=in.({cats_qs})",
            headers=HEADERS,
            json={"status": "queued"},
        )
        if r.ok:
            if r.status_code == 204 or not r.content:
                return
            reset = r.json()
            if reset:
                print(f"[worker] Reset {len(reset)} stuck {WORKER_CATEGORIES} job(s) back to queued.")
        else:
            print(f"[worker] Warning: could not reset stuck jobs: {r.text}")
    except Exception as e:
        print(f"[worker] Warning: reset_stuck_jobs error (non-fatal): {e}")

# ── Health check server (Railway health checks) ────────────────────────────────
class _HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")
    def log_message(self, *args):
        pass  # suppress noisy access logs

# ── Main poll loop ─────────────────────────────────────────────────────────────
def main():
    # Start health check HTTP server in background thread
    threading.Thread(
        target=lambda: HTTPServer(("0.0.0.0", 8080), _HealthHandler).serve_forever(),
        daemon=True,
    ).start()

    print(
        f"[worker] Started — categories={WORKER_CATEGORIES}, "
        f"{CPU_CORES} CPU cores, polling every {POLL_INTERVAL}s, timeout {JOB_TIMEOUT}s"
    )
    reset_stuck_jobs()

    backoff = POLL_INTERVAL
    while True:
        try:
            rows = sb_rpc("claim_job", {"p_categories": WORKER_CATEGORIES})
            backoff = POLL_INTERVAL  # reset on successful DB contact
            if rows:
                process_job(rows[0])
            else:
                time.sleep(POLL_INTERVAL)
        except KeyboardInterrupt:
            print("\n[worker] Shutting down.", flush=True)
            break
        except requests.HTTPError as e:
            # claim_job RPC not found (migration not run yet) — fall back to direct query
            if e.response is not None and e.response.status_code == 404:
                print("[worker] claim_job RPC not found — run supabase/migrations/005_claim_job.sql in Supabase. Falling back to direct poll.", flush=True)
                try:
                    cats = ",".join(WORKER_CATEGORIES)
                    jobs = sb_get("jobs", f"status=eq.queued&category=in.({cats})&order=created_at.asc&limit=1")
                    if jobs:
                        sb_patch("jobs", {"status": "processing"}, {"id": jobs[0]["id"]})
                        process_job(jobs[0])
                    else:
                        time.sleep(POLL_INTERVAL)
                except Exception as inner:
                    print(f"[worker] Fallback poll error: {inner}", flush=True)
                    time.sleep(POLL_INTERVAL)
            else:
                print(f"[worker] Poll error (retry in {backoff}s): {e}", flush=True)
                time.sleep(backoff)
                backoff = min(backoff * 2, 60)
        except Exception as e:
            print(f"[worker] Poll error (retry in {backoff}s): {e}", flush=True)
            time.sleep(backoff)
            backoff = min(backoff * 2, 60)  # cap at 60s

if __name__ == "__main__":
    main()
