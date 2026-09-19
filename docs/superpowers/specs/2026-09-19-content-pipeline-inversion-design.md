# Inverting the content pipeline

**Status:** implemented
**Date:** 2026-09-19

## The problem

Every fetcher owns a directory under `src/content/talks/` and deletes and
rewrites it on each build. Nothing typed into those files survives. So the
durable facts — a corrected date, a merge, an exclusion — had to go somewhere
the fetchers could not reach, and that somewhere became three JSON files:
`data/talk-overrides.json`, `data/conference-overrides.json`,
`data/talk-exclusions.json`. They are a patch log, replayed after every wipe.

This has cost us real, user-visible bugs:

- **The truth about one talk lives in two places** and they disagree silently.
  `override unused` is a normal log line, so eight of them being an actual
  outage was invisible.
- **Overrides are keyed on `youtube_id`**, so a talk with no recording cannot
  be corrected at all.
- **Merges are re-derived by heuristics on every build** rather than recorded
  once. A merge that worked yesterday can stop working tomorrow because an
  upstream title changed.
- **The pipeline is order-dependent, and was concurrent.** `fetch-youtube`
  scans all of `src/content/talks/` for claimed video IDs while
  `fetch-sessionize`, `fetch-github-readme` and `fetch-notist` are deleting
  directories inside that tree. On a fresh checkout it lost the race and
  dropped eighteen recordings; a second build in the same tree came out right,
  which is why every local build looked correct and every deploy was wrong.
- **Heuristics run inside the deploy**, so a bad guess publishes itself. The
  nightly job at 03:00 deployed unreviewed.

## The shape of the fix

Committed YAML becomes the source of truth. Fetchers reconcile *into* it
instead of wiping it, and they do so in a **pull request**, not in the deploy.

### Two jobs, split by what they may do

`deploy.yml` — on push to `main`. `npm ci`, `npm test`, `astro build`, deploy.
No fetchers, no heuristics, no upstream network. The live site is exactly what
is committed: reproducible, diffable, revertable.

`refresh.yml` — nightly and on demand. Runs the fetchers *and* the merge
heuristics, reconciling into `src/content/**`, then opens a PR on a fixed
branch. If nothing changed it exits. Tests and a build run on the branch.

Every heuristic decision therefore arrives as a reviewable diff. The race
described above would have surfaced as "eight entries lost their `youtube_id`"
in a PR, instead of as a silently broken site.

### One flat directory

`src/content/talks/**/*.yaml` is globbed as one collection already — the
subdirectories only ever encoded which fetcher owned which files. With
ownership gone, so are they. All engagements live in `src/content/talks/`,
one file per engagement, named by slug.

### Provenance

Each entry records the upstream keys it was built from:

```yaml
sources:
  youtube: q_Ffw2P_31Q
  sessionize: cloud-native-summit-2026
  notist: https://noti.st/kaspernissen/abc123
```

This is what makes a merge permanent. Today "this recording belongs to that
conference" is re-guessed every build from titles and dates. Once written into
`sources`, it is a fact: the next run matches on the key and never guesses
again.

### The reconcile rule

For each upstream record with key `k` from source `s`:

1. If an entry has `sources.s == k`, that is the target.
2. Otherwise, if a heuristic matches an existing entry confidently, **adopt**
   it: write `sources.s = k` into that entry. This is a merge, recorded once.
3. Otherwise create a new file.

Then fill fields:

- A field that is **absent or null** may be written.
- A field that **already has a value is never overwritten.**
- Upstream records that have disappeared are **reported in the PR body, never
  deleted.**

That is the whole contract, and it is what makes the YAML editable: anything
typed by hand is permanent, because the only thing a fetcher may do to an
existing field is fill a blank.

### What this deletes

- `data/talk-overrides.json` — corrections become ordinary field edits.
- `data/conference-overrides.json` — same.
- `data/talk-exclusions.json` — an exclusion becomes deleting the file, and
  it stays deleted because nothing rewrites the directory.
- `scripts/apply-talk-overrides.mjs`.
- The `prebuild` lifecycle hook, so `npm run build` is only `astro build`.

## Migration

The current merged output is known good: a fresh clone, a local build and the
live site now agree exactly, 61 talk pages. Migration freezes that state:

1. Run the existing pipeline to produce the correct merged tree.
2. Flatten every talk YAML into `src/content/talks/`.
3. Derive `sources` for each entry from the fields it already carries
   (`youtube_id`, `notist_url`, the Sessionize slug it came from).
4. Fold the three override files in, so their corrections become plain fields.
5. Commit. From here the files are the truth.

## What changed during implementation

Three things the design did not anticipate.

**Exclusions needed tombstones.** "An exclusion becomes deleting the file" is
wrong on its own: nothing rewrites the directory, so a deleted file is simply a
record the next fetch does not recognise, and it creates it again. An excluded
entry therefore keeps its file, carrying `hidden: true`, which is also where
its `sources` live. Thirteen exist. `src/lib/engagement.ts` exports `visible()`
and all four pages read talks through it.

**dedupe-talks had to leave the schedule.** It collapsed the same talk arriving
from two sources by comparing titles and dates. Provenance prevents that
duplication outright, and left running nightly the pass did active harm: because
Kasper gives the same talk repeatedly — "Breaking Free with Open Standards" has
five deliveries — it paired a recording with the wrong one and deleted a real
engagement. Two consecutive runs ate two different entries. The script remains
for one-off use; collapsing a genuine duplicate is now a human decision made
once, in a PR.

**Two recordings came back.** The old `fetch-youtube` named files
`slugify(title)-YYYY-MM` with no collision handling, so three videos titled
"Keynote: Closing Remarks" in 2024-03 silently overwrote each other. Reconcile
keeps them apart, and the site gained
`keynote-closing-remarks-2024-03-21` and `keynote-closing-remarks-2024-11-15`.
Nothing was lost: 61 pages before, 63 after, and the 61 are unchanged.

## Verification

- A clean clone, built once with no API key, matches a local build exactly.
- Running the refresh twice changes nothing the second time; running it on a
  clean checkout changes nothing at all, so a quiet night opens no PR.
- 93 tests pass, 14 of them covering the reconcile rules directly.

## Risks

- **A fetcher that stops reporting a record no longer removes it.** That is
  deliberate; stale entries are a review problem, not a data-loss problem.
- **Adoption heuristics can still be wrong**, but now they are wrong in a PR.
- **The nightly PR can conflict** with hand edits on main. It rebuilds its
  branch from scratch each run, so the fix is to close it and let the next run
  open a fresh one.
