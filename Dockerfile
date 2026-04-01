FROM python:3.11-slim

# Install system dependencies (ffmpeg is necessary for demucs/denoiser)
RUN apt-get update && apt-get install -y ffmpeg git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements file explicitly
COPY requirements.txt .

# Create a virtual environment so worker.py knows where to find its binaries (e.g. \`.venv/bin/demucs\`)
RUN python -m venv .venv

# Install dependencies into the virtual environment
RUN .venv/bin/pip install --no-cache-dir -r requirements.txt

# Patch denoiser's audio.py: torchaudio 2.x removed the 'offset' kwarg and renamed
# it to 'frame_offset'. The denoiser's old code only uses frame_offset when the
# backend is 'soundfile' or 'sox_io'; with ffmpeg (default in 2.x) it falls into
# the else branch with the removed 'offset' kwarg, causing a TypeError at runtime.
RUN .venv/bin/python - <<'PYEOF'
import inspect, denoiser.audio as da
path = inspect.getfile(da)
with open(path) as f:
    src = f.read()
old = (
    "            if torchaudio.get_audio_backend() in ['soundfile', 'sox_io']:\n"
    "                out, sr = torchaudio.load(str(file),\n"
    "                                          frame_offset=offset,\n"
    "                                          num_frames=num_frames or -1)\n"
    "            else:\n"
    "                out, sr = torchaudio.load(str(file), offset=offset, num_frames=num_frames)\n"
)
new = (
    "            out, sr = torchaudio.load(str(file),\n"
    "                                      frame_offset=offset,\n"
    "                                      num_frames=num_frames or -1)\n"
)
if old in src:
    src = src.replace(old, new)
    with open(path, 'w') as f:
        f.write(src)
    print('Patched denoiser audio.py: replaced offset= with frame_offset=')
else:
    print('WARN: denoiser patch pattern not found — may already be fixed or layout changed')
PYEOF

# Pre-download all Demucs model checkpoints so they are baked into the image
# and never re-downloaded at runtime.
COPY download_models.py .
RUN .venv/bin/python download_models.py

# Copy the rest of the app into the container
COPY . .

# Start the worker
CMD [".venv/bin/python", "worker.py"]
