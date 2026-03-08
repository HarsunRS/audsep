import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '../../../../../lib/supabase';
import { generateApiKey, hashKey } from '../../../../../lib/apikeys';

// GET — list user's API keys
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServerClient();
  const { data: user } = await db.from('users').select('id').eq('clerk_id', userId).single();
  if (!user) return NextResponse.json({ keys: [] });

  const { data: keys } = await db
    .from('api_keys')
    .select('id, name, created_at, last_used_at')
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });

  return NextResponse.json({ keys: keys || [] });
}

// POST — create a new API key (raw key shown once)
export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const db = createServerClient();
  const { data: user } = await db.from('users').select('id').eq('clerk_id', userId).single();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const rawKey = generateApiKey();
  const keyHash = hashKey(rawKey);

  await db.from('api_keys').insert({
    user_id: user.id,
    key_hash: keyHash,
    name,
  });

  // Return raw key ONCE — we never store it again
  return NextResponse.json({ key: rawKey, name });
}

// DELETE — revoke a key by ID
export async function DELETE(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { keyId } = await req.json();
  const db = createServerClient();
  const { data: user } = await db.from('users').select('id').eq('clerk_id', userId).single();

  await db.from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)
    .eq('user_id', user.id);

  return NextResponse.json({ revoked: true });
}
