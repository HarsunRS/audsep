import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { createServerClient } from '../../../../lib/supabase';
import { sendWelcomeEmail } from '../../../../lib/email';

export async function POST(req) {
  const payload = await req.text();
  const headers = {
    'svix-id': req.headers.get('svix-id'),
    'svix-timestamp': req.headers.get('svix-timestamp'),
    'svix-signature': req.headers.get('svix-signature'),
  };

  let event;
  try {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || 'dev_secret');
    event = wh.verify(payload, headers);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const db = createServerClient();

  if (event.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = event.data;
    const email = email_addresses?.[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(' ') || 'there';

    await db.from('users').upsert({
      clerk_id: id,
      email,
      name,
      plan: 'free',
      credits_used_today: 0,
      credits_reset_at: new Date().toISOString(),
    }, { onConflict: 'clerk_id' });

    await sendWelcomeEmail(email, name);
  }

  if (event.type === 'user.deleted') {
    await db.from('users').delete().eq('clerk_id', event.data.id);
  }

  return NextResponse.json({ received: true });
}
