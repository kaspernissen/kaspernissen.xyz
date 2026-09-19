/**
 * Where Credly badge images are served from.
 *
 * Same arrangement as the photos and decks (see src/lib/photoHost.ts): the
 * Credly fetcher writes src/assets/badges/ as the local mirror you sync from,
 * and the bucket's badges/ prefix is what the site actually renders.
 *
 * `image` in each badge's YAML is a path the fetcher wrote, so only the file
 * name is used here and moving the host never means rewriting content.
 */
const configured = import.meta.env.PUBLIC_BADGE_BASE_URL?.trim();

export const BADGE_BASE = configured ? configured.replace(/\/+$/, '') : '/badges';

export const badgeUrl = (file: string) => `${BADGE_BASE}/${file.replace(/^.*\//, '')}`;
