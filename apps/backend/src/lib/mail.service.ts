import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: (process.env.MAIL_PORT || '587') === '465',
    auth: {
      user: process.env.MAIL_USER || '',
      pass: process.env.MAIL_PASS || '',
    },
  });

  async sendMail(opts: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const info = await this.transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@nexyr.com',
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });

    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[mail] Preview: ${previewUrl}`);
      }
    }
  }
}
