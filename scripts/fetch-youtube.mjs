import fs from 'node:fs/promises';
import path from 'node:path';

const PLAYLIST_ID = 'PL5T4q56AEyfVPQUu4R6ESZfIT-gq8AYw1';
const KEY = process.env.YOUTUBE_API_KEY;
const OUT_DIR = 'src/content/talks/youtube';
const MANUAL_DIR = 'src/content/talks';

if (!KEY) {
  console.warn('[youtube] YOUTUBE_API_KEY not set — skipping (existing files preserved).');
  process.exit(0);
}

function slugify(s) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function splitTitle(title) {
  const parts = title.split(/\s+[—\-|·]\s+/);
  if (parts.length >= 2) {
    return { title: parts.slice(0, -1).join(' — ').trim(), event: parts.at(-1).trim() };
  }
  return { title, event: 'Unknown event' };
}

async function readManualClaimedIds() {
  const claimed = new Set();
  try {
    for (const f of await fs.readdir(MANUAL_DIR)) {
      if (!f.endsWith('.yaml')) continue;
      const txt = await fs.readFile(path.join(MANUAL_DIR, f), 'utf8');
      const m = txt.match(/^youtube_id:\s*([A-Za-z0-9_-]+)\s*$/m);
      if (m && m[1] !== 'null') claimed.add(m[1]);
    }
  } catch {}
  return claimed;
}

async function fetchPage(token) {
  const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
  url.searchParams.set('part', 'snippet,contentDetails');
  url.searchParams.set('playlistId', PLAYLIST_ID);
  url.searchParams.set('maxResults', '50');
  url.searchParams.set('key', KEY);
  if (token) url.searchParams.set('pageToken', token);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`YouTube ${r.status}: ${await r.text()}`);
  return r.json();
}

let items = [];
try {
  let token;
  do {
    const page = await fetchPage(token);
    items = items.concat(page.items ?? []);
    token = page.nextPageToken;
  } while (token);
} catch (e) {
  console.warn(`[youtube] fetch failed: ${e.message} — keeping existing files`);
  process.exit(0);
}

await fs.mkdir(OUT_DIR, { recursive: true });
for (const f of await fs.readdir(OUT_DIR)) {
  if (f.endsWith('.yaml')) await fs.unlink(path.join(OUT_DIR, f));
}

const claimed = await readManualClaimedIds();

let n = 0, skipped = 0;
for (const it of items) {
  const s = it.snippet ?? {};
  const videoId = it.contentDetails?.videoId ?? s.resourceId?.videoId;
  if (!videoId) continue;
  const tlow = (s.title ?? '').toLowerCase();
  if (tlow.includes('private video') || tlow.includes('deleted video')) continue;
  if (claimed.has(videoId)) {
    skipped++;
    continue;
  }
  const { title, event } = splitTitle(s.title ?? 'Untitled');
  const date = new Date(s.publishedAt ?? Date.now()).toISOString().slice(0, 10);
  const slug = `${slugify(title)}-${date.slice(0, 7)}`;
  const lines = [
    `title: ${JSON.stringify(title)}`,
    `event: ${JSON.stringify(event)}`,
    `date: ${date}`,
    `youtube_id: ${videoId}`,
    `tags: []`,
    `featured: false`,
  ];
  if (s.description) {
    const teaser = s.description.split('\n').slice(0, 4).join('\n');
    lines.push(`abstract: ${JSON.stringify(teaser)}`);
  }
  await fs.writeFile(path.join(OUT_DIR, `${slug}.yaml`), lines.join('\n') + '\n');
  n++;
}
console.log(`[youtube] wrote ${n} talks (skipped ${skipped} already-claimed) → ${OUT_DIR}`);
