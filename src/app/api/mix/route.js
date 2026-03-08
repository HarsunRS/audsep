import { NextResponse } from 'next/server';
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
    try {
        const { tracks } = await request.json();
        if (!tracks || !tracks.length) {
            return NextResponse.json({ error: 'No tracks provided' }, { status: 400 });
        }

        const inputFiles = tracks.map(t => ({
            ...t,
            // Convert public path like /outputs/timestamp/vocals.wav to absolute OS path
            localPath: path.join(process.cwd(), 'public', t.url.replace(/^\//, ''))
        }));

        for (const file of inputFiles) {
            try {
                await fs.access(file.localPath);
            } catch (e) {
                throw new Error(`Track file not found: ${file.localPath}`);
            }
        }

        const uniqueId = Date.now().toString();
        const publicOutputDir = path.join(process.cwd(), 'public', 'outputs', 'mixes');
        await fs.mkdir(publicOutputDir, { recursive: true });

        const outputPath = path.join(publicOutputDir, `mix_${uniqueId}.wav`);

        const ffmpegArgs = [];
        inputFiles.forEach(f => {
            ffmpegArgs.push('-i', f.localPath);
        });

        let filterStr = '';
        let amixInputs = '';
        inputFiles.forEach((f, i) => {
            filterStr += `[${i}:a]volume=${f.volume}[a${i}];`;
            amixInputs += `[a${i}]`;
        });
        filterStr += `${amixInputs}amix=inputs=${inputFiles.length}:normalize=0[aout]`;

        ffmpegArgs.push('-filter_complex', filterStr);
        ffmpegArgs.push('-map', '[aout]');
        ffmpegArgs.push('-y', outputPath);

        console.log(`Running ffmpeg with args: ${ffmpegArgs.join(' ')}`);
        await runCommand('ffmpeg', ffmpegArgs, process.cwd());

        const mixUrl = `/outputs/mixes/mix_${uniqueId}.wav`;

        return NextResponse.json({ success: true, url: mixUrl });

    } catch (error) {
        console.error('Error in mix API:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
