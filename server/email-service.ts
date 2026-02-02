import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.charityEmail,
      subject: `Token "${data.tokenName}" launched in support of ${data.charityName}`,
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

function generateApprovalEmailHtml(data: CharityNotificationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Token Launched for ${data.charityName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Token Launched!</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>${data.charityName}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      A new memecoin token has been launched on GoodBags in support of your organization! 
      This token includes automatic donation royalties that will be sent to your charity from trading activity.
    </p>
    
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #10b981;">Token Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Token Name:</td>
          <td style="padding: 8px 0; font-weight: 600;">${data.tokenName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Symbol:</td>
          <td style="padding: 8px 0; font-weight: 600;">$${data.tokenSymbol}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Mint Address:</td>
          <td style="padding: 8px 0; font-family: monospace; font-size: 12px; word-break: break-all;">${data.tokenMintAddress}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Creator Wallet:</td>
          <td style="padding: 8px 0; font-family: monospace; font-size: 12px; word-break: break-all;">${data.creatorWallet}</td>
        </tr>
      </table>
    </div>
    
    <h3 style="font-size: 16px; margin: 25px 0 15px 0;">What Would You Like To Do?</h3>
    
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
      You can approve this token to show your official endorsement, or deny it if you don't want to be associated with this project.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.approvalLink}" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Review This Token
      </a>
    </div>
    
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>Important:</strong> If you don't recognize this request or didn't authorize this token, 
        you can deny it to prevent any association with your organization.
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
      <strong>About GoodBags:</strong> GoodBags is a platform that enables the launch of memecoins 
      with built-in charity donations. A portion of all trading fees automatically goes to verified charities.
    </p>
    
    <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
      If you have any questions, please contact us at contact@master22solutions.com
    </p>
  </div>
  
  <div style="background: #1f2937; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      © ${new Date().getFullYear()} GoodBags • <a href="https://goodbags.tech" style="color: #10b981;">goodbags.tech</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

function generateApprovalEmailText(data: CharityNotificationData): string {
  return `
New Token Launched for ${data.charityName}!

Hello ${data.charityName},

A new memecoin token has been launched on GoodBags in support of your organization! 
This token includes automatic donation royalties that will be sent to your charity from trading activity.

TOKEN DETAILS:
- Token Name: ${data.tokenName}
- Symbol: $${data.tokenSymbol}
- Mint Address: ${data.tokenMintAddress}
- Creator Wallet: ${data.creatorWallet}

WHAT WOULD YOU LIKE TO DO?

You can approve this token to show your official endorsement, or deny it if you don't want to be associated with this project.

Review this token here: ${data.approvalLink}

IMPORTANT: If you don't recognize this request or didn't authorize this token, you can deny it to prevent any association with your organization.

---

About GoodBags: GoodBags is a platform that enables the launch of memecoins with built-in charity donations. A portion of all trading fees automatically goes to verified charities.

If you have any questions, please contact us at contact@master22solutions.com

© ${new Date().getFullYear()} GoodBags • goodbags.tech
  `.trim();
}

export function generateApprovalLink(tokenMintAddress: string, charityId: string): string {
  const baseUrl = process.env.APP_URL || 'https://goodbags.tech';
  // Include reauth=true to force fresh X login when clicking from email
  return `${baseUrl}/charity-portal?token=${tokenMintAddress}&charity=${charityId}&reauth=true`;
}
