import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '../../../../../lib/supabase';
import { getDownloadUrl } from '../../../../../lib/storage';

// DELETE /api/jobs/[id] — cancel a queued job (no-op if already processing/done)
export async function DELETE(req, { params }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServerClient();

  // Resolve the internal user id for this Clerk user
  const { data: user } = await db
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Cancel jobs that are queued or processing.
  // The worker polls for 'cancelled' every 5 s and kills Demucs if found.
  const { data: job, error } = await db
    .from('jobs')
    .update({ status: 'cancelled' })
    .eq('id', params.id)
    .eq('user_id', user.id)                    // ownership check
    .in('status', ['queued', 'processing'])    // allow cancelling mid-run
    .select('id, status')
    .single();

  if (error || !job) {
    return NextResponse.json(
      { error: 'Job not found, not owned by you, or already done/cancelled.' },
      { status: 409 }
    );
  }

  return NextResponse.json({ cancelled: true, id: job.id });
}

// GET /api/jobs/[id] — poll job status
export async function GET(req, { params }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServerClient();
  const { data: job, error } = await db
    .from('jobs')
    .select('id, status, output_urls, filename, model, category, error, created_at')
    .eq('id', params.id)
    .single();

  if (error || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  // If output_urls contains storage paths, generate signed URLs.
  // output_urls may arrive as a parsed object (jsonb) or as a JSON string
  // if the worker double-encoded it — handle both.
  let tracks = job.output_urls;
  if (typeof tracks === 'string') {
    try { tracks = JSON.parse(tracks); } catch { tracks = null; }
  }
  if (job.status === 'done' && tracks && typeof tracks === 'object') {
    const signed = {};
    for (const [stem, path] of Object.entries(tracks)) {
      try {
        signed[stem] = await getDownloadUrl('outputs', path, 172800); // 48h
      } catch (e) {
        console.error(`[jobs/${job.id}] signed URL failed for ${stem}:`, e.message);
        signed[stem] = path; // fallback to raw path
      }
    }
    tracks = signed;
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    tracks,
    filename: job.filename,
    model: job.model,
    error: job.error,
    createdAt: job.created_at,
  });
}
