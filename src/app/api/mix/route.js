import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

const runCommand = (command, args, cwd) => {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, { cwd });
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (data) => { stdout += data.toString(); });
        proc.stderr.on('data', (data) => { stderr += data.toString(); });
        proc.on('close', (code) => {
            if (code === 0) resolve(stdout);
            else reject(new Error(`Process exited with code ${code}\nStderr: ${stderr}`));
        });
        proc.on('error', reject);
    });
};

export async function POST(request) {
    // ── Auth check ────────────────────────────────────────────────────────────
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { tracks } = await request.json();
        if (!tracks || !tracks.length) {
            return NextResponse.json({ error: 'No tracks provided' }, { status: 400 });
        }

        // ── Validate and sanitize each track ─────────────────────────────────
        const publicRoot = path.resolve(process.cwd(), 'public');
        const inputFiles = [];

        for (const t of tracks) {
            // Volume must be a finite number between 0 and 2
            const vol = parseFloat(t.volume);
            if (!isFinite(vol) || vol < 0 || vol > 2) {
                return NextResponse.json({ error: 'Invalid volume value' }, { status: 400 });
            }

            // Resolve path and ensure it stays within public/
            const resolved = path.resolve(publicRoot, t.url.replace(/^\//, ''));
            if (!resolved.startsWith(publicRoot + path.sep) && resolved !== publicRoot) {
                return NextResponse.json({ error: 'Invalid track path' }, { status: 400 });
            }

            inputFiles.push({ ...t, volume: vol, localPath: resolved });
        }

        for (const file of inputFiles) {
            try {
                await fs.access(file.localPath);
            } catch {
                throw new Error(`Track file not found: ${file.localPath}`);
            }
        }

        const uniqueId = Date.now().toString();
        const publicOutputDir = path.join(process.cwd(), 'public', 'outputs', 'mixes');
        await fs.mkdir(publicOutputDir, { recursive: true });
        const outputPath = path.join(publicOutputDir, `mix_${uniqueId}.wav`);

        const ffmpegArgs = [];
        inputFiles.forEach(f => { ffmpegArgs.push('-i', f.localPath); });

        let filterStr = '';
        let amixInputs = '';
        inputFiles.forEach((f, i) => {
            // volume is validated as a number above — safe to interpolate
            filterStr += `[${i}:a]volume=${f.volume}[a${i}];`;
            amixInputs += `[a${i}]`;
        });
        filterStr += `${amixInputs}amix=inputs=${inputFiles.length}:normalize=0[aout]`;

        ffmpegArgs.push('-filter_complex', filterStr);
        ffmpegArgs.push('-map', '[aout]');
        ffmpegArgs.push('-y', outputPath);

        await runCommand('ffmpeg', ffmpegArgs, process.cwd());

        return NextResponse.json({ success: true, url: `/outputs/mixes/mix_${uniqueId}.wav` });

    } catch (error) {
        console.error('Error in mix API:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
