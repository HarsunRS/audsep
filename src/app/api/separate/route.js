import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAndIncrementUsage } from '../../../../lib/usage';
import { uploadInput } from '../../../../lib/storage';
import { createServerClient } from '../../../../lib/supabase';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

function venvBin(name) {
  return process.cwd() + ['', '.venv', 'bin', name].join('/');
}

const cleanup = async (dir) => {
  if (dir) try { await fs.rm(dir, { recursive: true, force: true }); } catch { }
};

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // ── Usage enforcement ──────────────────────────────────────────────────────
  const usage = await checkAndIncrementUsage(userId);
  if (!usage.allowed) {
    return NextResponse.json({
      error: 'Daily limit reached. Upgrade to Pro for unlimited separations.',
      used: usage.used,
      limit: usage.limit,
      upgrade: '/pricing',
    }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const model = formData.get('model') || 'htdemucs';
  const category = formData.get('category') || 'music';
  const vocalOnly = formData.get('vocalOnly') === 'true';
  const trimStart = parseFloat(formData.get('trimStart') || '0');
  const trimEnd = parseFloat(formData.get('trimEnd') || '0');

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const db = createServerClient();

  // Create job record
  const { data: job, error: jobError } = await db.from('jobs').insert({
    user_id: usage.userId,
    status: 'queued',
    model,
    category,
    vocal_only: vocalOnly,
    filename: file.name,
  }).select().single();

  if (jobError || !job) {
    throw new Error(`Database error creating job: ${jobError?.message || 'Unknown'}`);
  }

  // Try uploading to Supabase Storage (falls back to local if unconfigured)
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  let useLocalMode = true;
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const storagePath = await uploadInput(usage.userId, job.id, buffer, safeFilename);
      await db.from('jobs').update({ input_url: storagePath }).eq('id', job.id);
      useLocalMode = false;
    }
  } catch (e) {
    console.warn('[separate] Storage upload failed, using local mode:', e.message);
  }

  if (useLocalMode) {
    // Process synchronously with streaming (original behavior, for dev without Supabase)
    return processLocally({ job, db, buffer, safeFilename, model, category, vocalOnly, trimStart, trimEnd, userId: usage.userId });
  }

  // Return job ID for polling
  return NextResponse.json({ jobId: job.id, status: 'queued', used: usage.used, limit: usage.limit });
  } catch (error) {
    console.error('[API separate] POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

async function processLocally({ job, db, buffer, safeFilename, model, category, vocalOnly, trimStart, trimEnd, userId }) {
  let tempDir = null;
  const uniqueId = Date.now().toString();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
      try {
        await db.from('jobs').update({ status: 'processing' }).eq('id', job.id);

        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audsep-'));
        let inputFilePath = path.join(tempDir, safeFilename);
        await fs.writeFile(inputFilePath, buffer);

        // Trim if requested
        if (trimEnd > trimStart && trimEnd > 0) {
          const trimmedPath = path.join(tempDir, 'trimmed_' + safeFilename);
          await new Promise((res, rej) => {
            const args = ['-i', inputFilePath, '-ss', String(trimStart), '-to', String(trimEnd), '-c', 'copy', '-y', trimmedPath];
            const p = spawn('ffmpeg', args);
            p.on('close', code => code === 0 ? res() : rej(new Error('ffmpeg trim failed')));
            p.on('error', rej);
          });
          inputFilePath = trimmedPath;
        }

        let outputFiles = {};

        if (category === 'noise' || category === 'wind') {
          const noisyDir = path.join(tempDir, 'noisy');
          await fs.mkdir(noisyDir, { recursive: true });
          const monoWav = path.join(noisyDir, 'mono.wav');
          await new Promise((res, rej) => {
            const p = spawn('ffmpeg', ['-i', inputFilePath, '-ar', '16000', '-ac', '1', '-y', monoWav]);
            p.on('close', code => code === 0 ? res() : rej(new Error('ffmpeg resample failed')));
            p.on('error', rej);
          });
          const denoiserOut = path.join(tempDir, 'enhanced');
          await fs.mkdir(denoiserOut, { recursive: true });
          const denoiserArgs = ['-m', 'denoiser.enhance', '--noisy_dir', noisyDir, '--out_dir', denoiserOut, '--device', 'cpu'];
          if (category === 'wind') denoiserArgs.push('--dns64');
          await new Promise((res, rej) => {
            const p = spawn(venvBin('python'), denoiserArgs, { cwd: tempDir });
            p.stderr.on('data', d => {
              const m = d.toString().match(/(\d{1,3})%/);
              if (m) send({ type: 'progress', percent: parseInt(m[1]) });
            });
            p.on('close', code => code === 0 ? res() : rej(new Error('Denoiser failed')));
            p.on('error', rej);
          });
          const enhancedName = path.parse(path.basename(monoWav)).name + '_enhanced.wav';
          const publicDir = path.join(process.cwd(), 'public', 'outputs', uniqueId);
          await fs.mkdir(publicDir, { recursive: true });
          await fs.copyFile(path.join(denoiserOut, enhancedName), path.join(publicDir, 'enhanced.wav'));
          outputFiles = { enhanced: `/outputs/${uniqueId}/enhanced.wav` };
        } else {
          const outDir = path.join(tempDir, 'out');
          const demucsArgs = ['-n', model, '-o', outDir];
          if (vocalOnly || ['speech', 'speaker'].includes(category)) demucsArgs.push('--two-stems', 'vocals');
          demucsArgs.push(inputFilePath);
          let lastPct = -1;
          await new Promise((res, rej) => {
            const p = spawn(venvBin('demucs'), demucsArgs, { cwd: tempDir });
            p.stderr.on('data', d => {
              const m = d.toString().match(/[\s]?(\d{1,3})%\|/);
              if (m) { const pct = parseInt(m[1]); if (pct !== lastPct && pct <= 100) { lastPct = pct; send({ type: 'progress', percent: pct }); } }
            });
            p.on('close', code => code === 0 ? res() : rej(new Error('Demucs failed')));
            p.on('error', rej);
          });
          const base = path.parse(path.basename(inputFilePath)).name;
          const modelOutDir = path.join(outDir, model, base);
          const files = await fs.readdir(modelOutDir);
          const publicDir = path.join(process.cwd(), 'public', 'outputs', uniqueId);
          await fs.mkdir(publicDir, { recursive: true });
          for (const f of files) {
            await fs.copyFile(path.join(modelOutDir, f), path.join(publicDir, f));
            outputFiles[path.parse(f).name] = `/outputs/${uniqueId}/${f}`;
          }
        }

        await db.from('jobs').update({ status: 'done', output_urls: outputFiles }).eq('id', job.id);
        send({ type: 'success', tracks: outputFiles, jobId: job.id });
      } catch (err) {
        console.error('[API Error]', err);
        await db.from('jobs').update({ status: 'failed', error: err.message }).eq('id', job.id);
        send({ type: 'error', message: err.message });
      } finally {
        controller.close();
        await cleanup(tempDir);
      }
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive' },
  });
}
