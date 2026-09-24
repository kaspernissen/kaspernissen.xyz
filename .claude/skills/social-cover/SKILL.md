---
name: social-cover
description: Use when making a share image, cover, banner, OG image or thumbnail for a talk, post or announcement — renders one in the kaspernissen.xyz hero style (dark ground, rotated highlight chips, confetti, cartoon mascot) at LinkedIn/X/OG sizes.
---

# Social covers in the site's hero style

Renders a cover image that looks like the top of kaspernissen.xyz: the near-black
ground, a headline in Inter extrabold with words sitting in rotated pink / orange
/ cyan / yellow chips, scattered confetti dots, the violet squiggle, and one of
the cartoon mascots carrying the hero's hard yellow offset shadow.

## Render one

```bash
python3 .claude/skills/social-cover/render.py \
  --size wide \
  --mascot thinking \
  --kicker "KubeCon EU 2026" \
  --headline "Observability is a {platform|cyan} problem" \
  --out /tmp/cover.png
```

Always pass `--out`. Look at the result before reporting it as done — these are
compositions, and a headline one word longer can change how it balances.

## Options

| Flag | Meaning |
|---|---|
| `--size` | `square` 1024×1024 · `wide` 1920×1080 · `banner` 1584×396 (LinkedIn profile) · `card` 1200×627 (link preview / `og:image`) |
| `--mascot` | Name from `assets/mascots/`, or `--mascot random`. Omit for none. |
| `--headline` | The line. `{...}` marks a chip. |
| `--kicker` | Small uppercase line above the headline. Optional. Shrunk to fit one line, so keep it to a short credit — a long one just renders small. |
| `--flip` | Put the mascot on the left. |
| `--mascot-scale` | Multiply the preset's mascot width. The headline auto-fits into whatever is left, so watch what the run prints: on a `card`, `1.8` still leaves a 74px headline, while `2.1` drops it to 52px and the kicker to 13px, which is too small to read at feed size. |
| `--seed` | Fixes the confetti. Same seed + same text = same image. |

## Writing the headline

Wrap the words that should sit in a coloured chip in braces, and optionally name
the colour:

```
"Observability is a {platform problem|cyan}"
"{Stop|pink} shipping {dashboards|yellow} nobody reads"
"I talk {Observability} and {Platform Engineering}"
```

Colours are `pink` `orange` `cyan` `yellow` `violet`. Leave the colour out and
chips cycle pink → orange → cyan → yellow, which is the hero's own order. Each
chip tilts alternately −1° / +1.5°, as on the site.

Keep it short. Two to six words per line, at most about ten in total — the chips
are what carry the design, and a long sentence shrinks the type until they stop
reading as chips. Chip one or two phrases, not every word.

## Picking a mascot

`ls assets/mascots` for the full set. They are one character with 18 expressions:

- **positive** — `smile` `laughing` `celebrate` `excited` `smirk` `hopeful`
- **thinking** — `thinking` `deadpan` `arms-crossed`
- **negative** — `worried` `sad` `angry` `shocked` `oops` `facepalm` `panic`
  `exasperated` `shrug`

Match the expression to the copy: `facepalm` next to a line about an outage,
`thinking` next to a question, `celebrate` next to a launch. A mismatch is the
most common way one of these comes out looking odd.

`banner` is only 396px tall, so the mascot is cropped to head and shoulders
there. Prefer a face-forward one (`smile`, `thinking`, `smirk`) for that size —
the wide-armed ones (`shrug`, `exasperated`, `celebrate`) lose their gesture.

## How it renders

A headless Chromium screenshots an HTML template at the exact pixel size. This
is deliberate: the hero's look is CSS — rotated rounded chips, `tracking-tight`,
the hard `drop-shadow` — and redrawing that in an image library means
reimplementing rotated rounded rectangles and font metrics by hand for a worse
match. The colours in `template.html` are copied from `src/styles/global.css`
and `src/components/Hero.astro`; if the site's palette changes, change them
there too.

The confetti is placed in the browser too, for the same reason. `render.py`
scatters far more dots and squiggles than it wants across the whole frame, then
— once the headline has been auto-fitted and its line boxes are final — keeps a
well-spaced subset of the ones that clear the type and the mascot. So the
scatter fills the frame instead of hugging the margins, and a long headline
simply leaves fewer places for it. If a run prints `decor: room for N dots`, the
copy and the mascot have taken most of the space; that is information, not a
fault, but it is worth a look.

Needs `playwright` with Chromium installed. Inter loads from rsms.me, the same
place the site gets it, so rendering needs network.

## The mascots themselves

`assets/mascots/*.png` are cut from two generated contact sheets by
`assets/extract-mascots.py`. Re-run that only to re-cut from the original
sheets; it overwrites all 18.

They wear a Patagonia jacket, and the generator misspelled the logo on several
("paiegonia", "gorafiohia"). Left as-is by choice. It is small at cover sizes,
but it is a third-party mark rendered wrong, so avoid crops that enlarge the
chest.
