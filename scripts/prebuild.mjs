// Runs all five fetchers in parallel. Each fetcher is fault-tolerant:
// failure logs a warning but does NOT fail the build.
import { spawn } from 'node:child_process';

const fetchers = [
  ['youtube',         'scripts/fetch-youtube.mjs'],
  ['sessionize',      'scripts/fetch-sessionize.mjs'],
  ['credly',          'scripts/fetch-credly.mjs'],
  ['github-readme',   'scripts/fetch-github-readme.mjs'],
  ['github-contrib',  'scripts/fetch-github-contributions.mjs'],
];

function run(label, file) {
  return new Promise((resolve) => {
    const child = spawn('node', [file], { stdio: 'inherit' });
    child.on('exit', (code) => resolve({ label, code }));
    child.on('error', () => resolve({ label, code: 1 }));
  });
}

const results = await Promise.all(fetchers.map(([l, f]) => run(l, f)));
console.log('\nprebuild summary:');
for (const r of results) {
  console.log(
    `  ${r.code === 0 ? '✓' : '✗'} ${r.label}` +
      (r.code === 0 ? '' : ` (exit ${r.code} — using cached files if any)`),
  );
}
