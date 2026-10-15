import { createTransport } from 'nodemailer';
import { envOf } from './env';
import type { MailMessage } from './types';

/** Письмо через SMTP студии; отправитель — `LEAD_MAIL_FROM`, без него — ящик заявок `LEAD_MAIL_TO`. */
export const sendMail = async ({ to, subject, text }: MailMessage) => {
  const url = envOf('SMTP_URL');
  const from = envOf('LEAD_MAIL_FROM') || envOf('LEAD_MAIL_TO');

  if (!url || !to || !from) {
    throw new Error('Почта не настроена: нет строки SMTP, отправителя или адреса получателя');
  }

  await createTransport(url).sendMail({ from, to, subject, text });
};
