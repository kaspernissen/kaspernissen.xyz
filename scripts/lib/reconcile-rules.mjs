/**
 * The rule that makes the committed YAML editable.
 *
 * Fetchers used to delete and rewrite the directory they owned, so nothing
 * typed by hand survived a build and every durable correction had to live in a
 * parallel override file. Now a fetcher reconciles into the existing entries
 * instead, under one contract:
 *
 *   - a field that is absent or null may be filled
 *   - a field that already has a value is NEVER overwritten
 *   - a record that has disappeared upstream is reported, never deleted
 *
 * That is the whole thing. Anything you type is permanent, because the only
 * change a fetcher may make to an existing field is filling a blank.
 *
 * Kept free of Node APIs so it can be unit tested directly; the file I/O lives
 * in scripts/lib/entries.mjs and scripts/lib/reconcile-io.mjs.
 */

/** Absent, null, empty string, or empty array — all count as "no value yet". */
export function isBlank(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Fills only the blank fields of `entry` from `incoming`.
 *
 * `kept` is deliberately reported rather than silently dropped: it is how the
 * refresh PR can say "upstream now calls this something else, and we are
 * keeping your version", which is a thing worth reading in a diff.
 */
export function fillBlanks(entry, incoming) {
  const fields = { ...entry };
  const filled = [];
  const kept = [];

  for (const [key, value] of Object.entries(incoming)) {
    if (key === 'sources') continue; // merged separately, see mergeSources
    if (isBlank(value)) continue; // nothing to offer
    if (isBlank(fields[key])) {
      fields[key] = value;
      filled.push(key);
    } else if (JSON.stringify(fields[key]) !== JSON.stringify(value)) {
      kept.push(key);
    }
  }

  return { fields, filled, kept };
}

/**
 * Records which upstream record this entry was built from.
 *
 * This is what makes a merge permanent. "This recording belongs to that
 * conference" used to be re-derived from titles and dates on every build, so a
 * merge could quietly stop working when an upstream title changed. Written
 * into `sources` once, the next run matches on the key and never guesses.
 *
 * An existing key is never repointed: if an entry already claims a different
 * YouTube video, that is a conflict for a human to look at, not something to
 * overwrite.
 */
export function mergeSources(entry, source, key) {
  const current = entry.sources ?? {};
  const existing = current[source];
  if (existing === key) return { sources: current, changed: false, conflict: null };
  if (existing !== undefined) {
    return { sources: current, changed: false, conflict: existing };
  }
  return { sources: { ...current, [source]: key }, changed: true, conflict: null };
}

/** Indexes entries by their key for one source, for O(1) match-by-provenance. */
export function indexBySource(entries, source) {
  const index = new Map();
  for (const entry of entries) {
    const key = entry.sources?.[source];
    if (key) index.set(key, entry);
  }
  return index;
}
