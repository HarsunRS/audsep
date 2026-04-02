import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAndIncrementUsage } from '../../../../lib/usage';
import { createServerClient } from '../../../../lib/supabase';

const ALLOWED_CATEGORIES = ['music', 'speech', 'noise', 'wind'];

// Each model maps to the minimum tier required to use it.
// Music:   free=demucs_2stem, basic=htdemucs, pro=htdemucs_ft
// Speech:  free=sepformer,    basic=clearvoice, pro=asteroid
// Noise:   free=rnnoise,      basic=dns64,      pro=deepfilternet
const MODEL_TIERS = {
    'demucs_2stem':   'free',
    'htdemucs':       'basic',
    'htdemucs_ft':    'pro',
    'htdemucs_6s':    'basic',
    'htdemucs_hybrid':'pro',
    'sepformer':      'free',
    'sepformer_wsj':  'basic',
    'sepformer_pro':  'pro',
    'rnnoise':        'free',
    'dns64':          'basic',
    'deepfilternet':  'pro',
};
const ALLOWED_MODELS = Object.keys(MODEL_TIERS);
const TIER_ORDER = { free: 0, basic: 1, pro: 2 };

function planToTier(plan) {
    if (!plan || plan === 'free') return 'free';
    if (plan.startsWith('basic')) return 'basic';
    return 'pro'; // pro-monthly, pro-yearly, team
}

// Comma-separated Clerk user IDs that bypass usage limits (e.g. for testing).
// Set WHITELIST_CLERK_IDS in your .env.local or Railway environment variables.
const WHITELISTED_IDS = new Set(
  (process.env.WHITELIST_CLERK_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
);

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

    const isWhitelisted = WHITELISTED_IDS.has(userId);
    let usage;
    if (isWhitelisted) {
      // Whitelisted accounts get unlimited separations — skip the usage check entirely.
      // Still call the RPC to ensure the user row exists; just ignore the allowed flag.
      const fallback = await checkAndIncrementUsage(userId);
      usage = { ...fallback, allowed: true, limit: 9999 };
    } else {
      usage = await checkAndIncrementUsage(userId);
    }

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

    // Whitelist model and category to prevent injection of arbitrary values into the worker
    if (!ALLOWED_MODELS.includes(model)) {
      return NextResponse.json({ error: `Invalid model. Must be one of: ${ALLOWED_MODELS.join(', ')}` }, { status: 400 });
    }
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Invalid category. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}` }, { status: 400 });
    }

    // Enforce tier gating server-side — the UI locks models too, but this is the real gate
    const userTier = planToTier(usage.plan);
    const requiredTier = MODEL_TIERS[model] ?? 'pro';
    if (TIER_ORDER[userTier] < TIER_ORDER[requiredTier]) {
      return NextResponse.json({
        error: `Model "${model}" requires a ${requiredTier} plan. Upgrade to access it.`,
        upgrade: '/pricing',
      }, { status: 403 });
    }

    // Validate trim params as non-negative finite numbers to prevent FFmpeg argument injection
    const parsedTrimStart = parseFloat(trimStart);
    const parsedTrimEnd = parseFloat(trimEnd);
    if (!isFinite(parsedTrimStart) || parsedTrimStart < 0 ||
        !isFinite(parsedTrimEnd)   || parsedTrimEnd < 0) {
      return NextResponse.json({ error: 'trimStart and trimEnd must be non-negative numbers' }, { status: 400 });
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
      trim_start: parsedTrimStart || null,
      trim_end: (parsedTrimEnd > parsedTrimStart) ? parsedTrimEnd : null,
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
