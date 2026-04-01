"""
Patch denoiser's audio.py for torchaudio 2.x compatibility.

torchaudio 2.x removed the 'offset' kwarg and renamed it 'frame_offset'.
The denoiser's Audioset.__getitem__ only used frame_offset for soundfile/sox_io
backends; with ffmpeg (default in 2.x) it called torchaudio.load(offset=...)
which raises TypeError.

Fix: replace the entire backend-conditional block with a single torchaudio.load
call that always uses frame_offset=.
"""
import inspect
import re
import sys

import denoiser.audio as da

path = inspect.getfile(da)
with open(path) as f:
    src = f.read()

# Check if already patched (our replacement string is present)
if 'frame_offset=offset' in src and 'get_audio_backend' not in src:
    print('patch_denoiser: already patched, nothing to do', flush=True)
    sys.exit(0)

# Use regex to match the backend-conditional block regardless of exact whitespace.
# Matches:
#   if torchaudio.get_audio_backend() in [...]:
#       out, sr = torchaudio.load(..., frame_offset=offset, num_frames=... )
#   else:
#       out, sr = torchaudio.load(..., offset=offset, num_frames=...)
pattern = re.compile(
    r"( +)if torchaudio\.get_audio_backend\(\)[^\n]+\n"
    r"(?:.*\n)+?"          # the frame_offset branch (multi-line)
    r" +else:\n"
    r"(?: +out, sr = torchaudio\.load\([^\n]+\n)",
    re.MULTILINE,
)

match = pattern.search(src)
if match:
    indent = match.group(1)
    replacement = (
        f"{indent}out, sr = torchaudio.load(str(file),\n"
        f"{indent}                          frame_offset=offset,\n"
        f"{indent}                          num_frames=num_frames or -1)\n"
    )
    src = src[:match.start()] + replacement + src[match.end():]
    with open(path, 'w') as f:
        f.write(src)
    print('patch_denoiser: patched denoiser/audio.py via regex (frame_offset fix applied)', flush=True)
else:
    # Fallback: direct string replacement of the offset= kwarg in the else branch only.
    # This handles the case where the regex didn't match but the old kwarg is still present.
    if ', offset=offset,' in src:
        src = src.replace(
            'out, sr = torchaudio.load(str(file), offset=offset, num_frames=num_frames)',
            'out, sr = torchaudio.load(str(file), frame_offset=offset, num_frames=num_frames or -1)',
        )
        # Also remove the now-dead if/else wrapper lines
        src = re.sub(
            r" +if torchaudio\.get_audio_backend\(\)[^\n]+\n"
            r"( +out, sr = torchaudio\.load\([^\n]+\n(?:.*frame_offset[^\n]+\n)?(?:.*num_frames[^\n]+\n)?)"
            r" +else:\n",
            r"\1",
            src,
        )
        with open(path, 'w') as f:
            f.write(src)
        print('patch_denoiser: patched via fallback string replace', flush=True)
    else:
        print('patch_denoiser: WARNING — could not find pattern to patch!', flush=True)
        print('patch_denoiser: printing audio.py for diagnosis:', flush=True)
        with open(path) as f:
            print(f.read(), flush=True)
        sys.exit(1)  # Fail the build so the problem is visible

sys.exit(0)
