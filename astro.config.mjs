// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

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

export default defineConfig({
  site: 'https://kaspernissen.xyz',
  vite: { plugins: [tailwindcss()] },
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
