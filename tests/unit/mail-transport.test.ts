import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendMail } from '@/lib/delivery/mail';

/**
 * Почта сайта ходит в SMTP только по IPv4: nodemailer сам резолвит имя хоста в A и AAAA и берет адрес случайно,
 * а с сервера до почтовика по IPv6 соединения нет — заявка ждала ответа почты две минуты. Поэтому транспорт должен
 * получить уже IPv4-адрес в `host`, исходное имя — в `tls.servername`, и короткие таймауты SMTP.
 *
 * nodemailer настоящий: созданный транспорт запоминается, его действующие опции — `transporter.options` (тот же
 * разбор `SMTP_URL`, что у nodemailer, строкой или объектом его ни позвали). Отправка подменена — сеть не трогается.
 * `localhost` резолвится и в `127.0.0.1`, и в `::1` — случай «DNS отдает обе семьи» без сети.
 */

type TransportOptions = {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: { user?: string; pass?: string };
  tls?: { servername?: string };
  connectionTimeout?: unknown;
  greetingTimeout?: unknown;
  socketTimeout?: unknown;
};

type RecordedTransport = {
  transporter: { options: TransportOptions };
  sendMail: ReturnType<typeof vi.fn>;
};

const created = vi.hoisted(() => [] as RecordedTransport[]);

vi.mock('nodemailer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('nodemailer')>();
  const createTransport = ((...args: Parameters<typeof actual.createTransport>) => {
    const transport = actual.createTransport(...args) as unknown as RecordedTransport;

    transport.sendMail = vi.fn().mockResolvedValue({ messageId: '<probe@mrshkn.test>', accepted: [] });
    created.push(transport);

    return transport;
  }) as unknown as typeof actual.createTransport;

  return { ...actual, createTransport, default: { ...actual, createTransport } };
});

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

const FROM = 'site@mrshkn.com';

const MESSAGE = { to: 'leads@example.com', subject: 'Заявка с сайта: Проба', text: 'Проба почты по IPv4' };

const SMTPS_URL = 'smtps://hello%40mrshkn.com:secret@localhost:465';

const TIMEOUT_LIMIT_MS = 10_000;

const ENV_KEYS = ['SMTP_URL', 'LEAD_MAIL_FROM', 'LEAD_MAIL_TO'] as const;

const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

/** Транспорт, которым письмо ушло: проверяются опции именно его, а не любого созданного. */
const usedTransport = () => {
  const used = created.filter((transport) => transport.sendMail.mock.calls.length > 0);

  expect(used, 'транспортов, через которые ушло письмо').toHaveLength(1);

  return used[0];
};

const listFiles = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(ROOT, join(entry.parentPath, entry.name)));

beforeEach(() => {
  created.length = 0;

  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
  }

  process.env.LEAD_MAIL_FROM = FROM;
  process.env.LEAD_MAIL_TO = MESSAGE.to;
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
});

describe('транспорт почты сайта', () => {
  it('M1: smtps с логином на localhost — host 127.0.0.1, порт 465, secure, логин раскодирован, servername localhost; письмо ушло этим транспортом', async () => {
    process.env.SMTP_URL = SMTPS_URL;

    await sendMail(MESSAGE);

    const transport = usedTransport();
    const { options } = transport.transporter;

    expect(options.host, 'адрес SMTP — IPv4, хотя localhost дает и ::1').toBe('127.0.0.1');
    expect(options.port).toBe(465);
    expect(options.secure).toBe(true);
    expect(options.auth).toEqual({ user: 'hello@mrshkn.com', pass: 'secret' });
    expect(options.tls?.servername, 'имя для TLS — исходное имя хоста').toBe('localhost');
    expect(transport.sendMail).toHaveBeenCalledTimes(1);
    expect(transport.sendMail).toHaveBeenCalledWith(expect.objectContaining({ from: FROM, ...MESSAGE }));
  });

  it('M2: таймауты соединения, приветствия и сокета — числа больше 0 и не больше 10 000 мс', async () => {
    process.env.SMTP_URL = SMTPS_URL;

    await sendMail(MESSAGE);

    const { options } = usedTransport().transporter;

    for (const key of ['connectionTimeout', 'greetingTimeout', 'socketTimeout'] as const) {
      const value = options[key];

      expect(typeof value, `${key}: ${String(value)}`).toBe('number');
      expect(value as number, key).toBeGreaterThan(0);
      expect(value as number, key).toBeLessThanOrEqual(TIMEOUT_LIMIT_MS);
    }
  });

  it('M3: smtp без логина на localhost:587 — host 127.0.0.1, порт 587, без secure и auth, servername localhost', async () => {
    process.env.SMTP_URL = 'smtp://localhost:587';

    await sendMail(MESSAGE);

    const { options } = usedTransport().transporter;

    expect(options.host, 'адрес SMTP — IPv4').toBe('127.0.0.1');
    expect(options.port).toBe(587);
    expect(options.secure).toBe(false);
    expect(options.auth, 'логина в строке нет — нет и auth').toBeUndefined();
    expect(options.tls?.servername, 'имя для TLS — исходное имя хоста').toBe('localhost');
  });

  it('M4: SMTP только по IPv6 — sendMail отклоняется, письмо не уходит', async () => {
    process.env.SMTP_URL = 'smtp://[::1]:2525';

    await expect(sendMail(MESSAGE)).rejects.toBeInstanceOf(Error);

    const sent = created.flatMap((transport) => transport.sendMail.mock.calls);

    expect(sent, 'отправок через транспорт без IPv4-адреса').toEqual([]);
  });

  it('M6: без порта — 465 для smtps и 587 для smtp; IPv4-литерал — host как есть, без servername; пароль раскодирован', async () => {
    const optionsFor = async (smtpUrl: string) => {
      created.length = 0;
      process.env.SMTP_URL = smtpUrl;
      await sendMail(MESSAGE);

      return usedTransport().transporter.options;
    };

    expect((await optionsFor('smtps://localhost')).port, 'smtps без порта').toBe(465);
    expect((await optionsFor('smtp://localhost')).port, 'smtp без порта').toBe(587);

    const literal = await optionsFor('smtp://127.0.0.1:2525');

    expect(literal.host).toBe('127.0.0.1');
    expect(literal.tls?.servername, 'у IP-литерала имени для TLS нет').toBeUndefined();

    expect((await optionsFor('smtps://hello%40mrshkn.com:s%40cret@localhost:465')).auth).toEqual({
      user: 'hello@mrshkn.com',
      pass: 's@cret',
    });
  });

  it('M7: битый % в пароле не роняет почту — пароль уходит как есть', async () => {
    process.env.SMTP_URL = 'smtps://hello%40mrshkn.com:50%zz@localhost:465';

    await sendMail(MESSAGE);

    expect(usedTransport().transporter.options.auth).toEqual({ user: 'hello@mrshkn.com', pass: '50%zz' });
  });

  it('M5: createTransport( в src/ встречается только в src/lib/delivery/mail.ts — вся почта идет через sendMail', () => {
    const files = listFiles(join(ROOT, 'src'));
    const found = files.filter((path) => readFileSync(join(ROOT, path), 'utf8').includes('createTransport('));

    expect(files.length, 'файлов в src/').toBeGreaterThan(1);
    expect(found, 'файлы, создающие свой транспорт почты').toEqual(['src/lib/delivery/mail.ts']);
  });
});
