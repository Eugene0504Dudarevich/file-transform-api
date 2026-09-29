import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { OTP_TTL_MINUTES } from '../constants/otp.constants.js';

@Injectable()
export class EmailService {
  private readonly transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  async sendRegistrationCode(email: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Confirm your registration',
        text: `
          Your verification code is ${code}.
          The code is valid for ${OTP_TTL_MINUTES} minutes.
          If you didn't create an account, you can ignore this email. 
        `.trim(),
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <p>Your verification code is:</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">
              ${code}
            </p>
            <p>The code is valid for ${OTP_TTL_MINUTES} minutes.</p>
            <p>If you didn't create an account, you can ignore this email.</p>
          </div>
        `.trim(),
      });
    } catch {
      throw new InternalServerErrorException(
        'Unable to send registration email',
      );
    }
  }
}
