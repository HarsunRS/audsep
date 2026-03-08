import { createServerClient } from './supabase';

const FREE_LIMIT = 3; // separations per day for free tier

/**
 * Check if user is allowed to run a separation, and increment counter.
 * Returns { allowed, used, limit, plan }
 */
export async function checkAndIncrementUsage(clerkUserId) {
  const db = createServerClient();

  // Fetch user row
  const { data: user, error } = await db
    .from('users')
    .select('id, plan, credits_used_today, credits_reset_at')
    .eq('clerk_id', clerkUserId)
    .single();

  if (error || !user) {
    // Auto-create user row if missing (race condition on first call)
    const { data: newUser } = await db
      .from('users')
      .insert({ clerk_id: clerkUserId, plan: 'free', credits_used_today: 0, credits_reset_at: new Date().toISOString() })
      .select()
      .single();
    return { allowed: true, used: 0, limit: FREE_LIMIT, plan: 'free', userId: newUser?.id };
  }

  const plan = user.plan || 'free';
  const limit = plan === 'free' ? FREE_LIMIT : Infinity;

  // Reset counter if day has rolled over
  const lastReset = new Date(user.credits_reset_at);
  const now = new Date();
  const isNewDay =
    now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
    now.getUTCMonth() !== lastReset.getUTCMonth() ||
    now.getUTCDate() !== lastReset.getUTCDate();

  let used = isNewDay ? 0 : (user.credits_used_today || 0);

  if (plan !== 'free') {
    // Pro/Team: always allowed, but still track usage
    await db.from('users').update({ credits_used_today: used + 1, credits_reset_at: isNewDay ? now.toISOString() : user.credits_reset_at }).eq('id', user.id);
    return { allowed: true, used, limit, plan, userId: user.id };
  }

  if (used >= FREE_LIMIT) {
    return { allowed: false, used, limit, plan, userId: user.id };
  }

  // Increment
  await db.from('users').update({
    credits_used_today: used + 1,
    credits_reset_at: isNewDay ? now.toISOString() : user.credits_reset_at,
  }).eq('id', user.id);

  return { allowed: true, used: used + 1, limit, plan, userId: user.id };
}

/**
 * Get current usage for a user without incrementing
 */
export async function getUsage(clerkUserId) {
  const db = createServerClient();
  const { data: user } = await db
    .from('users')
    .select('plan, credits_used_today, credits_reset_at')
    .eq('clerk_id', clerkUserId)
    .single();

  if (!user) return { used: 0, limit: FREE_LIMIT, plan: 'free' };

  const plan = user.plan || 'free';
  const limit = plan === 'free' ? FREE_LIMIT : null;
  const lastReset = new Date(user.credits_reset_at);
  const now = new Date();
  const isNewDay = now.getUTCDate() !== lastReset.getUTCDate() || now.getUTCMonth() !== lastReset.getUTCMonth();
  const used = isNewDay ? 0 : (user.credits_used_today || 0);

  return { used, limit, plan };
}
