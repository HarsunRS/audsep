/**
 * Lemon Squeezy API helper (direct REST — no SDK needed)
 * Docs: https://docs.lemonsqueezy.com/api
 */

const LS_API = 'https://api.lemonsqueezy.com/v1';

async function lsFetch(path, options = {}) {
  const res = await fetch(`${LS_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.errors?.[0]?.detail || 'Lemon Squeezy API error');
  return json;
}

/**
 * Create a checkout URL for a given variant
 * variantId: LEMONSQUEEZY_PRO_VARIANT_ID or LEMONSQUEEZY_TEAM_VARIANT_ID
 */
export async function createCheckout(variantId, email, clerkUserId) {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const data = await lsFetch('/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email,
            custom: { clerk_user_id: clerkUserId },
          },
          product_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=1`,
            receipt_thank_you_note: 'Thanks for upgrading! Enjoy unlimited separations.',
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: String(storeId) } },
          variant: { data: { type: 'variants', id: String(variantId) } },
        },
      },
    }),
  });
  return data.data.attributes.url;
}

/**
 * Verify a Lemon Squeezy webhook signature
 * Returns true if valid
 */
export function verifyWebhookSignature(rawBody, signature) {
  if (!process.env.LEMONSQUEEZY_WEBHOOK_SECRET) return true; // skip in dev
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

/** Map LS variant ID → plan name */
export function variantToPlan(variantId) {
  const id = String(variantId);
  if (id === String(process.env.LEMONSQUEEZY_TEAM_VARIANT_ID)) return 'team';
  if (id === String(process.env.LEMONSQUEEZY_PRO_VARIANT_ID)) return 'pro';
  return 'free';
}
