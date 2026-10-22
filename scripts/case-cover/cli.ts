import { CASE_COVER_USAGE } from './consts.ts';
import { checkCoverInput, composeCaseCover } from './compose.ts';

const ARGUMENTS_COUNT = 3;

const fail = (message: string) => {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
};

const run = async (args: string[]) => {
  if (args.length !== ARGUMENTS_COUNT) {
    fail(`Нужны три пути: ${CASE_COVER_USAGE}`);

    return;
  }

  const [desktop, mobile, output] = args;
  const problems = (await Promise.all([checkCoverInput(desktop), checkCoverInput(mobile)])).filter(
    (problem) => problem !== null,
  );

  if (problems.length > 0) {
    problems.forEach(({ message }) => fail(message));

    return;
  }

  await composeCaseCover(desktop, mobile, output);
  process.stdout.write(`Обложка готова: ${output}\n`);
};

run(process.argv.slice(2)).catch((error: unknown) => fail(error instanceof Error ? error.message : String(error)));
