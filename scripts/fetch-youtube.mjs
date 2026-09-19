import fs from 'node:fs/promises';
import { reconcile, summarise } from './lib/reconcile-io.mjs';
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

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

// YouTube JSON strings are JS-escaped (&, \", \n). JSON.parse on a
// re-quoted string handles every escape correctly, including surrogate pairs.
function decodeJsonString(s) {
  try {
    return JSON.parse(`"${s}"`);
  } catch {
    return s.replace(/\\u0026/g, '&').replace(/\\"/g, '"').replace(/\\n/g, ' ');
  }
}

// HTML scraping (no auth, full playlist, in playlist order).
//
// YouTube replaced `playlistVideoRenderer` with `lockupViewModel`; the old
// selector silently returned zero items, which made this fall through to the
// 15-item RSS cap. Items come back in the order the playlist displays them.
async function fetchPlaylistHtml() {
  const r = await fetch(`https://www.youtube.com/playlist?list=${PLAYLIST_ID}`, {
    headers: BROWSER_HEADERS,
    redirect: 'follow',
  });
  if (!r.ok) throw new Error(`HTML playlist ${r.status}`);
  const html = await r.text();
  const blocks = html.split('"lockupViewModel":{');
  const out = [];
  const seen = new Set();
  for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i].slice(0, 8000);
    const vid = b.match(/"videoId":"([A-Za-z0-9_-]{11})"/)?.[1];
    if (!vid || seen.has(vid)) continue;
    seen.add(vid);
    const titleRaw = b.match(
      /"lockupMetadataViewModel":\{"title":\{"content":"((?:[^"\\]|\\.)*)"/,
    )?.[1];
    out.push({
      videoId: vid,
      title: titleRaw ? decodeJsonString(titleRaw) : 'Untitled',
      position: out.length, // 0 = first in the playlist = most recently added
    });
  }
  if (out.length === 0) throw new Error('playlist markup yielded 0 items');
  return out;
}

// A video's publish date, channel and description never change, so once we have
// them they are kept forever. This is not a speed optimisation: YouTube serves a
// captcha instead of the watch page once it decides we've scraped too much, and
// without the cache every rate-limited run would overwrite good rows with
// "Unknown event" and no abstract. Hitting that is what made this cache
// necessary — see the guard in writeTalk() for the other half of the fix.
const DETAILS_CACHE = 'data/youtube-cache.json';

async function loadDetailsCache() {
  try {
    return JSON.parse(await fs.readFile(DETAILS_CACHE, 'utf8'));
  } catch {
    return {};
  }
}

const detailsCache = await loadDetailsCache();
let cacheHits = 0;
let cacheMisses = 0;
let blocked = 0;

async function saveDetailsCache() {
  await fs.mkdir(path.dirname(DETAILS_CACHE), { recursive: true });
  await fs.writeFile(DETAILS_CACHE, JSON.stringify(detailsCache, null, 2) + '\n');
}

// Per-video scrape of /watch. The API gives publishedAt + channelTitle +
// description; without a key we recover all three from the watch page so the
// no-key path doesn't produce "Unknown event" rows with no abstract.
async function fetchVideoDetails(videoId) {
  const cached = detailsCache[videoId];
  // Only a cache entry that actually carries a date is worth trusting; a
  // half-empty one from a blocked run should be retried.
  if (cached?.publishedAt) {
    cacheHits++;
    return cached;
  }

  try {
    const r = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
    });
    if (!r.ok) return {};
    const html = await r.text();
    // A captcha/consent interstitial is a few KB and has none of the player
    // payload. Treating it as a normal page is what produced today's-date rows.
    if (html.length < 20_000 || !/"videoDetails"|ytInitialPlayerResponse|itemprop="datePublished"/.test(html)) {
      blocked++;
      return {};
    }
    const publishedAt =
      html.match(/"publishDate":"(\d{4}-\d{2}-\d{2})/)?.[1] ??
      html.match(/<meta itemprop="datePublished" content="(\d{4}-\d{2}-\d{2})/)?.[1] ??
      html.match(/"uploadDate":"(\d{4}-\d{2}-\d{2})/)?.[1] ??
      null;
    const channelTitle = (() => {
      const m =
        html.match(/"ownerChannelName":"((?:[^"\\]|\\.)*)"/)?.[1] ??
        html.match(/"author":"((?:[^"\\]|\\.)*)"/)?.[1];
      return m ? decodeJsonString(m) : null;
    })();
    const description = (() => {
      const m =
        html.match(/"attributedDescription":\{"content":"((?:[^"\\]|\\.)*)"/)?.[1] ??
        html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/)?.[1];
      return m ? decodeJsonString(m) : null;
    })();
    const details = { publishedAt, channelTitle, description };
    if (publishedAt) {
      detailsCache[videoId] = details;
      cacheMisses++;
    }
    return details;
  } catch {
    return {};
  }
}

async function mapWithLimit(arr, limit, fn) {
  const out = new Array(arr.length);
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= arr.length) break;
      out[idx] = await fn(arr[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
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
    // No API key — try HTML playlist scrape first (full list), fall back to
    // RSS (15-item cap) if that fails.
    try {
      source = 'html';
      const videos = await fetchPlaylistHtml();
      console.log(`[youtube] no API key — using HTML scrape (${videos.length} videos)`);

      // Enrich each video from its /watch page: publish date, channel (used as
      // the event fallback) and description (used as the abstract).
      const details = await mapWithLimit(videos, 8, async (v) => fetchVideoDetails(v.videoId));
      items = videos.map((v, i) => ({
        contentDetails: { videoId: v.videoId },
        playlistPosition: v.position,
        snippet: {
          title: v.title,
          publishedAt: details[i]?.publishedAt ? `${details[i].publishedAt}T00:00:00Z` : null,
          channelTitle: details[i]?.channelTitle ?? null,
          description: details[i]?.description ?? null,
        },
      }));
    } catch (htmlErr) {
      console.warn(`[youtube] HTML scrape failed: ${htmlErr.message} — falling back to RSS`);
      source = 'rss';
      items = await fetchRss();
      console.log(`[youtube] using RSS fallback (15-item cap)`);
    }
  }
} catch (e) {
  console.warn(`[youtube] fetch failed (${source}): ${e.message} — keeping existing files`);
  process.exit(0);
}

// No directory to prepare and nothing to wipe.
//
// Two pieces of machinery used to live here and are gone with the wipe:
//
//   `previous` re-read every file before deleting it, so that a detail lookup
//   coming back empty could not replace a real date with a placeholder. The
//   reconcile rule covers that by construction: a field with a value is never
//   overwritten.
//
//   `claimed` scanned the whole of src/content/talks/ for video IDs some other
//   entry already used, so this fetcher would not write a duplicate. It ran
//   concurrently with the fetchers that owned those directories, read a mix of
//   two builds' files, and on a fresh checkout skipped eighteen videos whose
//   claims were about to be deleted. An entry is now found by the key it
//   records in `sources.youtube`, which no other fetcher can disturb.

const records = [];
let n = 0, undated = 0;
for (const it of items) {
  const s = it.snippet ?? {};
  const videoId = it.contentDetails?.videoId ?? s.resourceId?.videoId;
  if (!videoId) continue;
  const tlow = (s.title ?? '').toLowerCase();
  if (tlow.includes('private video') || tlow.includes('deleted video')) continue;
  let { title, event } = splitTitle(s.title ?? 'Untitled');
  if (event === 'Unknown event' && s.channelTitle) event = s.channelTitle;

  // NEVER invent a date. This used to be `s.publishedAt ?? Date.now()`, which
  // silently restamped every talk with today's date the first time YouTube
  // rate-limited us. A video with no date is skipped: an entry that already
  // exists keeps the date on disk regardless, because reconcile does not
  // overwrite, and a new entry without one is not worth creating.
  const date = s.publishedAt ? new Date(s.publishedAt).toISOString().slice(0, 10) : null;
  if (!date) {
    undated++;
    continue;
  }

  const fields = {
    title,
    event,
    date,
    youtube_id: videoId,
    tags: [],
    featured: false,
  };
  // Playlist order (0 = most recently added). Talks listings sort on this so
  // the site reflects the order Kasper curates the playlist in, not upload date.
  if (typeof it.playlistPosition === 'number') fields.playlist_position = it.playlistPosition;
  if (s.description) fields.abstract = s.description.split('\n').slice(0, 4).join('\n');

  records.push({ key: videoId, fields });
  n++;
}

await saveDetailsCache();

const report = await reconcile('youtube', records, { matchField: 'youtube_id' });
console.log(
  summarise(report) +
    ` — ${cacheHits} cached, ${cacheMisses} fetched` +
    (blocked ? `, ${blocked} blocked by YouTube` : '') +
    (undated ? `, ${undated} skipped with no known date` : ''),
);

if (blocked > 0) {
  console.warn(
    `[youtube] ${blocked} video(s) returned a captcha instead of the watch page. ` +
      `Existing dates and abstracts were preserved; re-run later to fill the gaps.`,
  );
}
