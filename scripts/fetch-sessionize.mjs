// Scrapes Kasper's public Sessionize speaker profile for the Events timeline
// (https://sessionize.com/kaspernissen → #events section).
//
// Each event entry on that page has:
//   <a class="c-s-event__name" href="...">Event Name</a>
//   <span class="c-s-event__tag">Upcoming|Past</span>
//   <span class="c-s-event__meta c-s-event__meta--date">Month YYYY</span>
//   <span class="c-s-event__meta c-s-event__meta--location">City, Country</span>

import fs from 'node:fs/promises';
import path from 'node:path';

const PROFILE_URL = 'https://sessionize.com/kaspernissen';
const OUT_DIR = 'src/content/talks/events/sessionize';
const OVERRIDES_FILE = 'data/conference-overrides.json';

// Sessionize's profile publishes month + year only, so scraped dates are always
// a last-day-of-month guess. Overrides let a real date (or a corrected name,
// location or URL) survive this fetcher deleting and rewriting OUT_DIR.
async function loadOverrides() {
  try {
    const raw = JSON.parse(await fs.readFile(OVERRIDES_FILE, 'utf8'));
    return Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith('_')));
  } catch (e) {
    if (e.code !== 'ENOENT') console.warn(`[sessionize] ${OVERRIDES_FILE}: ${e.message}`);
    return {};
  }
}

function slugify(s) {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function decodeEntities(s) {
  return s
    // Numeric entities first — Sessionize writes non-ASCII place names this way
    // (Malm&#246;, &#216;redev, Gen&#232;ve, &#197;rhus). Without this they survive
    // into the YAML and Astro re-escapes the ampersand, rendering "Malm&#246;".
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
    // &amp; LAST so "&amp;#246;" doesn't collapse to "&#246;" and stay undecoded.
    .replace(/&amp;/g, '&');
}

function lastDayOfMonth(year, month1Indexed) {
  return new Date(Date.UTC(year, month1Indexed, 0)).getUTCDate();
}

// Default a month-only date to the LAST day of the month so the conference
// stays "Upcoming" until that month has fully passed (e.g. "May 2026" should
// not flip to Past on May 2).
function parseMonthYear(s) {
  const months = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  };
  const t = s.trim();
  // "September 11, 2026" or "September 11-13, 2026" (most precise)
  let m = t.match(/^([A-Za-z]+)\s+(\d{1,2})(?:[-–](\d{1,2}))?,?\s+(\d{4})$/);
  if (m) {
    const mo = months[m[1].toLowerCase()];
    if (mo) {
      const day = m[3] ? m[3] : m[2]; // use END of range so the event reads as upcoming through the last day
      return `${m[4]}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  // "September 2026" or "Sep 2026" — month-only, default to last day of month
  m = t.match(/^([A-Za-z]+\.?)\s+(\d{4})$/);
  if (m) {
    const mo = months[m[1].toLowerCase().replace(/\.$/, '')];
    if (mo) {
      const last = lastDayOfMonth(Number(m[2]), mo);
      return `${m[2]}-${String(mo).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
    }
  }
  // Just a year — default to Dec 31
  m = t.match(/^(\d{4})$/);
  if (m) return `${m[1]}-12-31`;
  return null;
}

let html;
try {
  const r = await fetch(PROFILE_URL);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  html = await r.text();
} catch (e) {
  console.warn(`[sessionize] fetch failed: ${e.message} — keeping existing files`);
  process.exit(0);
}

await fs.mkdir(OUT_DIR, { recursive: true });
for (const f of await fs.readdir(OUT_DIR)) {
  if (f.endsWith('.yaml')) await fs.unlink(path.join(OUT_DIR, f));
}

// Carve out just the Events section so we don't pick up Sessions etc.
const eventsStart = html.indexOf('id="events"');
const sessionsStart = html.indexOf('id="sessions"');
if (eventsStart < 0) {
  console.warn('[sessionize] no #events section on profile — skipping');
  process.exit(0);
}
const eventsHtml = html.slice(
  eventsStart,
  sessionsStart > eventsStart ? sessionsStart : undefined,
);

const overrides = await loadOverrides();
const usedOverrides = new Set();

// Each event lives in a <div class="c-s-event"> ... </div> block.
const blockRe = /<div\s+class="c-s-event">([\s\S]*?)<\/div>\s*<\/div>/g;
let n = 0;
for (const m of eventsHtml.matchAll(blockRe)) {
  const block = m[1];

  // Two markup shapes for the event name:
  //   <a class="c-s-event__name" href="…">Name</a>   — event with an external site
  //   <span class="c-s-event__name">Name</span>      — Sessionize-hosted event, no link
  // Only matching the <a> form silently dropped every Sessionize-hosted event
  // (all four KubeCons, incl. NA 2026).
  const linkMatch = block.match(
    /<a\s+class="c-s-event__name"\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/,
  );
  const spanMatch = block.match(/<span\s+class="c-s-event__name"[^>]*>([\s\S]*?)<\/span>/);
  if (!linkMatch && !spanMatch) continue;
  const url = linkMatch ? linkMatch[1].trim() : PROFILE_URL;
  const rawName = linkMatch ? linkMatch[2] : spanMatch[1];
  const name = decodeEntities(rawName.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());

  const tagMatch = block.match(/<span\s+class="c-s-event__tag">([^<]+)<\/span>/);
  const tag = tagMatch ? tagMatch[1].trim() : '';

  const dateMatch = block.match(
    /<span\s+class="c-s-event__meta c-s-event__meta--date">([\s\S]*?)<\/span>/,
  );
  const dateRaw = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
  const date = parseMonthYear(dateRaw) ?? '2024-01-01';

  const locMatch = block.match(
    /<span\s+class="c-s-event__meta c-s-event__meta--location">([\s\S]*?)<\/span>/,
  );
  const location = locMatch
    ? decodeEntities(locMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
    : 'Unknown';

  // Overrides are keyed on the slugified event NAME (not name+date), so a
  // corrected date doesn't move the key out from under its own override.
  const key = slugify(name);
  if (Object.hasOwn(overrides, key)) usedOverrides.add(key);
  const ov = overrides[key] ?? {};

  const finalName = ov.name ?? name;
  const finalDate = ov.date ?? date;
  const finalLocation = ov.location ?? location;
  const finalUrl = ov.url ?? url;

  const slug = slugify(`${finalName}-${finalDate.slice(0, 7)}`);
  // Emitted in the unified engagement shape (see src/content.config.ts): the
  // event's own name is `event`, and `title` is the session given there, which
  // Sessionize does not expose — it comes from an override when known.
  const lines = [
    ov.session_title ? `title: ${JSON.stringify(ov.session_title)}` : `title: null`,
    `event: ${JSON.stringify(finalName)}`,
    `event_url: ${JSON.stringify(finalUrl)}`,
    ov.session_url ? `session_url: ${JSON.stringify(ov.session_url)}` : null,
    `date: ${finalDate}`,
    ov.end_date ? `end_date: ${ov.end_date}` : null,
    `location: ${JSON.stringify(finalLocation)}`,
    `role: ${JSON.stringify(ov.role ?? 'speaker')}`,
    // Sessionize publishes no abstract, so it comes from the override when the
    // talk page should carry a description.
    ov.abstract ? `abstract: ${JSON.stringify(ov.abstract)}` : null,
    ov.co_speakers?.length
      ? `co_speakers:\n${ov.co_speakers.map((s) => `  - ${JSON.stringify(s)}`).join('\n')}`
      : null,
    `tags: []`,
    `featured: false`,
    tag.toLowerCase().includes('upcoming') ? `# Upcoming per Sessionize` : null,
  ].filter(Boolean).join('\n');

  await fs.writeFile(path.join(OUT_DIR, `${slug}.yaml`), lines + '\n');
  n++;
}
// Surface overrides that matched nothing — a renamed event would otherwise
// silently revert to the scraped month-end guess.
const unused = Object.keys(overrides).filter((k) => !usedOverrides.has(k));
if (unused.length > 0) {
  console.warn(`[sessionize] ${unused.length} override(s) matched no event: ${unused.join(', ')}`);
}
console.log(
  `[sessionize] wrote ${n} conferences (${usedOverrides.size} overridden) → ${OUT_DIR}`,
);
