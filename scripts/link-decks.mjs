// Folds a Notist-sourced deck entry into the recording entry for the same
// delivery, so one engagement carries both.
//
// Runs as a post-pass (see refresh.mjs) after link-recordings, so
// it never merges into an entry that is about to be dropped.
//
// Both sides are now entries in the same `talks` collection: the YouTube
// fetcher writes one with a recording, the Notist fetcher writes one with a
// deck. Where they are the same delivery the deck's fields move onto the
// recording and the deck-only file is removed. Where they are not — a talk
// given three times but recorded once — the deck keeps its own entry, which is
// correct: that delivery really does have slides and no video.
//
// See scripts/lib/deck-match.mjs for why title matching alone is not safe.

import fs from 'node:fs/promises';
import path from 'node:path';
import { planDeckLinks, planEngagementDeckLinks } from './lib/deck-match.mjs';

const ROOT = 'src/content/talks';
const DECK_DIR = path.join(ROOT, 'decks');
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

/** Sets `key` to `value` in a flat YAML doc, replacing any existing line. */
function upsert(text, key, value) {
  const line = `${key}: ${value}`;
  const re = new RegExp(`^${key}:.*$`, 'm');
  if (re.test(text)) return text.replace(re, line);
  return text.replace(/\n*$/, '\n') + line + '\n';
}

function assertUnder(file, dir) {
  const rel = path.relative(dir, file);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`[link-decks] refusing to write outside ${dir}: ${file}`);
  }
}

// Deletion guard. This used to be `assertUnder(file, ROOT/decks)`: a deck
// entry was only ever removed if it sat in the directory fetch-notist owned,
// so a bug here could not eat a hand-written engagement. The directories are
// gone, so the same protection now asks what the entry IS rather than where it
// lives — a deck absorbed into another entry must carry the Notist URL it came
// from, which no hand-written engagement has.
function assertIsDeckEntry(rec) {
  if (!rec.notist_url) {
    throw new Error(`[link-decks] refusing to delete a non-deck entry: ${rec.path}`);
  }
}

const FIELDS = [
  'title', 'date', 'end_date', 'event', 'location', 'youtube_id',
  'deck_file', 'deck_size_mb', 'notist_url', 'abstract',
];

const all = [];
for (const file of await walk(ROOT)) {
  const text = await fs.readFile(file, 'utf8');
  const rec = { path: file, text };
  // A hidden entry is a tombstone: it exists only so the fetchers recognise
  // the upstream record and do not create the file again. It must never win a
  // deck or a recording away from an entry the site actually shows.
  if (/^hidden:\s*true\s*$/m.test(text)) continue;
  for (const f of FIELDS) rec[f] = readField(text, f);
  // A title is required of decks (the first pass matches on it) but NOT of
  // engagements — a Sessionize entry usually has none and displays its event
  // name instead. Dropping those here would hide every deck↔engagement pair.
  if (!rec.date) continue;
  all.push(rec);
}

// Deck side = entries that carry a deck but no recording. Talk side = entries
// with a recording. An entry that already has both is left alone.
const deckSide = all.filter((r) => r.deck_file && !r.youtube_id);
const talkSide = all.filter((r) => r.youtube_id && !r.deck_file);

const { links, unlinkedDecks } = planDeckLinks(deckSide, talkSide);

for (const link of links) {
  assertUnder(link.talk.path, ROOT);

  let text = link.talk.text;
  text = upsert(text, 'deck_file', JSON.stringify(link.deck.deck_file));
  if (link.deck.deck_size_mb) text = upsert(text, 'deck_size_mb', link.deck.deck_size_mb);
  if (link.deck.notist_url) text = upsert(text, 'notist_url', JSON.stringify(link.deck.notist_url));

  // A YouTube-sourced entry knows only the channel name and the upload date.
  // The deck knows where and when the talk was actually given — Notist records
  // the delivery, not the publication — so it wins on both. Without this,
  // "Breaking Free with Open Standards" reads as 2025-10-01 by "Kasper Borg
  // Nissen" instead of 2025-09-09 at ContainerDays.
  if (link.talk.path.startsWith(YOUTUBE_DIR + path.sep)) {
    if (link.deck.date) text = upsert(text, 'date', link.deck.date);
    if (link.deck.event) text = upsert(text, 'event', JSON.stringify(link.deck.event));
    if (link.deck.location) text = upsert(text, 'location', JSON.stringify(link.deck.location));
  }
  await fs.writeFile(link.talk.path, text);

  // The deck's own entry has been absorbed; keeping it would list the same
  // delivery twice. Only ever removes a file the Notist fetcher regenerates.
  assertIsDeckEntry(link.deck);
  await fs.unlink(link.deck.path);

  console.log(
    `[link-decks] merged deck into ${path.basename(link.talk.path)}\n` +
      `               +${link.lagDays}d  title ${link.similarity.toFixed(2)}` +
      `${link.sameEvent ? '  event✓' : ''}  (${link.talk.youtube_id})`,
  );
}

// Second pass: a deck with no recording to attach to may still belong to a
// scheduled engagement — the Notist deck and the Sessionize entry are then two
// halves of the same delivery. Matching on event + date folds them together and
// gives the engagement the session title it was missing.
const engagementSide = all.filter(
  (r) => !r.deck_file && !r.youtube_id && !r.notist_url,
);
const second = planEngagementDeckLinks(unlinkedDecks, engagementSide);

for (const link of second.links) {
  assertUnder(link.engagement.path, ROOT);

  let text = link.engagement.text;
  text = upsert(text, 'deck_file', JSON.stringify(link.deck.deck_file));
  if (link.deck.deck_size_mb) text = upsert(text, 'deck_size_mb', link.deck.deck_size_mb);
  if (link.deck.notist_url) text = upsert(text, 'notist_url', JSON.stringify(link.deck.notist_url));
  // The engagement usually has no session title; the deck is where it lives.
  if (link.deck.title && !link.engagement.title) {
    text = upsert(text, 'title', JSON.stringify(link.deck.title));
  }
  if (link.deck.abstract && !link.engagement.abstract) {
    text = upsert(text, 'abstract', JSON.stringify(link.deck.abstract));
  }
  await fs.writeFile(link.engagement.path, text);

  assertIsDeckEntry(link.deck);
  await fs.unlink(link.deck.path);

  console.log(
    `[link-decks] merged deck into engagement ${path.basename(link.engagement.path)}` +
      ` (${link.engagement.event}, ${link.offDays}d off)`,
  );
}

for (const deck of second.unlinkedDecks) {
  console.log(
    `[link-decks] slides only, no recording: ${JSON.stringify(String(deck.title).slice(0, 48))} (${deck.date})`,
  );
}

console.log(
  `[link-decks] ${links.length} decks merged into recordings, ` +
    `${second.links.length} into scheduled engagements, ` +
    `${second.unlinkedDecks.length} kept as slides-only engagements`,
);
