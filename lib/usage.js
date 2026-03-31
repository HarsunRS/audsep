import { createServerClient } from './supabase';

const LIMITS = {
  free: 3,              // per day
  'basic-monthly': 30,  // per month
  'pro-monthly': 100,   // per month
  'studio-monthly': 300,// per month
  'basic-yearly': 30,   // per month
  'pro-yearly': 100,    // per month
  'studio-yearly': 300, // per month
  // legacy keys
  basic: 30,
  pro: 100,
  team: 300,
};

/**
 * Check if user is allowed to run a separation, and increment counter.
 * Uses a Postgres function (002_atomic_usage.sql) that takes a row-level lock,
 * eliminating the read-then-write race condition.
 * Returns { allowed, used, limit, plan, userId }
 */
export async function checkAndIncrementUsage(clerkUserId) {
  const db = createServerClient();

  const { data, error } = await db.rpc('check_and_increment_usage', {
    p_clerk_id: clerkUserId,
  });

  if (error) throw new Error(`Usage check failed: ${error.message}`);

  // rpc returns an array of rows from the RETURNS TABLE function
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('Usage check returned no data');

  return {
    allowed: row.allowed,
    used: row.used,
    limit: row.lim,
    plan: row.plan,
    userId: row.uid,
  };
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
