/**
 * Where speaker photos are served from.
 *
 * Nothing image-shaped is versioned any more. The bucket holds two sizes under
 * one prefix:
 *
 *   photos/<name>            the 3200px original, what "Download original" links to
 *   photos/display/<name>    the 1600px master the gallery renders from
 *
 * Astro fetches the display master at build time and emits responsive WebP from
 * it, exactly as it did when the file sat in src/assets/speakers/. The tradeoff
 * is that a build now depends on the bucket being reachable and public; see the
 * `image.remotePatterns` note in astro.config.mjs.
 *
 * Both URLs derive from PUBLIC_PHOTO_BASE_URL, so pointing this at a CloudFront
 * distribution or a different bucket is a one-line change. When it is unset,
 * `npm run dev` falls back to public/speakers/ so the site runs without a .env;
 * that is a dev convenience, not a hosting option. See AGENTS.md.
 */
const configured = import.meta.env.PUBLIC_PHOTO_BASE_URL?.trim();

export const PHOTO_BASE = configured ? configured.replace(/\/+$/, '') : '/speakers';

/** Strips any directory part; content stores bare file names. */
const bare = (file: string) => file.replace(/^.*\//, '');

/** The full-resolution original, for download links. */
export const photoUrl = (file: string) => `${PHOTO_BASE}/${bare(file)}`;

/** The display master, for rendering. */
export const photoDisplayUrl = (file: string) => `${PHOTO_BASE}/display/${bare(file)}`;
