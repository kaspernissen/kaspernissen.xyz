#!/usr/bin/env python3
"""Render a share image in the kaspernissen.xyz hero style.

A headless Chromium screenshots template.html at the exact output size. The
hero's look is CSS -- rotated rounded chips, tracking-tight Inter, a hard
offset drop-shadow -- so reproducing it in an image library would mean
reimplementing rotated rounded rectangles and font metrics by hand for a worse
match. See SKILL.md.
"""

import argparse
import base64
import html
import mimetypes
import random
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
MASCOTS = REPO / "assets" / "mascots"

# Chip order is the hero's own: pink, orange, cyan, yellow.
CYCLE = ["pink", "orange", "cyan", "yellow"]
COLOURS = set(CYCLE) | {"violet"}

# Confetti colours, matching the hero's cyan / pink / yellow dots.
DOT_COLOURS = ["#22d3ee", "#ec4899", "#facc15"]

PRESETS = {
    #                w     h   pad  font kicker mascot-frac  gap
    "square": dict(w=1024, h=1024, pad=80, font=78, kicker=22, mascot=0.70, gap=24, stack=True),
    "wide":   dict(w=1920, h=1080, pad=120, font=124, kicker=30, mascot=0.40, gap=56, stack=False),
    # padl: LinkedIn overlays the profile photo on a cover's lower-left.
    "banner": dict(w=1584, h=396, pad=64, padl=380, font=62, kicker=18, mascot=0.24, gap=48, stack=False),
    # A share card is read at thumbnail size in a feed or a chat, so the
    # headline is sized to survive that: a narrower mascot and a tighter pad
    # buy the copy the width it needs to hold a larger face.
    "card":   dict(w=1200, h=627, pad=64, font=96, kicker=24, mascot=0.30, gap=36, stack=False),
}


# Shrinks the headline until it fits its box in both directions. Chips are
# nowrap, so an over-long chip shows up as overflowing width and is caught here
# rather than breaking across lines.
FIT_JS = """(start) => {
  const copy = document.getElementById('copy');
  const inner = document.getElementById('copyinner');
  const h1 = document.querySelector('h1');
  let size = start;
  const fits = () =>
    inner.offsetHeight <= copy.clientHeight && inner.scrollWidth <= copy.clientWidth;
  while (size > 14 && !fits()) {
    size -= 2;
    h1.style.fontSize = size + 'px';
  }
  return size;
}"""

# Thins the candidate confetti down to a spread subset that clears the type.
# Runs after the fit passes, because only then is the headline at its final
# size and its line boxes where they will actually be.
DECOR_JS = """(opts) => {
  const h1 = document.querySelector('h1');
  const kicker = document.getElementById('kicker');
  const mascot = document.querySelector('#mascot img');

  // Per line box, not the h1's block box: a block box spans the full column
  // width, so short last lines would fence off empty space beside them.
  const keep = [];
  const range = document.createRange();
  range.selectNodeContents(h1);
  for (const r of range.getClientRects()) if (r.width) keep.push(r);
  if (kicker) keep.push(kicker.getBoundingClientRect());
  // The banner's reserved corner: LinkedIn lays the profile photo over it, so
  // confetti placed there is simply covered up, and the cover renders sparser
  // than it looks here.
  if (opts.reserve) keep.push(opts.reserve);
  if (mascot) {
    // Inset: a PNG's box includes its transparent margin, and decor sits
    // behind the figure anyway, so only the opaque core needs protecting.
    const b = mascot.getBoundingClientRect();
    const ix = b.width * 0.16, iy = b.height * 0.1;
    keep.push({left: b.left + ix, right: b.right - ix,
               top: b.top + iy, bottom: b.bottom - iy});
  }

  const grow = opts.grow;
  const clear = (b) => !keep.some(k =>
    b.left < k.right + grow && b.right > k.left - grow &&
    b.top < k.bottom + grow && b.bottom > k.top - grow);

  const thin = (sel, want, start, floor) => {
    const free = [];
    for (const el of document.querySelectorAll(sel)) {
      const b = el.getBoundingClientRect();
      if (!clear(b)) { el.remove(); continue; }
      free.push({el, b, x: b.left + b.width / 2, y: b.top + b.height / 2});
    }
    // Farthest-first: accept a candidate only if it stands clear of the ones
    // already accepted, relaxing the spacing until enough fit. Without this
    // the survivors clump into whatever gap the copy happens to leave.
    // `floor` is where relaxing stops: past it, fewer marks beat tangled ones.
    let gap = start, taken = [];
    while (true) {
      taken = [];
      for (const c of free) {
        if (taken.every(t => Math.hypot(t.x - c.x, t.y - c.y) >= gap)) taken.push(c);
        if (taken.length >= want) break;
      }
      if (taken.length >= want || gap < floor) break;
      gap *= 0.82;
    }
    const kept = new Set(taken.map(t => t.el));
    for (const {el} of free) if (!kept.has(el)) el.remove();
    return taken;
  };

  // Squiggles first, and the ones that land become keep-out for the dots.
  // They are the biggest marks and the only ones that read as tangled when
  // they touch, so they get the pick of the space and a hard spacing floor.
  const squigs = thin('.squig.cand', opts.squigs, opts.spread * 1.6, opts.spread);
  for (const s of squigs) keep.push(s.b);
  const dots = thin('.dot.cand', opts.dots, opts.spread, 12);
  return [dots.length, squigs.length];
}"""

# The kicker is one line by definition — it is a label, not a sentence. Let it
# wrap and it reads as a typo, and at 0.18em tracking even a short credit line
# wraps on a card. Shrink it to fit instead of trimming the words.
KICKER_JS = """(start) => {
  const el = document.getElementById('kicker');
  if (!el) return start;
  el.style.whiteSpace = 'nowrap';
  let size = start;
  while (size > 9 && el.scrollWidth > el.parentElement.clientWidth) {
    size -= 1;
    el.style.fontSize = size + 'px';
  }
  return size;
}"""


def parse_headline(text):
    """Turn "a {b|cyan} c" into HTML, cycling chip colours and tilts."""
    out, i, n = [], 0, 0
    for m in re.finditer(r"\{([^{}|]+)(?:\|([a-z]+))?\}", text):
        out.append(html.escape(text[i:m.start()]))
        label, colour = m.group(1), m.group(2)
        if colour and colour not in COLOURS:
            sys.exit(f"unknown chip colour {colour!r}; use one of {', '.join(sorted(COLOURS))}")
        colour = colour or CYCLE[n % len(CYCLE)]
        tilt = "a" if n % 2 == 0 else "b"
        out.append(f'<span class="chip {colour} {tilt}">{html.escape(label)}</span>')
        i, n = m.end(), n + 1
    out.append(html.escape(text[i:]))
    if n == 0:
        print("note: no {chips} in the headline — it will render as plain text", file=sys.stderr)
    return "".join(out)


def decor(rng, w, h, pad):
    """Candidate confetti and squiggles, scattered over the whole frame.

    These are candidates, not final placements: far more are emitted than are
    wanted, spread on a jittered grid, and DECOR_JS keeps a well-spaced subset
    of the ones that miss the type and the mascot. Confining them to the left
    and right margins here instead — the obvious way to keep them off the
    headline — is what makes a cover look edged rather than scattered, and it
    cannot be fixed from Python: the headline is auto-fitted after layout, so
    its real box is not known until the browser has it.
    """
    bits = []
    unit = max(10, round(w / 150))
    m = unit * 1.2
    # One candidate per cell, jittered inside it, so the pool itself is even
    # and the survivors inherit that evenness wherever the copy leaves room.
    cols, rows = 8, 5
    for r in range(rows):
        for c in range(cols):
            size = rng.choice([unit, round(unit * 1.3), round(unit * 1.7)])
            x = m + (w - 2 * m - size) * (c + rng.uniform(0.15, 0.85)) / cols
            y = m + (h - 2 * m - size) * (r + rng.uniform(0.15, 0.85)) / rows
            bits.append(
                f'<span class="dot cand" style="left:{x:.0f}px;top:{y:.0f}px;'
                f'width:{size}px;height:{size}px;background:{rng.choice(DOT_COLOURS)}"></span>'
            )
    # The exact path from Hero.astro, scaled to the canvas.
    s = max(1.0, w / 750)
    for _ in range(10):
        sx = rng.uniform(m, w - m - 58 * s)
        sy = rng.uniform(m, h - m - 20 * s)
        bits.append(
            f'<svg class="squig cand" style="position:absolute;left:{sx:.0f}px;top:{sy:.0f}px" '
            f'width="{58*s:.0f}" height="{20*s:.0f}" viewBox="0 0 58 20">'
            '<path d="M2 10 Q10 2 18 10 T34 10 T50 10 L56 10" stroke="#7c3aed" '
            'stroke-width="3.5" fill="none" stroke-linecap="round" /></svg>'
        )
    return "".join(bits)


def data_uri(path):
    mime = mimetypes.guess_type(path.name)[0] or "image/png"
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def build_html(args, p):
    w, h, pad = p["w"], p["h"], p["pad"]
    rng = random.Random(args.seed if args.seed is not None else f"{args.headline}{args.size}")

    mascot_html, mascot_w = "", 0
    if args.mascot:
        name = args.mascot
        if name == "random":
            choices = sorted(f.stem for f in MASCOTS.glob("*.png"))
            if not choices:
                sys.exit(f"no mascots in {MASCOTS}")
            name = rng.choice(choices)
            print(f"mascot: {name}", file=sys.stderr)
        path = MASCOTS / f"{name}.png"
        if not path.exists():
            have = ", ".join(sorted(f.stem for f in MASCOTS.glob("*.png")))
            sys.exit(f"no mascot {name!r} in {MASCOTS}\navailable: {have}")
        mascot_w = int(w * p["mascot"] * args.mascot_scale)
        mascot_html = f'<div id="mascot"><img src="{data_uri(path)}" alt="" /></div>'

    # Scaled off the mascot, not the canvas: the hero's offset reads as a hard
    # shadow because it is large relative to the figure, and at banner sizes a
    # canvas-scaled offset shrinks into a thin outline.
    shadow = max(4, round((mascot_w or w) / 45))
    tpl = (HERE / "template.html").read_text()
    subs = {
        "__W__": w, "__H__": h, "__PAD__": pad, "__GAP__": p["gap"],
        "__PADL__": p.get("padl", pad),
        # Past the frame edge, so the mascots' square-cut chest and the
        # bar of yellow shadow beneath it fall outside the image.
        "__MASCOTDROP__": pad + round(mascot_w * 0.09),
        "__FONT__": p["font"], "__KICKER__": p["kicker"],
        "__KICKGAP__": round(p["font"] * 0.22),
        "__RADIUS__": max(6, round(p["font"] * 0.10)),
        "__CHIPX__": round(p["font"] * 0.13),
        "__CHIPY__": round(p["font"] * 0.03),
        "__MASCOTW__": mascot_w,
        "__SHX__": shadow, "__SHY__": round(shadow * 1.2),
        "__STAGECLASS__": ("stack" if p["stack"] else "") + (" flip" if args.flip else ""),
        "__DECOR__": decor(rng, w, h, pad),
        "__HEADLINE__": parse_headline(args.headline),
        "__KICKERHTML__": f'<div id="kicker">{html.escape(args.kicker)}</div>' if args.kicker else "",
        "__MASCOTHTML__": mascot_html,
    }
    for k, v in subs.items():
        tpl = tpl.replace(k, str(v))
    return tpl


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--size", choices=sorted(PRESETS), default="wide")
    ap.add_argument("--headline", required=True, help='e.g. "Observability is a {platform|cyan} problem"')
    ap.add_argument("--kicker", help="small uppercase line above the headline")
    ap.add_argument("--mascot", help="name from assets/mascots, or 'random'")
    ap.add_argument("--flip", action="store_true", help="mascot on the left")
    # The presets size the mascot to leave the headline the width it needs. A
    # short headline does not need all of it, so this trades that slack back to
    # the figure; the type auto-fits to whatever is left.
    ap.add_argument("--mascot-scale", type=float, default=1.0,
                    help="multiply the preset's mascot width, e.g. 1.4 for a bigger figure")
    ap.add_argument("--seed", help="fix the confetti")
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()

    p = PRESETS[args.size]
    markup = build_html(args, p)

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit("playwright is not installed: pip install playwright && playwright install chromium")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        # deviceScaleFactor 1: the preset sizes are the real output sizes.
        page = browser.new_page(viewport={"width": p["w"], "height": p["h"]}, device_scale_factor=1)
        page.set_content(markup, wait_until="networkidle")
        # Must settle before fitting: measuring against the fallback sans gives
        # a size that is wrong once Inter arrives and every line rebreaks.
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(250)
        # Kicker first: it sits above the headline, so shrinking it frees
        # height the headline may then be able to use.
        kick = page.evaluate(KICKER_JS, p["kicker"])
        if kick < p["kicker"]:
            print(f"kicker shrunk {p['kicker']} -> {kick}px to fit one line", file=sys.stderr)
        final = page.evaluate(FIT_JS, p["font"])
        if final < p["font"]:
            print(f"headline shrunk {p['font']} -> {final}px to fit", file=sys.stderr)
        # Last: the confetti is placed against the type's final boxes.
        reserve = None
        if p.get("padl", p["pad"]) > p["pad"]:
            reserve = {"left": 0, "right": p["padl"],
                       "top": p["h"] * 0.2, "bottom": p["h"]}
        dots, squigs = page.evaluate(DECOR_JS, {
            "dots": 9, "squigs": 2,
            "spread": min(p["w"], p["h"]) / 3.0,
            "grow": p["pad"] * 0.3,
            "reserve": reserve,
        })
        if dots < 9 or squigs < 2:
            print(f"decor: room for {dots} dots and {squigs} squiggles", file=sys.stderr)
        page.screenshot(path=str(args.out))
        browser.close()
    print(f"{args.out}  {p['w']}x{p['h']}")


if __name__ == "__main__":
    main()
