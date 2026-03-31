import Razorpay from 'razorpay';
import crypto from 'crypto';

export const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

/**
 * Verify a Razorpay webhook signature
 * Returns true if valid
 */
export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    // In production, missing secret is a misconfiguration — reject all webhooks
    console.error('[razorpay] RAZORPAY_WEBHOOK_SECRET is not set — rejecting webhook');
    return false;
  }
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const a = Buffer.from(expectedSignature, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Canonical price list — single source of truth for both create-order and webhook verification
// Prices in USD cents; converted to INR paise at checkout using live rate or fixed rate below.
// Rate: 1 USD = 83 INR (update periodically)
const USD_TO_PAISE = 83 * 100;

export const PLAN_PRICES_USD_CENTS = {
  'basic-monthly':  500,   // $5
  'basic-yearly':   4800,  // $48
  'pro-monthly':    1800,  // $18
  'pro-yearly':     17200, // $172
};

export function getPlanAmountInPaise(plan) {
  const usdCents = PLAN_PRICES_USD_CENTS[plan];
  if (!usdCents) return 0;
  return Math.round((usdCents / 100) * USD_TO_PAISE);
}

/**
 * Verify that the paid amount matches the expected amount for the plan.
 * Prevents crafted webhooks from granting a higher-tier plan for less money.
 */
export function isPaidAmountValid(plan, paidAmountPaise) {
  const expected = getPlanAmountInPaise(plan);
  if (!expected) return false; // unknown plan
  // Allow 1% tolerance for currency conversion rounding
  return paidAmountPaise >= Math.floor(expected * 0.99);
}
