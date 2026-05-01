import fs from 'node:fs/promises';
import path from 'node:path';

const PLAYLIST_ID = 'PL5T4q56AEyfVPQUu4R6ESZfIT-gq8AYw1';
const KEY = process.env.YOUTUBE_API_KEY;
const OUT_DIR = 'src/content/talks/youtube';
const MANUAL_DIR = 'src/content/talks';

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

// Recursively scan all talks/*.yaml (except the youtube/ subfolder we own) for
// already-claimed video IDs — manual entries AND other auto-sources (github/).
async function readManualClaimedIds() {
  const claimed = new Set();
  async function walk(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (full === OUT_DIR) continue;
        await walk(full);
      } else if (e.name.endsWith('.yaml')) {
        const txt = await fs.readFile(full, 'utf8');
        const m = txt.match(/^youtube_id:\s*([A-Za-z0-9_-]+)\s*$/m);
        if (m && m[1] !== 'null') claimed.add(m[1]);
      }
    }
  }
  await walk(MANUAL_DIR);
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

// RSS fallback (15 most recent items, no auth required).
async function fetchRss() {
  const r = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`);
  if (!r.ok) throw new Error(`RSS ${r.status}`);
  const xml = await r.text();
  const entries = [];
  for (const block of xml.split('<entry>').slice(1)) {
    const get = (re) => block.match(re)?.[1];
    const videoId = get(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const title = get(/<title>([^<]+)<\/title>/);
    const published = get(/<published>([^<]+)<\/published>/);
    const author = get(/<author>\s*<name>([^<]+)<\/name>/);
    const description = get(/<media:description>([\s\S]*?)<\/media:description>/);
    if (!videoId || !title) continue;
    entries.push({
      contentDetails: { videoId },
      snippet: {
        title: title.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
        publishedAt: published,
        channelTitle: author,
        description,
      },
    });
  }
  return entries;
}

let items = [];
let source = 'api';
try {
  if (KEY) {
    let token;
    do {
      const page = await fetchPage(token);
      items = items.concat(page.items ?? []);
      token = page.nextPageToken;
    } while (token);
  } else {
    source = 'rss';
    items = await fetchRss();
    console.log(`[youtube] YOUTUBE_API_KEY not set — using RSS fallback (15-item cap)`);
  }
} catch (e) {
  console.warn(`[youtube] fetch failed (${source}): ${e.message} — keeping existing files`);
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
  let { title, event } = splitTitle(s.title ?? 'Untitled');
  if (event === 'Unknown event' && s.channelTitle) event = s.channelTitle;
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
