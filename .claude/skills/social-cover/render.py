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
    "card":   dict(w=1200, h=627, pad=76, font=80, kicker=22, mascot=0.36, gap=40, stack=False),
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
    """Confetti and the hero's squiggle, kept in the margins so they do not
    land on the headline."""
    bits = []
    unit = max(10, round(w / 150))
    for _ in range(rng.randint(5, 8)):
        size = rng.choice([unit, round(unit * 1.3), round(unit * 1.7)])
        # Bias towards the edges: the middle belongs to the type and the mascot.
        # Kept a clear margin in from the frame so none is sliced in half.
        m = unit * 1.5
        if rng.random() < 0.5:
            x = rng.uniform(m, max(m, pad * 0.75))
        else:
            x = rng.uniform(w - pad * 1.2, w - m - size)
        y = rng.uniform(m, h - m - size)
        bits.append(
            f'<span class="dot" style="left:{x:.0f}px;top:{y:.0f}px;'
            f'width:{size}px;height:{size}px;background:{rng.choice(DOT_COLOURS)}"></span>'
        )
    # The exact path from Hero.astro, scaled to the canvas.
    s = max(1.0, w / 900)
    sx, sy = rng.uniform(pad * 0.4, w * 0.5), rng.uniform(pad * 0.25, pad * 0.9)
    bits.append(
        f'<svg style="position:absolute;left:{sx:.0f}px;top:{sy:.0f}px" '
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
        mascot_w = int(w * p["mascot"])
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
        final = page.evaluate(FIT_JS, p["font"])
        if final < p["font"]:
            print(f"headline shrunk {p['font']} -> {final}px to fit", file=sys.stderr)
        page.screenshot(path=str(args.out))
        browser.close()
    print(f"{args.out}  {p['w']}x{p['h']}")


if __name__ == "__main__":
    main()
