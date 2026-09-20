import { spawnSync } from 'node:child_process';

const DESIGNS = ['kinetic', 'terminal', 'pop', 'swiss', 'editorial'];

const lhci = (design, ...args) => {
  const result = spawnSync('yarn', ['lhci', ...args], {
    stdio: 'inherit',
    env: { ...process.env, LIGHTHOUSE_DESIGN: design },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

// Первый прогон на свежем раннере измеряет холодный Chrome и Node, а не сайт: TBT там в 3–4 раза
// выше остальных. Прогревочный прогон не попадает ни в assert, ни в отчеты.
console.log('\n=== Lighthouse CI: warm-up (не учитывается) ===');
lhci(DESIGNS[0], 'collect', '--numberOfRuns=1');

for (const design of DESIGNS) {
  console.log(`\n=== Lighthouse CI: ${design} ===`);
  lhci(design, 'autorun');
}
