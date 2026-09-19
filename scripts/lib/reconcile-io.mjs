// The one place a fetcher is allowed to touch the engagement files.
//
// A fetcher used to own a directory and rewrite it wholesale, which is why
// nothing hand-written could live there. Now it hands its records to this and
// the rules in src/lib/reconcile.ts decide what may change:
//
//   - an entry is found by the provenance key it already carries
//   - a blank field may be filled; a field with a value is never overwritten
//   - a record that has gone from upstream is reported, never deleted
//
// Nothing here deletes a file. That is deliberate and it is the whole point:
// deletion is how the old pipeline lost eighteen recordings, and it is why a
// correction could not survive a build.

import fs from 'node:fs/promises';
import path from 'node:path';
import { loadEntries, save, TALKS_DIR } from './entries.mjs';
import { fillBlanks, mergeSources, indexBySource } from './reconcile-rules.mjs';

function slugify(s) {
  return String(s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fileNameFor(fields) {
  const base = slugify(fields.title || fields.event) || 'engagement';
  const date = String(fields.date ?? 'undated').slice(0, 7);
  return `${base}-${date}.yaml`;
}

/**
 * Reconciles one source's records into the engagement files.
 *
 * `records` is [{ key, fields }] where `key` identifies the record upstream —
 * a video ID, a Notist URL, a slugified conference name. It must be stable:
 * it is the handle by which this entry is recognised forever after, and a key
 * that changes shape between runs creates duplicates instead of updating.
 *
 * Returns a report the refresh PR body is written from.
 */
export async function reconcile(source, records, options = {}) {
  const { dir = TALKS_DIR, onCreate, matchField } = options;
  const entries = await loadEntries(dir);
  const index = indexBySource(entries.map((e) => e.fields), source);
  const byFields = new Map(entries.map((e) => [e.fields, e.file]));

  // Fallback lookup for an entry that carries the identifying value but has
  // not recorded it as provenance yet — a talk the README fetcher just created
  // with a `youtube_id`, moments before this fetcher goes looking for that
  // video. Without it the video is not recognised until record-sources has
  // run, so a fresh entry takes two refreshes to fill in.
  const byField = new Map();
  if (matchField) {
    for (const { fields } of entries) {
      const value = fields[matchField];
      if (value && !fields.sources?.[source]) byField.set(value, fields);
    }
  }

  const report = { source, created: [], updated: [], kept: [], conflicts: [], missing: [] };
  const seen = new Set();
  const used = new Set(entries.map((e) => path.basename(e.file)));

  for (const { key, fields: incoming } of records) {
    seen.add(key);
    const existing = index.get(key) ?? byField.get(key);

    if (existing) {
      const { fields, filled, kept } = fillBlanks(existing, incoming);
      const merged = mergeSources(fields, source, key);
      fields.sources = merged.sources;
      if (filled.length > 0) {
        await save(byFields.get(existing), fields);
        report.updated.push({ key, file: byFields.get(existing), filled });
      }
      if (kept.length > 0) report.kept.push({ key, file: byFields.get(existing), kept });
      continue;
    }

    // No entry claims this record. Give the caller a chance to adopt an
    // existing entry — that is how a recording joins the conference it was
    // given at — before falling back to creating a file.
    const adopted = onCreate ? await onCreate(incoming, key, entries) : null;
    if (adopted) {
      const { fields, filled } = fillBlanks(adopted, incoming);
      fields.sources = mergeSources(fields, source, key).sources;
      await save(byFields.get(adopted), fields);
      report.updated.push({ key, file: byFields.get(adopted), filled, adopted: true });
      continue;
    }

    let name = fileNameFor(incoming);
    for (let n = 2; used.has(name); n++) {
      name = fileNameFor(incoming).replace(/\.yaml$/, `-${n}.yaml`);
    }
    used.add(name);
    const file = path.join(dir, name);
    await save(file, { ...incoming, sources: { [source]: key } });
    report.created.push({ key, file });
  }

  for (const [key, fields] of index) {
    if (!seen.has(key)) report.missing.push({ key, file: byFields.get(fields) });
  }

  return report;
}

/** One line per source, for the refresh log and the PR body. */
export function summarise(report) {
  const bits = [
    `${report.created.length} created`,
    `${report.updated.length} updated`,
  ];
  if (report.kept.length > 0) bits.push(`${report.kept.length} kept (yours differs)`);
  if (report.missing.length > 0) bits.push(`${report.missing.length} no longer upstream`);
  return `[${report.source}] ${bits.join(', ')}`;
}

export { slugify, fileNameFor, fs };
