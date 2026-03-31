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
RUN .venv/bin/python -c "\
from demucs.pretrained import get_model; \
get_model('mdx_extra_q'); \
get_model('mdx_extra'); \
get_model('htdemucs'); \
get_model('htdemucs_ft'); \
get_model('htdemucs_6s'); \
print('All models downloaded.')"

# Copy the rest of the app into the container
COPY . .

# Start the worker
CMD [".venv/bin/python", "worker.py"]
