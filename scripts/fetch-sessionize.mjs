// Scrapes Kasper's public Sessionize speaker profile for the Events timeline
// (https://sessionize.com/kaspernissen → #events section).
//
// Each event entry on that page has:
//   <a class="c-s-event__name" href="...">Event Name</a>
//   <span class="c-s-event__tag">Upcoming|Past</span>
//   <span class="c-s-event__meta c-s-event__meta--date">Month YYYY</span>
//   <span class="c-s-event__meta c-s-event__meta--location">City, Country</span>

import fs from 'node:fs/promises';
import { reconcile, summarise } from './lib/reconcile-io.mjs';
import path from 'node:path';

const PROFILE_URL = 'https://sessionize.com/kaspernissen';
const OUT_DIR = 'src/content/talks/events/sessionize';

// Sessionize's profile publishes month + year only, so every date scraped here
// is a last-day-of-month guess. It used to need an override file to correct
// one, because this fetcher deleted and rewrote its directory each build. Now
// the real date is simply typed into the entry: reconcile fills blanks and
// never overwrites, so the guess below only ever applies to an event nobody
// has dated yet.

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

const records = [];

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

  // The key is the slugified event NAME as Sessionize publishes it, never
  // name+date: a corrected date must not move the handle by which this entry
  // is recognised. It is written into the entry as `sources.sessionize`.
  const key = slugify(name);

  // Raw scraped values, deliberately. Corrections used to live in
  // a separate override file because this fetcher deleted and rewrote
  // its directory; now they live in the entry itself, and reconcile only ever
  // fills a blank. So a real date typed into the YAML beats the month-end
  // guess below without anything having to remember that it is a correction.
  records.push({
    key,
    fields: {
      title: null,
      event: name,
      event_url: url,
      date,
      location,
      role: 'speaker',
      tags: [],
      featured: false,
    },
  });
  n++;
}
const report = await reconcile('sessionize', records);
console.log(summarise(report));
for (const m of report.missing) {
  // Not deleted: Sessionize drops an event from the profile once it is well
  // past, which is not a reason to erase a talk that was given.
  console.log(`[sessionize] no longer listed upstream: ${m.key}`);
}
