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

# Patch denoiser's audio.py for torchaudio 2.x (offset= → frame_offset=)
RUN .venv/bin/python -c "\
import inspect, denoiser.audio as da; \
p = inspect.getfile(da); \
src = open(p).read(); \
fixed = src.replace('torchaudio.load(str(file), offset=offset, num_frames=num_frames)', \
    'torchaudio.load(str(file), frame_offset=offset, num_frames=num_frames or -1)'); \
open(p, 'w').write(fixed); \
print('denoiser patch applied' if fixed != src else 'denoiser already compatible') \
"

# Pre-download all Demucs + DeepFilterNet3 model checkpoints so they are baked into the image
# and never re-downloaded at runtime.
COPY download_models.py .
RUN .venv/bin/python download_models.py

# Copy the rest of the app into the container
COPY . .

# Start the worker
ENV PYTHONUNBUFFERED=1
CMD [".venv/bin/python", "-u", "worker.py"]
