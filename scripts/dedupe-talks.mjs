// Collapses duplicate talk entries. Runs AFTER every fetcher (see prebuild.mjs)
// because the duplicates only exist once both the GitHub README and the YouTube
// playlist have written their output.
//
// Each fetcher wipes and rewrites its own directory, so this pass re-runs on
// every build rather than being a one-time cleanup. See scripts/lib/talk-merge.mjs
// for the merge rules and why title-only matching would be unsafe.

import fs from 'node:fs/promises';
import path from 'node:path';
import { planMerges } from './lib/talk-merge.mjs';

const ROOT = 'src/content/talks';

// These YAML files are flat scalar/sequence maps written by our own fetchers,
// so a small line parser is enough — no YAML dependency needed.
function parseYaml(text) {
  const out = { tags: [], co_speakers: [] };
  const lines = text.split('\n');
  let listKey = null;
  for (const line of lines) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      out[listKey].push(unquote(item[1]));
      continue;
    }
    listKey = null;
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, rawValue] = m;
    const value = rawValue.trim();
    if (value === '' ) { listKey = key; out[key] = out[key] ?? []; continue; }
    if (value === '[]') { out[key] = []; continue; }
    if (value === 'null') { out[key] = null; continue; }
    if (value === 'true' || value === 'false') { out[key] = value === 'true'; continue; }
    if (/^-?\d+(\.\d+)?$/.test(value)) { out[key] = Number(value); continue; }
    out[key] = unquote(value);
  }
  return out;
}

function unquote(v) {
  if (v.startsWith('"')) {
    try { return JSON.parse(v); } catch { return v.replace(/^"|"$/g, ''); }
  }
  return v;
}

const KEY_ORDER = [
  'title', 'event', 'event_url', 'session_url', 'date', 'end_date', 'location',
  'role', 'status', 'co_speakers', 'abstract', 'youtube_id', 'deck_file',
  'deck_size_mb', 'notist_url', 'tags', 'featured', 'playlist_position',
];

function toYaml(t) {
  const lines = [];
  for (const key of KEY_ORDER) {
    const v = t[key];
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) { if (key === 'tags' || key === 'co_speakers') lines.push(`${key}: []`); continue; }
      lines.push(`${key}:`);
      for (const item of v) lines.push(`  - ${JSON.stringify(item)}`);
      continue;
    }
    if (v === null) { if (key === 'youtube_id' || key === 'deck_file') lines.push(`${key}: null`); continue; }
    if (typeof v === 'number' || typeof v === 'boolean') { lines.push(`${key}: ${v}`); continue; }
    // Dates must stay unquoted so Astro's z.coerce.date() sees a real date.
    if (key === 'date' || key === 'youtube_id') { lines.push(`${key}: ${v}`); continue; }
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

// Deck entries are deliberately out of scope. This pass merges a talk with the
// *same* talk written by another fetcher; a deck and a recording are different
// artefacts of one delivery, and pairing them needs the date-direction guard in
// scripts/lib/deck-match.mjs. Without this exclusion the "exactly one side has a
// recording" rule here matches every deck/talk pair and merges them blind.
const DECKS = path.join(ROOT, 'decks');

const YOUTUBE = path.join(ROOT, 'youtube');

const talks = [];
for (const file of await walk(ROOT)) {
  const parsed = parseYaml(await fs.readFile(file, 'utf8'));
  if (!parsed.title) continue;
  // 'youtube'  — event is a channel name, date is the upload date.
  // 'deck'     — a real delivery, but pairing it with a recording is
  //              link-decks' job, so planMerges lets it compete for the
  //              closest-delivery decision and then leaves it alone.
  // 'curated'  — the README, Sessionize and manual entries: a real event on a
  //              real date. Two of these are never collapsed into each other.
  const source = file.startsWith(YOUTUBE + path.sep)
    ? 'youtube'
    : file.startsWith(DECKS + path.sep)
      ? 'deck'
      : 'curated';
  talks.push({ ...parsed, file, source });
}

const plans = planMerges(talks);

for (const plan of plans) {
  await fs.writeFile(plan.keep, toYaml(plan.merged));
  await fs.unlink(plan.drop);
  console.log(
    `[dedupe-talks] merged (${plan.score.toFixed(2)}) ${JSON.stringify(plan.merged.title)}\n` +
      `                 kept ${plan.keep} (+ recording ${plan.merged.youtube_id})\n` +
      `                 dropped ${plan.drop}`,
  );
}

console.log(`[dedupe-talks] ${talks.length} talks, ${plans.length} merged`);
