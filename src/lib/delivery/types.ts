/** Письмо обычным текстом: адрес получателя, тема и тело. */
export type MailMessage = {
  to: string;
  subject: string;
  text: string;
};
