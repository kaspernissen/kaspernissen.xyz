// Writes down what the merge passes just worked out.
//
// dedupe-talks, link-recordings and link-decks decide things like "this
// recording is the talk given at that conference" and fold one entry into
// another. They express that by moving fields — the engagement gains a
// `youtube_id`, the recording's own file is deleted.
//
// That is not enough on its own. The next refresh looks up each video by
// `sources.youtube`, so an engagement holding a `youtube_id` it never recorded
// as provenance looks like a video nothing claims, and a duplicate entry is
// created beside it. This closes that gap: a field that identifies an upstream
// record becomes the provenance key for it.
//
// Running this after the merge passes is what turns a heuristic into a fact.
// The guess happens once; from then on the key matches and nothing is guessed
// again — which is precisely what the old pipeline could not do, because it
// threw the answer away with the directory on every build.

import { loadEntries, save, TALKS_DIR } from './lib/entries.mjs';

// field on the entry -> the source whose key it is
const DERIVED = {
  youtube_id: 'youtube',
  notist_url: 'notist',
};

let changed = 0;
const conflicts = [];

for (const { file, fields } of await loadEntries(TALKS_DIR)) {
  const sources = { ...(fields.sources ?? {}) };
  let touched = false;

  for (const [field, source] of Object.entries(DERIVED)) {
    const value = fields[field];
    if (!value) continue;
    if (sources[source] === value) continue;
    if (sources[source] !== undefined) {
      // The entry says it came from one video and now carries another. Never
      // silently repoint: that is how a talk ends up showing someone else's
      // recording.
      conflicts.push(`${file}: ${source} is ${sources[source]} but ${field} is ${value}`);
      continue;
    }
    sources[source] = value;
    touched = true;
  }

  if (touched) {
    await save(file, { ...fields, sources });
    changed++;
  }
}

for (const c of conflicts) console.warn(`[record-sources] ${c}`);
console.log(`[record-sources] ${changed} entries gained provenance` + (conflicts.length ? `, ${conflicts.length} conflicts` : ''));
