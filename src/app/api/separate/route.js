import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

// Build the venv path dynamically at runtime so Turbopack never statically sees
// the symlink path during bundling. We spit the literal string to prevent tracing.
function venvBin(name) {
    const suffix = ['', '.venv', 'bin', name].join('/');
    return process.cwd() + suffix;
}

/**
 * MODEL ROUTING:
 * category=music  -> Demucs (htdemucs, htdemucs_ft, htdemucs_6s, mdx_q)
 * category=noise  -> Facebook Denoiser (env & wind noise removal)
 * category=speech -> Demucs two-stems (vocal isolation, speaker focused)
 */

const cleanup = async (tempDir) => {
    if (tempDir) {
        try { await fs.rm(tempDir, { recursive: true, force: true }); } catch { }
    }
};

export async function POST(request) {
    let tempDir = null;
    let safeFilename = '';
    const uniqueId = Date.now().toString();

    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const model = formData.get('model') || 'htdemucs';
        const category = formData.get('category') || 'music';
        const vocalOnly = formData.get('vocalOnly') === 'true';
        const trimStart = parseFloat(formData.get('trimStart') || '0');
        const trimEnd = parseFloat(formData.get('trimEnd') || '0');

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audsep-'));
        const bytes = await file.arrayBuffer();
        safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        let inputFilePath = path.join(tempDir, safeFilename);
        await fs.writeFile(inputFilePath, Buffer.from(bytes));

        // If trim is requested, use ffmpeg to pre-cut the file
        if (trimEnd > trimStart && trimEnd > 0) {
            const trimmedPath = path.join(tempDir, 'trimmed_' + safeFilename);
            await new Promise((resolve, reject) => {
                const args = ['-i', inputFilePath, '-ss', String(trimStart)];
                if (trimEnd > 0) args.push('-to', String(trimEnd));
                args.push('-c', 'copy', '-y', trimmedPath);
                const p = spawn('ffmpeg', args);
                p.on('close', code => code === 0 ? resolve() : reject(new Error('ffmpeg trim failed')));
                p.on('error', reject);
            });
            inputFilePath = trimmedPath;
        }

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                const send = (obj) => controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

                try {
                    let outputFiles = {};

                    if (category === 'noise' || category === 'wind') {
                        // ── Facebook Denoiser ─────────────────────────────────────────────────────
                        // Converts to 16kHz wav first (denoiser requirement)
                        const monoWav = path.join(tempDir, 'mono.wav');
                        await new Promise((res, rej) => {
                            const p = spawn('ffmpeg', ['-i', inputFilePath, '-ar', '16000', '-ac', '1', '-y', monoWav]);
                            p.on('close', code => code === 0 ? res() : rej(new Error('ffmpeg resample failed')));
                            p.on('error', rej);
                        });

                        const denoiserOut = path.join(tempDir, 'enhanced');
                        await fs.mkdir(denoiserOut, { recursive: true });

                        const denoiserArgs = [
                            '-m', 'denoiser.enhance',
                            '--noisy_dir', path.dirname(monoWav),
                            '--out_dir', denoiserOut,
                            '--device', 'cpu',
                        ];
                        // Wind mode: use stronger model
                        if (category === 'wind') denoiserArgs.push('--dns64');

                        await new Promise((res, rej) => {
                            const p = spawn(venvBin('python'), denoiserArgs, { cwd: tempDir });
                            p.stderr.on('data', d => {
                                const txt = d.toString();
                                const m = txt.match(/(\d{1,3})%/);
                                if (m) send({ type: 'progress', percent: parseInt(m[1]) });
                            });
                            p.on('close', code => code === 0 ? res() : rej(new Error('Denoiser failed')));
                            p.on('error', rej);
                        });

                        // Denoiser outputs to enhanced/<filename>_enhanced.wav
                        const enhancedName = path.parse(path.basename(monoWav)).name + '_enhanced.wav';
                        const enhancedSrc = path.join(denoiserOut, enhancedName);

                        const publicDir = path.join(process.cwd(), 'public', 'outputs', uniqueId);
                        await fs.mkdir(publicDir, { recursive: true });
                        const destPath = path.join(publicDir, 'enhanced.wav');
                        await fs.copyFile(enhancedSrc, destPath);
                        outputFiles = { enhanced: `/outputs/${uniqueId}/enhanced.wav` };

                    } else {
                        // ── Demucs (music / speech / speaker) ────────────────────────────────────
                        const outDir = path.join(tempDir, 'out');
                        const demucsArgs = ['-n', model, '-o', outDir];

                        const speechModels = ['speech', 'speaker'];
                        if (vocalOnly || speechModels.includes(category)) {
                            demucsArgs.push('--two-stems', 'vocals');
                        }
                        demucsArgs.push(inputFilePath);

                        let lastPercent = -1;
                        await new Promise((res, rej) => {
                            const p = spawn(venvBin('demucs'), demucsArgs, { cwd: tempDir });
                            p.stderr.on('data', d => {
                                const txt = d.toString();
                                const m = txt.match(/[\s]?(\d{1,3})%\|/);
                                if (m) {
                                    const pct = parseInt(m[1]);
                                    if (pct !== lastPercent && pct <= 100) {
                                        lastPercent = pct;
                                        send({ type: 'progress', percent: pct });
                                    }
                                }
                            });
                            p.on('close', code => code === 0 ? res() : rej(new Error('Demucs failed')));
                            p.on('error', rej);
                        });

                        const modelOutDir = path.join(outDir, model, path.parse(path.basename(inputFilePath)).name);
                        const files = await fs.readdir(modelOutDir);
                        const publicDir = path.join(process.cwd(), 'public', 'outputs', uniqueId);
                        await fs.mkdir(publicDir, { recursive: true });

                        for (const f of files) {
                            await fs.copyFile(path.join(modelOutDir, f), path.join(publicDir, f));
                            outputFiles[path.parse(f).name] = `/outputs/${uniqueId}/${f}`;
                        }
                    }

                    send({ type: 'success', tracks: outputFiles });
                } catch (err) {
                    console.error('[API Error]', err);
                    send({ type: 'error', message: err.message });
                } finally {
                    controller.close();
                    await cleanup(tempDir);
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'application/x-ndjson',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        await cleanup(tempDir);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
