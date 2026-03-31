import sys

try:
    from demucs.pretrained import get_model

    models = ['htdemucs', 'htdemucs_ft', 'htdemucs_6s']
    for m in models:
        try:
            get_model(m)
            print(f'Downloaded {m}', flush=True)
        except Exception as e:
            print(f'WARN: could not pre-download {m}: {e}', flush=True)

    print('Model pre-download complete.', flush=True)

except Exception as e:
    print(f'WARN: demucs import failed, models will download at runtime: {e}', flush=True)

try:
    import denoiser.pretrained as dp

    for name, loader in [('master64 (default denoiser)', dp.master64), ('dns64 (wind denoiser)', dp.dns64)]:
        try:
            loader()
            print(f'Downloaded denoiser model: {name}', flush=True)
        except Exception as e:
            print(f'WARN: could not pre-download denoiser {name}: {e}', flush=True)

except Exception as e:
    print(f'WARN: denoiser import failed, model will download at runtime: {e}', flush=True)

sys.exit(0)
