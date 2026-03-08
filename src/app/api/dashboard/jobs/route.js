import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '../../../../../lib/supabase';
import { getDownloadUrl } from '../../../../../lib/storage';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServerClient();
  const { data: user } = await db.from('users').select('id').eq('clerk_id', userId).single();
  if (!user) return NextResponse.json([]);

  const { data: jobs } = await db
    .from('jobs')
    .select('id, status, output_urls, filename, model, category, error, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Generate signed URLs for done jobs
  const enriched = await Promise.all((jobs || []).map(async (job) => {
    let tracks = job.output_urls;
    if (job.status === 'done' && tracks && typeof tracks === 'object') {
      const signed = {};
      for (const [stem, path] of Object.entries(tracks)) {
        try { signed[stem] = await getDownloadUrl('outputs', path, 172800); }
        catch { signed[stem] = path; }
      }
      tracks = signed;
    }
    return { ...job, tracks, createdAt: job.created_at };
  }));

  return NextResponse.json(enriched);
}
