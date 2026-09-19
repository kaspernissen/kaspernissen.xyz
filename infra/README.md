# Deck hosting

Slide-deck PDFs are mirrored from [noti.st/kasperborgnissen](https://noti.st/kasperborgnissen)
and served from S3 rather than committed to this repo. At ~8MB a deck and a new
one after every talk, versioning them would add ~80MB a year to the repo
permanently — git never forgets a blob.

- **Bucket:** `kasper-nissen-presentations` (`eu-west-1`)
- **Public base URL:** `https://kasper-nissen-presentations.s3.eu-west-1.amazonaws.com`
- **What is committed:** only the YAML under `src/content/decks/notist/` — titles,
  events, dates, file names and sizes. The decks page renders from that alone.
- **What is not:** `public/decks/*.pdf` is gitignored. It is the local mirror you
  sync from, not the source of truth.

## Bucket configuration

The bucket uses **Object Ownership: bucket owner enforced**, so ACLs are
disabled — the Access Control List panel in the console will show dashes for
every grantee and that is correct. Access is controlled by the bucket policy
instead, which is AWS's recommended setup.

1. **Block Public Access** — untick *Block all public access*. Specifically the
   two policy-related boxes must be off, or the public-read policy is ignored:
   - `BlockPublicPolicy`
   - `RestrictPublicBuckets`

   The two ACL-related boxes can stay on; nothing here uses ACLs.

2. **Bucket policy** — apply [`deck-bucket-policy.json`](./deck-bucket-policy.json).
   It grants `s3:GetObject` to everyone, scoped to objects in this bucket only.
   Nobody can list the bucket, overwrite an object, or see any other bucket.

3. **Writes** — not granted to anyone by the policy. Uploads authenticate with
   your own IAM credentials via the AWS CLI. Don't add a write grant here.

## Publishing new decks

After a talk is published on Notist:

```sh
node scripts/fetch-notist.mjs                       # pulls new PDFs + writes YAML
DECKS_BUCKET=s3://kasper-nissen-presentations \
  node scripts/sync-decks.mjs                       # uploads them
git add src/content/decks/notist && git commit      # publishes the links
```

`sync-decks.mjs` sets a one-year immutable `Cache-Control`, which is safe
because a deck's filename encodes its title and month — the bytes behind a
given URL never change.

## Switching hosting later

`src/lib/deckHost.ts` reads `PUBLIC_DECK_BASE_URL`. Point it anywhere (a
CloudFront distribution, a `decks.kaspernissen.xyz` CNAME, or unset it to serve
from `public/decks/` in-repo again) and nothing else changes.

A CloudFront distribution in front of the bucket would be the next step if the
raw `s3.eu-west-1.amazonaws.com` URL ever matters — it buys a custom domain and
cheaper egress, but it is not needed for this to work.
