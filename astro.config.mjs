// @ts-check
import { defineConfig } from 'astro/config';
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
 * The walk is hand-rolled rather than pulling in unist-util-visit: it is only
 * a tree of {children}, and this is the one plugin the site has.
 */
function rehypeBlogImages() {
  const base = env.PUBLIC_BLOG_IMAGE_BASE_URL?.trim().replace(/\/+$/, '');
  const PREFIX = '/blog-images/';
  return (tree) => {
    const walk = (node) => {
      if (node.tagName === 'img' && typeof node.properties?.src === 'string') {
        if (base && node.properties.src.startsWith(PREFIX)) {
          node.properties.src = `${base}/${node.properties.src.slice(PREFIX.length)}`;
        }
        node.properties.loading ??= 'lazy';
        node.properties.decoding ??= 'async';
      }
      // Captioned images are literal <figure> HTML in the Markdown, which
      // arrives as one opaque raw node rather than parsed elements — so it has
      // to be patched as text or those images keep the placeholder path.
      if (node.type === 'raw' && typeof node.value === 'string' && node.value.includes('<img')) {
        if (base) node.value = node.value.split(`src="${PREFIX}`).join(`src="${base}/`);
        node.value = node.value.replace(/<img (?![^>]*\bloading=)/g, '<img loading="lazy" decoding="async" ');
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

export default defineConfig({
  site: 'https://kaspernissen.xyz',
  vite: { plugins: [tailwindcss()] },
  markdown: { rehypePlugins: [rehypeBlogImages] },
  integrations: [sitemap()],
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
