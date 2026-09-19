// Runs all five fetchers in parallel. Each fetcher is fault-tolerant:
// failure logs a warning but does NOT fail the build.
import { spawn } from 'node:child_process';

const fetchers = [
  ['youtube',         'scripts/fetch-youtube.mjs'],
  ['sessionize',      'scripts/fetch-sessionize.mjs'],
  ['credly',          'scripts/fetch-credly.mjs'],
  ['github-readme',   'scripts/fetch-github-readme.mjs'],
  ['github-contrib',  'scripts/fetch-github-contributions.mjs'],
  ['dash0',           'scripts/fetch-dash0.mjs'],
  ['notist',          'scripts/fetch-notist.mjs'],
];

function run(label, file) {
  return new Promise((resolve) => {
    const child = spawn('node', [file], { stdio: 'inherit' });
    child.on('exit', (code) => resolve({ label, code }));
    child.on('error', () => resolve({ label, code: 1 }));
  });
}

const results = await Promise.all(fetchers.map(([l, f]) => run(l, f)));

// Post-passes run AFTER every fetcher, never in parallel with them: the same
// talk can arrive from both the GitHub README and the YouTube playlist, so the
// duplicates only exist once both have finished writing.
// prune-talks runs last: dedupe may merge two entries into one keeper, and an
// excluded talk must be dropped whichever file survives that merge.
// link-decks runs after prune: it must not link a deck to a talk that is
// about to be merged away or excluded from the site.
// link-recordings runs after dedupe (which handles title-matchable pairs) and
// before link-decks, so a deck can attach to the combined engagement.
const postPasses = [
  ['dedupe-talks', 'scripts/dedupe-talks.mjs'],
  ['link-recordings', 'scripts/link-recordings.mjs'],
  ['prune-talks', 'scripts/prune-talks.mjs'],
  ['link-decks', 'scripts/link-decks.mjs'],
  // A second recording pass, because link-decks teaches the first one things it
  // could not know: a YouTube entry arrives labelled with the channel name and
  // the upload date, and only once its deck is attached does it carry the event
  // and the day the talk was given. The ContainerDays 2025 recording was
  // unmatchable on the first pass ("Kasper Borg Nissen", 2025-10-01) and
  // obvious on the second ("Container Days Conference", 2025-09-09).
  // Idempotent: an engagement that already has a recording is never a candidate.
  ['link-recordings (2)', 'scripts/link-recordings.mjs'],
  // Hand-entered corrections win over everything the fetchers inferred.
  ['talk-overrides', 'scripts/apply-talk-overrides.mjs'],
];
for (const [label, file] of postPasses) {
  results.push(await run(label, file));
}

console.log('\nprebuild summary:');
for (const r of results) {
  console.log(
    `  ${r.code === 0 ? '✓' : '✗'} ${r.label}` +
      (r.code === 0 ? '' : ` (exit ${r.code} — using cached files if any)`),
  );
}
