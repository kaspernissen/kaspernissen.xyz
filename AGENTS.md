# AGENTS.md

Instructions for coding agents working in this repo. `CLAUDE.md` imports this
file, so this is the one place to edit.

## Decks and photos live in S3, never in the repo

Every deck PDF and every speaker photo is served from the public bucket
`s3://kasper-nissen-presentations`:

| What                     | Bucket key                   | Local staging dir     |
| ------------------------ | ---------------------------- | --------------------- |
| Deck PDFs                | `decks/<file>.pdf`           | `public/decks/`       |
| Photo originals (3200px) | `photos/<name>.jpg`          | `public/speakers/`    |
| Photo display masters    | `photos/display/<name>.jpg`  | `src/assets/speakers/`|

The public base URL is
`https://kasper-nissen-presentations.s3.eu-west-1.amazonaws.com`.

The local directories are gitignored staging mirrors that you upload from. Do
not commit files from them, and do not treat the `/decks` or `/speakers`
fallback in `src/lib/deckHost.ts` / `src/lib/photoHost.ts` as a place to host
anything. That fallback exists only so `npm run dev` works without a `.env`.
The deployed site always reads from the bucket (see `.github/workflows/deploy.yml`).

### Adding a deck

1. Put the PDF in `public/decks/`. Name it `<talk-title-slug>-<yyyy-mm>.pdf`,
   the same scheme `scripts/fetch-notist.mjs` uses.
2. Run `npm run decks:sync` (needs `DECKS_BUCKET` from `.env` and AWS credentials).
3. Confirm the upload: `curl -sI <base>/decks/<file>.pdf` must return `200`.
4. Only then set `deck_file` (and `deck_size_mb`) in the talk's
   `src/content/talks/*.yaml`. A YAML entry pointing at a file that is not in the
   bucket is a dead download link on the live site.

### Adding photos

1. `npm run photos:import -- <source-dir> --out-full public/speakers`
   writes display masters to `src/assets/speakers/`, originals to
   `public/speakers/`, and YAML stubs to `src/content/speakers/`.
2. Upload the originals: `npm run photos:sync`.
3. Upload the display masters:
   `aws s3 sync src/assets/speakers s3://kasper-nissen-presentations/photos/display --exclude '*' --include '*.jpg' --cache-control 'public, max-age=31536000, immutable'`
4. Confirm both `<base>/photos/<name>.jpg` and `<base>/photos/display/<name>.jpg`
   return `200` before committing the YAML. The build fetches display masters
   from the bucket and fails if one is missing.

If you cannot upload (no credentials, no AWS CLI), stop and tell the user. Do
not fall back to committing the file or to serving it locally.
