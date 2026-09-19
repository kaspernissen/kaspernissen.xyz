// Which `writing` kinds belong on /podcasts rather than /writing.
//
// Podcasts and interviews are spoken appearances; keeping them out of the
// writing archive stops 12 guest spots from padding a list of blog posts.
// Both pages read the same collection, so a kind is listed in exactly one.
export const PODCAST_KINDS = ['podcast', 'interview'] as const;

export const isPodcast = (kind: string) =>
  (PODCAST_KINDS as readonly string[]).includes(kind);

// Code RED goes out often enough that its 37 issues outnumbered everything
// else on /writing put together, so a blog post from last month sat below a
// dozen newsletters. They get their own list underneath rather than being
// dropped: they are still Kasper's writing, just a different cadence.
export const NEWSLETTER_KINDS = ['newsletter'] as const;

export const isNewsletter = (kind: string) =>
  (NEWSLETTER_KINDS as readonly string[]).includes(kind);
