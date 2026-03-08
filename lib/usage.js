import { createServerClient } from './supabase';

const LIMITS = {
  free: 2,       // per day
  basic: 30,     // per month
  pro: 100,      // per month
  team: 300,    // per month
};

function getResetScope(plan, lastResetDate) {
  const now = new Date();
  const last = new Date(lastResetDate);

  if (plan === 'free') {
    // Reset daily
    return now.getUTCFullYear() !== last.getUTCFullYear() ||
           now.getUTCMonth() !== last.getUTCMonth() ||
           now.getUTCDate() !== last.getUTCDate();
  } else {
    // Reset monthly (Basic, Pro, Team)
    return now.getUTCFullYear() !== last.getUTCFullYear() ||
           now.getUTCMonth() !== last.getUTCMonth();
  }
}

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
    // Auto-create user row if missing
    const { data: newUser } = await db
      .from('users')
      .insert({ clerk_id: clerkUserId, plan: 'free', credits_used_today: 0, credits_reset_at: new Date().toISOString() })
      .select()
      .single();
    return { allowed: true, used: 1, limit: LIMITS.free, plan: 'free', userId: newUser?.id };
  }

  const plan = user.plan || 'free';
  const limit = LIMITS[plan] || LIMITS.free;

  // Check if we should reset their usage counter based on their plan's billing cycle
  const isNewCycle = getResetScope(plan, user.credits_reset_at);
  const now = new Date();

  let used = isNewCycle ? 0 : (user.credits_used_today || 0);

  // Enforce limit
  if (used >= limit) {
    return { allowed: false, used, limit, plan, userId: user.id };
  }

  // Increment
  await db.from('users').update({
    credits_used_today: used + 1,
    credits_reset_at: isNewCycle ? now.toISOString() : user.credits_reset_at,
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

  if (!user) return { used: 0, limit: LIMITS.free, plan: 'free' };

  const plan = user.plan || 'free';
  const limit = LIMITS[plan] || LIMITS.free;
  
  const isNewCycle = getResetScope(plan, user.credits_reset_at);
  const used = isNewCycle ? 0 : (user.credits_used_today || 0);

  return { used, limit, plan };
}
