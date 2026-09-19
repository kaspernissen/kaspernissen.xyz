// Event logos for the upcoming schedule.
//
// A list of twelve conference names is a wall of text. Each event already
// publishes a mark for itself, so this pulls it rather than asking Kasper to
// find and crop one per event.
//
// It only takes SQUARE sources — apple-touch-icon first, then <link rel=icon>,
// then /favicon.ico. og:image is deliberately ignored: it is a 1200x630
// banner, and a banner scaled into a 32px slot is an unreadable smear. Where
// nothing square is on offer the entry keeps no logo and the page falls back
// to a monogram, which is honest and still breaks up the row.
//
// Logos live in the repo (src/assets/event-logos/) rather than the bucket:
// twelve favicons is a hundred kilobytes, and keeping them here avoids a
// third asset host for something this small. Under src/ rather than public/
// so the page can glob the directory and know which events actually have a
// mark, instead of emitting a broken <img> for the ones that don't.
//
// Re-runnable. An event that already has a logo on disk is skipped, so the
// common case costs no requests.

import fs from 'node:fs/promises';
import path from 'node:path';
import { eventSlug } from '../src/lib/eventSlug.mjs';

const TALKS = 'src/content/talks';
const OUT_DIR = 'src/assets/event-logos';
const UA = 'Mozilla/5.0 (compatible; kaspernissen.xyz/1.0; +https://kaspernissen.xyz)';

// Image bytes, identified by their magic numbers. A site that answers a
// missing favicon with an HTML error page is the usual failure here, and it
// is invisible unless the bytes are checked.
const SIGNATURES = [
  [[0x89, 0x50, 0x4e, 0x47], 'png'],
  [[0xff, 0xd8, 0xff], 'jpg'],
  [[0x47, 0x49, 0x46], 'gif'],
  [[0x00, 0x00, 0x01, 0x00], 'ico'],
];

function imageKind(buf) {
  for (const [sig, ext] of SIGNATURES) {
    if (sig.every((b, i) => buf[i] === b)) return ext;
  }
  // SVG and WebP need more than a fixed prefix.
  const head = Buffer.from(buf.subarray(0, 300)).toString('utf8');
  if (buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return 'webp';
  if (head.includes('<svg') || (head.includes('<?xml') && head.includes('svg'))) return 'svg';
  return null;
}

async function get(url, as = 'text') {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: as === 'text' ? 'text/html' : 'image/*' },
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return as === 'text' ? res.text() : Buffer.from(await res.arrayBuffer());
}

/** Square icon candidates from a page's <head>, best first. */
function candidates(html, pageUrl) {
  const found = [];
  const links = html.matchAll(/<link\b[^>]*>/gi);
  for (const [tag] of links) {
    const rel = (tag.match(/\brel=["']([^"']+)["']/i) ?? [])[1]?.toLowerCase() ?? '';
    const href = (tag.match(/\bhref=["']([^"']+)["']/i) ?? [])[1];
    if (!href || !/icon/.test(rel)) continue;
    const sizes = (tag.match(/\bsizes=["']([^"']+)["']/i) ?? [])[1] ?? '';
    const px = parseInt(sizes, 10) || (rel.includes('apple') ? 180 : 32);
    // apple-touch-icon is a designed mark; a 16px favicon is a last resort.
    found.push({ url: new URL(href, pageUrl).href, score: rel.includes('apple') ? px + 1000 : px });
  }
  found.sort((a, b) => b.score - a.score);
  found.push({ url: new URL('/favicon.ico', pageUrl).href, score: 0 });
  return found;
}

const entries = [];
for (const name of await fs.readdir(TALKS)) {
  if (!name.endsWith('.yaml')) continue;
  const file = path.join(TALKS, name);
  const text = await fs.readFile(file, 'utf8');
  const field = (k) => (text.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) ?? [])[1]?.trim().replace(/^["']|["']$/g, '');
  const date = field('date');
  if (!date || date < new Date().toISOString().slice(0, 10)) continue;
  const url = field('event_url') || field('session_url');
  const event = field('event');
  if (url && event) entries.push({ file, text, event, url });
}

// Several events share a host (three on events.linuxfoundation.org, two on
// yowcon.com). They get the same mark, which is correct — it is the same
// organisation — so the fetch is done once per host.
const byHost = new Map();
await fs.mkdir(OUT_DIR, { recursive: true });

let written = 0;
for (const entry of entries) {
  const slug = eventSlug(entry.event);
  const existing = (await fs.readdir(OUT_DIR)).find((f) => f.startsWith(`${slug}.`));
  if (existing) {
    console.log(`  = ${entry.event} (have ${existing})`);
    continue;
  }

  const host = new URL(entry.url).host;
  try {
    if (!byHost.has(host)) {
      const html = await get(entry.url);
      byHost.set(host, candidates(html, entry.url));
    }
    let saved = null;
    for (const c of byHost.get(host)) {
      try {
        const buf = await get(c.url, 'bin');
        const ext = imageKind(buf);
        if (!ext || buf.length < 100) continue;
        await fs.writeFile(path.join(OUT_DIR, `${slug}.${ext}`), buf);
        saved = `${slug}.${ext}`;
        break;
      } catch {
        /* try the next candidate */
      }
    }
    if (saved) {
      written++;
      console.log(`  + ${entry.event} -> ${saved}`);
    } else {
      console.log(`  - ${entry.event} (no square icon; monogram)`);
    }
  } catch (err) {
    console.log(`  ! ${entry.event} (${err.message})`);
  }
}

console.log(`\n${written} logo(s) written to ${OUT_DIR}, ${entries.length} upcoming event(s) checked.`);
