// Remove the heavy white borders from cards/pills. The chunky offset shadow
// alone provides the "lifted" feel against the dark surface.
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = 'src';

// Patterns to remove. Order matters: longer patterns first.
const REMOVALS = [
  'border-2 border-stone-100 ',
  ' border-2 border-stone-100',
  'border-2 border-stone-100',
];

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...(await walk(path.join(dir, e.name))));
    else if (e.name.endsWith('.astro') || e.name.endsWith('.css')) out.push(path.join(dir, e.name));
  }
  return out;
}

const files = await walk(ROOT);
let touched = 0;
for (const f of files) {
  let txt = await fs.readFile(f, 'utf8');
  let modified = false;
  for (const r of REMOVALS) {
    if (txt.includes(r)) {
      txt = txt.split(r).join('');
      modified = true;
    }
  }
  if (modified) {
    await fs.writeFile(f, txt);
    touched++;
    console.log(`  · ${f}`);
  }
}
console.log(`\n[remove-borders] rewrote ${touched} files`);
