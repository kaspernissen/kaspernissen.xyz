// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://kaspernissen.xyz',
  vite: { plugins: [tailwindcss()] },
  image: {
    // Speaker photos live in S3 rather than the repo (see src/lib/photoHost.ts).
    // Astro still optimises them: it fetches each one at build time and emits
    // the same responsive WebP it would for a local file. The consequence is
    // that the build now needs the bucket to be reachable and public — if it
    // is not, image builds fail rather than silently shipping originals.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kasper-nissen-presentations.s3.eu-west-1.amazonaws.com',
        pathname: '/photos/**',
      },
    ],
  },
});
