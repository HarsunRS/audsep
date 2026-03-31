from demucs.pretrained import get_model

models = ['mdx_extra_q', 'mdx_extra', 'htdemucs', 'htdemucs_ft', 'htdemucs_6s']
failed = []

for m in models:
    try:
        get_model(m)
        print(f'Downloaded {m}', flush=True)
    except Exception as e:
        print(f'WARN: could not pre-download {m}: {e}', flush=True)
        failed.append(m)

if failed:
    print(f'WARNING: these models will be downloaded at runtime: {failed}', flush=True)
else:
    print('All models pre-downloaded successfully.', flush=True)
