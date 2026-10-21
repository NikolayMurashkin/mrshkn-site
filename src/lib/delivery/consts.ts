export const TELEGRAM_API_FALLBACK = 'https://api.telegram.org';

/** Таймауты SMTP: соединения, приветствия и сокета. У nodemailer по умолчанию 2 мин, 30 с и 10 мин. */
export const SMTP_TIMEOUT_MS = 10_000;

/** Порт SMTP, если строка его не задала: как у nodemailer — 465 для `smtps:`, 587 для `smtp:`. */
export const SMTP_DEFAULT_PORT = { secure: 465, plain: 587 } as const;
