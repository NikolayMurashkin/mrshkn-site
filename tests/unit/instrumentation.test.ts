import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { register } from '@/instrumentation';

/**
 * Payload сайта поднимается при старте процесса, до первого запроса: миграции и расписание задач не ждут посетителя.
 * Подъем идет только в рантайме Node.js и не на фазе сборки; упал — ошибка в лог и выход с ненулевым кодом, чтобы
 * хостинг не пустил трафик на контейнер без базы. Payload и конфиг — моки: проверяется сам вызов.
 */

const mocks = vi.hoisted(() => ({
  config: { label: 'конфиг сайта' },
  getPayload: vi.fn(),
}));

vi.mock('payload', () => ({ getPayload: mocks.getPayload }));

vi.mock('@/payload.config', () => ({ default: mocks.config }));

const ENV_KEYS = ['NEXT_RUNTIME', 'NEXT_PHASE'] as const;

let savedEnv: Record<(typeof ENV_KEYS)[number], string | undefined>;
let exit: MockInstance<typeof process.exit>;
let errors: MockInstance<typeof console.error>;

const setEnv = (env: Partial<Record<(typeof ENV_KEYS)[number], string>>) => {
  for (const key of ENV_KEYS) {
    if (env[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = env[key];
    }
  }
};

beforeEach(() => {
  savedEnv = { NEXT_RUNTIME: process.env.NEXT_RUNTIME, NEXT_PHASE: process.env.NEXT_PHASE };
  mocks.getPayload.mockReset();
  mocks.getPayload.mockResolvedValue({});
  exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  setEnv(savedEnv as Partial<Record<(typeof ENV_KEYS)[number], string>>);
});

describe('подъем Payload при старте процесса', () => {
  it('I1: рантайм nodejs вне сборки — getPayload один раз с конфигом сайта и cron: true', async () => {
    setEnv({ NEXT_RUNTIME: 'nodejs' });

    await register();

    expect(mocks.getPayload, 'вызовов getPayload').toHaveBeenCalledTimes(1);

    const [options] = mocks.getPayload.mock.calls[0] as [{ config?: unknown; cron?: unknown }];

    expect(options.config, 'конфиг — тот, что экспортирует payload.config').toBe(mocks.config);
    expect(options.cron, 'cron: true — иначе очередь задач не крутится').toBe(true);
  });

  it('I2: рантайм edge — getPayload не вызван, выхода нет', async () => {
    setEnv({ NEXT_RUNTIME: 'edge' });

    await register();

    expect(mocks.getPayload).not.toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
  });

  it('I3: фаза сборки — getPayload не вызван', async () => {
    setEnv({ NEXT_RUNTIME: 'nodejs', NEXT_PHASE: 'phase-production-build' });

    await register();

    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it('I4: getPayload отклонен — ошибка в лог и выход с ненулевым кодом', async () => {
    setEnv({ NEXT_RUNTIME: 'nodejs' });

    const failure = new Error('db down');

    mocks.getPayload.mockRejectedValue(failure);

    // Выход замокан, процесс живет дальше: реализации разрешено и пробросить ошибку после выхода.
    await register().catch(() => undefined);

    await vi.waitFor(() => expect(exit, 'process.exit после отказа подъема').toHaveBeenCalled(), { timeout: 2000 });

    expect(
      errors.mock.calls.some((call) => call.includes(failure)),
      `console.error без самой ошибки подъема; было: ${JSON.stringify(errors.mock.calls.map((call) => call.map(String)))}`,
    ).toBe(true);
    expect(
      exit.mock.calls.some(([code]) => typeof code === 'number' && code !== 0),
      `код выхода не ненулевой: ${JSON.stringify(exit.mock.calls)}`,
    ).toBe(true);
  });
});
