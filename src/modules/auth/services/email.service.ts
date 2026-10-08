import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { OTP_TTL_MINUTES } from '../constants/otp.constants.js';
import { VerificationCodeType } from '../types/verification-code.type';

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

  async sendVerificationCode(
    email: string,
    code: string,
    type: VerificationCodeType,
  ): Promise<void> {
    const subject = this.getSubject(type);
    const textMessage = this.getTextMessage(type, code);
    const htmlMessage = this.getHtmlMessage(type);
    const errorMessage = this.getErrorMessage(type);

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject,
        text: `
          ${textMessage}
          The code is valid for ${OTP_TTL_MINUTES} minutes. 
        `.trim(),
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <p>${htmlMessage}</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">
              ${code}
            </p>
            <p>The code is valid for ${OTP_TTL_MINUTES} minutes.</p>
          </div>
        `.trim(),
      });
    } catch {
      throw new InternalServerErrorException(errorMessage);
    }
  }

  private getSubject(type: VerificationCodeType): string {
    switch (type) {
      case VerificationCodeType.REGISTRATION:
        return 'Confirm your registration';
      case VerificationCodeType.LOGIN:
        return 'Confirm your login';
      default:
        return '';
    }
  }

  private getTextMessage(type: VerificationCodeType, code: string): string {
    switch (type) {
      case VerificationCodeType.REGISTRATION:
        return `Your verification code is ${code}. If you didn't create an account, you can ignore this email.`;
      case VerificationCodeType.LOGIN:
        return `Your verification code is ${code}. If you didn't try to sign in, please secure your account.`;
      default:
        return '';
    }
  }

  private getHtmlMessage(type: VerificationCodeType): string {
    switch (type) {
      case VerificationCodeType.REGISTRATION:
        return 'Your registration verification code is:';
      case VerificationCodeType.LOGIN:
        return 'Your login verification code is:';
      default:
        return '';
    }
  }

  private getErrorMessage(type: VerificationCodeType): string {
    switch (type) {
      case VerificationCodeType.REGISTRATION:
        return 'Unable to send registration email.';
      case VerificationCodeType.LOGIN:
        return 'Unable to send login verification email.';
      default:
        return '';
    }
  }
}
