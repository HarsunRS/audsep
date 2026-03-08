import { NextResponse } from 'next/server';
import { verifyWebhookSignature, variantToPlan } from '../../../../../lib/lemonsqueezy';
import { createServerClient } from '../../../../../lib/supabase';
import { sendPaymentReceiptEmail } from '../../../../../lib/email';

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-signature') || '';

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const db = createServerClient();
  const eventName = event.meta?.event_name;
  const clerkUserId = event.meta?.custom_data?.clerk_user_id;
  const attrs = event.data?.attributes;

  if (!clerkUserId) return NextResponse.json({ received: true });

  if (eventName === 'order_created') {
    const variantId = attrs?.first_order_item?.variant_id;
    const plan = variantToPlan(variantId);

    const { data: user } = await db.from('users')
      .update({
        plan,
        lemon_customer_id: String(attrs?.customer_id || ''),
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', clerkUserId)
      .select()
      .single();

    if (user?.email) {
      const amount = `$${((attrs?.total || 0) / 100).toFixed(2)}`;
      await sendPaymentReceiptEmail(user.email, user.name || 'there', plan, amount);
    }
  }

  if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
    await db.from('users').update({
      plan: 'free',
      lemon_subscription_id: null,
      updated_at: new Date().toISOString(),
    }).eq('clerk_id', clerkUserId);
  }

  if (eventName === 'subscription_updated') {
    const variantId = attrs?.variant_id;
    const plan = variantToPlan(variantId);
    await db.from('users').update({
      plan,
      lemon_subscription_id: String(event.data?.id || ''),
      updated_at: new Date().toISOString(),
    }).eq('clerk_id', clerkUserId);
  }

  if (eventName === 'subscription_created') {
    await db.from('users').update({
      lemon_subscription_id: String(event.data?.id || ''),
      updated_at: new Date().toISOString(),
    }).eq('clerk_id', clerkUserId);
  }

  return NextResponse.json({ received: true });
}
