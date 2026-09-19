// Fetches everything Kasper has written or hosted on dash0.com.
//
// Driven by the SITEMAP, not RSS. The RSS feeds are a rolling window — at time
// of writing posts.xml carried 2 items while the sitemap listed 71 blog posts —
// so an RSS-driven fetch can never represent the full back catalogue. Guides and
// knowledge-base articles have no feed at all.
//
// Every candidate page is fetched once and kept only if its
// `<meta property="article:author">` names Kasper. Dash0 credits the actual
// author/host per page, so this correctly picks out his posts and the Code RED
// episodes he hosted (Mirko hosts the others).

import fs from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = 'src/content/writing/dash0';
const SITEMAP = 'https://www.dash0.com/sitemap.xml';
const CACHE_FILE = 'data/dash0-cache.json';
const AUTHOR_NEEDLE = /Kasper\s+(Borg\s+)?Nissen/i;
const FETCH_CONCURRENCY = 8;

// dash0.com rate-limits a cold sweep of ~370 pages to roughly 16 minutes, which
// is far too slow for the nightly build. The sitemap rarely changes, so results
// are cached per URL and only genuinely new URLs are fetched. Set
// DASH0_REFRESH=1 to force a full re-fetch (e.g. after an author byline change).
const FORCE_REFRESH = process.env.DASH0_REFRESH === '1';

async function loadCache() {
  if (FORCE_REFRESH) return {};
  try {
    return JSON.parse(await fs.readFile(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// `requireAuthor: false` skips the per-page author check — used where Kasper
// authors every entry, so a missing meta tag shouldn't drop the item.
const SECTIONS = [
  { path: 'blog',       kind: 'blog',       publication: 'Dash0 Blog',              requireAuthor: true },
  { path: 'guides',     kind: 'guide',      publication: 'Dash0 Guides',            requireAuthor: true },
  { path: 'knowledge',  kind: 'knowledge',  publication: 'Dash0 Knowledge Base',    requireAuthor: true },
  { path: 'newsletter', kind: 'newsletter', publication: 'Code RED Newsletter',     requireAuthor: false },
  { path: 'podcast',    kind: 'podcast',    publication: 'Code RED Podcast (Dash0)', requireAuthor: true },
];

function slugify(s) {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

const metaContent = (html, property) =>
  html.match(new RegExp(`<meta\\s+property="${property}"\\s+content="([^"]*)"`, 'i'))?.[1] ?? null;

async function mapWithLimit(arr, limit, fn) {
  const out = new Array(arr.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (true) {
        const idx = i++;
        if (idx >= arr.length) break;
        out[idx] = await fn(arr[idx]);
      }
    }),
  );
  return out;
}

// Returns an object when the page is Kasper's, `null` when it was fetched
// successfully but isn't his, and `undefined` on a network/HTTP failure.
// Only the first two are cacheable — caching a transient error would drop the
// page from the site permanently.
async function fetchPage(url, { requireAuthor }) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'kaspernissen.xyz fetcher' } });
    if (!r.ok) return undefined;
    const html = await r.text();

    // Two author markups on dash0.com:
    //   blog/podcast → <meta property="article:author" content="Name">
    //   guides/knowledge → JSON-LD "author":[{"@type":"Person","name":"Name"}]
    // Only names inside the JSON-LD `author` value count — the page also lists
    // every other Dash0 author in its sidebar markup.
    const authors = [
      ...html.matchAll(/<meta\s+property="article:author"\s+content="([^"]+)"/gi),
    ].map((m) => decodeEntities(m[1]));

    const ldAuthor = html.match(/"author":\s*(\[[^\]]*\]|\{[^}]*\})/)?.[1];
    if (ldAuthor) {
      for (const m of ldAuthor.matchAll(/"name":"([^"]+)"/g)) {
        authors.push(decodeEntities(m[1]));
      }
    }

    if (requireAuthor && !authors.some((a) => AUTHOR_NEEDLE.test(a))) return null;

    const title = decodeEntities(
      metaContent(html, 'og:title') ??
        html.match(/<title>([^<]*)<\/title>/i)?.[1] ??
        'Untitled',
    )
      .replace(/\s*[·|]\s*(Podcast|Blog|Guides?|Knowledge)?\s*[·|]?\s*Dash0\s*$/i, '')
      .trim();

    const published =
      metaContent(html, 'article:published_time') ??
      metaContent(html, 'article:modified_time') ??
      null;

    const summary = metaContent(html, 'og:description');

    // Cover art for the podcast cards. Relative to the page when dash0.com
    // emits a path rather than an absolute URL.
    const rawImage = metaContent(html, 'og:image');
    let image = null;
    if (rawImage) {
      try { image = new URL(decodeEntities(rawImage), url).href; } catch { image = null; }
    }

    return { url, title, published, summary, image, authors };
  } catch {
    return undefined;
  }
}

// ---- collect candidate URLs from the sitemap -------------------------------

let sitemap;
try {
  const r = await fetch(SITEMAP);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  sitemap = await r.text();
} catch (e) {
  console.warn(`[dash0] sitemap fetch failed: ${e.message} — keeping existing files`);
  process.exit(0);
}

const allUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

await fs.mkdir(OUT_DIR, { recursive: true });
for (const f of await fs.readdir(OUT_DIR)) {
  if (f.endsWith('.yaml')) await fs.unlink(path.join(OUT_DIR, f));
}

let total = 0;
const seenSlugs = new Set();
const cache = await loadCache();
const nextCache = {};
let fetched = 0;
let cached = 0;

for (const section of SECTIONS) {
  const prefix = `https://www.dash0.com/${section.path}/`;
  const urls = [...new Set(allUrls.filter((u) => u.startsWith(prefix) && u !== prefix))];

  // `null` is a meaningful cached result ("checked, not Kasper's"), so the
  // cache stores it explicitly rather than treating it as a miss.
  const results = await mapWithLimit(urls, FETCH_CONCURRENCY, async (u) => {
    // A cached page from before og:image was collected has no `image` key at
    // all, which is different from having no image. Re-fetch those once so the
    // field backfills instead of staying empty until the cache is cleared.
    if (Object.hasOwn(cache, u) && (cache[u] === null || 'image' in cache[u])) {
      cached++;
      nextCache[u] = cache[u];
      return cache[u];
    }
    fetched++;
    const page = await fetchPage(u, section);
    if (page !== undefined) nextCache[u] = page; // don't cache transient failures
    return page ?? null;
  });

  const pages = results.filter(Boolean);

  for (const p of pages) {
    const date = p.published ? new Date(p.published).toISOString().slice(0, 10) : '2024-01-01';
    let slug = slugify(`${section.kind}-${p.title}-${date.slice(0, 7)}`);
    // dash0.com publishes some articles at two URL spellings; keep the first.
    if (seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    const summary = p.summary
      ? p.summary.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 220)
      : null;

    const yaml = [
      `kind: ${section.kind}`,
      `title: ${JSON.stringify(p.title)}`,
      `publication: ${JSON.stringify(section.publication)}`,
      `date: ${date}`,
      `url: ${JSON.stringify(p.url)}`,
      summary ? `summary: ${JSON.stringify(summary)}` : null,
      p.image ? `image: ${JSON.stringify(p.image)}` : null,
    ].filter(Boolean).join('\n');

    await fs.writeFile(path.join(OUT_DIR, `${slug}.yaml`), yaml + '\n');
    total++;
  }

  console.log(
    `[dash0] ${section.path}: ${pages.length}/${urls.length} ${section.requireAuthor ? 'by Kasper' : '(no author filter)'}`,
  );
}

await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
await fs.writeFile(CACHE_FILE, JSON.stringify(nextCache, null, 0) + '\n');

console.log(
  `[dash0] wrote ${total} writing entries → ${OUT_DIR} ` +
    `(${fetched} fetched, ${cached} from cache)`,
);
