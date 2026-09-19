import type { CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'blog'>;

/**
 * The file name carries the date so posts sort in a directory listing, but the
 * URL should not: /blog/introducing-shuttle reads better than
 * /blog/2019-01-15-introducing-shuttle, and a post's date is shown on the page
 * anyway. Strips a leading ISO date from the entry id.
 */
export const blogSlug = (post: Post) => post.id.replace(/^\d{4}-\d{2}-\d{2}-/, '');

/** Drafts are kept out of every listing and never get a page. */
export const published = (posts: Post[]) =>
  posts.filter((p) => !p.data.draft).sort((a, b) => +b.data.date - +a.data.date);

/** Posts per listing page. */
export const PAGE_SIZE = 6;

/** Every tag used, most-used first, with how many posts carry it. */
export function tagCounts(posts: Post[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of p.data.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export const tagSlug = (tag: string) =>
  tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * The hero's Memphis palette, reused for tags.
 *
 * A tag keeps its colour everywhere it appears because the colour comes from
 * the tag's own characters, not from its position in a list — "kubernetes" is
 * the same pink on a card, on the filter bar and on the post itself.
 */
const TAG_COLOURS = [
  'bg-pink-500 text-white',
  'bg-orange-400 text-stone-950',
  'bg-cyan-400 text-stone-950',
  'bg-yellow-400 text-stone-950',
  'bg-violet-600 text-white',
];

export function tagColour(tag: string): string {
  let hash = 0;
  for (const ch of tag) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TAG_COLOURS[hash % TAG_COLOURS.length];
}

/** How long the body takes to read, at 200 words per minute. */
export function readingMinutes(body: string): number {
  // Fenced code is skimmed, not read, and a post that is half shell scripts
  // otherwise claims to be twice the read it is.
  const prose = body.replace(/```[\s\S]*?```/g, ' ');
  return Math.max(1, Math.round(prose.split(/\s+/).filter(Boolean).length / 200));
}
