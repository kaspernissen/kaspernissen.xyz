/**
 * Where full-resolution speaker photos are served from.
 *
 * Same split as the decks (see src/lib/deckHost.ts): the site commits a 1600px
 * display master per photo — which Astro downsamples to the sizes the gallery
 * actually serves — and the heavy 3200px original that people download lives
 * outside the repo.
 *
 * Default `/speakers` serves them from `public/speakers/`. Set
 * PUBLIC_PHOTO_BASE_URL to a bucket to serve them from there instead:
 *
 *   PUBLIC_PHOTO_BASE_URL=https://kasper-nissen-presentations.s3.eu-west-1.amazonaws.com/photos
 *
 * `download` in each photo's YAML is a bare file name, so moving the host never
 * means rewriting content.
 */
const configured = import.meta.env.PUBLIC_PHOTO_BASE_URL?.trim();

export const PHOTO_BASE = configured ? configured.replace(/\/+$/, '') : '/speakers';

export const photoUrl = (file: string) =>
  `${PHOTO_BASE}/${file.replace(/^\/?speakers\//, '').replace(/^\//, '')}`;
