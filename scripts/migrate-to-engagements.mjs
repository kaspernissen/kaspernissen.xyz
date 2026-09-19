// One-off migration: folds src/content/conferences and src/content/decks into
// the unified src/content/talks collection.
//
//   node scripts/migrate-to-engagements.mjs [--dry]
//
// Field mapping:
//   conferences  name -> event, url -> event_url, session_title -> title
//   decks        file -> deck_file, size_mb -> deck_size_mb, title/event kept
//   talks        slides_pdf -> deck_file
//
// Fetcher-owned directories are migrated too, but the fetchers themselves were
// updated to emit the new shape, so this is about existing files rather than
// future ones.

import fs from 'node:fs/promises';
import path from 'node:path';

const dry = process.argv.includes('--dry');

const TALKS = 'src/content/talks';
const CONFERENCES = 'src/content/conferences';
const DECKS = 'src/content/decks';

const Q = '"';

function parse(text) {
  const out = {};
  const lines = text.split('\n');
  let listKey = null;
  for (const line of lines) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      (out[listKey] ||= []).push(unquote(item[1]));
      continue;
    }
    listKey = null;
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, raw] = m;
    const v = raw.trim();
    if (v === '') { listKey = key; out[key] = []; continue; }
    if (v === '[]') { out[key] = []; continue; }
    if (v === 'null') { out[key] = null; continue; }
    if (v === 'true' || v === 'false') { out[key] = v === 'true'; continue; }
    if (/^-?\d+(\.\d+)?$/.test(v)) { out[key] = Number(v); continue; }
    out[key] = unquote(v);
  }
  return out;
}

function unquote(v) {
  if (v.startsWith(Q)) {
    try { return JSON.parse(v); } catch { return v.replace(/^"|"$/g, ''); }
  }
  return v;
}

const KEY_ORDER = [
  'title', 'event', 'event_url', 'session_url', 'date', 'end_date', 'location',
  'role', 'status', 'co_speakers', 'abstract', 'youtube_id', 'deck_file',
  'deck_size_mb', 'notist_url', 'tags', 'featured', 'slug', 'playlist_position',
];

const RAW_KEYS = new Set(['date', 'end_date', 'youtube_id']);

export function serialise(o) {
  const lines = [];
  for (const key of KEY_ORDER) {
    const v = o[key];
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) {
        if (key === 'tags' || key === 'co_speakers') lines.push(`${key}: []`);
        continue;
      }
      lines.push(`${key}:`);
      for (const it of v) lines.push(`  - ${JSON.stringify(it)}`);
      continue;
    }
    if (v === null) {
      // Only keep nulls that carry meaning (a field known to be empty).
      if (['youtube_id', 'deck_file', 'title', 'location'].includes(key)) lines.push(`${key}: null`);
      continue;
    }
    if (typeof v === 'number' || typeof v === 'boolean') { lines.push(`${key}: ${v}`); continue; }
    if (RAW_KEYS.has(key)) { lines.push(`${key}: ${v}`); continue; }
    lines.push(`${key}: ${JSON.stringify(v)}`);
  }
  return lines.join('\n') + '\n';
}

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

let nTalks = 0, nConf = 0, nDeck = 0;

// 1. Existing talks: rename slides_pdf -> deck_file.
for (const file of await walk(TALKS)) {
  const o = parse(await fs.readFile(file, 'utf8'));
  if (o.slides_pdf !== undefined) {
    o.deck_file = o.slides_pdf;
    delete o.slides_pdf;
  }
  if (o.title == null) o.title = null;
  if (!dry) await fs.writeFile(file, serialise(o));
  nTalks++;
}

// 2. Conferences become engagements.
for (const file of await walk(CONFERENCES)) {
  const c = parse(await fs.readFile(file, 'utf8'));
  const o = {
    title: c.session_title ?? null,
    event: c.name,
    event_url: c.url ?? null,
    session_url: c.session_url ?? null,
    date: c.date,
    end_date: c.end_date ?? null,
    location: c.location ?? null,
    role: c.role ?? 'speaker',
    co_speakers: c.co_speakers ?? [],
    tags: [],
    featured: false,
  };
  const rel = path.relative(CONFERENCES, file);
  const dest = path.join(TALKS, 'events', rel);
  if (!dry) {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, serialise(o));
  }
  nConf++;
}

// 3. Decks become engagements too — a deck IS a delivery, and link-decks folds
//    it into the matching recording afterwards where one exists.
for (const file of await walk(DECKS)) {
  const d = parse(await fs.readFile(file, 'utf8'));
  const o = {
    title: d.title ?? null,
    event: d.event ?? 'Unknown event',
    date: d.date,
    location: null,
    role: 'speaker',
    deck_file: d.file ?? null,
    deck_size_mb: d.size_mb ?? null,
    notist_url: d.notist_url ?? null,
    tags: [],
    featured: false,
  };
  const rel = path.relative(DECKS, file);
  const dest = path.join(TALKS, 'decks', rel);
  if (!dry) {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, serialise(o));
  }
  nDeck++;
}

console.log(
  `${dry ? '[dry] ' : ''}migrated: ${nTalks} talks rewritten, ` +
    `${nConf} conferences -> talks/events, ${nDeck} decks -> talks/decks`,
);
if (!dry) console.log('Remove src/content/conferences and src/content/decks once verified.');
