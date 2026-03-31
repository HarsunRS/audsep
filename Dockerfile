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

# Pre-download all Demucs model checkpoints so they are baked into the image
# and never re-downloaded at runtime.
# Models by tier:
#   free:  mdx_extra_q, mdx_extra
#   basic: htdemucs, htdemucs_ft
#   pro:   htdemucs_6s  (htdemucs_hybrid reuses htdemucs weights)
RUN .venv/bin/python - <<'EOF'
from demucs.pretrained import get_model
for m in ['mdx_extra_q', 'mdx_extra', 'htdemucs', 'htdemucs_ft', 'htdemucs_6s']:
    try:
        get_model(m)
        print(f'Downloaded {m}')
    except Exception as e:
        print(f'WARN: could not download {m}: {e}')
print('Model pre-download complete.')
EOF

# Copy the rest of the app into the container
COPY . .

# Start the worker
CMD [".venv/bin/python", "worker.py"]
