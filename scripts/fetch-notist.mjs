// Mirrors Kasper's Notist slide decks (noti.st/kasperborgnissen) onto this site.
//
// Notist exposes a small JSON API:
//   /<user>.json          → the author + the presentations they've published
//   /<user>/<id>.json     → one presentation (title, slug, blurb, event link)
//   /events/<id>.json     → the event a presentation was given at
//
// The PDF URL is the one thing the JSON does NOT carry: it lives only in the
// presentation's HTML as https://on.notist.cloud/pdf/deck-<hash>.pdf, so each
// deck page gets scraped for it.
//
// Two modes, because the deck PDFs are ~8MB each and there will be more of
// them every time Kasper speaks:
//
//   default              mirror the PDFs into public/decks/ (gitignored), so
//                        the site can serve them itself.
//   DECKS_METADATA_ONLY  write the YAML only, and take each deck's size from
//                        an upstream HEAD. Use this wherever the PDFs are
//                        served from somewhere else (see src/lib/deckHost.ts)
//                        so a build doesn't pull ~80MB it will never serve.
//
// Either way the YAML is small and committed, so the decks page renders from
// the repo alone; only the bytes move around.

import fs from 'node:fs/promises';
import path from 'node:path';

const USER = 'kasperborgnissen';
const OUT = 'src/content/talks/decks/notist';
const PDF_DIR = 'public/decks';
const METADATA_ONLY = process.env.DECKS_METADATA_ONLY === '1';

function slugify(s) {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

// Notist wraps everything in a JSON:API-ish { data: [ { attributes, ... } ] }.
const first = (doc) => doc?.data?.[0];

async function fileSize(p) {
  try { return (await fs.stat(p)).size; } catch { return -1; }
}

// Mirrors src/lib/deckHost.ts. Only consulted in metadata-only mode, to check
// that a deck is actually downloadable before the site links to it.
const DECK_BASE = (process.env.PUBLIC_DECK_BASE_URL ?? '').trim().replace(/\/+$/, '');

async function hostedElsewhere(fileName) {
  if (!DECK_BASE) return true; // nowhere configured to check; assume fine
  try {
    const r = await fetch(`${DECK_BASE}/${fileName}`, { method: 'HEAD' });
    return r.ok;
  } catch {
    // A network blip shouldn't silently drop every deck from the site.
    return true;
  }
}

let profile;
try {
  profile = await getJson(`https://noti.st/${USER}.json`);
} catch (err) {
  console.warn(`[notist] profile fetch failed (${err.message}) — keeping existing decks`);
  process.exit(0);
}

const presentations = first(profile)?.relationships?.data ?? [];
if (presentations.length === 0) {
  console.warn('[notist] no presentations found — keeping existing decks');
  process.exit(0);
}

await fs.mkdir(OUT, { recursive: true });
await fs.mkdir(PDF_DIR, { recursive: true });
// Only the YAML is rewritten each run; the PDFs in public/decks are the cache.
for (const f of await fs.readdir(OUT)) {
  if (f.endsWith('.yaml')) await fs.unlink(path.join(OUT, f));
}

// A presentation's event is embedded in its own relationships — no second
// request needed. The `related` URL is only a fallback for the (unobserved)
// case where the embedded copy carries no title.
const eventCache = new Map();
async function eventTitle(detail) {
  const rel = (detail?.relationships?.data ?? []).find((r) => r.type === 'events');
  if (!rel) return null;
  if (rel.attributes?.title) return rel.attributes.title;

  const url = rel.links?.related;
  if (!url) return null;
  if (eventCache.has(url)) return eventCache.get(url);
  let title = null;
  try {
    title = first(await getJson(url))?.attributes?.title ?? null;
  } catch { /* an event that 404s just leaves the deck without one */ }
  eventCache.set(url, title);
  return title;
}

let written = 0;
let downloaded = 0;
let skipped = 0;

for (const p of presentations) {
  const id = String(p.id).replace(/^pr_/, '');
  const { title, presented_on: presentedOn } = p.attributes ?? {};
  if (!title) continue;

  const date = (presentedOn ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.warn(`[notist] ${id}: no usable date — skipped`);
    continue;
  }

  let detail;
  try {
    detail = first(await getJson(`https://noti.st/${USER}/${id}.json`));
  } catch (err) {
    console.warn(`[notist] ${id}: detail fetch failed (${err.message}) — skipped`);
    continue;
  }
  const slug = detail?.attributes?.slug ?? slugify(title);

  // The PDF href only exists in the rendered page.
  let pdfUrl = null;
  try {
    const html = await (await fetch(`https://noti.st/${USER}/${id}/${slug}`)).text();
    pdfUrl = html.match(/https:\/\/on\.notist\.cloud\/pdf\/deck-[a-f0-9]+\.pdf/)?.[0] ?? null;
  } catch { /* fall through to the no-PDF warning */ }

  if (!pdfUrl) {
    console.warn(`[notist] ${id}: no PDF published upstream — skipped`);
    continue;
  }

  // Named for the talk rather than kept as upstream's deck-<hash>.pdf, so what
  // lands in someone's Downloads folder says what it is. The name is derived
  // from title + month, which also keeps the public URL stable when a deck is
  // re-uploaded upstream (the hash changes on re-upload; this doesn't).
  const fileName = `${slugify(`${title}-${date.slice(0, 7)}`)}.pdf`;
  const dest = path.join(PDF_DIR, fileName);

  // Upstream serves a content-length, so an exact size match is a good enough
  // "already have it" check without re-downloading 8MB to hash it. It also
  // gives metadata-only runs a size to publish without touching the bytes.
  let size = await fileSize(dest);
  let remoteSize = 0;
  try {
    const head = await fetch(pdfUrl, { method: 'HEAD' });
    remoteSize = Number(head.headers.get('content-length') ?? 0);
  } catch { /* if HEAD fails, fall back to whatever is on disk */ }

  if (METADATA_ONLY) {
    size = remoteSize > 0 ? remoteSize : size;
    if (size <= 0) {
      console.warn(`[notist] ${id}: no size available — skipped`);
      continue;
    }
    // A deck can appear on noti.st before it has been synced to the bucket.
    // Linking it then would publish a 404, so it waits for the next build
    // instead — by which time `npm run decks:sync` has usually run.
    if (!(await hostedElsewhere(fileName))) {
      console.warn(`[notist] ${fileName} not at ${DECK_BASE} yet — skipped (run decks:sync)`);
      continue;
    }
    skipped++;
  } else if (size > 0 && (remoteSize === 0 || size === remoteSize)) {
    skipped++;
  } else {
    try {
      const r = await fetch(pdfUrl);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await fs.writeFile(dest, Buffer.from(await r.arrayBuffer()));
      size = await fileSize(dest);
      downloaded++;
      console.log(`[notist] downloaded ${fileName} (${(size / 1048576).toFixed(1)}MB)`);
    } catch (err) {
      console.warn(`[notist] ${id}: PDF download failed (${err.message}) — skipped`);
      if (size <= 0) continue;
    }
  }

  const event = (await eventTitle(detail)) ?? 'Unknown event';

  // A published deck IS a delivery, so this is emitted as a full engagement
  // (see src/content.config.ts). link-decks folds it into the matching
  // recording afterwards where one exists.
  const yaml = [
    `title: ${JSON.stringify(title)}`,
    `event: ${JSON.stringify(event)}`,
    `date: ${date}`,
    `location: null`,
    `role: "speaker"`,
    `youtube_id: null`,
    `deck_file: ${JSON.stringify(fileName)}`,
    `deck_size_mb: ${(size / 1048576).toFixed(1)}`,
    `notist_url: ${JSON.stringify(`https://noti.st/${USER}/${id}/${slug}`)}`,
    `tags: []`,
    `featured: false`,
  ].join('\n');

  await fs.writeFile(path.join(OUT, `${slugify(`${title}-${date.slice(0, 7)}`)}.yaml`), yaml + '\n');
  written++;
}

console.log(
  METADATA_ONLY
    ? `[notist] wrote ${written} decks → ${OUT} (metadata only, ${skipped} PDFs left upstream)`
    : `[notist] wrote ${written} decks → ${OUT} ` +
        `(${downloaded} PDFs downloaded, ${skipped} already cached)`,
);
