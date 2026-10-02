/**
 * One list for everything written, wherever it was published.
 *
 * `writing` holds links to pieces published elsewhere and `blog` holds posts
 * written here, so a listing that only reads `writing` never shows the blog.
 * This interleaves the two by date.
 *
 * A post that is a cross-post of something already in `writing` (its
 * `canonical` is that entry's URL) is left out. The external entry is the
 * original, and listing both would show the same piece twice.
 */

type Linked = { data: { date: Date; url: string } };
type Post = { data: { date: Date; canonical: string | null } };

export type FeedItem<W, P> =
  | { type: 'writing'; entry: W }
  | { type: 'post'; entry: P };

const normalise = (url: string) => url.trim().replace(/\/+$/, '').toLowerCase();

export function writingFeed<W extends Linked, P extends Post>(
  writing: W[],
  posts: P[],
): FeedItem<W, P>[] {
  const linked = new Set(writing.map((w) => normalise(w.data.url)));
  const own = posts.filter((p) => !p.data.canonical || !linked.has(normalise(p.data.canonical)));
  return [
    ...writing.map((entry) => ({ type: 'writing' as const, entry })),
    ...own.map((entry) => ({ type: 'post' as const, entry })),
  ].sort((a, b) => +b.entry.data.date - +a.entry.data.date);
}
