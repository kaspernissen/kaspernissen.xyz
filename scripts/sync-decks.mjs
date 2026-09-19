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

const pdfs = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter((f) => f.endsWith(SRC.includes('decks') ? '.pdf' : '.jpg')) : [];
if (pdfs.length === 0) {
  console.error(`sync-decks: no PDFs in ${SRC} — run scripts/fetch-notist.mjs first`);
  process.exit(1);
}

const dest = `${bucket.replace(/\/+$/, '')}/${prefix.replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');

const args = [
  's3', 'sync', SRC, dest,
  '--exclude', '*',
  '--include', SRC.includes('decks') ? '*.pdf' : '*.jpg',
  '--content-type', SRC.includes('decks') ? 'application/pdf' : 'image/jpeg',
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
