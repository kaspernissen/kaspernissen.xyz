/**
 * Where images inside blog posts are served from.
 *
 * Posts are Markdown and their bodies reference images as `IMGBASE/<file>`.
 * The sentinel is rewritten to this base at build time by the rehype plugin in
 * astro.config.mjs, so the Markdown itself stays free of any hostname and
 * moving the files — to CloudFront, to another bucket — is one env var rather
 * than a rewrite of every post.
 *
 * The files sit under one flat prefix, blog/<file>, at whatever size they were
 * imported at. Unlike speaker photos there is no separate display master:
 * these came off Medium at 2000px, which is already the size they render at.
 */
const configured = import.meta.env.PUBLIC_BLOG_IMAGE_BASE_URL?.trim();

export const BLOG_IMAGE_BASE = configured ? configured.replace(/\/+$/, '') : '/blog-images';

/** Strips any directory part; frontmatter stores bare file names. */
export const blogImageUrl = (file: string) =>
  `${BLOG_IMAGE_BASE}/${file.replace(/^.*\//, '')}`;
