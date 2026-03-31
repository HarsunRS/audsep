import { NextResponse } from 'next/server';
import { verifyWebhookSignature, isPaidAmountValid } from '../../../../../lib/razorpay';
import { createServerClient } from '../../../../../lib/supabase';

// Assuming lib/email exists since it was in the original codebase
const getEmailLib = async () => {
    try {
        return await import('../../../../../lib/email');
    } catch (e) {
        return null;
    }
};

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const db = createServerClient();

    // Handle payment capture
    if (event.event === 'order.paid' || event.event === 'payment.captured') {
        const entity = event.event === 'order.paid' ? event.payload.order.entity : event.payload.payment.entity;
        const notes = entity.notes || {};
        
        const clerkUserId = notes.clerkUserId;
        const rawPlan = notes.plan;

        if (!clerkUserId || !rawPlan) {
            console.error('Webhook missing clerkUserId or plan from notes:', notes);
            return NextResponse.json({ received: true });
        }

        // Verify paid amount matches the expected price for this plan
        // This prevents a crafted webhook from granting a higher-tier plan for less money
        if (!isPaidAmountValid(rawPlan, entity.amount)) {
            console.error(`Webhook amount mismatch: plan=${rawPlan}, amount=${entity.amount}`);
            return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
        }

        // Normalize plan key: "basic-monthly" → "basic", "pro-yearly" → "pro", etc.
        const plan = rawPlan.replace(/-(monthly|yearly)$/, '');

        const { data: user } = await db.from('users')
          .update({
            plan: plan,
            razorpay_payment_id: entity.id,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_id', clerkUserId)
          .select()
          .single();

        if (user?.email) {
            const amount = `₹${(entity.amount / 100).toFixed(2)}`;
            const emailLib = await getEmailLib();
            if (emailLib && emailLib.sendPaymentReceiptEmail) {
                await emailLib.sendPaymentReceiptEmail(user.email, user.name || 'there', plan, amount);
            }
        }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
