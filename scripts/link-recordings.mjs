// Folds a YouTube recording into the engagement it was recorded at, using the
// event link in the video description. See scripts/lib/recording-match.mjs for
// why the description domain beats title matching here.
//
// Runs after dedupe-talks (which handles the title-matchable pairs) and before
// link-decks, so a deck can then attach to the combined entry.

import fs from 'node:fs/promises';
import path from 'node:path';
import { planRecordingLinks } from './lib/recording-match.mjs';

const ROOT = 'src/content/talks';
const YOUTUBE_DIR = path.join(ROOT, 'youtube');

async function walk(dir, acc = []) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, acc);
    else if (e.name.endsWith('.yaml')) acc.push(full);
  }
  return acc;
}

function readField(text, key) {
  const m = text.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  if (!m) return null;
  const raw = m[1].trim();
  if (raw === '' || raw === 'null') return null;
  if (raw.startsWith('"')) {
    try { return JSON.parse(raw); } catch { return raw.replace(/^"|"$/g, ''); }
  }
  return raw;
}

function upsert(text, key, value) {
  const line = `${key}: ${value}`;
  const re = new RegExp(`^${key}:.*$`, 'm');
  if (re.test(text)) return text.replace(re, line);
  return text.replace(/\n*$/, '\n') + line + '\n';
}

function assertUnder(file, dir) {
  const rel = path.relative(dir, file);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`[link-recordings] refusing to write outside ${dir}: ${file}`);
  }
}

const FIELDS = [
  'title', 'date', 'end_date', 'event', 'event_url', 'location', 'youtube_id',
  'abstract', 'playlist_position', 'deck_file',
];

const all = [];
for (const file of await walk(ROOT)) {
  const text = await fs.readFile(file, 'utf8');
  const rec = { path: file, text };
  for (const f of FIELDS) rec[f] = readField(text, f);
  if (!rec.date) continue;
  all.push(rec);
}

// Only YouTube-sourced entries are candidates to be absorbed: they are the ones
// whose `event` is a channel name and whose date is an upload date. Curated
// entries already know where and when they happened.
const recordings = all.filter((r) => r.youtube_id && r.path.startsWith(YOUTUBE_DIR + path.sep));
// No event_url requirement: an engagement can also be identified by its name.
const engagements = all.filter(
  (r) => !r.youtube_id && r.event && !r.path.startsWith(YOUTUBE_DIR + path.sep),
);

const { links, adoptions } = planRecordingLinks(recordings, engagements);

for (const link of links) {
  assertUnder(link.engagement.path, ROOT);

  let text = link.engagement.text;
  text = upsert(text, 'youtube_id', link.recording.youtube_id);
  // The engagement is the authority on title, event, date and location; the
  // recording only supplies what the engagement is missing.
  if (link.recording.title && !link.engagement.title) {
    text = upsert(text, 'title', JSON.stringify(link.recording.title));
  }
  if (link.recording.abstract && !link.engagement.abstract) {
    text = upsert(text, 'abstract', JSON.stringify(link.recording.abstract));
  }
  if (link.recording.playlist_position) {
    text = upsert(text, 'playlist_position', link.recording.playlist_position);
  }
  await fs.writeFile(link.engagement.path, text);

  // Safe to remove: the YouTube fetcher regenerates this directory every build,
  // and it now skips ids already claimed by another entry.
  assertUnder(link.recording.path, YOUTUBE_DIR);
  await fs.unlink(link.recording.path);

  console.log(
    `[link-recordings] ${link.engagement.event} ← ${link.recording.youtube_id}` +
      ` (${link.matchedBy}, +${link.lagDays}d)`,
  );
}

// A second session at an engagement another recording already absorbed. It
// keeps its own entry — it is a genuinely different talk — but takes the event
// name, location and real dates in place of the channel name and upload date.
for (const link of adoptions) {
  assertUnder(link.recording.path, YOUTUBE_DIR);

  let text = link.recording.text;
  const e = link.engagement;
  text = upsert(text, 'event', JSON.stringify(e.event));
  text = upsert(text, 'date', e.date);
  if (e.end_date) text = upsert(text, 'end_date', e.end_date);
  if (e.event_url) text = upsert(text, 'event_url', JSON.stringify(e.event_url));
  if (e.location) text = upsert(text, 'location', JSON.stringify(e.location));
  await fs.writeFile(link.recording.path, text);

  console.log(
    `[link-recordings] ${e.event} ⊕ ${link.recording.youtube_id}` +
      ` (also at this event; ${link.matchedBy})`,
  );
}

console.log(
  `[link-recordings] ${links.length} recordings folded into engagements, ` +
    `${adoptions.length} relabelled as extra sessions ` +
    `(${recordings.length} recordings, ${engagements.length} candidate engagements)`,
);
