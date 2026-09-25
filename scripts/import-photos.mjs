// Imports a folder of speaker photos into the site.
//
//   node scripts/import-photos.mjs <source-dir> [--out-full <dir>] [--dry]
//
// For each image it produces two things:
//
//   src/assets/speakers/<slug>.jpg   a 1600px display master, uploaded to the
//                                    bucket's photos/display/ prefix (not
//                                    committed). Astro downsamples this to the
//                                    400/800px variants the gallery actually
//                                    serves, so it needs to be good but not
//                                    enormous.
//   <out-full>/<slug>.jpg            a 3200px high-quality original for people
//                                    to download. These are the heavy files and
//                                    are meant for the S3 bucket, not the repo.
//
// plus a src/content/speakers/<slug>.yaml stub.
//
// Naming: <date>-<event-slug>-<nn>. The date comes from EXIF, falling back to
// the most common date in the same folder — photos arrive in per-shoot folders,
// so a stripped-EXIF frame almost always belongs with its dated neighbours.
// Filenames from the camera (DSC_4591, IMG_7590) and from Flickr
// (54430136251_371b666636_o) carry nothing worth keeping.
//
// RAW (.CR2) is converted through sips, which reads it via macOS ImageIO — no
// extra dependency, and it handles EXIF orientation.

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import crypto from 'node:crypto';

const exec = promisify(execFile);

const ASSETS = 'src/assets/speakers';
const CONTENT = 'src/content/speakers';
const DISPLAY_PX = 1600;
const FULL_PX = 3200;

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const sourceDir = args.find((a) => !a.startsWith('--'));
const outFull = args.includes('--out-full') ? args[args.indexOf('--out-full') + 1] : 'photos-fullres';

if (!sourceDir) {
  console.error('usage: node scripts/import-photos.mjs <source-dir> [--out-full <dir>] [--dry]');
  process.exit(1);
}

const IMAGE_RE = /\.(jpe?g|png|cr2|nef|arw|dng|heic|tiff?)$/i;

function slugify(s) {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function walk(dir, acc = []) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, acc);
    else if (IMAGE_RE.test(e.name)) acc.push(full);
  }
  return acc;
}

/** EXIF capture date via sips, as YYYY-MM-DD. */
async function exifDate(file) {
  try {
    const { stdout } = await exec('sips', ['-g', 'creation', file]);
    const m = stdout.match(/creation:\s*(\d{4}):(\d{2}):(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
  } catch {
    return null;
  }
}

async function md5(file) {
  return crypto.createHash('md5').update(await fs.readFile(file)).digest('hex');
}

// Events we can state with confidence, keyed by the date the photos carry.
// Anything not listed is left as TBD rather than guessed at.
const KNOWN_EVENTS = [
  { from: '2024-03-18', to: '2024-03-23', name: 'KubeCon + CloudNativeCon Europe 2024', location: 'Paris, France' },
  { from: '2024-11-11', to: '2024-11-16', name: 'KubeCon + CloudNativeCon North America 2024', location: 'Salt Lake City, USA' },
  { from: '2025-04-01', to: '2025-04-05', name: 'KubeCon + CloudNativeCon Europe 2025', location: 'London, UK' },
  { from: '2026-09-01', to: '2026-09-05', name: 'ContainerDays Hamburg 2026', location: 'Hamburg, Germany' },
  { from: '2026-09-23', to: '2026-09-25', name: 'SREday London 2026 Q3', location: 'London, UK' },
];

function eventFor(date) {
  return KNOWN_EVENTS.find((e) => date >= e.from && date <= e.to) ?? null;
}

const files = (await walk(sourceDir)).sort();
if (files.length === 0) {
  console.error(`no images found under ${sourceDir}`);
  process.exit(1);
}

// Pass 1: dates, dedupe.
const seen = new Map();
const records = [];
for (const file of files) {
  const hash = await md5(file);
  if (seen.has(hash)) {
    console.log(`  duplicate, skipping: ${path.basename(file)} == ${path.basename(seen.get(hash))}`);
    continue;
  }
  seen.set(hash, file);
  records.push({ file, dir: path.dirname(file), date: await exifDate(file) });
}

// Fill missing dates from the folder's neighbours — but ONLY where the folder
// is plainly one shoot. Some folders mix events months apart, and stamping
// those with a single modal date would invent history rather than recover it.
// A folder whose dated photos span more than a week is left alone.
const SAME_SHOOT_DAYS = 7;
const byDir = new Map();
for (const r of records) {
  if (!r.date) continue;
  const counts = byDir.get(r.dir) ?? new Map();
  counts.set(r.date, (counts.get(r.date) ?? 0) + 1);
  byDir.set(r.dir, counts);
}

const homogeneous = new Map();
for (const [dir, counts] of byDir) {
  const dates = [...counts.keys()].sort();
  const spanDays =
    (new Date(dates.at(-1)).getTime() - new Date(dates[0]).getTime()) / 86_400_000;
  if (spanDays <= SAME_SHOOT_DAYS) {
    homogeneous.set(dir, [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]);
  } else {
    console.log(
      `  ${path.basename(dir)}: dated photos span ${Math.round(spanDays)} days ` +
        `— not inferring dates for its undated frames`,
    );
  }
}

let inferred = 0;
let undated = 0;
for (const r of records) {
  if (r.date) continue;
  const guess = homogeneous.get(r.dir);
  if (!guess) { undated++; continue; }
  r.date = guess;
  r.dateInferred = true;
  inferred++;
}

// Pass 2: names.
const usedSlugs = new Map();
for (const r of records) {
  const ev = r.date ? eventFor(r.date) : null;
  r.event = ev;
  const base = r.date
    ? `${r.date}-${ev ? slugify(ev.name.replace(/\+ CloudNativeCon/i, '')) : 'untitled'}`
    : 'unsorted';
  const n = (usedSlugs.get(base) ?? 0) + 1;
  usedSlugs.set(base, n);
  r.slug = `${base}-${String(n).padStart(2, '0')}`;
}

console.log(`\n${records.length} images (${files.length - records.length} duplicates skipped)`);
console.log(`${inferred} dates inferred from folder neighbours, ${undated} left undated`);
const named = records.filter((r) => r.event).length;
console.log(`${named} matched a known event, ${records.length - named} left as TBD\n`);

if (dry) {
  for (const r of records.slice(0, 12)) {
    console.log(`  ${path.basename(r.file).padEnd(34)} -> ${r.slug}.jpg  ${r.event?.name ?? 'TBD'}`);
  }
  if (records.length > 12) console.log(`  … and ${records.length - 12} more`);
  process.exit(0);
}

await fs.mkdir(ASSETS, { recursive: true });
await fs.mkdir(CONTENT, { recursive: true });
await fs.mkdir(outFull, { recursive: true });

let done = 0;
for (const r of records) {
  const display = path.join(ASSETS, `${r.slug}.jpg`);
  const full = path.join(outFull, `${r.slug}.jpg`);

  // sips resizes only if the image is larger than the target, so smaller
  // originals pass through untouched rather than being upscaled.
  await exec('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', '-Z', String(DISPLAY_PX), r.file, '--out', display]);
  await exec('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '90', '-Z', String(FULL_PX), r.file, '--out', full]);

  const yaml = [
    `slug: ${r.slug}`,
    `caption: ${JSON.stringify(r.event ? `${r.event.name}` : 'TBD — add a caption')}`,
    `event: ${JSON.stringify(r.event?.name ?? 'TBD')}`,
    // Left null rather than guessed — see the inference guard above.
    `date: ${r.date ?? 'null'}`,
    `photographer: "Unknown"`,
    `license: "All rights reserved"`,
    `src: ${JSON.stringify(`./${r.slug}.jpg`)}`,
    `download: ${JSON.stringify(`${r.slug}.jpg`)}`,
  ].join('\n');
  await fs.writeFile(path.join(CONTENT, `${r.slug}.yaml`), yaml + '\n');

  done++;
  if (done % 20 === 0) console.log(`  … ${done}/${records.length}`);
}

console.log(`\nwrote ${done} display masters → ${ASSETS}`);
console.log(`wrote ${done} originals → ${outFull} (upload these to the bucket)`);
console.log(`wrote ${done} stubs → ${CONTENT}`);
