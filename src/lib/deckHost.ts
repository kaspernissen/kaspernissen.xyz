/**
 * Where deck PDFs are served from.
 *
 * Decks are hosted in the S3 bucket under `decks/`, and PUBLIC_DECK_BASE_URL
 * points at it (set in .env and in the deploy workflow). `public/decks/` is a
 * gitignored local mirror that `npm run decks:sync` uploads from; the PDFs are
 * never committed.
 *
 * The `/decks` fallback when the variable is unset exists only so `npm run dev`
 * works without a .env. It is not a hosting option. See AGENTS.md.
 */
const configured = import.meta.env.PUBLIC_DECK_BASE_URL?.trim();

export const DECK_BASE = configured ? configured.replace(/\/+$/, '') : '/decks';

export const deckUrl = (file: string) => `${DECK_BASE}/${file}`;
