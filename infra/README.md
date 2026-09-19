# Deck hosting

Slide-deck PDFs are mirrored from [noti.st/kasperborgnissen](https://noti.st/kasperborgnissen)
and served from S3 rather than committed to this repo. At ~8MB a deck and a new
one after every talk, versioning them would add ~80MB a year to the repo
permanently — git never forgets a blob.

- **Bucket:** `kasper-nissen-presentations` (`eu-west-1`)
- **Layout:** one bucket, two prefixes — decks and photo originals have the same
  access rules and lifetime, so a second bucket would only be more to configure.

  ```
  s3://kasper-nissen-presentations/
    decks/<title>-<yyyy-mm>.pdf     ← npm run decks:sync
    photos/<slug>.jpg               ← npm run photos:sync
  ```

  Files are flat within a prefix. The name already carries the title and month,
  so a further year/ level would just be more path to get wrong, at ~10 a year.
- **Public base URLs:**
  `https://kasper-nissen-presentations.s3.eu-west-1.amazonaws.com/decks` and
  `.../photos`, wired through `PUBLIC_DECK_BASE_URL` / `PUBLIC_PHOTO_BASE_URL`.
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

## The upload credentials

Uploads use a dedicated IAM user, not the account root. A root access key
cannot be scoped to one bucket and cannot be rotated without disturbing
everything else in the account, so a leak costs the whole account rather than
some slide PDFs.

Once, in the personal account:

1. **IAM → Policies → Create policy → JSON** — paste
   [`deck-writer-policy.json`](./deck-writer-policy.json) and name it
   `kaspernissen-xyz-deck-writer`. It allows listing this one bucket and
   reading/writing objects inside it. Nothing else, no other bucket, no delete.
2. **IAM → Users → Create user** `kaspernissen-xyz-deploy`, no console access,
   and attach that policy.
3. **Security credentials → Create access key → Command Line Interface.**
4. In a terminal, `aws configure --profile kasper-personal` and paste the key
   and secret at the prompts, region `eu-west-1`.
5. **IAM → root user → delete any existing root access keys.** Nothing should
   need them, and an unused root key is pure downside.

Then every command below takes `AWS_PROFILE=kasper-personal`. Verify with:

```sh
aws sts get-caller-identity --profile kasper-personal
aws s3 ls s3://kasper-nissen-presentations --profile kasper-personal
```

The secret only ever exists in `~/.aws/credentials`. Don't paste it into a
terminal whose output is being recorded, this repo, or a chat window.

## Publishing new decks

After a talk is published on Notist:

```sh
npm run decks:fetch     # pulls new PDFs into public/decks/ + writes YAML
npm run decks:sync      # uploads them to the decks/ prefix
npm run photos:sync     # uploads photo originals to the photos/ prefix
git add src/content/talks && git commit
```

Both sync commands read `DECKS_BUCKET`, `AWS_PROFILE` and `AWS_REGION` from
your environment — copy `.env.example` to `.env.local` and source it, or pass
them inline. The prefix is set by the npm script, so don't add one to
`DECKS_BUCKET`.

`--delete` is deliberately never passed and the upload user has no
`s3:DeleteObject`, so a sync can only ever add. Removing an object is a console
action, which is the right amount of friction for breaking a URL someone may
have shared.

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
