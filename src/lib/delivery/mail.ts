import { lookup } from 'node:dns/promises';
import { isIP, isIPv4 } from 'node:net';
import { createTransport } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { SMTP_DEFAULT_PORT, SMTP_TIMEOUT_MS } from './consts';
import { envOf } from './env';
import type { MailMessage } from './types';

/** Логин и пароль из URL раскодированы; битый `%` оставляет строку как есть — как `safeDecode` у nodemailer. */
const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/**
 * Параметры транспорта из `SMTP_URL` с адресом только IPv4. nodemailer сам резолвит имя в A и AAAA и берет адрес
 * случайно, а с сервера до почтовика по IPv6 соединения нет — письмо висело до таймаута. Поэтому имя резолвится
 * здесь в IPv4, исходное имя уходит в `tls.servername` для проверки сертификата. Строка в `createTransport`
 * не передается: ее опции перекрыли бы объект.
 */
const smtpOptions = async (smtpUrl: string): Promise<SMTPTransport.Options> => {
  const url = new URL(smtpUrl);
  const secure = url.protocol === 'smtps:';
  const name = url.hostname.replace(/^\[(.*)\]$/, '$1');
  const literal = isIP(name) !== 0;
  const address = literal ? name : (await lookup(name, { family: 4 })).address;

  if (!isIPv4(address)) {
    throw new Error(`Почта: у SMTP-хоста ${name} нет IPv4-адреса`);
  }

  return {
    host: address,
    port: Number(url.port) || (secure ? SMTP_DEFAULT_PORT.secure : SMTP_DEFAULT_PORT.plain),
    secure,
    ...(url.username || url.password
      ? { auth: { user: safeDecode(url.username), pass: safeDecode(url.password) } }
      : {}),
    ...(literal ? {} : { tls: { servername: name } }),
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  };
};

/** Письмо через SMTP студии; отправитель — `LEAD_MAIL_FROM`, без него — ящик заявок `LEAD_MAIL_TO`. */
export const sendMail = async ({ to, subject, text }: MailMessage) => {
  const url = envOf('SMTP_URL');
  const from = envOf('LEAD_MAIL_FROM') || envOf('LEAD_MAIL_TO');

  if (!url || !to || !from) {
    throw new Error('Почта не настроена: нет строки SMTP, отправителя или адреса получателя');
  }

  await createTransport(await smtpOptions(url)).sendMail({ from, to, subject, text });
};
