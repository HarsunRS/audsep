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

# ── SepFormer (Free voice isolation) ──────────────────────────────────────────
try:
    from speechbrain.inference.separation import SepformerSeparation
    import os
    SepformerSeparation.from_hparams(
        source="speechbrain/sepformer-wham",
        savedir=os.path.join(os.path.expanduser("~"), ".cache", "speechbrain", "sepformer-wham"),
        run_opts={"device": "cpu"},
    )
    print('Downloaded SepFormer model', flush=True)
except Exception as e:
    print(f'WARN: could not pre-download SepFormer: {e}', flush=True)

# ── Asteroid ConvTasNet (Pro voice isolation) ─────────────────────────────────
try:
    from asteroid.models import ConvTasNet
    ConvTasNet.from_pretrained("JorisCos/ConvTasNet_Libri2Mix_sepclean_16k")
    print('Downloaded Asteroid ConvTasNet model', flush=True)
except Exception as e:
    print(f'WARN: could not pre-download Asteroid model: {e}', flush=True)

sys.exit(0)
