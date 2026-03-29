import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { razorpay, getPlanAmountInPaise } from '../../../../../lib/razorpay';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan } = await req.json();

    const amount = getPlanAmountInPaise(plan);
    if (!amount) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_${crypto.randomBytes(8).toString("hex")}`,
      notes: {
        clerkUserId: userId,
        plan: plan
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    return NextResponse.json({ error: 'Error creating order' }, { status: 500 });
  }
}
