/**
 * Talk abstracts, minus what the YouTube import dragged in with them.
 *
 * Abstracts backfilled from a recording's YouTube description open with the
 * channel's own promotion ("Don't miss out! Join us at our next Flagship
 * Conference: KubeCon + CloudNativeCon events in Hong Kong…") or a "This
 * presentation was recorded at…" credit. Left in, that promo is the first
 * thing on the page and, worse, the meta description every search engine and
 * assistant summarises the talk from. The YAML is left as fetched (the refresh
 * would only put it back); the page reads it through here instead.
 */

const BOILERPLATE = [
  /^Don['’]t miss out!/i,
  /^This (presentation|talk|Ignite Talk) was recorded at\b/i,
];

const ENTITIES: Record<string, string> = { '&quot;': '"', '&#39;': "'", '&amp;': '&', '&lt;': '<', '&gt;': '>' };

export function cleanAbstract(abstract: string | null | undefined): string | null {
  if (!abstract) return null;
  const kept = abstract
    .replace(/&(quot|#39|amp|lt|gt);/g, (e) => ENTITIES[e])
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !BOILERPLATE.some((re) => re.test(p)));
  return kept.length ? kept.join('\n\n') : null;
}

/**
 * A meta description: one line, cut at a word boundary near `max` characters.
 * Search results show about 155 characters; anything past that is dropped by
 * the engine anyway, and a 500-character description is a signal that nobody
 * wrote one.
 */
export function metaDescription(text: string, max = 158): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.–—-]+$/, '')}…`;
}
