// Runs the fetchers, then the post-passes. Each fetcher is fault-tolerant:
// failure logs a warning but does NOT fail the build.
import { spawn } from 'node:child_process';

// Every fetcher here deletes and rewrites one directory under
// src/content/talks/, and none of them reads another's output, so they are
// safe to run together.
const talkWriters = [
  ['sessionize',      'scripts/fetch-sessionize.mjs'],
  ['github-readme',   'scripts/fetch-github-readme.mjs'],
  ['notist',          'scripts/fetch-notist.mjs'],
];

// Nothing to do with talks; safe to run alongside anything.
const independent = [
  ['credly',          'scripts/fetch-credly.mjs'],
  ['github-contrib',  'scripts/fetch-github-contributions.mjs'],
  ['dash0',           'scripts/fetch-dash0.mjs'],
];

// MUST run after talkWriters, never beside them. fetch-youtube scans the whole
// of src/content/talks/ for video IDs some other entry already claims, so it
// can skip writing a duplicate. Run in parallel with the fetchers that own
// those directories, it reads a mixture of last build's files and this one's:
// it saw a committed Sessionize engagement claiming q_Ffw2P_31Q, skipped the
// video, and then fetch-sessionize deleted that engagement and rewrote it from
// upstream without the ID. The recording existed nowhere, link-recordings had
// nothing to fold in, and every override keyed on it logged "override unused".
//
// The failure was a race, so it did not reproduce: a second build in the same
// working tree reads the directories the first one rewrote and comes out
// right, which is why this was invisible locally and wrong on every deploy.
const talkReaders = [
  ['youtube',         'scripts/fetch-youtube.mjs'],
];

function run(label, file) {
  return new Promise((resolve) => {
    const child = spawn('node', [file], { stdio: 'inherit' });
    child.on('exit', (code) => resolve({ label, code }));
    child.on('error', () => resolve({ label, code: 1 }));
  });
}

const results = await Promise.all(
  [...talkWriters, ...independent].map(([l, f]) => run(l, f)),
);
for (const [label, file] of talkReaders) {
  results.push(await run(label, file));
}

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
