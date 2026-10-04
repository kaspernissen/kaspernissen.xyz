// Measures every image the blog posts use and writes their sizes to
// data/blog-image-sizes.json, which the rehype plugin in astro.config.mjs reads
// to give each <img> a width and height. Without them the browser cannot
// reserve the space, and the text jumps as each image arrives.
//
// The images live in the bucket, not the repo, so the sizes are measured from
// there and the result is committed: the build stays offline. Re-run after
// adding images to a post:
//
//   npm run blog:image-sizes
//
// sharp comes with Astro; it only reads the header here.

import fs from 'node:fs/promises';
import sharp from 'sharp';

const BASE = (process.env.PUBLIC_BLOG_IMAGE_BASE_URL ??
  'https://kasper-nissen-presentations.s3.eu-west-1.amazonaws.com/blog').replace(/\/+$/, '');
const OUT = 'data/blog-image-sizes.json';
const DIR = 'src/content/blog';

const files = new Set();
for (const f of await fs.readdir(DIR)) {
  if (!f.endsWith('.md')) continue;
  const body = await fs.readFile(`${DIR}/${f}`, 'utf8');
  for (const m of body.matchAll(/\/blog-images\/([^)"\s]+)/g)) files.add(m[1]);
  // The hero, a bare file name in the frontmatter.
  const hero = body.match(/^hero:\s*"?([^"\n]+?)"?\s*$/m);
  if (hero) files.add(hero[1].replace(/^.*\//, ''));
}

const sizes = {};
let failed = 0;
for (const file of [...files].sort()) {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) {
    console.warn(`  ${file}: HTTP ${res.status}, skipped`);
    failed++;
    continue;
  }
  const { width, height, orientation } = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
  // EXIF orientations 5-8 are rotated a quarter turn: the browser shows the
  // image with width and height swapped.
  sizes[file] = orientation >= 5 ? [height, width] : [width, height];
}

// One image per line, so adding a post is a one-line diff.
const lines = Object.entries(sizes).map(([f, wh]) => `  ${JSON.stringify(f)}: ${JSON.stringify(wh)}`);
await fs.writeFile(OUT, `{\n${lines.join(',\n')}\n}\n`);
console.log(`[blog-image-sizes] ${Object.keys(sizes).length} images → ${OUT}${failed ? `, ${failed} failed` : ''}`);
