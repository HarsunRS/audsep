import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '../../../../../lib/supabase';

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

  // If output_urls contains storage paths, generate signed URLs
  let tracks = job.output_urls;
  if (job.status === 'done' && tracks) {
    const { getDownloadUrl } = await import('../../../../../lib/storage');
    const signed = {};
    for (const [stem, path] of Object.entries(tracks)) {
      try {
        signed[stem] = await getDownloadUrl('outputs', path, 172800); // 48h
      } catch {
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
