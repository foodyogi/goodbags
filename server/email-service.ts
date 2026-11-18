import { Resend } from 'resend';

// Created on first use: constructing Resend without a key throws, which used to crash the server at startup
let resendClient: Resend | null = null;
function getResend(): Resend {
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

/** The part of the Resend client we use, so tests can pass a mock */
export type EmailClient = { emails: Pick<Resend["emails"], "send"> };

const FROM_EMAIL = 'GoodBags <noreply@goodbags.tech>';

interface CharityNotificationData {
  charityName: string;
  charityEmail: string;
  tokenName: string;
  tokenSymbol: string;
  tokenMintAddress: string;
  creatorWallet: string;
  approvalLink: string;
}

export async function sendCharityApprovalEmail(data: CharityNotificationData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping email notification');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data: result, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.charityEmail,
      subject: `A charity coin was launched in support of ${data.charityName}`,
      html: generateApprovalEmailHtml(data),
      text: generateApprovalEmailText(data),
    });

    if (error) {
      console.error('[Email] Failed to send charity approval email:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Sent approval notification to ${data.charityEmail} for token ${data.tokenName}, messageId: ${result?.id}`);
    return { success: true, messageId: result?.id };
  } catch (err: any) {
    console.error('[Email] Error sending charity approval email:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}

// Coin details are chosen by whoever launches the coin, so they are escaped in the HTML version
export function generateApprovalEmailHtml(data: CharityNotificationData): string {
  const charityName = escapeHtml(data.charityName);
  const tokenName = escapeHtml(data.tokenName);
  const tokenSymbol = escapeHtml(data.tokenSymbol);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A charity coin was launched in support of ${charityName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">A charity coin was launched for you</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>${charityName}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      A charity coin was launched on GoodBags in support of your organization. Your share of the coin's
      trading fees builds up in the coin's Bags.fm fee config, and you claim it on Bags.fm with your X account.
    </p>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #10b981;">Coin details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Coin name:</td>
          <td style="padding: 8px 0; font-weight: 600;">${tokenName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Symbol:</td>
          <td style="padding: 8px 0; font-weight: 600;">$${tokenSymbol}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Mint address:</td>
          <td style="padding: 8px 0; font-family: monospace; font-size: 12px; word-break: break-all;">${escapeHtml(data.tokenMintAddress)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Creator wallet:</td>
          <td style="padding: 8px 0; font-family: monospace; font-size: 12px; word-break: break-all;">${escapeHtml(data.creatorWallet)}</td>
        </tr>
      </table>
    </div>

    <h3 style="font-size: 16px; margin: 25px 0 15px 0;">Approve or deny this coin</h3>

    <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
      Open the charity portal and sign in with your organization's official X account to endorse this coin,
      or deny it if you don't want to be associated with it. Only the X account on file for your charity can do this.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.approvalLink}" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Open the charity portal
      </a>
    </div>

    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>Important:</strong> If you don't recognize this coin or didn't expect it, you can deny it so it
        is clearly marked as not endorsed by your organization.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
      <strong>About GoodBags:</strong> GoodBags is charity fundraising infrastructure on Solana. People launch coins
      on Bags.fm with a charity's share written into the coin's fee split, and the charity claims its share on-chain.
    </p>

    <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
      If you have any questions, please contact us at contact@master22solutions.com
    </p>
  </div>

  <div style="background: #1f2937; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      © ${new Date().getFullYear()} GoodBags · <a href="https://goodbags.tech" style="color: #10b981;">goodbags.tech</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

export function generateApprovalEmailText(data: CharityNotificationData): string {
  return `
A charity coin was launched in support of ${data.charityName}

Hello ${data.charityName},

A charity coin was launched on GoodBags in support of your organization. Your share of the coin's trading fees builds up in the coin's Bags.fm fee config, and you claim it on Bags.fm with your X account.

COIN DETAILS:
- Coin name: ${data.tokenName}
- Symbol: $${data.tokenSymbol}
- Mint address: ${data.tokenMintAddress}
- Creator wallet: ${data.creatorWallet}

APPROVE OR DENY THIS COIN

Open the charity portal and sign in with your organization's official X account to endorse this coin, or deny it if you don't want to be associated with it. Only the X account on file for your charity can do this.

Charity portal: ${data.approvalLink}

IMPORTANT: If you don't recognize this coin or didn't expect it, you can deny it so it is clearly marked as not endorsed by your organization.

---

About GoodBags: GoodBags is charity fundraising infrastructure on Solana. People launch coins on Bags.fm with a charity's share written into the coin's fee split, and the charity claims its share on-chain.

If you have any questions, please contact us at contact@master22solutions.com

© ${new Date().getFullYear()} GoodBags · goodbags.tech
  `.trim();
}

export function generateApprovalLink(tokenMintAddress: string, charityId: string): string {
  const baseUrl = process.env.APP_URL || 'https://goodbags.tech';
  // Include reauth=true to force fresh X login when clicking from email
  return `${baseUrl}/charity-portal?token=${tokenMintAddress}&charity=${charityId}&reauth=true`;
}


interface CharityVerificationEmailData {
  charityName: string;
  charityEmail: string;
  verificationLink: string;
}

/**
 * Email the verification link to the address on a charity application. The link (which
 * contains the token) is never logged. Never throws.
 */
export async function sendCharityVerificationEmail(
  data: CharityVerificationEmailData,
  client?: EmailClient
): Promise<{ success: boolean; error?: string }> {
  if (!client && !process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured, verification email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { error } = await (client ?? getResend()).emails.send({
      from: FROM_EMAIL,
      to: data.charityEmail,
      subject: `Verify ${data.charityName}'s email for GoodBags`,
      html: `<p>Hello ${escapeHtml(data.charityName)},</p>
<p>Someone applied to register ${escapeHtml(data.charityName)} on GoodBags with this email address. To confirm it belongs to your organization, open this link within 24 hours:</p>
<p><a href="${data.verificationLink}">Verify this email address</a></p>
<p>If you didn't apply, you can ignore this email.</p>
<p>GoodBags, <a href="https://goodbags.tech">goodbags.tech</a></p>`,
      text: `Hello ${data.charityName},

Someone applied to register ${data.charityName} on GoodBags with this email address. To confirm it belongs to your organization, open this link within 24 hours:

${data.verificationLink}

If you didn't apply, you can ignore this email.

GoodBags, goodbags.tech`,
    });
    if (error) {
      console.error('[Email] Failed to send verification email:', error.message);
      return { success: false, error: error.message };
    }
    console.log(`[Email] Sent verification email for ${data.charityName}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Email] Error sending verification email:', err?.message || err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
