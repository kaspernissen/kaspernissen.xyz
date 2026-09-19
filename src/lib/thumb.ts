/**
 * Deterministic Memphis-pop artwork for talks with no video thumbnail.
 *
 * A talk without a recording used to render a flat dark box, which read as
 * "broken image" in a grid next to real YouTube stills. Instead each one gets
 * generated artwork in the site's palette.
 *
 * Everything is derived from the talk's title, so a given talk always gets the
 * same artwork — across rebuilds, and across the listing and detail pages. No
 * randomness, nothing stored.
 */

export type Palette = {
  bg: string;
  shapes: [string, string, string];
};

// Drawn from the Hero's confetti colours so the cards feel of a piece with the
// rest of the site rather than like stock placeholders.
export const PALETTES: Palette[] = [
  { bg: '#4c0519', shapes: ['#ec4899', '#facc15', '#22d3ee'] }, // rose
  { bg: '#0c4a6e', shapes: ['#22d3ee', '#fb923c', '#f9a8d4'] }, // sky
  { bg: '#4a044e', shapes: ['#7c3aed', '#facc15', '#ec4899'] }, // fuchsia
  { bg: '#431407', shapes: ['#fb923c', '#22d3ee', '#facc15'] }, // orange
  { bg: '#022c22', shapes: ['#34d399', '#facc15', '#ec4899'] }, // emerald
  { bg: '#1e1b4b', shapes: ['#818cf8', '#fb923c', '#22d3ee'] }, // indigo
];

/** FNV-1a. Small, stable, and dependency-free — we only need even spread. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function paletteFor(seed: string): Palette {
  return PALETTES[hashString(seed) % PALETTES.length];
}

/** Which of the layout variants in GeneratedThumb.astro to draw. */
export const LAYOUT_COUNT = 4;

export function layoutFor(seed: string): number {
  // A second, offset hash so palette and layout don't move in lockstep.
  return Math.floor(hashString(`${seed}#layout`) / 7) % LAYOUT_COUNT;
}
