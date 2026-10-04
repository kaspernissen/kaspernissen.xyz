// @ts-check
import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// This file runs outside Vite's env handling, so `.env` has not been read yet
// and process.env holds only what the shell exported. Components get the same
// values through import.meta.env; a plugin defined here has to ask for them.
const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_');

// Retry the network fetches Astro makes for remote images.
//
// Moving photos and badges to S3 traded repo size for a build-time dependency
// on the bucket, and roughly one build in ten died on a single
// `Connect Timeout Error (10000ms)` while rendering /speaker-kit — 130-odd
// images in one page, any one of which fails the whole build. Nothing was
// wrong with the bucket; one connection was slow to open.
//
// `fetch` only throws for network-level failures — an HTTP 404 or 503 resolves
// normally — so retrying here cannot paper over a genuinely missing image. A
// bucket that is actually down still fails the build, just four attempts later.
const MAX_ATTEMPTS = 4;
const innerFetch = globalThis.fetch;
globalThis.fetch = async function retryingFetch(input, init) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await innerFetch(input, init);
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS || init?.signal?.aborted) throw error;
      const backoffMs = 500 * 2 ** (attempt - 1);
      const url = typeof input === 'string' ? input : (input?.url ?? String(input));
      console.warn(
        `[build] fetch failed for ${url} (${error.cause?.code ?? error.message}) — ` +
          `retry ${attempt}/${MAX_ATTEMPTS - 1} in ${backoffMs}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
};

/**
 * Points blog post images at wherever they are hosted, and makes them lazy.
 *
 * Post bodies write images as `/blog-images/<file>`. That is deliberately a
 * root-absolute path and not a relative one: Astro resolves relative Markdown
 * image paths to local files at build time, before any rehype plugin runs, so
 * a placeholder there fails the build. A root path is passed through untouched
 * — and doubles as the fallback, serving from public/blog-images/ when
 * PUBLIC_BLOG_IMAGE_BASE_URL is unset, the same way photos fall back to
 * public/speakers/.
 *
 * Markdown images cannot go through <Image>, so they ship as plain <img> at
 * their imported size. One re:Invent post carries thirteen of them; without
 * `loading="lazy"` every one is fetched before the page settles.
 *
 * Width and height come from data/blog-image-sizes.json (see
 * scripts/blog-image-sizes.mjs), so the browser reserves each image's space
 * before it loads instead of shifting the text down when it arrives. The CSS
 * caps the width; `height: auto` keeps the ratio.
 *
 * The walk is hand-rolled rather than pulling in unist-util-visit: it is only
 * a tree of {children}, and this is the one plugin the site has.
 */
const BLOG_IMAGE_SIZES = JSON.parse(fs.readFileSync('data/blog-image-sizes.json', 'utf8'));

function rehypeBlogImages() {
  const base = env.PUBLIC_BLOG_IMAGE_BASE_URL?.trim().replace(/\/+$/, '');
  const PREFIX = '/blog-images/';
  return (tree) => {
    const walk = (node) => {
      if (node.tagName === 'img' && typeof node.properties?.src === 'string') {
        if (node.properties.src.startsWith(PREFIX)) {
          const file = node.properties.src.slice(PREFIX.length);
          const size = BLOG_IMAGE_SIZES[file];
          if (size) [node.properties.width, node.properties.height] = size;
          if (base) node.properties.src = `${base}/${file}`;
        }
        node.properties.loading ??= 'lazy';
        node.properties.decoding ??= 'async';
      }
      // Captioned images are literal <figure> HTML in the Markdown, which
      // arrives as one opaque raw node rather than parsed elements — so it has
      // to be patched as text or those images keep the placeholder path.
      if (node.type === 'raw' && typeof node.value === 'string' && node.value.includes('<img')) {
        node.value = node.value.replace(/<img ([^>]*?)src="\/blog-images\/([^"]+)"/g, (tag, before, file) => {
          const size = BLOG_IMAGE_SIZES[file];
          const dims = size && !/\bwidth=/.test(tag) ? ` width="${size[0]}" height="${size[1]}"` : '';
          return `<img ${before}src="${base ? `${base}/` : PREFIX}${file}"${dims}`;
        });
        node.value = node.value.replace(/<img (?![^>]*\bloading=)/g, '<img loading="lazy" decoding="async" ');
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

// Blog posts that are copies of something first published elsewhere: any post
// whose frontmatter carries a `canonical`. Read straight from the files because
// astro:content is not available in the config.
const IMPORTED_POSTS = new Set(
  fs
    .readdirSync('src/content/blog')
    .filter((f) => f.endsWith('.md'))
    .filter((f) => /^canonical:\s*\S/m.test(fs.readFileSync(`src/content/blog/${f}`, 'utf8').split('---')[1] ?? ''))
    .map((f) => `https://kaspernissen.xyz/blog/${f.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '')}/`),
);

export default defineConfig({
  site: 'https://kaspernissen.xyz',
  vite: { plugins: [tailwindcss()] },
  markdown: { rehypePlugins: [rehypeBlogImages] },
  integrations: [
    sitemap({
      // The sitemap is the list of pages this site wants indexed as its own.
      // Left out: tag listings and pagination (crawlers still reach them by
      // link), the 404 page, and imported posts, whose canonical points at
      // Medium or dash0.com. Listing a URL whose canonical says "index the
      // other one" asks a search engine to do two contradictory things.
      filter: (page) =>
        !/\/blog\/(tag|page)\//.test(page) && !/\/404\/?$/.test(page) && !IMPORTED_POSTS.has(page),
    }),
  ],
  image: {
    // Photos and badge art live in S3 rather than the repo
    // (see src/lib/photoHost.ts and src/lib/badgeHost.ts).
    // Astro still optimises them: it fetches each one at build time and emits
    // the same responsive WebP it would for a local file. The consequence is
    // that the build now needs the bucket to be reachable and public — if it
    // is not, image builds fail rather than silently shipping originals.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kasper-nissen-presentations.s3.eu-west-1.amazonaws.com',
        // photos/, badges/ — every prefix the site renders from.
        pathname: '/**',
      },
    ],
  },
});
