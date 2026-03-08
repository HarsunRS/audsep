import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'AudSep <noreply@audsep.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://audsep.com';

export async function sendWelcomeEmail(to, name) {
  if (!process.env.RESEND_API_KEY) return; // skip if not configured
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to AudSep 🎵',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;">
        <h1 style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#0a0a0a;">Welcome, ${name}!</h1>
        <p style="color:#555;line-height:1.7;">Your AudSep account is ready. You get <strong>3 free separations per day</strong> — no credit card required.</p>
        <a href="${APP_URL}/app" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#111;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;">Start Separating →</a>
        <p style="margin-top:32px;font-size:13px;color:#999;">— The AudSep Team</p>
      </div>
    `,
  });
}

export async function sendStemsReadyEmail(to, name, jobId, stemNames = []) {
  if (!process.env.RESEND_API_KEY) return;
  const stemList = stemNames.map(s => `<li style="margin:4px 0;color:#333;">${s}</li>`).join('');
  return resend.emails.send({
    from: FROM,
    to,
    subject: '🎛️ Your stems are ready — AudSep',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;">
        <h1 style="font-size:24px;font-weight:900;color:#0a0a0a;">Your stems are ready, ${name}!</h1>
        <p style="color:#555;line-height:1.7;">Your audio has been separated successfully. Download your stems:</p>
        ${stemList ? `<ul style="padding-left:20px;">${stemList}</ul>` : ''}
        <a href="${APP_URL}/dashboard" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#111;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;">View in Dashboard →</a>
        <p style="margin-top:32px;font-size:13px;color:#999;">— The AudSep Team</p>
      </div>
    `,
  });
}

export async function sendPaymentReceiptEmail(to, name, plan, amount) {
  if (!process.env.RESEND_API_KEY) return;
  return resend.emails.send({
    from: FROM,
    to,
    subject: `✅ You're now on AudSep ${plan} — Receipt`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;">
        <h1 style="font-size:24px;font-weight:900;color:#0a0a0a;">Payment confirmed!</h1>
        <p style="color:#555;line-height:1.7;">Thanks ${name}, your <strong>${plan}</strong> subscription is now active.</p>
        <table style="width:100%;margin-top:20px;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;font-size:14px;">Plan</td><td style="padding:8px 0;font-weight:700;text-align:right;">${plan}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:14px;">Amount</td><td style="padding:8px 0;font-weight:700;text-align:right;">${amount}</td></tr>
        </table>
        <a href="${APP_URL}/dashboard" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#111;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;">Go to Dashboard →</a>
        <p style="margin-top:32px;font-size:13px;color:#999;">— The AudSep Team</p>
      </div>
    `,
  });
}
