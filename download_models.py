import sys

# ── Demucs stem separation models ─────────────────────────────────────────────
try:
    from demucs.pretrained import get_model
    for m in ['htdemucs', 'htdemucs_ft', 'htdemucs_6s']:
        try:
            get_model(m)
            print(f'Downloaded demucs model: {m}', flush=True)
        except Exception as e:
            print(f'WARN: could not pre-download {m}: {e}', flush=True)
except Exception as e:
    print(f'WARN: demucs import failed, models will download at runtime: {e}', flush=True)

# ── DeepFilterNet3 (Pro denoiser) ──────────────────────────────────────────────
try:
    from df.enhance import init_df
    init_df()
    print('Downloaded DeepFilterNet3 model', flush=True)
except Exception as e:
    print(f'WARN: could not pre-download DeepFilterNet3: {e}', flush=True)

# ── RNNoise (Free denoiser) — no model download needed, bundled in pyrnnoise ──
try:
    from pyrnnoise import RNNoise
    RNNoise(sample_rate=48000)
    print('RNNoise ready (model bundled in package)', flush=True)
except Exception as e:
    print(f'WARN: RNNoise init failed: {e}', flush=True)

# ── SpeechBrain SepFormer models (voice isolation) ────────────────────────────
try:
    import os
    from speechbrain.inference.separation import SepformerSeparation
    cache = os.path.expanduser("~/.cache/speechbrain")
    for name, source in [
        ("sepformer",     "speechbrain/sepformer-wham"),
        ("sepformer_wsj", "speechbrain/sepformer-wsj02mix"),
        ("sepformer_pro", "speechbrain/sepformer-whamr"),
    ]:
        try:
            SepformerSeparation.from_hparams(
                source=source,
                savedir=os.path.join(cache, name),
                run_opts={"device": "cpu"},
            )
            print(f'Downloaded {name} model', flush=True)
        except Exception as e:
            print(f'WARN: could not pre-download {name}: {e}', flush=True)
except Exception as e:
    print(f'WARN: speechbrain import failed: {e}', flush=True)

sys.exit(0)
