// Applies hand-entered corrections to talk entries, last in the pipeline.
//
// Every fetcher deletes and rewrites its own directory, so editing a file under
// src/content/talks/youtube/ or .../sessionize/ lasts exactly until the next
// build. Anything you want to stay true has to live outside those directories —
// this is that place for individual talks, the way data/conference-overrides.json
// is for events.
//
// Keyed by youtube_id, which is the one identifier that survives a re-fetch:
// slugs move when a title or date is corrected, and file paths move when an
// entry is folded into an engagement.

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = 'src/content/talks';
const OVERRIDES = 'data/talk-overrides.json';

// Written unquoted so Astro's z.coerce.date() and the numeric fields parse.
const RAW_KEYS = new Set(['date', 'end_date', 'youtube_id', 'deck_size_mb', 'playlist_position']);

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
  const rendered = RAW_KEYS.has(key) ? String(value) : JSON.stringify(value);
  const line = `${key}: ${rendered}`;
  const re = new RegExp(`^${key}:.*$`, 'm');
  if (re.test(text)) return text.replace(re, line);
  return text.replace(/\n*$/, '\n') + line + '\n';
}

let raw;
try {
  raw = JSON.parse(await fs.readFile(OVERRIDES, 'utf8'));
} catch {
  console.log('[talk-overrides] no data/talk-overrides.json — nothing to apply');
  process.exit(0);
}

const overrides = Object.fromEntries(
  Object.entries(raw).filter(([k]) => !k.startsWith('_')),
);

// Every entry, not just the ones with a video: `engagement` below needs to find
// the engagement to absorb a recording into, and an engagement is precisely an
// entry that has no recording yet.
const entries = [];
const byVideo = new Map();
for (const file of await walk(ROOT)) {
  const text = await fs.readFile(file, 'utf8');
  const entry = { file, text };
  entries.push(entry);
  const id = readField(text, 'youtube_id');
  if (id) byVideo.set(id, entry);
}

// The automatic matchers claim a recording from its description or its channel
// name. Neither works for a video published by an umbrella channel like CNCF,
// which puts out talks from hundreds of events and links only to youtube.com —
// so those recordings are correctly left alone and sit as their own entry.
// `engagement` is the manual answer: name the event and the recording is folded
// into it, the same way link-recordings would have.
const eventKey = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Move a recording's video, abstract and playlist position onto the engagement
 * named by `eventName`, then delete the recording's own file.
 *
 * Refuses on anything ambiguous — no match, several matches, or a target that
 * already has a recording — because a wrong absorb deletes a real entry.
 */
async function absorb(videoId, eventName, source, entries) {
  const wanted = eventKey(eventName);
  const targets = entries.filter(
    (e) => e.file !== source.file && eventKey(readField(e.text, 'event')) === wanted,
  );
  if (targets.length !== 1) {
    console.warn(
      `[talk-overrides] ${videoId}: ${targets.length} engagements named ${JSON.stringify(eventName)} — not absorbed`,
    );
    return null;
  }
  const target = targets[0];
  const occupied = readField(target.text, 'youtube_id');
  if (occupied && occupied !== videoId) {
    console.warn(
      `[talk-overrides] ${videoId}: ${path.basename(target.file)} already has recording ${occupied} — not absorbed`,
    );
    return null;
  }

  let text = target.text;
  text = upsert(text, 'youtube_id', videoId);
  for (const key of ['abstract', 'playlist_position']) {
    const value = readField(source.text, key);
    if (value !== null) text = upsert(text, key, value);
  }
  // The engagement usually has no session title — that is why it needed one.
  if (!readField(text, 'title')) {
    const title = readField(source.text, 'title');
    if (title) text = upsert(text, 'title', title);
  }

  await fs.writeFile(target.file, text);
  await fs.unlink(source.file);
  console.log(
    `[talk-overrides] ${videoId} absorbed into ${path.basename(target.file)} ` +
      `(was ${path.basename(source.file)})`,
  );
  return { file: target.file, text };
}

let applied = 0;
const missing = [];

for (const [videoId, fields] of Object.entries(overrides)) {
  let target = byVideo.get(videoId);
  if (!target) { missing.push(videoId); continue; }

  if (fields.engagement) {
    const moved = await absorb(videoId, fields.engagement, target, entries);
    if (moved) {
      // Everything else in this override applies to the merged entry; the
      // recording's own file is gone.
      const gone = entries.indexOf(target);
      if (gone !== -1) entries.splice(gone, 1);
      Object.assign(entries.find((e) => e.file === moved.file) ?? {}, moved);
      byVideo.set(videoId, moved);
      target = moved;
    }
  }

  let text = target.text;
  for (const [key, value] of Object.entries(fields)) {
    if (key.startsWith('_') || key === 'engagement') continue;
    if (Array.isArray(value)) {
      // Rewrite the whole block: drop the old key and its indented items.
      text = text.replace(new RegExp(`^${key}:(?:.*)$(?:\\n[ \\t]+-.*$)*\\n?`, 'm'), '');
      text = text.replace(/\n*$/, '\n') +
        (value.length === 0 ? `${key}: []\n`
          : `${key}:\n` + value.map((v) => `  - ${JSON.stringify(v)}`).join('\n') + '\n');
      continue;
    }
    text = upsert(text, key, value);
  }
  await fs.writeFile(target.file, text);
  applied++;
  console.log(`[talk-overrides] ${videoId} → ${path.basename(target.file)} (${Object.keys(fields).filter((k) => !k.startsWith('_') && k !== 'engagement').join(', ')})`);
}

// Report rather than fail: a video can legitimately disappear from the playlist,
// and a silent no-op is how a typo goes unnoticed for months.
for (const id of missing) {
  console.warn(`[talk-overrides] no entry carries youtube_id ${id} — override unused`);
}

console.log(`[talk-overrides] ${applied} applied, ${missing.length} unused`);
