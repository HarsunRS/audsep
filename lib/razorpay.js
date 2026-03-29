import Razorpay from 'razorpay';
import crypto from 'crypto';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
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
  free: { amount: 0, name: 'Free' },
  basic: { amount: 900, name: 'Basic' }, // $9
  pro: { amount: 1900, name: 'Pro' },   // $19
  team: { amount: 4900, name: 'Studio' } // $49
};

// We will charge in USD or INR depending on configured preference
// Assuming INR for Razorpay standard integration
// Rate example: 1 USD = 83 INR
export function getPlanAmountInPaise(plan) {
  const rate = 83; 
  if (plan === 'basic') return 9 * rate * 100;
  if (plan === 'pro') return 19 * rate * 100;
  if (plan === 'team') return 49 * rate * 100;
  return 0; // free
}
