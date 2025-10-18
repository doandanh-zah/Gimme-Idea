import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure SendGrid SMTP
    this.transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  async sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@gimmeidea.com',
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      });

      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, token: string, username: string): Promise<boolean> {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #00ff00; color: #000; padding: 20px; text-align: center; }
            .content { background: #f4f4f4; padding: 30px; }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #00ff00;
              color: #000;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Gimme Idea! 🚀</h1>
            </div>
            <div class="content">
              <h2>Hi ${username},</h2>
              <p>Thanks for signing up! Please verify your email address to get started.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="button">Verify Email</a>
              </p>
              <p>Or copy this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
            </div>
            <div class="footer">
              <p>If you didn't create this account, please ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} Gimme Idea. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '✅ Verify your email - Gimme Idea',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, token: string, username: string): Promise<boolean> {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #00ff00; color: #000; padding: 20px; text-align: center; }
            .content { background: #f4f4f4; padding: 30px; }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #00ff00;
              color: #000;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request 🔐</h1>
            </div>
            <div class="content">
              <h2>Hi ${username},</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p>This link will expire in 1 hour. If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Gimme Idea. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🔐 Reset your password - Gimme Idea',
      html,
    });
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #00ff00; color: #000; padding: 20px; text-align: center; }
            .content { background: #f4f4f4; padding: 30px; }
            .feature { margin: 15px 0; padding: 10px; background: white; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Gimme Idea!</h1>
            </div>
            <div class="content">
              <h2>Hi ${username},</h2>
              <p>Your email has been verified! You're now part of the Gimme Idea community.</p>

              <h3>What you can do now:</h3>
              <div class="feature">
                <strong>🏗️ Builders:</strong> Submit your projects and get valuable feedback with bounty rewards
              </div>
              <div class="feature">
                <strong>🔍 Reviewers:</strong> Provide feedback on projects and earn rewards
              </div>
              <div class="feature">
                <strong>💰 Everyone:</strong> Build your reputation and grow your network
              </div>

              <p style="margin-top: 30px;">Ready to get started?</p>
              <p style="text-align: center;">
                <a href="${process.env.CLIENT_URL}/dashboard" style="display: inline-block; padding: 12px 30px; background: #00ff00; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Go to Dashboard
                </a>
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Gimme Idea. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🎉 Welcome to Gimme Idea!',
      html,
    });
  }
}

export default new EmailService();
