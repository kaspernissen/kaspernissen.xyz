// Renders page 1 of every deck in public/decks/ to public/decks/covers/<name>.jpg,
// skipping decks that already have one. The talk page shows it, and so does the
// card on /talks when the talk has no recording.
//
//   npm run decks:covers            then look at the output, then npm run decks:sync
//
// Page 1 is assumed to be the title slide. That held for every deck so far, but
// check the render before setting deck_cover: a deck that opens on a sponsor
// slide would put the sponsor on the talk page.
//
// Uses pdftoppm from poppler (brew install poppler). 1600px wide matches the
// largest size the talk page asks Astro for.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'public/decks';
const OUT = path.join(SRC, 'covers');
fs.mkdirSync(OUT, { recursive: true });

const pdfs = fs.readdirSync(SRC).filter((f) => f.endsWith('.pdf'));
let made = 0;
for (const pdf of pdfs) {
  const base = pdf.replace(/\.pdf$/, '');
  if (fs.existsSync(path.join(OUT, `${base}.jpg`))) continue;
  const r = spawnSync('pdftoppm', [
    '-f', '1', '-l', '1', '-singlefile',
    '-jpeg', '-jpegopt', 'quality=85',
    '-scale-to-x', '1600', '-scale-to-y', '-1',
    path.join(SRC, pdf), path.join(OUT, base),
  ], { stdio: ['ignore', 'ignore', 'inherit'] });
  if (r.error?.code === 'ENOENT') {
    console.error('decks:covers: pdftoppm is not installed — brew install poppler');
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error(`decks:covers: failed on ${pdf}`);
    process.exit(r.status ?? 1);
  }
  console.log(`  ${base}.jpg`);
  made++;
}
console.log(`decks:covers: ${made} rendered, ${pdfs.length - made} already had one`);
