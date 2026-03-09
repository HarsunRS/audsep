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

# Also install facebook-denoiser manually in case it's missing from local requirements
RUN .venv/bin/pip install --no-cache-dir denoiser

# Copy the rest of the app into the container (excluding node_modules based on .dockerignore if it exists)
COPY . .

# Start the worker
CMD [".venv/bin/python", "worker.py"]
