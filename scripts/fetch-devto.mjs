// Articles Kasper has published on DEV (dev.to).
//
// Unlike the Dash0 fetcher, which crawls a sitemap and sniffs the byline, DEV
// has a public JSON API that answers "what has this person written" directly.
// No key, no scraping, no HTML parsing.
//
// The interesting part is what it DOESN'T write. Kasper cross-posts to DEV:
// both articles on the account today are also on the Dash0 blog, which this
// site already lists. Publishing both would show the same piece twice under
// two mastheads. So an article whose title already appears elsewhere in the
// writing collection is skipped, and the canonical copy — the one on the
// publication that commissioned it — is the one that stays.
//
// Consequence worth knowing: a DEV post that is a cross-post is invisible
// here, by design. Only DEV-original writing appears.

import fs from 'node:fs/promises';
import path from 'node:path';

const USERNAME = 'kaspernissen';
const API = `https://dev.to/api/articles?username=${USERNAME}&per_page=100`;
const OUT_DIR = 'src/content/writing/devto';
const WRITING_ROOT = 'src/content/writing';

const slugify = (s) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normaliseTitle = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Titles already published on the site, from every source but this one. */
async function existingTitles() {
  const titles = new Set();
  const dirs = await fs.readdir(WRITING_ROOT, { withFileTypes: true });
  for (const dir of dirs) {
    if (!dir.isDirectory() || path.join(WRITING_ROOT, dir.name) === OUT_DIR) continue;
    const files = await fs.readdir(path.join(WRITING_ROOT, dir.name));
    for (const file of files) {
      if (!file.endsWith('.yaml')) continue;
      const text = await fs.readFile(path.join(WRITING_ROOT, dir.name, file), 'utf8');
      const title = text.match(/^title:\s*(.*)$/m)?.[1]?.trim();
      if (!title) continue;
      titles.add(normaliseTitle(title.replace(/^"|"$/g, '').replace(/\\"/g, '"')));
    }
  }
  return titles;
}

let articles;
try {
  const r = await fetch(API);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  articles = await r.json();
} catch (e) {
  // Same contract as every other fetcher: a bad night leaves what is on disk
  // alone rather than emptying the section.
  console.warn(`[devto] fetch failed: ${e.message} — keeping existing files`);
  process.exit(0);
}

const known = await existingTitles();

await fs.mkdir(OUT_DIR, { recursive: true });
for (const f of await fs.readdir(OUT_DIR)) {
  if (f.endsWith('.yaml')) await fs.unlink(path.join(OUT_DIR, f));
}

let written = 0;
const crossPosted = [];

for (const a of articles) {
  const title = a.title?.trim();
  const date = (a.published_at ?? '').slice(0, 10);
  if (!title || !date) continue;

  if (known.has(normaliseTitle(title))) {
    crossPosted.push(title);
    continue;
  }

  const yaml = [
    'kind: blog',
    `title: ${JSON.stringify(title)}`,
    'publication: "DEV Community"',
    `date: ${date}`,
    `url: ${JSON.stringify(a.url)}`,
    a.reading_time_minutes ? `duration_min: ${a.reading_time_minutes}` : null,
    a.description ? `summary: ${JSON.stringify(a.description.trim())}` : null,
    a.cover_image ? `image: ${JSON.stringify(a.cover_image)}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  await fs.writeFile(path.join(OUT_DIR, `${slugify(`${title}-${date.slice(0, 7)}`)}.yaml`), yaml + '\n');
  written++;
}

console.log(
  `[devto] wrote ${written} articles → ${OUT_DIR}` +
    (crossPosted.length
      ? `, skipped ${crossPosted.length} already published elsewhere: ${crossPosted.join('; ')}`
      : ''),
);
