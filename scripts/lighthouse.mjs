import { spawnSync } from 'node:child_process';

const DESIGNS = ['kinetic', 'terminal', 'pop', 'swiss', 'editorial'];

for (const design of DESIGNS) {
  console.log(`\n=== Lighthouse CI: ${design} ===`);
  const result = spawnSync('yarn', ['lhci', 'autorun'], {
    stdio: 'inherit',
    env: { ...process.env, LIGHTHOUSE_DESIGN: design },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
