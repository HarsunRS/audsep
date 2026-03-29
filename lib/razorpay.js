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
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return true; // skip in dev if not set
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

/** Map pricing plan back to Razorpay logic (optional) */
export const PLANS = {
  free:             { amount: 0,   name: 'Free' },
  'basic-monthly':  { amount: 500, name: 'Basic' },
  'pro-monthly':    { amount: 1500, name: 'Pro' },
  'studio-monthly': { amount: 3500, name: 'Studio' },
  'basic-yearly':   { amount: 4800, name: 'Basic' },
  'pro-yearly':     { amount: 14400, name: 'Pro' },
  'studio-yearly':  { amount: 33600, name: 'Studio' },
};

// We will charge in USD or INR depending on configured preference
// Assuming INR for Razorpay standard integration
// Rate example: 1 USD = 83 INR
export function getPlanAmountInPaise(plan) {
  const rate = 83; 
  if (plan === 'basic-monthly') return 5 * rate * 100;
  if (plan === 'pro-monthly') return 15 * rate * 100;
  if (plan === 'studio-monthly') return 35 * rate * 100;

  if (plan === 'basic-yearly') return 48 * rate * 100;
  if (plan === 'pro-yearly') return 144 * rate * 100;
  if (plan === 'studio-yearly') return 336 * rate * 100;

  return 0; // free
}
