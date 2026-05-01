// Parses Kasper's GitHub profile README at github.com/kaspernissen/kaspernissen
// for the "Speaking Activities" section and writes one talk per entry.
//
// Recognises this README format (one entry):
//   **[Title](session-url)**
//   _Event Name, Location_
//   Date: Month DD YYYY
//   📺 [Recording](youtube-url)
//
// If a `## Blog`/`## Podcasts` section ever shows up, also populates writing/.

import fs from 'node:fs/promises';
import path from 'node:path';

const REPO = 'kaspernissen/kaspernissen';
const TALKS_OUT = 'src/content/talks/github';
const WRITING_OUT = 'src/content/writing/github';
const BRANCHES = ['master', 'main'];

function slugify(s) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractYoutubeId(url) {
  const m =
    url.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
    url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
    url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function parseDate(text) {
  const months = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  };
  // "November 13 2024" or "April 19 2023" or "April 15-16 2021"
  let m = text.match(/([A-Za-z]+)\s+(\d{1,2})(?:[-–]\d{1,2})?\s+(\d{4})/);
  if (m) {
    const mo = months[m[1].toLowerCase()];
    if (mo) return `${m[3]}-${String(mo).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
  }
  // ISO-ish "2024-11-13"
  m = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

async function fetchReadme() {
  for (const b of BRANCHES) {
    const r = await fetch(`https://raw.githubusercontent.com/${REPO}/${b}/README.md`);
    if (r.ok) return r.text();
  }
  return null;
}

const md = await fetchReadme();
if (!md) {
  console.warn('[github-readme] README not found — keeping existing files');
  process.exit(0);
}

await fs.mkdir(TALKS_OUT, { recursive: true });
await fs.mkdir(WRITING_OUT, { recursive: true });
for (const dir of [TALKS_OUT, WRITING_OUT]) {
  for (const f of await fs.readdir(dir)) {
    if (f.endsWith('.yaml')) await fs.unlink(path.join(dir, f));
  }
}

// Section detection
const lines = md.split('\n');
let inSpeaking = false;
let writingKind = null;

const WRITING_HEADINGS = new Map([
  ['blog', 'blog'], ['blogs', 'blog'], ['posts', 'blog'], ['articles', 'blog'],
  ['podcast', 'podcast'], ['podcasts', 'podcast'],
  ['newsletter', 'newsletter'], ['newsletters', 'newsletter'],
  ['interview', 'interview'], ['interviews', 'interview'],
]);

let nTalks = 0;
let nWriting = 0;

// Collect groups of consecutive non-empty lines after a bold-link starter.
let buf = [];
const flush = async () => {
  if (buf.length === 0) return;
  const block = buf.join('\n');
  buf = [];

  // Talk: starts with **[Title](url)** as first line
  const titleMatch = block.match(/^\*\*\[([^\]]+)\]\(([^)]+)\)\*\*/m);
  if (!titleMatch || !inSpeaking) return;
  const title = titleMatch[1].trim();
  const sessionUrl = titleMatch[2].trim();

  // Event/location line: italicised, comes after title
  const evLine = block.match(/^_(.+?)_\s*$/m);
  let event = 'Unknown event';
  let location = '';
  if (evLine) {
    const parts = evLine[1].split(/,\s*/);
    if (parts.length >= 2) {
      event = parts.slice(0, -1).join(', ');
      location = parts.at(-1).trim();
    } else {
      event = evLine[1];
    }
  }

  // Date line
  const dateLine = block.match(/^(?:Date:\s*)?([A-Za-z]+\s+\d{1,2}(?:[-–]\d{1,2})?\s+\d{4})/m);
  const dateStr = dateLine ? parseDate(dateLine[1]) : null;
  if (!dateStr) return;

  // Recording link: 📺 [Recording](url)
  const recLine = block.match(/📺\s*\[(?:Recording|Video|Youtube)\]\(([^)]+)\)/i);
  const recUrl = recLine ? recLine[1] : null;
  const ytId = recUrl ? extractYoutubeId(recUrl) : null;

  const slug = slugify(`${title}-${dateStr.slice(0, 7)}`);
  const yaml = [
    `title: ${JSON.stringify(title)}`,
    `event: ${JSON.stringify(event)}`,
    `date: ${dateStr}`,
    location ? `location: ${JSON.stringify(location)}` : null,
    `youtube_id: ${ytId ?? 'null'}`,
    `tags: []`,
    `featured: false`,
  ].filter(Boolean).join('\n');
  await fs.writeFile(path.join(TALKS_OUT, `${slug}.yaml`), yaml + '\n');
  nTalks++;
};

for (const raw of lines) {
  // Heading detection
  const h = raw.match(/^(#{2,4})\s+(.+?)\s*$/);
  if (h) {
    await flush();
    const text = h[2].toLowerCase();
    if (text.includes('speaking')) inSpeaking = true;
    else if (h[1].length === 2) {
      // Top-level section break
      inSpeaking = text.includes('speaking');
      const key = text.replace(/[^a-z]/g, '');
      writingKind = WRITING_HEADINGS.get(key) ?? null;
    } else if (h[1].length === 3) {
      // Sub-section like ### Past / ### Upcoming — stay in current parent context
    }
    continue;
  }

  if (raw.trim() === '') {
    await flush();
    continue;
  }

  // Writing-style bullet (- [Title](url) — Publication 2024-01-01)
  if (writingKind && /^[-*]\s+/.test(raw)) {
    const linkRe = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const links = [...raw.matchAll(linkRe)];
    if (links.length > 0) {
      const [, title, url] = links[0];
      const date = parseDate(raw) ?? '2024-01-01';
      let publication;
      const pub = raw.match(/_([^_]+)_/) ?? raw.match(/—\s*([^—\n]+)$/);
      try {
        publication = pub ? pub[1].trim() : new URL(url).hostname.replace(/^www\./, '');
      } catch {
        publication = 'Unknown';
      }
      const slug = slugify(`${title}-${date.slice(0, 7)}`);
      const out = [
        `kind: ${writingKind}`,
        `title: ${JSON.stringify(title)}`,
        `publication: ${JSON.stringify(publication)}`,
        `date: ${date}`,
        `url: ${JSON.stringify(url)}`,
      ].join('\n');
      await fs.writeFile(path.join(WRITING_OUT, `${slug}.yaml`), out + '\n');
      nWriting++;
    }
    continue;
  }

  // Speaking-section block accumulator
  if (inSpeaking) buf.push(raw);
}
await flush();

console.log(
  `[github-readme] wrote ${nTalks} talks → ${TALKS_OUT}, ${nWriting} writing → ${WRITING_OUT}`,
);
