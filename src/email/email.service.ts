import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    // Deep link or web URL where the user enters the token.
    // For the Flutter app, the user copies the token manually,
    // so we just include it prominently in the email.
    const frontendUrl = process.env.FRONTEND_URL || 'https://unimarket.app';

    await this.transporter.sendMail({
      from: `"UniMarket" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Reset your UniMarket password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #1565C0; border-radius: 16px; padding: 16px;">
              <span style="font-size: 28px; color: white;">🏪</span>
            </div>
            <h1 style="color: #1565C0; margin-top: 12px;">UniMarket</h1>
          </div>

          <p style="color: #333; font-size: 16px;">
            You requested a password reset. Use the code below in the app to set a new password:
          </p>

          <div style="background: #F5F5F5; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <p style="font-size: 12px; color: #666; margin: 0 0 8px 0;">YOUR RESET CODE</p>
            <p style="font-size: 18px; font-family: monospace; font-weight: bold; color: #1565C0; 
                      word-break: break-all; margin: 0;">
              ${token}
            </p>
          </div>

          <p style="color: #666; font-size: 14px;">
            This code expires in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            UniMarket — Buy &amp; sell within your university
          </p>
        </div>
      `,
    });
  }
}
