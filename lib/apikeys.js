import crypto from 'crypto';
import { createServerClient } from './supabase';

const KEY_PREFIX = 'ask_'; // AudSep Key

/** Generate a new raw API key */
export function generateApiKey() {
  const random = crypto.randomBytes(32).toString('hex');
  return `${KEY_PREFIX}${random}`;
}

/** SHA-256 hash of a raw key (what we store in DB) */
export function hashKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Validate an API key from request header.
 * Returns { userId, keyId } on success, null on failure.
 */
export async function validateApiKey(rawKey) {
  if (!rawKey || !rawKey.startsWith(KEY_PREFIX)) return null;
  const hash = hashKey(rawKey);
  const db = createServerClient();

  const { data, error } = await db
    .from('api_keys')
    .select('id, user_id, revoked_at')
    .eq('key_hash', hash)
    .single();

  if (error || !data || data.revoked_at) return null;

  // Update last_used_at (fire-and-forget)
  db.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);

  return { userId: data.user_id, keyId: data.id };
}
