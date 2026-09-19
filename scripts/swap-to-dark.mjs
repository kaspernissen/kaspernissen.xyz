// One-off color-swap script. Walks src/ and rewrites common Tailwind class
// patterns from the light Memphis-pop theme to a dark variant.
// Idempotent on re-run for the patterns it knows about.

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = 'src';

// Order matters — longer patterns first so we don't double-rewrite.
const SWAPS = [
  // Card backgrounds and borders
  ['border-stone-950', 'border-stone-100'],
  ['border-stone-200', 'border-stone-800'],
  ['border-stone-300', 'border-stone-700'],

  // Card shadows (from black offset to white offset)
  ['shadow-[3px_3px_0_0_#1c1917]', 'shadow-[3px_3px_0_0_#fafaf9]'],
  ['shadow-[5px_5px_0_0_#1c1917]', 'shadow-[5px_5px_0_0_#fafaf9]'],

  // Backgrounds
  ['bg-white', 'bg-stone-900'],
  ['bg-stone-50', 'bg-stone-800'],
  ['hover:bg-stone-50', 'hover:bg-stone-800'],

  // Text
  ['text-stone-950', 'text-stone-50'],
  ['text-stone-900', 'text-stone-50'],
  ['text-stone-800', 'text-stone-100'],
  ['text-stone-700', 'text-stone-300'],
  ['text-stone-600', 'text-stone-400'],
  ['hover:text-stone-950', 'hover:text-stone-50'],
  ['hover:text-stone-800', 'hover:text-stone-100'],

  // Decoration backgrounds (subtle dim where we had subtle bright)
  ['bg-orange-100', 'bg-orange-950'],
  ['bg-amber-200 text-stone-900', 'bg-amber-700 text-stone-50'],
  ['bg-amber-200 text-stone-950', 'bg-amber-600 text-stone-50'],
  ['bg-amber-300 text-stone-950', 'bg-amber-500 text-stone-950'],
  ['bg-emerald-200 text-stone-950', 'bg-emerald-700 text-stone-50'],
  ['bg-sky-200 text-stone-950', 'bg-sky-700 text-stone-50'],
  ['bg-stone-200 text-stone-700', 'bg-stone-700 text-stone-200'],
  ['bg-orange-200 text-stone-950', 'bg-orange-700 text-stone-50'],

  // Linkedin pill: was black-on-bg, now white-on-bg
  ['bg-stone-950 text-white border-2 border-stone-100', 'bg-stone-50 text-stone-950 border-2 border-stone-50'],
  ['bg-stone-950 text-white', 'bg-stone-50 text-stone-950'],
];

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      out.push(...(await walk(path.join(dir, e.name))));
    } else if (e.name.endsWith('.astro') || e.name.endsWith('.css')) {
      out.push(path.join(dir, e.name));
    }
  }
  return out;
}

const files = await walk(ROOT);
let touched = 0;
for (const f of files) {
  let txt = await fs.readFile(f, 'utf8');
  let modified = false;
  for (const [a, b] of SWAPS) {
    if (txt.includes(a)) {
      txt = txt.split(a).join(b);
      modified = true;
    }
  }
  if (modified) {
    await fs.writeFile(f, txt);
    touched++;
    console.log(`  · ${f}`);
  }
}
console.log(`\n[swap-to-dark] rewrote ${touched} files`);
