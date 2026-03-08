import { NextResponse } from 'next/server';
import { validateApiKey } from '../../../../lib/apikeys';
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

// PUBLIC API — authenticated via x-api-key header
export async function POST(req) {
  const rawKey = req.headers.get('x-api-key');
  const keyData = await validateApiKey(rawKey);
  if (!keyData) return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 });

  // Get clerk_id from user_id
  const db = createServerClient();
  const { data: user } = await db.from('users').select('clerk_id, plan').eq('id', keyData.userId).single();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Usage enforcement
  const usage = await checkAndIncrementUsage(user.clerk_id);
  if (!usage.allowed) {
    return NextResponse.json({
      error: 'Daily limit reached',
      used: usage.used,
      limit: usage.limit,
      upgrade: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  const model = formData.get('model') || 'htdemucs';
  const category = formData.get('category') || 'music';
  const vocalOnly = formData.get('vocalOnly') === 'true';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  // Create job row
  const { data: job } = await db.from('jobs').insert({
    user_id: keyData.userId,
    status: 'queued',
    model,
    category,
    vocal_only: vocalOnly,
    filename: file.name,
  }).select().single();

  // Upload input to storage
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

  try {
    const storagePath = await uploadInput(keyData.userId, job.id, buffer, safeFilename);
    await db.from('jobs').update({ input_url: storagePath }).eq('id', job.id);
  } catch {
    // Fall back to local processing if storage not configured
  }

  return NextResponse.json({ jobId: job.id, status: 'queued' });
}
