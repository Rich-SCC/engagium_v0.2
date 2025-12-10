const nodemailer = require('nodemailer');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Check if email service is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Email service not configured. Password reset emails will not be sent.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendPasswordResetEmail(email, resetToken, firstName) {
    if (!this.transporter) {
      throw new Error('Email service is not configured. Please set SMTP environment variables.');
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Engagium'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Poppins', system-ui, -apple-system, sans-serif; 
              line-height: 1.6; 
              color: #374151; 
              background-color: #f9fafb;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 40px 20px; 
            }
            .email-wrapper {
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
              overflow: hidden;
            }
            .header { 
              background-color: #557170; 
              color: white; 
              padding: 32px 40px; 
              text-align: center; 
            }
            .header img {
              height: 48px;
              width: auto;
              margin-bottom: 12px;
            }
            .header h1 {
              font-size: 24px;
              font-weight: 600;
              margin: 0;
            }
            .content { 
              background-color: #ffffff; 
              padding: 40px; 
            }
            .content p {
              margin-bottom: 16px;
              color: #4b5563;
              font-size: 15px;
              font-weight: 400;
            }
            .content p strong {
              font-weight: 600;
              color: #374151;
            }
            .greeting {
              font-size: 16px;
              font-weight: 500;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .button-container {
              text-align: center;
              margin: 32px 0;
            }
            .button { 
              display: inline-block; 
              padding: 14px 32px; 
              background-color: #557170; 
              color: white !important; 
              text-decoration: none; 
              border-radius: 6px; 
              font-weight: 500;
              font-size: 15px;
              transition: background-color 0.2s;
            }
            .button:hover {
              background-color: #466060;
            }
            .link-text {
              word-break: break-all; 
              color: #557170;
              font-size: 14px;
              background-color: #f3f4f6;
              padding: 12px;
              border-radius: 4px;
              margin: 16px 0;
              display: block;
            }
            .warning {
              background-color: #f0f5f5;
              border-left: 4px solid #557170;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
            .warning p {
              margin: 0;
              font-size: 14px;
            }
            .footer { 
              text-align: center; 
              padding: 24px 40px;
              background-color: #f9fafb;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              font-size: 13px; 
              color: #6b7280;
              margin: 0;
              font-weight: 400;
            }
            .signature {
              margin-top: 32px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-weight: 400;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-wrapper">
              <div class="header">
                <img src="cid:logo" alt="Engagium" />
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <p class="greeting">Hi ${firstName},</p>
                <p>We received a request to reset your password for your Engagium account.</p>
                <p>Click the button below to reset your password:</p>
                <div class="button-container">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <div class="link-text">${resetUrl}</div>
                <div class="warning">
                  <p><strong>⏱ This link will expire in 1 hour.</strong></p>
                </div>
                <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
                <div class="signature">
                  <p>Best regards,<br><strong>The Engagium Team</strong></p>
                </div>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Engagium. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${firstName},

We received a request to reset your password for your Engagium account.

Please click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

Best regards,
The Engagium Team
      `,
      attachments: [
        {
          filename: 'logo.png',
          path: path.join(__dirname, '../assets/images/logo-email.png'),
          cid: 'logo'
        }
      ]
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async verifyConnection() {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('Email service is ready to send emails');
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
