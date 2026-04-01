"""
Patch denoiser's audio.py for torchaudio 2.x compatibility.

torchaudio 2.x removed the 'offset' kwarg from torchaudio.load() and renamed it
'frame_offset'. The denoiser's Audioset.__getitem__ only uses frame_offset when the
backend is 'soundfile' or 'sox_io'; with ffmpeg (the default in 2.x) it falls into
the else branch and calls torchaudio.load(..., offset=offset) which raises TypeError.

Fix: always use frame_offset= regardless of backend.
"""
import inspect
import sys
import denoiser.audio as da

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
    print('patch_denoiser: patched denoiser/audio.py (frame_offset fix applied)', flush=True)
else:
    print('patch_denoiser: pattern not found — already patched or layout changed', flush=True)

sys.exit(0)
