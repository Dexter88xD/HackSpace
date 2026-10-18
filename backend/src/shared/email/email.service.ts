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
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your HackSpace verification code</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
  font-family: Arial, Helvetica, sans-serif;
  color: #111111;
">
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background-color: #f5f5f5; padding: 40px 20px;"
  >
    <tr>
      <td align="center">

        <!-- Main container -->
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width: 520px;
            background-color: #ffffff;
            border: 1px solid #e5e5e5;
          "
        >

          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; border-bottom: 1px solid #e5e5e5;">
              <div style="
                font-size: 24px;
                font-weight: 700;
                letter-spacing: -0.5px;
              ">
                HackSpace
              </div>

              <div style="
                margin-top: 5px;
                font-size: 12px;
                color: #777777;
                letter-spacing: 1px;
                text-transform: uppercase;
              ">
                Build · Learn · Innovate
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">

              <h1 style="
                margin: 0 0 16px 0;
                font-size: 28px;
                line-height: 1.2;
                font-weight: 700;
                color: #111111;
              ">
                Verify your email
              </h1>

              <p style="
                margin: 0 0 28px 0;
                font-size: 15px;
                line-height: 1.6;
                color: #555555;
              ">
                Use the verification code below to continue with your
                HackSpace account.
              </p>

              <!-- OTP -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                <tr>
                  <td align="center">
                    <div style="
                      background-color: #f7f7f7;
                      border: 1px solid #dddddd;
                      padding: 22px 15px;
                      font-size: 32px;
                      font-weight: 700;
                      letter-spacing: 8px;
                      color: #111111;
                    ">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="
                margin: 24px 0 0 0;
                text-align: center;
                font-size: 13px;
                color: #777777;
              ">
                This code expires in <strong>10 minutes</strong>.
              </p>

              <div style="
                height: 1px;
                background-color: #eeeeee;
                margin: 32px 0;
              "></div>

              <p style="
                margin: 0;
                font-size: 13px;
                line-height: 1.6;
                color: #777777;
              ">
                If you didn't request this code, you can safely ignore this
                email. Someone may have entered your email address by mistake.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="
              padding: 20px 32px;
              background-color: #fafafa;
              border-top: 1px solid #e5e5e5;
            ">
              <p style="
                margin: 0;
                font-size: 12px;
                color: #999999;
                text-align: center;
              ">
                © ${new Date().getFullYear()} HackSpace
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: 'HackSpace Email Verification',
        html,
      });
    } catch {
      throw new Error('Failed to send verification email');
    }
  }
}
