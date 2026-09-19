// Builds a contact sheet of photos that still have no event.
//
// import-photos.mjs deliberately refuses to guess: a photo with no usable EXIF
// date, or one whose date matches no engagement, is written with event "TBD"
// rather than being filed somewhere plausible. That is the right call — a photo
// on the wrong talk page is worse than one in the general gallery — but it
// leaves a pile that only Kasper can sort out.
//
// This renders that pile as a single page: every unplaced photo, grouped by
// date, captioned with its file name, next to the engagements that fall near
// that date so the likely answer is visible rather than remembered.
//
//   node scripts/unplaced-photos.mjs [--open]
//
// Thumbnails load from the bucket, so it works from anywhere once the photos
// are synced. It writes to a temp file and never touches site content.

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const SPEAKERS = 'src/content/speakers';
const TALKS = 'src/content/talks';
const BASE =
  process.env.PUBLIC_PHOTO_BASE_URL?.replace(/\/+$/, '') ??
  'https://kasper-nissen-presentations.s3.eu-west-1.amazonaws.com/photos';

const DAY = 86_400_000;
const NEAR_DAYS = 3;

function field(text, key) {
  const m = text.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  if (!m) return null;
  const raw = m[1].trim();
  if (raw === '' || raw === 'null') return null;
  if (raw.startsWith('"')) {
    try { return JSON.parse(raw); } catch { return raw.replace(/^"|"$/g, ''); }
  }
  return raw;
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

const engagements = [];
for (const file of await walk(TALKS)) {
  const t = await fs.readFile(file, 'utf8');
  const date = field(t, 'date');
  if (!date) continue;
  engagements.push({
    date,
    end: field(t, 'end_date') ?? date,
    event: field(t, 'event'),
    location: field(t, 'location'),
  });
}

/** Engagements whose run contains `iso`, give or take a few days of travel. */
function nearby(iso) {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return [];
  const seen = new Set();
  return engagements
    .filter((e) => {
      const s = Date.parse(e.date);
      const x = Date.parse(e.end);
      return at >= s - NEAR_DAYS * DAY && at <= x + NEAR_DAYS * DAY;
    })
    .filter((e) => (seen.has(e.event) ? false : seen.add(e.event)))
    .map((e) => `${e.event}${e.location ? ` — ${e.location}` : ''} (${e.date}${e.end !== e.date ? `→${e.end}` : ''})`);
}

const unplaced = [];
for (const file of (await fs.readdir(SPEAKERS)).filter((f) => f.endsWith('.yaml')).sort()) {
  const t = await fs.readFile(path.join(SPEAKERS, file), 'utf8');
  const event = field(t, 'event');
  if (event && event !== 'TBD' && event !== 'Unknown') continue;
  unplaced.push({
    slug: field(t, 'slug') ?? file.replace(/\.yaml$/, ''),
    date: field(t, 'date'),
    image: (field(t, 'src') ?? '').replace(/^.*\//, ''),
    download: (field(t, 'download') ?? '').replace(/^.*\//, ''),
  });
}

const groups = new Map();
for (const p of unplaced) {
  const key = p.date ?? 'No date';
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(p);
}
// Dated groups in order, undated last — they need the most work, so they end up
// where you stop rather than where you start.
const ordered = [...groups.entries()].sort(([a], [b]) =>
  a === 'No date' ? 1 : b === 'No date' ? -1 : a.localeCompare(b),
);

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const parts = [];
parts.push(`<!doctype html><meta charset="utf-8"><title>Unplaced photos</title>`);
parts.push(`<style>
:root{color-scheme:dark}
body{background:#0c0a09;color:#e7e5e4;font:14px/1.5 system-ui,sans-serif;margin:0;padding:24px clamp(16px,4vw,40px)}
h1{font-size:22px;margin:0 0 4px}
.sub{color:#a8a29e;font-size:13px;margin:0 0 8px}
h2{font-size:15px;margin:32px 0 2px;color:#fafaf9}
.hint{color:#a8a29e;font-size:12px;margin:0 0 10px}
.hint b{color:#fdba74;font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
figure{margin:0;background:#1c1917;border-radius:10px;overflow:hidden}
a.shot{display:block}
img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;background:#292524}
figcaption{padding:6px 8px;font-size:11px;color:#a8a29e;word-break:break-all}
code{color:#e7e5e4}
</style>`);
parts.push(`<h1>Photos with no event</h1>`);
parts.push(`<p class="sub">${unplaced.length} of ${(await fs.readdir(SPEAKERS)).filter((f) => f.endsWith('.yaml')).length} photos. Click a thumbnail for the full-resolution original.</p>`);

for (const [date, items] of ordered) {
  const suggestions = date === 'No date' ? [] : nearby(date);
  parts.push(`<h2>${esc(date)} — ${items.length} photo${items.length === 1 ? '' : 's'}</h2>`);
  parts.push(
    `<p class="hint">${
      date === 'No date'
        ? 'No EXIF date, so these can never attach to a talk page automatically — they need an event <b>and</b> a date.'
        : suggestions.length
          ? `near: <b>${suggestions.map(esc).join('</b> · <b>')}</b>`
          : 'no engagement within 3 days — the date may be an import fallback'
    }</p>`,
  );
  parts.push('<div class="grid">');
  for (const p of items) {
    parts.push(
      `<figure><a class="shot" href="${BASE}/${esc(p.download)}" target="_blank" rel="noreferrer">` +
        `<img loading="lazy" src="${BASE}/display/${esc(p.image)}" alt="${esc(p.slug)}"></a>` +
        `<figcaption><code>${esc(p.image)}</code></figcaption></figure>`,
    );
  }
  parts.push('</div>');
}

const out = path.join(os.tmpdir(), 'unplaced-photos.html');
await fs.writeFile(out, parts.join('\n'));
console.log(`[unplaced-photos] ${unplaced.length} photos in ${ordered.length} groups → ${out}`);
if (process.argv.includes('--open')) spawn('open', [out], { stdio: 'ignore', detached: true }).unref();
