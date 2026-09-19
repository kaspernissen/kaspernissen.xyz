// Parses Kasper's GitHub profile README at github.com/kaspernissen/kaspernissen
// for three sections:
//   - "## Speaking Activities"     → talks (bold-link block format)
//   - "## Podcasts"                → writing kind=podcast (same bold-link block)
//   - "## Featured blog posts"     → writing kind=blog (markdown bullet list)
//
// Bold-link block format (talks + podcasts):
//   **[Title](url)**
//   _Event Name, Location_
//   Date: Month DD YYYY
//   📺 [Recording](url)        (or 💿 for podcasts; recording URL extracts youtube_id)
//
// Bullet-list format (blog posts):
//   - **[Title](url)** (Publication)

import fs from 'node:fs/promises';
import path from 'node:path';

const REPO = 'kaspernissen/kaspernissen';
const TALKS_OUT = 'src/content/talks/github';
const WRITING_OUT = 'src/content/writing/github';
const BRANCHES = ['master', 'main'];

function slugify(s) {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function extractYoutubeId(url) {
  const m =
    url.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
    url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
    url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// The README's date lines are hand-written and inconsistent: "March 11th 2021",
// "27th September 2017", "June 26 - 2019", "November 12-15, 2024". Anything this
// fails to read is dropped silently by writeBoldLinkBlock, so it stays liberal.
function parseDate(text) {
  const months = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9,
    oct: 10, nov: 11, dec: 12,
  };
  // "23rd" → "23", so the day and the year stay separable below.
  const t = text.replace(/(\d{1,2})(st|nd|rd|th)\b/gi, '$1');
  // A day range ("12-15", "26 - 2019") may sit between day and year, so the
  // separator before the year is allowed to be a comma, a dash, or both.
  const SEP = '(?:\\s*[-–—]\\s*\\d{1,2})?\\s*,?\\s*[-–—]?\\s*';

  // Month first: "March 11 2021", "November 12-15, 2024"
  let m = t.match(new RegExp(`([A-Za-z]+)\\s+(\\d{1,2})${SEP}(\\d{4})`));
  if (m && months[m[1].toLowerCase()]) {
    return iso(m[3], months[m[1].toLowerCase()], m[2]);
  }
  // Day first: "27 September 2017"
  m = t.match(new RegExp(`(\\d{1,2})\\s+([A-Za-z]+)${SEP}(\\d{4})`));
  if (m && months[m[2].toLowerCase()]) {
    return iso(m[3], months[m[2].toLowerCase()], m[1]);
  }
  m = t.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // Month and year only: "September 2017"
  m = t.match(/([A-Za-z]+)\s+(\d{4})/);
  if (m && months[m[1].toLowerCase()]) return iso(m[2], months[m[1].toLowerCase()], 1);
  m = t.match(/\((\d{4})\)/);
  if (m) return `${m[1]}-01-01`;
  return null;
}

function iso(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Section dispatch: which kind of parser the H2 heading triggers.
const SECTION_TYPES = [
  { test: /^speaking/i,           type: 'talks' },
  { test: /^podcast/i,            type: 'podcasts' },
  { test: /^featured blog post/i, type: 'blog-bullets' },
  { test: /^blog/i,               type: 'blog-bullets' },
  { test: /^interview/i,          type: 'interview-bullets' },
  { test: /^newsletter/i,         type: 'newsletter-bullets' },
];

function classifySection(headingText) {
  for (const s of SECTION_TYPES) if (s.test.test(headingText)) return s.type;
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

let nTalks = 0;
let nWriting = 0;

// The same talk is often given several times in one month (three "Shifting
// Security Left" deliveries in March 2021), and title+YYYY-MM collides for
// them. Without this the later block silently overwrites the earlier one.
const usedSlugs = new Set();
function uniqueSlug(base) {
  if (!usedSlugs.has(base)) { usedSlugs.add(base); return base; }
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!usedSlugs.has(candidate)) { usedSlugs.add(candidate); return candidate; }
  }
}

const lines = md.split('\n');
let currentSection = null;
let buf = [];

async function writeBoldLinkBlock(block, sectionType) {
  const titleMatch = block.match(/^\*\*\[([^\]]+)\]\(([^)]+)\)\*\*/m);
  if (!titleMatch) return;
  const title = titleMatch[1].trim();

  const evLine = block.match(/^_(.+?)_\s*$/m);
  let event = 'Unknown';
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

  const dateLine = block.match(/(?:^|\n)(?:\*\*Date:\*\*|Date:)\s*([^\n]+)/i);
  const dateStr = dateLine ? parseDate(dateLine[1]) : null;
  if (!dateStr) return;

  const recLine = block.match(/[📺💿]\s*\[(?:Recording|Video|Youtube|Listen)\]\(([^)]+)\)/i);
  const recUrl = recLine ? recLine[1] : null;
  const ytId = recUrl ? extractYoutubeId(recUrl) : null;

  if (sectionType === 'talks') {
    const slug = uniqueSlug(slugify(`${title}-${dateStr.slice(0, 7)}`));
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
  } else if (sectionType === 'podcasts') {
    const slug = slugify(`podcast-${title}-${dateStr.slice(0, 7)}`);
    const yaml = [
      `kind: podcast`,
      `title: ${JSON.stringify(title)}`,
      `publication: ${JSON.stringify(event)}`,
      `date: ${dateStr}`,
      `url: ${JSON.stringify(recUrl ?? titleMatch[2])}`,
    ].join('\n');
    await fs.writeFile(path.join(WRITING_OUT, `${slug}.yaml`), yaml + '\n');
    nWriting++;
  }
}

async function writeBulletItem(line, sectionType) {
  // Matches "- **[Title](url)** (Publication)" or simpler "- [Title](url)"
  const linkRe = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const links = [...line.matchAll(linkRe)];
  if (links.length === 0) return;
  const [, title, url] = links[0];

  const date = parseDate(line) ?? '2024-01-01';
  // Publication = the parenthesised text after the link, or italics.
  //
  // The bullets are bold: `- **[Title](url)** (TechTarget)`. The first pattern
  // used to require the link's ")" to be followed straight away by "(", so the
  // "**" in between made it miss, and the italics pattern then matched from the
  // second "*" and captured the entire markdown link as the publication. Eleven
  // entries rendered their own title and raw URL where the publisher should be.
  const pubMatch =
    line.match(/\)\*{0,2}\s*\(([^)]+)\)/) ||
    line.match(/\*([^*]+)\*/) ||
    line.match(/—\s*([^—\n]+)$/);

  // Whatever matched, it must not still be markup. Reduce a markdown link to
  // its text and fall back to the host rather than printing a URL at a reader.
  const cleaned = (pubMatch?.[1] ?? '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .trim();
  let publication;
  try {
    publication =
      cleaned && slugify(cleaned) !== slugify(title)
        ? cleaned
        : new URL(url).hostname.replace(/^www\./, '');
  } catch {
    publication = 'Unknown';
  }

  const kind = sectionType.startsWith('blog')
    ? 'blog'
    : sectionType.startsWith('interview')
      ? 'interview'
      : sectionType.startsWith('newsletter')
        ? 'newsletter'
        : 'blog';

  const slug = slugify(`${kind}-${title}-${date.slice(0, 7)}`);
  const yaml = [
    `kind: ${kind}`,
    `title: ${JSON.stringify(title)}`,
    `publication: ${JSON.stringify(publication)}`,
    `date: ${date}`,
    `url: ${JSON.stringify(url)}`,
  ].join('\n');
  await fs.writeFile(path.join(WRITING_OUT, `${slug}.yaml`), yaml + '\n');
  nWriting++;
}

async function flushBlock() {
  if (buf.length === 0) return;
  const block = buf.join('\n');
  buf = [];
  if (currentSection === 'talks' || currentSection === 'podcasts') {
    await writeBoldLinkBlock(block, currentSection);
  }
}

for (const raw of lines) {
  const h = raw.match(/^(#{2,4})\s+(.+?)\s*$/);
  if (h) {
    await flushBlock();
    if (h[1].length === 2) {
      // H2 is a section boundary
      currentSection = classifySection(h[2]);
    }
    // H3/H4 inside a section don't change section type (e.g. "### Past", "#### 2024")
    continue;
  }

  if (!currentSection) continue;

  // Bullet-list parsing fires per line, immediately
  if (currentSection.endsWith('-bullets') && /^[-*]\s+/.test(raw)) {
    await writeBulletItem(raw, currentSection);
    continue;
  }

  // Bold-link block: accumulate until blank line, then flush
  if ((currentSection === 'talks' || currentSection === 'podcasts')) {
    if (raw.trim() === '') {
      await flushBlock();
    } else {
      buf.push(raw);
    }
  }
}
await flushBlock();

console.log(
  `[github-readme] wrote ${nTalks} talks → ${TALKS_OUT}, ${nWriting} writing → ${WRITING_OUT}`,
);
