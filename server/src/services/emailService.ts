const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY || '',
      'content-type': 'application/json'
    } as Record<string, string>,
    body: JSON.stringify({
      sender: { name: 'CrisisGuard', email: process.env.EMAIL_USER },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent
    })
  });

  if (!response.ok) {
    const error = await response.json() as { message?: string };
    console.error('❌ Brevo API error:', error);
    throw new Error(`Email failed: ${error.message}`);
  }

  console.log(`✅ Email sent to ${to}`);
};

console.log('Email service configured with Brevo HTTP API');

const verificationEmailHtml = (name: string, verifyLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 40px 30px;">
        <h1 style="margin: 0 0 20px; color: #1a1a2e; font-size: 24px; font-weight: 600;">Welcome to CrisisGuard AI</h1>
        <p style="margin: 0 0 20px; color: #4a4a68; font-size: 16px; line-height: 1.6;">
          Hi ${name},
        </p>
        <p style="margin: 0 0 20px; color: #4a4a68; font-size: 16px; line-height: 1.6;">
          Thank you for registering with CrisisGuard AI. Please verify your email address to get started.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${verifyLink}" style="display: inline-block; padding: 14px 32px; background-color: #e94560; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                Verify Email
              </a>
            </td>
          </tr>
        </table>
        <p style="margin: 20px 0 0; color: #8a8aa3; font-size: 14px; line-height: 1.6;">
          If the button above doesn't work, copy and paste this link into your browser:<br>
          <a href="${verifyLink}" style="color: #e94560; word-break: break-all;">${verifyLink}</a>
        </p>
        <p style="margin: 30px 0 0; color: #8a8aa3; font-size: 14px; line-height: 1.6;">
          This link will expire in 24 hours.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="margin: 0; color: #8a8aa3; font-size: 12px; text-align: center;">
          If you didn't create an account with CrisisGuard AI, please ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const passwordResetEmailHtml = (name: string, resetLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 40px 30px;">
        <h1 style="margin: 0 0 20px; color: #1a1a2e; font-size: 24px; font-weight: 600;">Reset Your Password</h1>
        <p style="margin: 0 0 20px; color: #4a4a68; font-size: 16px; line-height: 1.6;">
          Hi ${name},
        </p>
        <p style="margin: 0 0 20px; color: #4a4a68; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background-color: #e94560; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                Reset Password
              </a>
            </td>
          </tr>
        </table>
        <p style="margin: 20px 0 0; color: #8a8aa3; font-size: 14px; line-height: 1.6;">
          If the button above doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetLink}" style="color: #e94560; word-break: break-all;">${resetLink}</a>
        </p>
        <p style="margin: 30px 0 0; color: #8a8aa3; font-size: 14px; line-height: 1.6;">
          This link will expire in 1 hour.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="margin: 0; color: #8a8aa3; font-size: 12px; text-align: center;">
          If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const sendVerificationEmail = async (email: string, name: string, token: string): Promise<void> => {
  const verifyLink = `${clientUrl}/verify-email?token=${token}`;
  
  try {
    await sendEmail(email, 'Verify your email - CrisisGuard AI', verificationEmailHtml(name, verifyLink));
    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${email}:`, (error as Error).message);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string, name: string, token: string): Promise<void> => {
  const resetLink = `${clientUrl}/reset-password?token=${token}`;
  
  try {
    await sendEmail(email, 'Reset your password - CrisisGuard AI', passwordResetEmailHtml(name, resetLink));
    console.log(`✅ Password reset email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${email}:`, (error as Error).message);
    throw error;
  }
};

const sosEmailHtml = (userName: string, lat: number, lng: number, mapsLink: string, timestamp: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 40px 30px;">
        <h1 style="margin: 0 0 20px; color: #dc2626; font-size: 28px; font-weight: 700;">🆘 SOS ALERT</h1>
        <p style="margin: 0 0 20px; color: #4a4a68; font-size: 16px; line-height: 1.6;">
          <strong>${userName}</strong> has triggered an SOS emergency alert.
        </p>
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="margin: 0 0 15px; color: #dc2626; font-size: 18px; font-weight: 600;">Location Information</h2>
          <p style="margin: 0 0 10px; color: #4a4a68; font-size: 14px;">
            <strong>GPS Coordinates:</strong><br>
            Latitude: ${lat}<br>
            Longitude: ${lng}
          </p>
          <p style="margin: 0 0 10px; color: #4a4a68; font-size: 14px;">
            <strong>Google Maps:</strong><br>
            <a href="${mapsLink}" style="color: #e94560; word-break: break-all;">${mapsLink}</a>
          </p>
          <p style="margin: 0; color: #4a4a68; font-size: 14px;">
            <strong>Timestamp:</strong><br>
            ${timestamp}
          </p>
        </div>
        <p style="margin: 20px 0; color: #4a4a68; font-size: 14px; line-height: 1.6;">
          Please respond immediately if you are nearby or can provide assistance.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="margin: 0; color: #8a8aa3; font-size: 12px; text-align: center;">
          This SOS was sent via CrisisGuard AI
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const sendSOSEmail = async (
  recipientEmail: string,
  userName: string,
  lat: number,
  lng: number,
  mapsLink: string,
  timestamp: string
): Promise<void> => {
  try {
    await sendEmail(recipientEmail, '🆘 SOS ALERT', sosEmailHtml(userName, lat, lng, mapsLink, timestamp));
    console.log(`✅ SOS alert email sent to ${recipientEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send SOS email to ${recipientEmail}:`, (error as Error).message);
    throw error;
  }
};
