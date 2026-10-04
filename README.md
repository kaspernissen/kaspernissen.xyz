# kaspernissen.xyz

Personal site of Kasper Borg Nissen: talks, blog, writing and speaker kit.
Built with [Astro](https://astro.build) and deployed to GitHub Pages.

## Run it

Needs Node 22.

```sh
cp .env.example .env
npm install
npm run dev      # http://localhost:4321
```

Decks, photos and blog images are served from S3; the URLs are in `.env`.

## Other commands

```sh
npm run build    # build to dist/
npm test         # unit tests
npm run refresh  # pull new talks and writing from Sessionize, YouTube, Dash0 and others
```

Adding decks or photos: see [AGENTS.md](AGENTS.md).
