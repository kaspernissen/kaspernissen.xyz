// Uploads the deck PDFs mirrored in public/decks/ to the bucket that serves
// them. Run after scripts/fetch-notist.mjs has pulled anything new:
//
//   node scripts/fetch-notist.mjs && node scripts/sync-decks.mjs
//
// Config (env, or a .env.local you source):
//   DECKS_BUCKET   required, e.g. s3://kaspernissen-decks
//   DECKS_PREFIX   optional key prefix inside the bucket, default none
//   AWS_PROFILE / AWS_REGION as usual
//
// This is deliberately a thin wrapper over `aws s3 sync` rather than an SDK
// dependency: it is run by hand a few times a year, and the AWS CLI already
// handles credentials, retries and multipart uploads.
//
// --delete is NOT passed. A deck removed upstream on noti.st should stop being
// linked from the site (the YAML goes away), but the file staying in the
// bucket keeps any URL someone has already shared alive.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

// Defaults to decks; DECKS_SRC/DECKS_PREFIX point it at the photo originals
// instead (see the photos:sync npm script), since the upload rules are the same.
const SRC = process.env.DECKS_SRC ?? 'public/decks';
const bucket = process.env.DECKS_BUCKET;
const prefix = process.env.DECKS_PREFIX ?? '';

if (!bucket) {
  console.error('sync-decks: set DECKS_BUCKET, e.g. DECKS_BUCKET=s3://kaspernissen-decks');
  process.exit(1);
}

// Photo originals are not all .jpg: a Flickr export arrives as .jpeg and a
// screenshot as .png. Filtering on '.jpg' alone silently skipped two of them,
// so their thumbnails rendered from the display master while "Download
// original" 404'd.
const PHOTO_EXT = ['.jpg', '.jpeg', '.png'];
const wanted = (f) =>
  SRC.includes('decks') ? f.endsWith('.pdf') : PHOTO_EXT.some((e) => f.toLowerCase().endsWith(e));

const pdfs = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter(wanted) : [];
if (pdfs.length === 0) {
  console.error(`sync-decks: no PDFs in ${SRC} — run scripts/fetch-notist.mjs first`);
  process.exit(1);
}

const dest = `${bucket.replace(/\/+$/, '')}/${prefix.replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');

const args = [
  's3', 'sync', SRC, dest,
  '--exclude', '*',
  // Mirrors `wanted` above. No --content-type: the CLI infers it per file,
  // which matters once more than one image format is in play.
  ...(SRC.includes('decks')
    ? ['--include', '*.pdf', '--content-type', 'application/pdf']
    : PHOTO_EXT.flatMap((e) => ['--include', `*${e}`])),
  // Deck filenames carry the talk title and month, so a given URL's bytes
  // never change — safe to cache hard and let the browser reuse it.
  '--cache-control', 'public, max-age=31536000, immutable',
  ...process.argv.slice(2),
];

console.log(`sync-decks: ${pdfs.length} PDFs → ${dest}`);
const r = spawnSync('aws', args, { stdio: 'inherit' });

if (r.error?.code === 'ENOENT') {
  console.error('sync-decks: the AWS CLI is not installed — brew install awscli');
  process.exit(1);
}
process.exit(r.status ?? 1);
