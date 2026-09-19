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

function readTitle(text) {
  const m = text.match(/^title:\s*(.*)$/m);
  if (!m) return null;
  const raw = m[1].trim();
  if (raw.startsWith('"')) {
    try { return JSON.parse(raw); } catch { return raw.replace(/^"|"$/g, ''); }
  }
  return raw;
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
  const title = readTitle(await fs.readFile(file, 'utf8'));
  if (!title) continue;
  const key = normalise(title);
  if (!wanted.has(key)) continue;
  await fs.unlink(file);
  hits.add(key);
  removed++;
  console.log(`[prune-talks] removed ${JSON.stringify(title)} (${file})`);
}

for (const [key, original] of wanted) {
  if (!hits.has(key)) {
    console.warn(`[prune-talks] exclusion matched nothing: ${JSON.stringify(original)}`);
  }
}

console.log(`[prune-talks] ${removed} removed, ${titles.length} exclusions configured`);
