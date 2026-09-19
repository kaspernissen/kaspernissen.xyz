// Removes talks listed in data/talk-exclusions.json.
//
// Runs as a post-pass (see prebuild.mjs) for the same reason dedupe-talks does:
// every fetcher wipes and rewrites its own directory on each build, so a talk
// deleted by hand reappears on the next `npm run build`. Excluding by title
// rather than by filename means one entry covers the talk whichever source it
// arrives from — the GitHub README slug and the YouTube slug differ.

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = 'src/content/talks';
const EXCLUSIONS = 'data/talk-exclusions.json';

// Loose enough that a stray comma, a pipe, or changed capitalisation in the
// source README doesn't silently un-exclude a talk.
function normalise(s) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function loadExclusions() {
  try {
    const { titles = [] } = JSON.parse(await fs.readFile(EXCLUSIONS, 'utf8'));
    return titles;
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`[prune-talks] could not read ${EXCLUSIONS}: ${err.message}`);
    }
    return [];
  }
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

// An engagement scraped from Sessionize has no session title — the site shows
// its event name instead (see displayTitle in src/lib/engagement.ts). Excluding
// one by the name you can actually see means matching that fallback too;
// otherwise "Devopsdays Aarhus 2025" is unexcludable.
function readNames(text) {
  return [readField(text, 'title'), readField(text, 'event')].filter(Boolean);
}

const titles = await loadExclusions();
if (titles.length === 0) {
  console.log('[prune-talks] no exclusions configured');
  process.exit(0);
}

const wanted = new Map(titles.map((t) => [normalise(t), t]));
const hits = new Set();
let removed = 0;

for (const file of await walk(ROOT)) {
  const names = readNames(await fs.readFile(file, 'utf8'));
  const name = names.find((n) => wanted.has(normalise(n)));
  if (!name) continue;
  await fs.unlink(file);
  hits.add(normalise(name));
  removed++;
  console.log(`[prune-talks] removed ${JSON.stringify(name)} (${file})`);
}

for (const [key, original] of wanted) {
  if (!hits.has(key)) {
    console.warn(`[prune-talks] exclusion matched nothing: ${JSON.stringify(original)}`);
  }
}

console.log(`[prune-talks] ${removed} removed, ${titles.length} exclusions configured`);
