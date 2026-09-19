// How an event name becomes a logo filename.
//
// Shared by scripts/fetch-event-logos.mjs, which writes the files, and
// EventLogo.astro, which looks them up. If the two ever disagreed, every logo
// would silently fall back to a monogram — so they read the same function.
// Plain .mjs rather than .ts so the Node script can import it directly.

export function eventSlug(name) {
  return (
    name
      // NFKD leaves the Nordic letters whole, so "Øredev" would slug to
      // "redev". Kasper speaks in Scandinavia often enough for that to matter.
      .replace(/[øØ]/g, 'o')
      .replace(/[æÆ]/g, 'ae')
      .replace(/[åÅ]/g, 'a')
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  );
}

/** Up to two initials, for the tile shown when an event publishes no mark. */
export function eventInitials(name) {
  const words = name
    .replace(/[^\p{L}\p{N}\s+]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w && !/^(the|and|of|on|for|a|an)$/i.test(w));
  return words.slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
}
