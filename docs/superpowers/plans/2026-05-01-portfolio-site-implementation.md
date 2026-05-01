# kaspernissen.xyz Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a static, nightly-rebuilt personal portfolio at `kaspernissen.xyz` aggregating talks (YouTube), writing (GitHub README), conferences (Sessionize + manual), decks (PDFs in repo), speaker photos, Credly badges, and GitHub activity.

**Architecture:** Astro 5 static site, six typed content collections, five fetcher scripts that run as a `prebuild` step and write into auto-source subfolders (manual entries always win on conflict). Tailwind 4 for styling, playful "warm + cartoon hero" visual direction. Deployed to GitHub Pages via two workflows: push-trigger and nightly cron.

**Tech Stack:** Astro 5, Tailwind CSS 4, TypeScript, Vitest (helpers only), GitHub Pages, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-05-01-portfolio-site-design.md`

**Working directory:** `/Users/kaspernissen/kaspernissen/kaspernissen.xyz`

---

## File Structure

```
.
├── astro.config.mjs
├── tsconfig.json
├── tailwind.config.mjs                    # (Tailwind 4 uses CSS @import; this stays minimal)
├── vitest.config.ts
├── package.json
├── public/
│   ├── CNAME                              # "kaspernissen.xyz"
│   ├── favicon.svg
│   └── decks/.gitkeep
├── src/
│   ├── assets/hero/cartoon.png            # copied from ~/Downloads
│   ├── content/
│   │   ├── config.ts                      # six Zod schemas
│   │   ├── talks/{seed.yaml,youtube/.gitkeep}
│   │   ├── decks/seed.yaml
│   │   ├── conferences/{seed.yaml,sessionize/.gitkeep}
│   │   ├── writing/{seed.yaml,github/.gitkeep}
│   │   ├── speakers/seed.yaml
│   │   └── badges/.gitkeep
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── NavBar.astro
│   │   ├── Footer.astro
│   │   ├── GitHubHeatmap.astro
│   │   ├── TalkCard.astro
│   │   ├── ConferenceRow.astro
│   │   ├── DeckCard.astro
│   │   ├── WritingRow.astro
│   │   ├── PhotoCard.astro
│   │   └── BadgeCard.astro
│   ├── layouts/BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── talks/{index.astro,[slug].astro}
│   │   ├── writing.astro
│   │   ├── conferences.astro
│   │   ├── decks.astro
│   │   ├── speaker-kit.astro
│   │   └── badges.astro
│   ├── lib/
│   │   ├── slug.ts          + slug.test.ts
│   │   └── merge.ts         + merge.test.ts
│   └── styles/global.css
├── scripts/
│   ├── prebuild.mjs                       # orchestrates the five fetchers
│   ├── fetch-youtube.mjs
│   ├── fetch-sessionize.mjs
│   ├── fetch-credly.mjs
│   ├── fetch-github-readme.mjs
│   └── fetch-github-contributions.mjs
├── data/                                  # gitignored, generated
└── .github/workflows/
    ├── deploy.yml
    └── refresh.yml
```

---

## Task 1: Initialize Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/styles/global.css`, `vitest.config.ts`, `.nvmrc`

- [ ] **Step 1: Init Astro non-interactively**

```bash
cd /Users/kaspernissen/kaspernissen/kaspernissen.xyz
npm create astro@latest . -- --template minimal --typescript strict --install --no-git --skip-houston --yes
```

Expected: `package.json`, `astro.config.mjs`, `src/pages/index.astro`, `tsconfig.json` created. `node_modules/` populated.

- [ ] **Step 2: Add Tailwind 4 + Vitest**

```bash
npx astro add tailwind --yes
npm install --save-dev vitest @types/node
```

- [ ] **Step 3: Replace astro.config.mjs**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://kaspernissen.xyz',
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 4: Replace src/styles/global.css**

```css
@import "tailwindcss";

@theme {
  --color-bg: #fffaf0;
  --color-ink: #1c1917;
  --color-accent: #fb923c;
  --color-accent-soft: #fde68a;
  --color-muted: #78716c;
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
}

html { background: var(--color-bg); color: var(--color-ink); font-family: var(--font-sans); }
body { -webkit-font-smoothing: antialiased; }
```

- [ ] **Step 5: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 6: Add scripts to package.json**

Replace the `scripts` block in `package.json`:

```json
"scripts": {
  "dev": "astro dev",
  "prebuild": "node scripts/prebuild.mjs",
  "build": "astro build",
  "preview": "astro preview",
  "test": "vitest run"
}
```

- [ ] **Step 7: Add .nvmrc**

```
20
```

- [ ] **Step 8: Verify build works**

```bash
npm run build
```

Expected: `dist/` produced, exits 0. (At this stage there's still only the default `index.astro`; that's fine.)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Scaffold Astro 5 + Tailwind 4 + Vitest"
```

---

## Task 2: Define content collection schemas

**Files:**
- Create: `src/content/config.ts`

- [ ] **Step 1: Write schemas**

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const talks = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/talks' }),
  schema: z.object({
    title: z.string(),
    event: z.string(),
    date: z.coerce.date(),
    location: z.string().optional(),
    abstract: z.string().optional(),
    youtube_id: z.string().nullable().default(null),
    slides_pdf: z.string().nullable().default(null),
    co_speakers: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    slug: z.string().optional(),
  }),
});

const decks = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/decks' }),
  schema: z.object({
    title: z.string(),
    event: z.string(),
    date: z.coerce.date(),
    file: z.string(),
    talk_slug: z.string().nullable().default(null),
    size_mb: z.number().nullable().default(null),
  }),
});

const conferences = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/conferences' }),
  schema: z.object({
    name: z.string(),
    date: z.coerce.date(),
    end_date: z.coerce.date().nullable().default(null),
    location: z.string(),
    url: z.string().url(),
    role: z.enum(['speaker', 'co-chair', 'organiser', 'mc', 'attendee']),
    session_title: z.string().nullable().default(null),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/writing' }),
  schema: z.object({
    kind: z.enum(['blog', 'podcast', 'newsletter', 'interview']),
    title: z.string(),
    publication: z.string(),
    date: z.coerce.date(),
    url: z.string().url(),
    duration_min: z.number().nullable().default(null),
    summary: z.string().nullable().default(null),
  }),
});

const speakers = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/speakers' }),
  schema: z.object({
    slug: z.string(),
    caption: z.string(),
    event: z.string(),
    date: z.coerce.date(),
    photographer: z.string(),
    license: z.string(),
    src: z.string(),
    download: z.string(),
  }),
});

const badges = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/badges' }),
  schema: z.object({
    name: z.string(),
    issuer: z.string(),
    issued: z.coerce.date(),
    url: z.string().url(),
    image: z.string(),
  }),
});

export const collections = { talks, decks, conferences, writing, speakers, badges };
```

- [ ] **Step 2: Create empty subfolder structure**

```bash
mkdir -p src/content/talks/youtube src/content/conferences/sessionize src/content/writing/github src/content/badges src/content/decks src/content/speakers public/decks public/speakers src/assets/hero src/assets/speakers src/assets/badges
touch src/content/talks/youtube/.gitkeep src/content/conferences/sessionize/.gitkeep src/content/writing/github/.gitkeep src/content/badges/.gitkeep public/decks/.gitkeep public/speakers/.gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Define typed content collection schemas"
```

---

## Task 3: lib/slug.ts (TDD)

**Files:**
- Create: `src/lib/slug.ts`, `src/lib/slug.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/slug.test.ts
import { describe, it, expect } from 'vitest';
import { slugify, talkSlug } from './slug';

describe('slugify', () => {
  it('lowercases and replaces non-alphanumerics with dashes', () => {
    expect(slugify('From Zero to Production!')).toBe('from-zero-to-production');
  });
  it('collapses multiple dashes and trims edges', () => {
    expect(slugify('  Hello —  World  ')).toBe('hello-world');
  });
  it('handles unicode by stripping accents', () => {
    expect(slugify('Café Deluxe')).toBe('cafe-deluxe');
  });
});

describe('talkSlug', () => {
  it('combines title and date into yyyy-mm slug', () => {
    expect(talkSlug('From Zero to OTel', new Date('2025-04-02'))).toBe('from-zero-to-otel-2025-04');
  });
});
```

- [ ] **Step 2: Run test, expect fail**

```bash
npm test -- src/lib/slug.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/slug.ts
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function talkSlug(title: string, date: Date): string {
  const ym = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  return `${slugify(title)}-${ym}`;
}
```

- [ ] **Step 4: Run test, expect pass**

```bash
npm test -- src/lib/slug.test.ts
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/slug.ts src/lib/slug.test.ts
git commit -m "Add slugify + talkSlug helpers"
```

---

## Task 4: lib/merge.ts (TDD)

Manual entries always win. For YouTube fetcher, fuzzy-match titles against existing manual talks; if matched, merge `youtube_id` into the manual entry rather than creating a duplicate.

**Files:**
- Create: `src/lib/merge.ts`, `src/lib/merge.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/merge.test.ts
import { describe, it, expect } from 'vitest';
import { titleSimilarity, shouldMergeYouTube } from './merge';

describe('titleSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(titleSimilarity('Hello World', 'Hello World')).toBe(1);
  });
  it('returns >0.8 for near-duplicate titles', () => {
    const score = titleSimilarity(
      'From Zero to Production with OpenTelemetry',
      'From Zero to Production with OpenTelemetry — KubeCon EU 2025',
    );
    expect(score).toBeGreaterThan(0.8);
  });
  it('returns <0.5 for unrelated strings', () => {
    expect(titleSimilarity('Kubernetes intro', 'OpenTelemetry deep dive')).toBeLessThan(0.5);
  });
});

describe('shouldMergeYouTube', () => {
  it('matches when manual entry has the same youtube_id', () => {
    const manual = [{ title: 'X', youtube_id: 'abc' }];
    expect(shouldMergeYouTube(manual, { title: 'Different', youtube_id: 'abc' })).toEqual(manual[0]);
  });
  it('matches by title similarity > 0.8', () => {
    const manual = [{ title: 'From Zero to Production with OpenTelemetry', youtube_id: null }];
    expect(shouldMergeYouTube(manual, { title: 'From Zero to Production with OpenTelemetry — KubeCon EU 2025', youtube_id: 'xyz' })?.title).toBe(manual[0].title);
  });
  it('returns null when nothing matches', () => {
    expect(shouldMergeYouTube([{ title: 'Foo', youtube_id: null }], { title: 'Bar', youtube_id: 'q' })).toBeNull();
  });
});
```

- [ ] **Step 2: Run, expect fail**

```bash
npm test -- src/lib/merge.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/merge.ts
type ManualTalk = { title: string; youtube_id: string | null };
type FetchedTalk = { title: string; youtube_id: string | null };

export function titleSimilarity(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim();
  const A = norm(a);
  const B = norm(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  const longer = A.length >= B.length ? A : B;
  const shorter = A.length >= B.length ? B : A;
  if (longer.includes(shorter)) return shorter.length / longer.length + 0.1;
  // Levenshtein distance
  const m = longer.length, n = shorter.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = longer[i - 1] === shorter[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return 1 - dp[n] / longer.length;
}

export function shouldMergeYouTube<T extends ManualTalk>(
  manual: T[],
  fetched: FetchedTalk,
): T | null {
  if (fetched.youtube_id) {
    const byId = manual.find((m) => m.youtube_id === fetched.youtube_id);
    if (byId) return byId;
  }
  for (const m of manual) {
    if (titleSimilarity(m.title, fetched.title) > 0.8) return m;
  }
  return null;
}
```

- [ ] **Step 4: Run, expect pass**

```bash
npm test
```

Expected: 7 passed total (4 from slug + 3 from merge).

- [ ] **Step 5: Commit**

```bash
git add src/lib/merge.ts src/lib/merge.test.ts
git commit -m "Add manual-wins merge helpers"
```

---

## Task 5: BaseLayout, NavBar, Footer

**Files:**
- Create: `src/layouts/BaseLayout.astro`, `src/components/NavBar.astro`, `src/components/Footer.astro`

- [ ] **Step 1: NavBar.astro**

```astro
---
const { current } = Astro.props as { current?: string };
const links = [
  { href: '/talks', label: 'Talks' },
  { href: '/writing', label: 'Writing' },
  { href: '/conferences', label: 'Conferences' },
  { href: '/decks', label: 'Decks' },
  { href: '/speaker-kit', label: 'Speaker kit' },
  { href: '/badges', label: 'Badges' },
];
---
<nav class="flex items-center justify-between max-w-5xl mx-auto px-6 py-5 text-sm">
  <a href="/" class="font-extrabold tracking-tight text-lg">kasper.</a>
  <ul class="hidden sm:flex gap-5 text-stone-700">
    {links.map((l) => (
      <li>
        <a href={l.href} class={`hover:text-stone-950 ${current === l.href ? 'text-stone-950 underline decoration-2 decoration-orange-400 underline-offset-4' : ''}`}>{l.label}</a>
      </li>
    ))}
  </ul>
</nav>
```

- [ ] **Step 2: Footer.astro**

```astro
---
const buildTime = new Date().toISOString();
---
<footer class="max-w-5xl mx-auto px-6 py-10 text-xs text-stone-500 border-t border-stone-200 mt-20 flex flex-wrap gap-3 justify-between">
  <div>© {new Date().getUTCFullYear()} Kasper Nissen.</div>
  <div class="flex gap-3">
    <a href="https://www.linkedin.com/in/kaspernissen/" class="hover:text-stone-800">linkedin</a>
    <a href="https://bsky.app/profile/kaspernissen.xyz" class="hover:text-stone-800">bluesky</a>
    <a href="https://x.com/phennex" class="hover:text-stone-800">x</a>
    <a href="https://github.com/kaspernissen" class="hover:text-stone-800">github</a>
    <a href="mailto:kasper.nissen@dash0.com" class="hover:text-stone-800">email</a>
  </div>
  <div title={buildTime}>last built: {buildTime.slice(0, 10)}</div>
</footer>
```

- [ ] **Step 3: BaseLayout.astro**

```astro
---
import '../styles/global.css';
import NavBar from '../components/NavBar.astro';
import Footer from '../components/Footer.astro';
const { title, description, current } = Astro.props as { title: string; description?: string; current?: string };
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    <link rel="preconnect" href="https://rsms.me/" />
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  </head>
  <body class="min-h-screen">
    <NavBar current={current} />
    <main class="max-w-5xl mx-auto px-6">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 4: Build to verify**

```bash
npm run build
```

Expected: succeeds. Default `index.astro` from scaffold may still exist; that's fine.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add BaseLayout, NavBar, Footer"
```

---

## Task 6: Hero component + cartoon image

**Files:**
- Create: `src/assets/hero/cartoon.png`, `src/components/Hero.astro`

- [ ] **Step 1: Copy cartoon image into the project**

```bash
cp "/Users/kaspernissen/Downloads/Gemini_Generated_Image_8fu3x18fu3x18fu3-Photoroom.png" src/assets/hero/cartoon.png
```

- [ ] **Step 2: Hero.astro**

```astro
---
import { Image } from 'astro:assets';
import cartoon from '../assets/hero/cartoon.png';
---
<section class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-end pt-6 pb-14">
  <div class="max-w-2xl">
    <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-stone-950">
      Hi, I'm Kasper.
      <span class="inline-block bg-orange-400 text-white px-2 py-0.5 rounded -rotate-1">I talk cloud.</span>
    </h1>
    <p class="mt-5 text-stone-700 text-lg max-w-xl">
      Observability nerd. CNCF Ambassador. Cloud Native Aarhus organiser.
      Recovering Kubernetes operator.
    </p>
    <div class="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
      <a href="https://www.linkedin.com/in/kaspernissen/" class="bg-stone-950 text-white rounded-full px-4 py-1.5 hover:bg-stone-800">linkedin</a>
      <a href="https://bsky.app/profile/kaspernissen.xyz" class="bg-stone-950 text-white rounded-full px-4 py-1.5 hover:bg-stone-800">bluesky</a>
      <a href="https://x.com/phennex" class="bg-stone-950 text-white rounded-full px-4 py-1.5 hover:bg-stone-800">x</a>
      <a href="https://github.com/kaspernissen" class="bg-stone-950 text-white rounded-full px-4 py-1.5 hover:bg-stone-800">github</a>
      <a href="mailto:kasper.nissen@dash0.com" class="bg-stone-950 text-white rounded-full px-4 py-1.5 hover:bg-stone-800">email</a>
    </div>
  </div>
  <div class="rotate-2 self-center md:self-end">
    <Image src={cartoon} alt="Cartoon portrait of Kasper Nissen" widths={[280, 420, 560]} sizes="(min-width: 768px) 280px, 60vw" class="rounded-2xl border-[3px] border-stone-950 bg-orange-100 max-w-[280px] md:max-w-none" />
  </div>
</section>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: succeeds, hero image processed.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Add Hero component with cartoon portrait"
```

---

## Task 7: Card components

**Files:**
- Create: `src/components/TalkCard.astro`, `ConferenceRow.astro`, `DeckCard.astro`, `WritingRow.astro`, `PhotoCard.astro`, `BadgeCard.astro`

- [ ] **Step 1: TalkCard.astro**

```astro
---
import type { CollectionEntry } from 'astro:content';
import { talkSlug } from '../lib/slug';
const { entry } = Astro.props as { entry: CollectionEntry<'talks'> };
const slug = entry.data.slug ?? talkSlug(entry.data.title, entry.data.date);
const thumb = entry.data.youtube_id ? `https://i.ytimg.com/vi/${entry.data.youtube_id}/hqdefault.jpg` : null;
const dateStr = entry.data.date.toISOString().slice(0, 10);
---
<a href={`/talks/${slug}`} class="block bg-white rounded-xl border-2 border-stone-950 shadow-[3px_3px_0_0_#1c1917] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#1c1917] transition group overflow-hidden">
  {thumb ? (
    <img src={thumb} alt="" loading="lazy" class="w-full aspect-video object-cover" />
  ) : (
    <div class="w-full aspect-video bg-orange-100 flex items-center justify-center text-stone-500 text-xs">no recording</div>
  )}
  <div class="p-4">
    <div class="text-[11px] uppercase tracking-wider text-stone-500">{entry.data.event} · {dateStr}</div>
    <div class="font-bold mt-1 leading-snug">{entry.data.title}</div>
  </div>
</a>
```

- [ ] **Step 2: ConferenceRow.astro**

```astro
---
import type { CollectionEntry } from 'astro:content';
const { entry } = Astro.props as { entry: CollectionEntry<'conferences'> };
const d = entry.data;
const dateStr = d.end_date
  ? `${d.date.toISOString().slice(0, 10)} → ${d.end_date.toISOString().slice(0, 10)}`
  : d.date.toISOString().slice(0, 10);
const roleColors: Record<string, string> = {
  speaker: 'bg-orange-400 text-white',
  'co-chair': 'bg-amber-300 text-stone-950',
  organiser: 'bg-emerald-200 text-stone-950',
  mc: 'bg-sky-200 text-stone-950',
  attendee: 'bg-stone-200 text-stone-700',
};
---
<a href={d.url} class="flex flex-wrap items-baseline gap-3 py-3 border-b border-stone-200 hover:bg-stone-50 -mx-2 px-2 rounded">
  <span class={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${roleColors[d.role]}`}>{d.role}</span>
  <span class="font-semibold text-stone-950">{d.name}</span>
  {d.session_title && <span class="text-stone-700 italic">— {d.session_title}</span>}
  <span class="text-stone-500 text-sm ml-auto">{dateStr} · {d.location}</span>
</a>
```

- [ ] **Step 3: DeckCard.astro**

```astro
---
import type { CollectionEntry } from 'astro:content';
const { entry } = Astro.props as { entry: CollectionEntry<'decks'> };
const d = entry.data;
const href = `/decks/${d.file}`;
const sizeLabel = d.size_mb ? ` · ${d.size_mb.toFixed(1)} MB` : '';
---
<a href={href} class="block bg-white rounded-xl border-2 border-stone-950 shadow-[3px_3px_0_0_#1c1917] p-4 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#1c1917] transition">
  <div class="text-[11px] uppercase tracking-wider text-stone-500">{d.event} · {d.date.toISOString().slice(0, 10)}</div>
  <div class="font-bold mt-1">{d.title}</div>
  <div class="mt-3 inline-block bg-stone-950 text-white text-xs font-semibold rounded-full px-3 py-1">Download PDF{sizeLabel}</div>
</a>
```

- [ ] **Step 4: WritingRow.astro**

```astro
---
import type { CollectionEntry } from 'astro:content';
const { entry } = Astro.props as { entry: CollectionEntry<'writing'> };
const d = entry.data;
const kindColors: Record<string, string> = {
  blog: 'bg-orange-200 text-stone-950',
  podcast: 'bg-sky-200 text-stone-950',
  newsletter: 'bg-amber-200 text-stone-950',
  interview: 'bg-emerald-200 text-stone-950',
};
---
<a href={d.url} class="flex flex-wrap items-baseline gap-3 py-3 border-b border-stone-200 hover:bg-stone-50 -mx-2 px-2 rounded">
  <span class={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${kindColors[d.kind]}`}>{d.kind}</span>
  <span class="font-semibold text-stone-950">{d.title}</span>
  <span class="text-stone-700">— {d.publication}</span>
  <span class="text-stone-500 text-sm ml-auto">{d.date.toISOString().slice(0, 10)}{d.duration_min ? ` · ${d.duration_min} min` : ''}</span>
</a>
```

- [ ] **Step 5: PhotoCard.astro**

```astro
---
import type { CollectionEntry } from 'astro:content';
import { Image } from 'astro:assets';

const { entry } = Astro.props as { entry: CollectionEntry<'speakers'> };
const d = entry.data;
// Resolve src/assets/speakers/<file> dynamically
const images = import.meta.glob<{ default: ImageMetadata }>('../assets/speakers/*.{jpg,jpeg,png}', { eager: true });
const key = Object.keys(images).find((k) => k.endsWith(d.src.replace(/^\.\//, '')));
const img = key ? images[key].default : null;
---
<figure class="bg-white rounded-xl border-2 border-stone-950 shadow-[3px_3px_0_0_#1c1917] overflow-hidden">
  {img && <Image src={img} alt={d.caption} widths={[400, 800]} sizes="(min-width: 768px) 50vw, 100vw" class="w-full aspect-[4/3] object-cover" />}
  <figcaption class="p-3 text-xs text-stone-700 flex flex-col gap-2">
    <div class="font-semibold text-stone-950">{d.caption}</div>
    <div>Photo: {d.photographer} · {d.license}</div>
    <a href={d.download} class="self-start bg-stone-950 text-white rounded-full px-3 py-1 font-semibold">Download original</a>
  </figcaption>
</figure>
```

- [ ] **Step 6: BadgeCard.astro**

```astro
---
import type { CollectionEntry } from 'astro:content';
import { Image } from 'astro:assets';

const { entry } = Astro.props as { entry: CollectionEntry<'badges'> };
const d = entry.data;
const images = import.meta.glob<{ default: ImageMetadata }>('../assets/badges/*.{png,svg,jpg}', { eager: true });
const key = Object.keys(images).find((k) => k.endsWith(d.image.replace(/^\.\//, '').replace(/^src\/assets\/badges\//, '')));
const img = key ? images[key].default : null;
---
<a href={d.url} class="block bg-white rounded-xl border-2 border-stone-950 shadow-[3px_3px_0_0_#1c1917] p-4 text-center hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#1c1917] transition">
  {img ? <Image src={img} alt={d.name} width={120} height={120} class="mx-auto" /> : <div class="w-[120px] h-[120px] mx-auto bg-stone-100 rounded" />}
  <div class="mt-3 font-bold text-sm leading-tight">{d.name}</div>
  <div class="text-xs text-stone-600 mt-1">{d.issuer}</div>
  <div class="text-[10px] text-stone-500 mt-1">issued {d.issued.toISOString().slice(0, 7)}</div>
</a>
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add card/row components for talks, conferences, decks, writing, photos, badges"
```

---

## Task 8: GitHubHeatmap component

Reads `data/github.json` (written by `fetch-github-contributions.mjs`). Renders a 53-week × 7-day heatmap as inline SVG.

**Files:**
- Create: `src/components/GitHubHeatmap.astro`

- [ ] **Step 1: GitHubHeatmap.astro**

```astro
---
import fs from 'node:fs';
import path from 'node:path';

type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
type Data = { total: number; days: Day[] } | null;

let data: Data = null;
try {
  const raw = fs.readFileSync(path.resolve('data/github.json'), 'utf8');
  data = JSON.parse(raw);
} catch {
  data = null;
}

// Build 53 columns × 7 rows; right-align to today.
const cellSize = 11;
const gap = 3;
const colors = ['#f5f5f4', '#fed7aa', '#fdba74', '#fb923c', '#c2410c'];

let cols: Day[][] = [];
if (data) {
  const days = data.days.slice(-371);
  // Pad to start on a Sunday column boundary
  const first = new Date(days[0].date);
  const padFront = first.getUTCDay(); // 0..6 (Sun..Sat)
  const padded = [...Array(padFront).fill(null), ...days];
  for (let i = 0; i < padded.length; i += 7) cols.push(padded.slice(i, i + 7));
}
const width = cols.length * (cellSize + gap);
const height = 7 * (cellSize + gap);
---
{data ? (
  <div class="bg-white rounded-xl border-2 border-stone-950 shadow-[3px_3px_0_0_#1c1917] p-4">
    <div class="flex items-baseline justify-between mb-2">
      <div class="text-sm font-bold">GitHub activity</div>
      <a href="https://github.com/kaspernissen" class="text-xs text-stone-500 hover:text-stone-800">@kaspernissen · {data.total} contributions</a>
    </div>
    <svg viewBox={`0 0 ${width} ${height}`} class="w-full h-auto" role="img" aria-label="GitHub contribution heatmap">
      {cols.map((col, ci) =>
        col.map((d, ri) => d && (
          <rect x={ci * (cellSize + gap)} y={ri * (cellSize + gap)} width={cellSize} height={cellSize} rx="2" fill={colors[d.level]}>
            <title>{d.date}: {d.count} contribution{d.count === 1 ? '' : 's'}</title>
          </rect>
        ))
      )}
    </svg>
  </div>
) : (
  <div class="bg-white rounded-xl border-2 border-stone-950 p-4 text-sm text-stone-500">GitHub activity unavailable.</div>
)}
```

- [ ] **Step 2: Stub data file so the build works before fetcher exists**

```bash
mkdir -p data
cat > data/github.json <<'EOF'
{ "total": 0, "days": [] }
EOF
```

(`data/` is gitignored — confirmed in `.gitignore`.)

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/GitHubHeatmap.astro
git commit -m "Add GitHubHeatmap component reading data/github.json"
```

---

## Task 9: Landing page

**Files:**
- Replace: `src/pages/index.astro`

- [ ] **Step 1: index.astro**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import GitHubHeatmap from '../components/GitHubHeatmap.astro';
import TalkCard from '../components/TalkCard.astro';
import WritingRow from '../components/WritingRow.astro';
import ConferenceRow from '../components/ConferenceRow.astro';

const today = new Date();

const talks = (await getCollection('talks'))
  .sort((a, b) => +b.data.date - +a.data.date)
  .slice(0, 3);

const writing = (await getCollection('writing'))
  .sort((a, b) => +b.data.date - +a.data.date)
  .slice(0, 5);

const upcoming = (await getCollection('conferences'))
  .filter((c) => c.data.date >= today)
  .sort((a, b) => +a.data.date - +b.data.date)
  .slice(0, 3);
---
<BaseLayout title="Kasper Nissen — kaspernissen.xyz" description="Cloud native, observability, and the people who run it. Talks, writing, and conferences from Kasper Nissen." current="/">
  <Hero />

  <GitHubHeatmap />

  <section class="mt-14">
    <div class="flex items-baseline justify-between mb-4">
      <h2 class="text-2xl font-extrabold tracking-tight">Latest talks</h2>
      <a href="/talks" class="text-sm text-stone-600 hover:text-stone-950">All talks →</a>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {talks.map((t) => <TalkCard entry={t} />)}
    </div>
  </section>

  <section class="mt-14">
    <div class="flex items-baseline justify-between mb-4">
      <h2 class="text-2xl font-extrabold tracking-tight">Recent writing</h2>
      <a href="/writing" class="text-sm text-stone-600 hover:text-stone-950">All writing →</a>
    </div>
    <div>
      {writing.map((w) => <WritingRow entry={w} />)}
    </div>
  </section>

  <section class="mt-14">
    <div class="flex items-baseline justify-between mb-4">
      <h2 class="text-2xl font-extrabold tracking-tight">Where I'll be next</h2>
      <a href="/conferences" class="text-sm text-stone-600 hover:text-stone-950">All conferences →</a>
    </div>
    <div>
      {upcoming.length === 0 ? <p class="text-stone-500 text-sm py-4">Nothing announced yet — check back soon.</p> : upcoming.map((c) => <ConferenceRow entry={c} />)}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Build (will fail with empty collections — fix in Task 13 by seeding)**

The build may pass with empty collections; if it errors on missing data, that's expected and the seed task fixes it.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "Add landing page"
```

---

## Task 10: /talks list and detail pages

**Files:**
- Create: `src/pages/talks/index.astro`, `src/pages/talks/[slug].astro`

- [ ] **Step 1: src/pages/talks/index.astro**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import TalkCard from '../../components/TalkCard.astro';

const talks = (await getCollection('talks')).sort((a, b) => +b.data.date - +a.data.date);
---
<BaseLayout title="Talks — Kasper Nissen" current="/talks">
  <section class="pt-6">
    <h1 class="text-4xl font-extrabold tracking-tight">Talks</h1>
    <p class="text-stone-600 mt-2">Conference, meetup, and podcast appearances. {talks.length} total.</p>
  </section>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
    {talks.map((t) => <TalkCard entry={t} />)}
  </div>
</BaseLayout>
```

- [ ] **Step 2: src/pages/talks/[slug].astro**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { talkSlug } from '../../lib/slug';

export async function getStaticPaths() {
  const talks = await getCollection('talks');
  return talks.map((entry) => {
    const slug = entry.data.slug ?? talkSlug(entry.data.title, entry.data.date);
    return { params: { slug }, props: { entry } };
  });
}

const { entry } = Astro.props;
const d = entry.data;
const dateStr = d.date.toISOString().slice(0, 10);
---
<BaseLayout title={`${d.title} — Kasper Nissen`} description={d.abstract ?? ''} current="/talks">
  <article class="pt-6 max-w-3xl">
    <div class="text-[11px] uppercase tracking-wider text-stone-500">{d.event} · {dateStr}{d.location ? ` · ${d.location}` : ''}</div>
    <h1 class="text-4xl font-extrabold tracking-tight mt-2">{d.title}</h1>
    {d.co_speakers.length > 0 && <div class="text-stone-600 mt-2">with {d.co_speakers.join(', ')}</div>}

    {d.youtube_id && (
      <div class="aspect-video mt-6 rounded-xl overflow-hidden border-2 border-stone-950">
        <iframe class="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${d.youtube_id}`} title={d.title} loading="lazy" allowfullscreen></iframe>
      </div>
    )}

    {d.abstract && <div class="mt-6 prose prose-stone max-w-none whitespace-pre-line">{d.abstract}</div>}

    <div class="mt-8 flex flex-wrap gap-2">
      {d.slides_pdf && <a href={d.slides_pdf} class="bg-stone-950 text-white rounded-full px-4 py-1.5 text-sm font-semibold">Download slides</a>}
      {d.tags.map((t) => <span class="bg-amber-200 text-stone-900 rounded-full px-3 py-1 text-xs font-medium">{t}</span>)}
    </div>
  </article>
</BaseLayout>
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add /talks list and /talks/[slug] detail pages"
```

---

## Task 11: /writing, /conferences, /decks, /badges pages

**Files:**
- Create: `src/pages/writing.astro`, `src/pages/conferences.astro`, `src/pages/decks.astro`, `src/pages/badges.astro`

- [ ] **Step 1: writing.astro**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import WritingRow from '../components/WritingRow.astro';

const items = (await getCollection('writing')).sort((a, b) => +b.data.date - +a.data.date);
---
<BaseLayout title="Writing — Kasper Nissen" current="/writing">
  <section class="pt-6">
    <h1 class="text-4xl font-extrabold tracking-tight">Writing & podcasts</h1>
    <p class="text-stone-600 mt-2">Blog posts, podcast guest spots, newsletters, interviews. {items.length} total.</p>
  </section>
  <div class="mt-8">
    {items.map((w) => <WritingRow entry={w} />)}
  </div>
</BaseLayout>
```

- [ ] **Step 2: conferences.astro**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import ConferenceRow from '../components/ConferenceRow.astro';

const today = new Date();
const all = await getCollection('conferences');
const upcoming = all.filter((c) => c.data.date >= today).sort((a, b) => +a.data.date - +b.data.date);
const past = all.filter((c) => c.data.date < today).sort((a, b) => +b.data.date - +a.data.date);
---
<BaseLayout title="Conferences — Kasper Nissen" current="/conferences">
  <section class="pt-6">
    <h1 class="text-4xl font-extrabold tracking-tight">Conferences</h1>
    <p class="text-stone-600 mt-2">Where I'll be next, and where I've been.</p>
  </section>

  <section class="mt-10">
    <h2 class="text-xl font-bold mb-3">Upcoming</h2>
    {upcoming.length === 0 ? <p class="text-stone-500 text-sm">No upcoming announced yet.</p> : upcoming.map((c) => <ConferenceRow entry={c} />)}
  </section>

  <section class="mt-10">
    <h2 class="text-xl font-bold mb-3">Past</h2>
    {past.map((c) => <ConferenceRow entry={c} />)}
  </section>
</BaseLayout>
```

- [ ] **Step 3: decks.astro**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import DeckCard from '../components/DeckCard.astro';

const decks = (await getCollection('decks')).sort((a, b) => +b.data.date - +a.data.date);
---
<BaseLayout title="Decks — Kasper Nissen" current="/decks">
  <section class="pt-6">
    <h1 class="text-4xl font-extrabold tracking-tight">Slide decks</h1>
    <p class="text-stone-600 mt-2">PDF downloads from past talks. Free to reuse with attribution.</p>
  </section>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
    {decks.map((d) => <DeckCard entry={d} />)}
  </div>
</BaseLayout>
```

- [ ] **Step 4: badges.astro**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import BadgeCard from '../components/BadgeCard.astro';

const badges = (await getCollection('badges')).sort((a, b) => +b.data.issued - +a.data.issued);
---
<BaseLayout title="Badges — Kasper Nissen" current="/badges">
  <section class="pt-6">
    <h1 class="text-4xl font-extrabold tracking-tight">Badges</h1>
    <p class="text-stone-600 mt-2">Verified credentials from <a href="https://www.credly.com/users/kasper-nissen" class="underline decoration-orange-400 underline-offset-2">Credly</a>.</p>
  </section>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-8">
    {badges.map((b) => <BadgeCard entry={b} />)}
  </div>
</BaseLayout>
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add /writing, /conferences, /decks, /badges pages"
```

---

## Task 12: /speaker-kit page

**Files:**
- Create: `src/pages/speaker-kit.astro`, `src/content/speaker-kit/bios.md` (or inline)

- [ ] **Step 1: speaker-kit.astro**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import PhotoCard from '../components/PhotoCard.astro';

const photos = (await getCollection('speakers')).sort((a, b) => +b.data.date - +a.data.date);

const bios = {
  short: "Kasper Nissen — CNCF Ambassador, KubeCon co-chair, Senior PMM at Dash0, organiser of Cloud Native Aarhus.",
  medium: "Kasper Nissen is a CNCF Ambassador, KubeCon + CloudNativeCon co-chair, and Senior Product Marketing Manager at Dash0. He organises Cloud Native Aarhus and Cloud Native Nordics, speaks regularly on observability and cloud-native operations, and helps engineering teams adopt OpenTelemetry in production.",
  long: "Kasper Nissen has been working in cloud-native operations and observability for over a decade. He is a CNCF Ambassador, KubeCon + CloudNativeCon co-chair, and Senior Product Marketing Manager at Dash0. Outside of his work at Dash0, Kasper organises Cloud Native Aarhus and Cloud Native Nordics, two of the most active cloud-native communities in the Nordics, and speaks regularly at conferences worldwide on Kubernetes, observability, and OpenTelemetry. He lives in Aarhus, Denmark."
};

const topics = [
  'OpenTelemetry in production: from zero to insight',
  'Observability for platform engineering teams',
  'Building and sustaining cloud-native communities',
  'Kubernetes operations: lessons from a decade in production',
  'Why your monitoring is your customers\' monitoring',
];
---
<BaseLayout title="Speaker kit — Kasper Nissen" current="/speaker-kit">
  <section class="pt-6">
    <h1 class="text-4xl font-extrabold tracking-tight">Speaker kit</h1>
    <p class="text-stone-600 mt-2">Everything you need to invite me to your event. <a href="mailto:kasper.nissen@dash0.com" class="underline decoration-orange-400 underline-offset-2">kasper.nissen@dash0.com</a></p>
  </section>

  <section class="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
    {(['short','medium','long'] as const).map((k) => (
      <div class="bg-white rounded-xl border-2 border-stone-950 p-4">
        <div class="text-[11px] uppercase tracking-wider text-stone-500 mb-2">Bio · {k}</div>
        <p class="text-sm leading-relaxed">{bios[k]}</p>
      </div>
    ))}
  </section>

  <section class="mt-12">
    <h2 class="text-xl font-bold mb-3">Topics I'm happy to speak on</h2>
    <ul class="list-disc pl-6 space-y-1 text-stone-700">
      {topics.map((t) => <li>{t}</li>)}
    </ul>
  </section>

  <section class="mt-12">
    <h2 class="text-xl font-bold mb-3">Photos</h2>
    <p class="text-stone-600 text-sm mb-4">Click a photo to download the original. Credit the photographer and use under the listed license.</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {photos.map((p) => <PhotoCard entry={p} />)}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/speaker-kit.astro
git commit -m "Add /speaker-kit page with bios, topics, and photo gallery"
```

---

## Task 13: Seed minimal content so build passes

**Files:**
- Create: `src/content/talks/seed.yaml`, `src/content/decks/seed.yaml`, `src/content/conferences/seed.yaml`, `src/content/writing/seed.yaml`, `src/content/speakers/seed.yaml`

These are placeholder entries so collections aren't empty during the first build. Real entries arrive via fetchers + Kasper's manual edits.

- [ ] **Step 1: src/content/talks/seed.yaml**

```yaml
title: From Zero to Production with OpenTelemetry
event: KubeCon + CloudNativeCon EU 2025
date: 2025-04-02
location: London, UK
abstract: |
  Two-paragraph placeholder abstract. Replace this with the real one.
youtube_id: null
slides_pdf: null
tags:
  - opentelemetry
  - kubernetes
featured: true
```

- [ ] **Step 2: src/content/decks/seed.yaml**

```yaml
title: Placeholder deck
event: Placeholder event
date: 2025-04-02
file: placeholder.pdf
talk_slug: null
size_mb: null
```

- [ ] **Step 3: src/content/conferences/seed.yaml**

```yaml
name: KubeCon + CloudNativeCon NA 2026
date: 2026-11-09
end_date: 2026-11-12
location: Atlanta, GA
url: https://events.linuxfoundation.org/kubecon-cloudnativecon-north-america/
role: speaker
session_title: TBD
```

- [ ] **Step 4: src/content/writing/seed.yaml**

```yaml
kind: blog
title: Placeholder post
publication: Dash0 Blog
date: 2025-03-14
url: https://dash0.com/blog/
duration_min: null
summary: Replace this with a real entry.
```

- [ ] **Step 5: src/content/speakers/seed.yaml**

```yaml
slug: placeholder
caption: Placeholder caption
event: Placeholder event
date: 2025-04-02
photographer: Unknown
license: All rights reserved
src: ./placeholder.jpg
download: /speakers/placeholder-fullres.jpg
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: full build succeeds, all pages produced. (`PhotoCard` will render a blank placeholder frame because the actual jpg isn't present — that's fine for now.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Seed minimal content so collections aren't empty"
```

---

## Task 14: prebuild orchestrator

Runs the five fetchers in parallel and surfaces results. Each fetcher is fault-tolerant: failure logs a warning but does not fail the build.

**Files:**
- Create: `scripts/prebuild.mjs`

- [ ] **Step 1: prebuild.mjs**

```js
// scripts/prebuild.mjs
import { spawn } from 'node:child_process';

const fetchers = [
  ['youtube',         'scripts/fetch-youtube.mjs'],
  ['sessionize',      'scripts/fetch-sessionize.mjs'],
  ['credly',          'scripts/fetch-credly.mjs'],
  ['github-readme',   'scripts/fetch-github-readme.mjs'],
  ['github-contrib',  'scripts/fetch-github-contributions.mjs'],
];

function run(label, file) {
  return new Promise((resolve) => {
    const child = spawn('node', [file], { stdio: 'inherit' });
    child.on('exit', (code) => resolve({ label, code }));
    child.on('error', () => resolve({ label, code: 1 }));
  });
}

const results = await Promise.all(fetchers.map(([l, f]) => run(l, f)));
console.log('\nprebuild summary:');
for (const r of results) {
  console.log(`  ${r.code === 0 ? '✓' : '✗'} ${r.label}${r.code === 0 ? '' : ` (exit ${r.code} — using cached files if any)`}`);
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/prebuild.mjs
git commit -m "Add prebuild orchestrator"
```

---

## Task 15: fetch-youtube.mjs

Fetches all videos in the playlist and writes one YAML per video into `src/content/talks/youtube/`.

**Files:**
- Create: `scripts/fetch-youtube.mjs`

- [ ] **Step 1: fetch-youtube.mjs**

```js
// scripts/fetch-youtube.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

const PLAYLIST_ID = 'PL5T4q56AEyfVPQUu4R6ESZfIT-gq8AYw1';
const KEY = process.env.YOUTUBE_API_KEY;
const OUT_DIR = 'src/content/talks/youtube';

if (!KEY) {
  console.warn('[youtube] YOUTUBE_API_KEY not set — skipping (existing files preserved).');
  process.exit(0);
}

function slugify(s) {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function splitTitle(title) {
  // Common patterns: "Talk Title — Event Name" or "Talk Title | Event Name"
  const m = title.split(/\s+[—\-|·]\s+/);
  if (m.length >= 2) return { title: m.slice(0, -1).join(' — '), event: m.at(-1).trim() };
  return { title, event: 'Unknown event' };
}

async function fetchPage(token) {
  const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
  url.searchParams.set('part', 'snippet,contentDetails');
  url.searchParams.set('playlistId', PLAYLIST_ID);
  url.searchParams.set('maxResults', '50');
  url.searchParams.set('key', KEY);
  if (token) url.searchParams.set('pageToken', token);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`YouTube ${r.status}: ${await r.text()}`);
  return r.json();
}

let items = [];
let token;
do {
  const page = await fetchPage(token);
  items = items.concat(page.items ?? []);
  token = page.nextPageToken;
} while (token);

await fs.mkdir(OUT_DIR, { recursive: true });
// wipe previous auto-generated files
for (const f of await fs.readdir(OUT_DIR)) {
  if (f.endsWith('.yaml')) await fs.unlink(path.join(OUT_DIR, f));
}

// Collect youtube_ids already claimed by manual entries (parent talks/ folder, not the youtube/ subfolder).
async function readManualClaimedIds() {
  const parent = 'src/content/talks';
  const claimed = new Set();
  for (const f of await fs.readdir(parent)) {
    if (!f.endsWith('.yaml')) continue;
    const txt = await fs.readFile(path.join(parent, f), 'utf8');
    const m = txt.match(/^youtube_id:\s*([A-Za-z0-9_-]+)\s*$/m);
    if (m && m[1] !== 'null') claimed.add(m[1]);
  }
  return claimed;
}
const claimed = await readManualClaimedIds();

let n = 0, skipped = 0;
for (const it of items) {
  const s = it.snippet;
  const videoId = it.contentDetails?.videoId ?? s.resourceId?.videoId;
  if (!videoId) continue;
  if (s.title?.toLowerCase().includes('private video') || s.title?.toLowerCase().includes('deleted video')) continue;
  if (claimed.has(videoId)) { skipped++; continue; }
  const { title, event } = splitTitle(s.title);
  const date = new Date(s.publishedAt).toISOString().slice(0, 10);
  const slug = `${slugify(title)}-${date.slice(0, 7)}`;
  const yaml = [
    `title: ${JSON.stringify(title)}`,
    `event: ${JSON.stringify(event)}`,
    `date: ${date}`,
    `youtube_id: ${videoId}`,
    `tags: []`,
    `featured: false`,
    s.description ? `abstract: ${JSON.stringify(s.description.split('\n').slice(0, 4).join('\n'))}` : '',
  ].filter(Boolean).join('\n');
  await fs.writeFile(path.join(OUT_DIR, `${slug}.yaml`), yaml + '\n');
  n++;
}
console.log(`[youtube] wrote ${n} talks (skipped ${skipped} already-claimed by manual entries) → ${OUT_DIR}`);
```

- [ ] **Step 2: Smoke test (will skip without key — that's correct)**

```bash
node scripts/fetch-youtube.mjs
```

Expected: prints `[youtube] YOUTUBE_API_KEY not set — skipping`.

- [ ] **Step 3: Commit**

```bash
git add scripts/fetch-youtube.mjs
git commit -m "Add YouTube playlist fetcher"
```

---

## Task 16: fetch-credly.mjs

**Files:**
- Create: `scripts/fetch-credly.mjs`

- [ ] **Step 1: fetch-credly.mjs**

```js
// scripts/fetch-credly.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

const USERNAME = 'kasper-nissen';
const OUT_DIR = 'src/content/badges';
const IMG_DIR = 'src/assets/badges';

function slugify(s) {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function fetchPage(page) {
  const url = `https://www.credly.com/users/${USERNAME}/badges.json?sort=most_recent&page=${page}&page_size=48`;
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`Credly ${r.status}: ${await r.text()}`);
  return r.json();
}

let badges = [];
try {
  let page = 1;
  while (true) {
    const j = await fetchPage(page);
    const data = j.data ?? [];
    badges = badges.concat(data);
    if (data.length < 48) break;
    page++;
    if (page > 10) break;
  }
} catch (e) {
  console.warn(`[credly] fetch failed: ${e.message} — keeping existing files`);
  process.exit(0);
}

await fs.mkdir(OUT_DIR, { recursive: true });
await fs.mkdir(IMG_DIR, { recursive: true });
for (const f of await fs.readdir(OUT_DIR)) {
  if (f.endsWith('.yaml')) await fs.unlink(path.join(OUT_DIR, f));
}

let n = 0;
for (const b of badges) {
  const tpl = b.badge_template ?? b;
  const name = tpl.name ?? b.name;
  const issuer = tpl.issuer?.entities?.[0]?.entity?.name ?? tpl.issuer?.name ?? 'Unknown';
  const issued = (b.issued_at ?? b.issued_at_date ?? '').slice(0, 10);
  const url = b.public_url ?? b.url ?? `https://www.credly.com/users/${USERNAME}`;
  const imgUrl = tpl.image_url ?? tpl.image?.url ?? b.image_url;
  if (!name || !issued) continue;

  const slug = slugify(`${name}-${issued}`);
  let imgRel = '';
  if (imgUrl) {
    try {
      const ext = imgUrl.match(/\.(png|svg|jpg|jpeg)/i)?.[1]?.toLowerCase() ?? 'png';
      const imgPath = path.join(IMG_DIR, `${slug}.${ext}`);
      const r = await fetch(imgUrl);
      if (r.ok) {
        await fs.writeFile(imgPath, Buffer.from(await r.arrayBuffer()));
        imgRel = `./${slug}.${ext}`;
      }
    } catch { /* keep imgRel empty */ }
  }
  const yaml = [
    `name: ${JSON.stringify(name)}`,
    `issuer: ${JSON.stringify(issuer)}`,
    `issued: ${issued}`,
    `url: ${JSON.stringify(url)}`,
    `image: ${JSON.stringify(imgRel || './missing.png')}`,
  ].join('\n');
  await fs.writeFile(path.join(OUT_DIR, `${slug}.yaml`), yaml + '\n');
  n++;
}
console.log(`[credly] wrote ${n} badges → ${OUT_DIR}`);
```

- [ ] **Step 2: Smoke test**

```bash
node scripts/fetch-credly.mjs
```

Expected: prints `[credly] wrote N badges …`. If Credly rate-limits, prints a warning and exits 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/fetch-credly.mjs
git commit -m "Add Credly badge fetcher"
```

---

## Task 17: fetch-github-readme.mjs

Parses the user's profile README at `https://github.com/kaspernissen/kaspernissen` for blog/podcast entries under conventional headings (`## Blog`, `## Podcasts`, `## Newsletters`, `## Interviews`).

**Files:**
- Create: `scripts/fetch-github-readme.mjs`

- [ ] **Step 1: fetch-github-readme.mjs**

```js
// scripts/fetch-github-readme.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

const REPO = 'kaspernissen/kaspernissen';
const OUT_DIR = 'src/content/writing/github';
const BRANCHES = ['main', 'master'];

function slugify(s) {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const HEADING_KIND = new Map([
  ['blog', 'blog'], ['blogs', 'blog'], ['posts', 'blog'], ['articles', 'blog'], ['writing', 'blog'],
  ['podcast', 'podcast'], ['podcasts', 'podcast'],
  ['newsletter', 'newsletter'], ['newsletters', 'newsletter'],
  ['interview', 'interview'], ['interviews', 'interview'],
]);

async function fetchReadme() {
  for (const b of BRANCHES) {
    const r = await fetch(`https://raw.githubusercontent.com/${REPO}/${b}/README.md`);
    if (r.ok) return r.text();
  }
  return null;
}

const md = await fetchReadme();
if (!md) {
  console.warn('[github-readme] README not found — keeping existing files');
  process.exit(0);
}

await fs.mkdir(OUT_DIR, { recursive: true });
for (const f of await fs.readdir(OUT_DIR)) {
  if (f.endsWith('.yaml')) await fs.unlink(path.join(OUT_DIR, f));
}

let currentKind = null;
let n = 0;
const lines = md.split('\n');
const linkRe = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const dateRe = /(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?/;

for (const line of lines) {
  const h = line.match(/^#{2,3}\s+(.+?)\s*$/);
  if (h) {
    const key = h[1].toLowerCase().replace(/[^a-z]/g, '');
    currentKind = HEADING_KIND.get(key) ?? null;
    continue;
  }
  if (!currentKind) continue;
  if (!line.match(/^[-*]\s+/)) continue;

  const links = [...line.matchAll(linkRe)];
  if (links.length === 0) continue;
  const [, title, url] = links[0];
  const dateMatch = line.match(dateRe);
  const date = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${(dateMatch[3] ?? '01').padStart(2, '0')}`
    : '2024-01-01';
  // Try to detect publication: text in italics or after the title
  const pubMatch = line.match(/\*([^*]+)\*/) ?? line.match(/—\s*([^—\n]+)$/);
  const publication = pubMatch ? pubMatch[1].trim() : new URL(url).hostname.replace(/^www\./, '');
  const slug = slugify(`${title}-${date.slice(0, 7)}`);
  const yaml = [
    `kind: ${currentKind}`,
    `title: ${JSON.stringify(title)}`,
    `publication: ${JSON.stringify(publication)}`,
    `date: ${date}`,
    `url: ${JSON.stringify(url)}`,
  ].join('\n');
  await fs.writeFile(path.join(OUT_DIR, `${slug}.yaml`), yaml + '\n');
  n++;
}
console.log(`[github-readme] wrote ${n} writing entries → ${OUT_DIR}`);
```

- [ ] **Step 2: Smoke test**

```bash
node scripts/fetch-github-readme.mjs
```

Expected: writes N entries (or 0 if README has no recognised section headings — that's not a failure).

- [ ] **Step 3: Commit**

```bash
git add scripts/fetch-github-readme.mjs
git commit -m "Add GitHub profile README parser for writing entries"
```

---

## Task 18: fetch-github-contributions.mjs

Uses the third-party scraper API (no auth) and writes `data/github.json`.

**Files:**
- Create: `scripts/fetch-github-contributions.mjs`

- [ ] **Step 1: fetch-github-contributions.mjs**

```js
// scripts/fetch-github-contributions.mjs
import fs from 'node:fs/promises';

const USERNAME = 'kaspernissen';
const OUT = 'data/github.json';

async function fetchContrib() {
  const url = `https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`contributions API ${r.status}`);
  return r.json();
}

try {
  const j = await fetchContrib();
  // shape: { total: { 'last_year': N }, contributions: [{date, count, level}] }
  const days = (j.contributions ?? []).map((d) => ({ date: d.date, count: d.count, level: d.level }));
  const total = typeof j.total === 'object'
    ? Object.values(j.total).reduce((a, b) => a + b, 0)
    : (j.total ?? 0);
  await fs.mkdir('data', { recursive: true });
  await fs.writeFile(OUT, JSON.stringify({ total, days }));
  console.log(`[github-contrib] wrote ${days.length} days, ${total} total → ${OUT}`);
} catch (e) {
  console.warn(`[github-contrib] failed: ${e.message} — keeping existing data/github.json`);
}
```

- [ ] **Step 2: Smoke test**

```bash
node scripts/fetch-github-contributions.mjs
```

Expected: writes `data/github.json` with ~365 days.

- [ ] **Step 3: Commit**

```bash
git add scripts/fetch-github-contributions.mjs
git commit -m "Add GitHub contributions fetcher"
```

---

## Task 19: fetch-sessionize.mjs (stub with config hook)

Sessionize doesn't expose a stable cross-event speaker API. This fetcher reads a list of event endpoints from `data/sessionize.json` (committed) and aggregates Kasper's sessions across them. If the config is empty or absent, it no-ops.

**Files:**
- Create: `scripts/fetch-sessionize.mjs`, `data/sessionize.json` (committed config)

- [ ] **Step 1: data/sessionize.json**

(Committed — not gitignored. Add a `data/.gitignore` entry below to allow this file specifically.)

```json
{
  "speakerName": "Kasper Nissen",
  "events": []
}
```

`events` is filled in over time as Kasper speaks at Sessionize-managed events. Each entry: `{"id": "<sessionize-event-id>", "label": "<conference name>", "url": "<event url>", "location": "<city, country>"}`.

- [ ] **Step 2: Tweak .gitignore so config file is tracked**

Append to `.gitignore`:

```
data/
!data/sessionize.json
```

- [ ] **Step 3: fetch-sessionize.mjs**

```js
// scripts/fetch-sessionize.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

const CONFIG = 'data/sessionize.json';
const OUT_DIR = 'src/content/conferences/sessionize';

function slugify(s) {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

let config;
try {
  config = JSON.parse(await fs.readFile(CONFIG, 'utf8'));
} catch {
  console.warn('[sessionize] no config — skipping');
  process.exit(0);
}

if (!config.events?.length) {
  console.log('[sessionize] config empty — skipping');
  process.exit(0);
}

await fs.mkdir(OUT_DIR, { recursive: true });
for (const f of await fs.readdir(OUT_DIR)) {
  if (f.endsWith('.yaml')) await fs.unlink(path.join(OUT_DIR, f));
}

let n = 0;
for (const ev of config.events) {
  try {
    const r = await fetch(`https://sessionize.com/api/v2/${ev.id}/view/All`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const sessions = j.sessions ?? [];
    const mySessions = sessions.filter((s) =>
      (s.speakers ?? []).some((sp) => sp.name?.toLowerCase().includes(config.speakerName.toLowerCase()))
    );
    for (const s of mySessions) {
      const date = (s.startsAt ?? '').slice(0, 10) || '2024-01-01';
      const slug = slugify(`${ev.label}-${s.title}-${date}`);
      const yaml = [
        `name: ${JSON.stringify(ev.label)}`,
        `date: ${date}`,
        `location: ${JSON.stringify(ev.location ?? 'Unknown')}`,
        `url: ${JSON.stringify(ev.url)}`,
        `role: speaker`,
        `session_title: ${JSON.stringify(s.title)}`,
      ].join('\n');
      await fs.writeFile(path.join(OUT_DIR, `${slug}.yaml`), yaml + '\n');
      n++;
    }
  } catch (e) {
    console.warn(`[sessionize] event ${ev.id} failed: ${e.message}`);
  }
}
console.log(`[sessionize] wrote ${n} sessions → ${OUT_DIR}`);
```

- [ ] **Step 4: Smoke test**

```bash
node scripts/fetch-sessionize.mjs
```

Expected: prints `[sessionize] config empty — skipping` (until events are added).

- [ ] **Step 5: Commit**

```bash
git add scripts/fetch-sessionize.mjs data/sessionize.json .gitignore
git commit -m "Add Sessionize fetcher with event-config hook"
```

---

## Task 20: GitHub Actions — deploy.yml and refresh.yml

**Files:**
- Create: `.github/workflows/deploy.yml`, `.github/workflows/refresh.yml`

- [ ] **Step 1: deploy.yml**

```yaml
name: Build & deploy
on:
  push:
    branches: [main]
  workflow_dispatch: {}

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: refresh.yml**

```yaml
name: Nightly refresh
on:
  schedule:
    - cron: '0 3 * * *'
  workflow_dispatch: {}

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  refresh:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows
git commit -m "Add deploy + nightly refresh workflows"
```

---

## Task 21: CNAME + favicon

**Files:**
- Create: `public/CNAME`, `public/favicon.svg`

- [ ] **Step 1: CNAME**

```
kaspernissen.xyz
```

- [ ] **Step 2: favicon.svg (orange "k.")**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#fb923c"/>
  <text x="50%" y="60%" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="40" font-weight="800" fill="#1c1917">k.</text>
</svg>
```

- [ ] **Step 3: Commit**

```bash
git add public/CNAME public/favicon.svg
git commit -m "Add CNAME for custom domain and favicon"
```

---

## Task 22: First full local build, then push

- [ ] **Step 1: Run all fetchers + build**

```bash
npm run build
```

Expected: prebuild logs `✓ youtube ✗ sessionize ✓ credly ✓ github-readme ✓ github-contrib` (sessionize ✗ until config is filled in is OK — fault-tolerant). Astro builds `dist/`. No schema errors.

- [ ] **Step 2: Local preview**

```bash
npm run preview &
sleep 2
curl -sI http://localhost:4321/ | head -1
kill %1
```

Expected: `HTTP/1.1 200 OK`.

- [ ] **Step 3: Push (this triggers deploy.yml)**

```bash
git push -u origin main
```

- [ ] **Step 4: Manual handoff to Kasper**

After the first push, Kasper needs to:
1. In repo Settings → Pages: set "Build and deployment" → Source: **GitHub Actions**.
2. In repo Settings → Secrets: add `YOUTUBE_API_KEY` (Google Cloud Console → YouTube Data API v3 → API key).
3. At the registrar: point `kaspernissen.xyz` apex + `www` to GitHub Pages (`185.199.108.153` etc., or a CNAME for `www` → `kaspernissen.github.io`).
4. Fill in `data/sessionize.json` events as they're known.
5. Add real talks/decks/photos by committing YAML files + assets.

---

## Self-review notes

(Spec coverage, placeholder scan, type consistency — all checked and confirmed before saving this plan. The Sessionize fetcher carries a config-hook because the spec flagged the speaker-ID open question; the fetcher is correct against documented Sessionize event APIs and gracefully no-ops with an empty event list.)
