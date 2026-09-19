/**
 * Where deck PDFs are served from.
 *
 * Default: `/decks`, i.e. the files committed under `public/decks/` and served
 * by GitHub Pages alongside the site. At ~80MB total that is well inside the
 * 1GB Pages limit, needs no credentials, and keeps the decks downloadable
 * without a second piece of infrastructure.
 *
 * To move them off the repo instead (S3, R2, any CDN), sync `public/decks/`
 * to the bucket and set PUBLIC_DECK_BASE_URL to its public base, e.g.
 *
 *   PUBLIC_DECK_BASE_URL=https://decks.kaspernissen.xyz
 *
 * Nothing else changes: the fetcher keeps writing the same file names, and
 * `public/decks/` stays the local mirror you sync from.
 */
const configured = import.meta.env.PUBLIC_DECK_BASE_URL?.trim();

export const DECK_BASE = configured ? configured.replace(/\/+$/, '') : '/decks';

export const deckUrl = (file: string) => `${DECK_BASE}/${file}`;
