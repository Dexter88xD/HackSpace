import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

// Configures a Gmail SMTP transporter using environment credentials and provides a method
// to send email verification codes. Errors during email delivery are converted into a generic
// failure error without exposing the underlying mail service details.
@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendVerificationMail(email: string, otp: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: 'HackSpace Email Verification',
        text: `Your verification code is: ${otp}`,
      });
    } catch {
      throw new Error('Failed to send verification email');
    }
  }
}
