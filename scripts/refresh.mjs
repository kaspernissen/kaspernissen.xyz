// Runs the fetchers, then the post-passes. Each fetcher is fault-tolerant:
// failure logs a warning but does NOT fail the build.
import { spawn } from 'node:child_process';

// Each of these owns one directory and reads nobody else's, so they are safe
// to run together. fetch-github-readme owns two — talks/ and writing/github.
const writers = [
  ['sessionize',      'scripts/fetch-sessionize.mjs'],
  ['github-readme',   'scripts/fetch-github-readme.mjs'],
  ['notist',          'scripts/fetch-notist.mjs'],
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
//
// fetch-devto is here for the same reason: it reads every other writing entry
// to spot a cross-post, and both writing/dash0 and writing/github are rewritten
// wholesale by fetchers in the wave above. Beside them it would compare against
// a half-written directory and publish a duplicate of an article the site
// already lists.
const readers = [
  ['youtube',         'scripts/fetch-youtube.mjs'],
  ['devto',           'scripts/fetch-devto.mjs'],
];

function run(label, file) {
  return new Promise((resolve) => {
    const child = spawn('node', [file], { stdio: 'inherit' });
    child.on('exit', (code) => resolve({ label, code }));
    child.on('error', () => resolve({ label, code: 1 }));
  });
}

// Before anything fetches: make sure the provenance the merge passes worked
// out last night is actually written down. record-sources also runs at the
// end, but a key recorded there is only useful to the NEXT run's lookups, and
// without this pass that run fills a blank a pass late and the tree takes two
// refreshes to settle.
const results = [await run('record-sources (pre)', 'scripts/record-sources.mjs')];

results.push(...(await Promise.all(writers.map(([l, f]) => run(l, f)))));
results.push(...(await Promise.all(readers.map(([l, f]) => run(l, f)))));

// Post-passes run AFTER every fetcher, never in parallel with them: a talk can
// arrive from both the GitHub README and the YouTube playlist, and the pair
// only exists once both have finished writing.
//
// These are the adoption heuristics — the passes that decide a recording
// belongs to a conference, or that a deck belongs to a recording. They are the
// reason the refresh opens a pull request instead of deploying: a guess made
// here used to publish itself overnight with nobody looking at it.
//
// link-recordings runs before link-decks so a deck can attach to the combined
// engagement rather than to a recording that is about to be folded away.
const postPasses = [
  // dedupe-talks is deliberately NOT here.
  //
  // It collapsed the same talk arriving from two sources by matching titles
  // and dates. Provenance now prevents that duplication outright: a record is
  // found by the key it carries, so it cannot arrive twice. Left in the
  // schedule it does active harm — it re-decides settled questions every
  // night, and because Kasper gives the same talk repeatedly ("Breaking Free
  // with Open Standards" has five deliveries) it pairs a recording with the
  // wrong one and deletes a real engagement. Two consecutive runs ate two
  // different entries.
  //
  // The script stays for one-off use: collapsing a genuine duplicate is now a
  // human decision, made once, in a pull request.
  ['link-recordings', 'scripts/link-recordings.mjs'],
  ['link-decks', 'scripts/link-decks.mjs'],
  // A second recording pass, because link-decks teaches the first one things it
  // could not know: a YouTube entry arrives labelled with the channel name and
  // the upload date, and only once its deck is attached does it carry the event
  // and the day the talk was given. The ContainerDays 2025 recording was
  // unmatchable on the first pass ("Kasper Borg Nissen", 2025-10-01) and
  // obvious on the second ("Container Days Conference", 2025-09-09).
  // Idempotent: an engagement that already has a recording is never a candidate.
  ['link-recordings (2)', 'scripts/link-recordings.mjs'],
  // No talk-overrides and no prune-talks.
  //
  // Both were replays of a patch log, needed only because the fetchers wiped
  // the directory and lost the answer every build. The corrections now live in
  // the entries themselves and reconcile cannot overwrite them; an exclusion
  // is `hidden: true` in the file it belongs to. Replaying them nightly would
  // mean two records of the same fact, free to disagree — which is how eight
  // stale overrides went unnoticed while the site was wrong.
  // Last: write down what the merge passes decided, so the next run matches on
  // a key instead of guessing again. See scripts/record-sources.mjs.
  ['record-sources', 'scripts/record-sources.mjs'],
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
