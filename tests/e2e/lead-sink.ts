import { createServer, type IncomingMessage } from 'node:http';
import { SMTPServer } from 'smtp-server';
import { SINK_HTTP_PORT, SINK_SMTP_PORT } from './consts.ts';
import type { SinkCall } from './types.ts';

const calls: SinkCall[] = [];

const readBody = async (request: IncomingMessage) => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks).toString('utf8');
};

/** Письмо приходит закодированным: без раскодировки в теле вместо «source=site» лежит «source=3Dsite». */
const decodeMessage = (raw: string) => {
  const separator = raw.indexOf('\r\n\r\n');
  const head = raw.slice(0, separator);
  const body = raw.slice(separator + 4);

  if (/content-transfer-encoding:\s*base64/i.test(head)) {
    return Buffer.from(body, 'base64').toString('utf8');
  }

  if (/content-transfer-encoding:\s*quoted-printable/i.test(head)) {
    const bytes: number[] = [];
    const unfolded = body.replace(/=\r\n/g, '');

    for (let index = 0; index < unfolded.length; index += 1) {
      if (unfolded[index] === '=' && /^[0-9A-Fa-f]{2}$/.test(unfolded.slice(index + 1, index + 3))) {
        bytes.push(Number.parseInt(unfolded.slice(index + 1, index + 3), 16));
        index += 2;
        continue;
      }

      bytes.push(...Buffer.from(unfolded[index], 'utf8'));
    }

    return Buffer.from(bytes).toString('utf8');
  }

  return body;
};

const http = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://127.0.0.1:${SINK_HTTP_PORT}`);

  if (request.method === 'GET' && url.pathname === '/calls') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(calls));

    return;
  }

  if (request.method === 'DELETE' && url.pathname === '/calls') {
    calls.length = 0;
    response.writeHead(204);
    response.end();

    return;
  }

  if (request.method === 'POST' && url.pathname.startsWith('/telegram/')) {
    calls.push({ channel: 'telegram', body: await readBody(request) });
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: true, result: { message_id: calls.length } }));

    return;
  }

  if (request.method === 'POST' && url.pathname.startsWith('/bitrix/')) {
    calls.push({ channel: 'bitrix', body: await readBody(request) });
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ result: calls.length }));

    return;
  }

  response.writeHead(404);
  response.end();
});

const smtp = new SMTPServer({
  authOptional: true,
  hideSTARTTLS: true,
  onData(stream, _session, callback) {
    const chunks: Buffer[] = [];

    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => {
      calls.push({ channel: 'mail', body: decodeMessage(Buffer.concat(chunks).toString('utf8')) });
      callback();
    });
  },
});

http.listen(SINK_HTTP_PORT);
smtp.listen(SINK_SMTP_PORT);
