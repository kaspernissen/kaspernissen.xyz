// Reading and writing the engagement files.
//
// One flat directory, one file per engagement. The subdirectories that used to
// live here (youtube/, events/sessionize/, github/, decks/notist/) only ever
// encoded which fetcher owned which files; with delete-and-rewrite gone, so is
// the ownership, and Astro globs the whole tree as one collection anyway.
//
// Everything is written through `save` so the field order is identical whoever
// wrote it. That matters more than it sounds: the nightly refresh opens a pull
// request, and a diff is only reviewable if the only lines that move are the
// ones that actually changed.

import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

export const TALKS_DIR = 'src/content/talks';

// Identity first, then when and where, then what came out of it, then
// provenance last — it is bookkeeping, not content.
const FIELD_ORDER = [
  'title',
  'event',
  'event_url',
  'session_url',
  'date',
  'end_date',
  'location',
  'role',
  'status',
  'co_speakers',
  'abstract',
  'youtube_id',
  'deck_file',
  'deck_size_mb',
  'notist_url',
  'tags',
  'featured',
  'slug',
  'playlist_position',
  'sources',
];

/** Dates round-trip as `YYYY-MM-DD`, never as a JS Date with a timezone. */
function toPlainDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

export async function loadEntries(dir = TALKS_DIR) {
  const files = [];
  async function walk(d) {
    let items;
    try {
      items = await fs.readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const item of items) {
      const full = path.join(d, item.name);
      if (item.isDirectory()) await walk(full);
      else if (item.name.endsWith('.yaml')) files.push(full);
    }
  }
  await walk(dir);

  const entries = [];
  for (const file of files.sort()) {
    const text = await fs.readFile(file, 'utf8');
    const fields = YAML.parse(text) ?? {};
    for (const key of ['date', 'end_date']) {
      if (fields[key] !== undefined) fields[key] = toPlainDate(fields[key]);
    }
    entries.push({ file, fields });
  }
  return entries;
}

/** Serialises one entry in canonical field order. */
export function render(fields) {
  const ordered = {};
  for (const key of FIELD_ORDER) {
    if (fields[key] !== undefined) ordered[key] = toPlainDate(fields[key]);
  }
  // Anything the schema gained since this list was written still gets saved,
  // rather than being silently dropped on the next refresh.
  for (const key of Object.keys(fields)) {
    if (!(key in ordered)) ordered[key] = toPlainDate(fields[key]);
  }
  // No forced quoting style: these files are meant to be opened and edited, and
  // letting the serialiser choose gives a multi-paragraph abstract a literal
  // block (`abstract: |-`) instead of one long line of \n escapes.
  // lineWidth 0 stops it wrapping a long title mid-sentence, which would make
  // the refresh PR's diff churn on rewrapping rather than on real changes.
  return YAML.stringify(ordered, { lineWidth: 0, defaultKeyType: 'PLAIN' });
}

export async function save(file, fields) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, render(fields));
}

/** `Beyond "Supports OpenTelemetry"` + a date -> a stable, unique filename. */
export function fileNameFor(fields, slugify) {
  const base = slugify(fields.title || fields.event);
  const date = toPlainDate(fields.date) ?? 'undated';
  return `${base}-${date}.yaml`;
}
