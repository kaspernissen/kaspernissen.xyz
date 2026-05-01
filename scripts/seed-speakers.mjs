// One-off: generates speaker YAMLs and downloadable copies for every file
// dropped into src/assets/speakers/. Idempotent — safe to re-run; existing
// YAMLs are NOT overwritten so manual edits survive.
//
// For files > 4 MB it shells out to `sips` to produce a width-2400, q80 JPEG
// in public/speakers/ instead of copying the multi-megabyte original.

import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';

const SRC = 'src/assets/speakers';
const OUT_YAML = 'src/content/speakers';
const OUT_PUBLIC = 'public/speakers';
const SIPS_THRESHOLD_BYTES = 4 * 1024 * 1024;

function slugify(s) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

await fs.mkdir(OUT_YAML, { recursive: true });
await fs.mkdir(OUT_PUBLIC, { recursive: true });

const files = (await fs.readdir(SRC)).filter((f) =>
  /\.(jpg|jpeg|png|heic|webp)$/i.test(f),
);

let n = 0;
for (const f of files) {
  const ext = path.extname(f).slice(1).toLowerCase();
  const stem = path.basename(f, path.extname(f));
  const slug = slugify(stem);
  const yamlPath = path.join(OUT_YAML, `${slug}.yaml`);
  const publicExt = ext === 'png' || ext === 'jpeg' ? ext : 'jpg';
  const downloadPath = `/speakers/${slug}-fullres.${publicExt}`;
  const publicFile = path.join(OUT_PUBLIC, `${slug}-fullres.${publicExt}`);

  // 1. Public copy (resize if huge)
  try {
    const stat = await fs.stat(path.join(SRC, f));
    if (stat.size > SIPS_THRESHOLD_BYTES && (ext === 'jpg' || ext === 'jpeg' || ext === 'png')) {
      execSync(
        `sips -s format jpeg --resampleWidth 2400 -s formatOptions 80 ` +
          `${JSON.stringify(path.join(SRC, f))} --out ${JSON.stringify(publicFile.replace(/\.png$/, '.jpg'))}`,
        { stdio: 'pipe' },
      );
    } else {
      await fs.copyFile(path.join(SRC, f), publicFile);
    }
  } catch (e) {
    console.warn(`[seed-speakers] copy/resize failed for ${f}: ${e.message}`);
    continue;
  }

  // 2. YAML — only create if missing (manual edits win on re-run).
  try {
    await fs.access(yamlPath);
    console.log(`  · ${slug} (yaml exists, skipped)`);
    continue;
  } catch {}

  const yaml =
    `slug: ${slug}\n` +
    `caption: ${JSON.stringify('TBD — replace with caption (event + topic)')}\n` +
    `event: ${JSON.stringify('TBD')}\n` +
    `date: ${new Date().toISOString().slice(0, 10)}\n` +
    `photographer: ${JSON.stringify('Unknown')}\n` +
    `license: ${JSON.stringify('All rights reserved')}\n` +
    `src: ${JSON.stringify('./' + f)}\n` +
    `download: ${JSON.stringify(downloadPath)}\n`;
  await fs.writeFile(yamlPath, yaml);
  console.log(`  ✓ ${slug}`);
  n++;
}
console.log(`\n[seed-speakers] generated ${n} new YAML files (existing entries preserved).`);
