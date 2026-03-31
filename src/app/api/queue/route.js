import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAndIncrementUsage } from '../../../../lib/usage';
import { createServerClient } from '../../../../lib/supabase';

/**
 * POST /api/queue
 * Body: { inputPath, filename, model, category, vocalOnly, trimStart, trimEnd }
 *
 * The audio file is already in Supabase Storage (uploaded directly from the browser).
 * This endpoint only creates a job row and returns { jobId }.
 * The Railway worker polls Supabase and processes the job.
 */
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const usage = await checkAndIncrementUsage(userId);
    if (!usage.allowed) {
      return NextResponse.json({
        error: 'Daily limit reached. Upgrade to Pro for unlimited separations.',
        used: usage.used,
        limit: usage.limit,
        upgrade: '/pricing',
      }, { status: 429 });
    }

    const body = await request.json();
    const { inputPath, filename, model = 'htdemucs', category = 'music', vocalOnly = false, trimStart = 0, trimEnd = 0 } = body;

    if (!inputPath) {
      return NextResponse.json({ error: 'inputPath is required' }, { status: 400 });
    }

    const db = createServerClient();

    const { data: job, error: jobError } = await db.from('jobs').insert({
      user_id: usage.userId,
      status: 'queued',
      model,
      category,
      vocal_only: vocalOnly,
      filename: filename || 'audio',
      input_url: inputPath,
    }).select().single();

    if (jobError || !job) {
      throw new Error(`Failed to create job: ${jobError?.message || 'Unknown error'}`);
    }

    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
      used: usage.used,
      limit: usage.limit,
    });
  } catch (error) {
    console.error('[API /queue] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
