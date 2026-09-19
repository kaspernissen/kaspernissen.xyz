// Which `writing` kinds belong on /podcasts rather than /writing.
//
// Podcasts and interviews are spoken appearances; keeping them out of the
// writing archive stops 12 guest spots from padding a list of blog posts.
// Both pages read the same collection, so a kind is listed in exactly one.
export const PODCAST_KINDS = ['podcast', 'interview'] as const;

export const isPodcast = (kind: string) =>
  (PODCAST_KINDS as readonly string[]).includes(kind);
