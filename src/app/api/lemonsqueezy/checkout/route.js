import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createCheckout } from '../../../../../lib/lemonsqueezy';
import { createServerClient } from '../../../../../lib/supabase';

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan } = await req.json();

  // Get variant ID based on plan
  let variantId;
  if (plan === 'pro') variantId = process.env.LEMONSQUEEZY_PRO_VARIANT_ID;
  else if (plan === 'team') variantId = process.env.LEMONSQUEEZY_TEAM_VARIANT_ID;
  else return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  if (!variantId) {
    return NextResponse.json({ error: 'Lemon Squeezy not configured' }, { status: 503 });
  }

  // Get user email from Supabase
  const db = createServerClient();
  const { data: user } = await db.from('users').select('email').eq('clerk_id', userId).single();

  const url = await createCheckout(variantId, user?.email || '', userId);
  return NextResponse.json({ url });
}
