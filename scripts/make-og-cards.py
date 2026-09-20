#!/usr/bin/env python3
"""Render one share card per blog post, plus the site-wide default.

Every card is 1200x627 so it is never re-cropped by the platform. The imported
heroes could not do that job: they are whatever aspect ratio Medium happened to
store, so a share card built from one is cropped somewhere unhelpful.

Run after adding a post:  python3 scripts/make-og-cards.py
Cards are committed, so this only needs running when a post is added or the
social-cover skill's look changes.
"""
import hashlib
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
RENDER = REPO / ".claude/skills/social-cover/render.py"
OUT = REPO / "public/og"
POSTS = REPO / "src/content/blog"
MASCOTS = sorted(p.stem for p in (REPO / "assets/mascots").glob("*.png"))

# Faces that read as "here is a guide", not "something went wrong".
NEUTRAL = ["thinking", "smirk", "smile", "deadpan", "arms-crossed", "hopeful", "excited", "laughing"]


def frontmatter(path):
    text = path.read_text()
    fm = text.split("---", 2)[1]
    get = lambda k: (re.search(rf'^{k}:\s*(.*)$', fm, re.M) or [None, ""])[1].strip()
    title = get("title").strip('"')
    tags = [t.strip().strip('"') for t in get("tags").strip("[]").split(",") if t.strip()]
    return title, tags


def headline(title, tags):
    """Chip the first tag that actually appears in the title.

    Chipping a phrase that is not in the title would mean rewriting it, and a
    share card that does not match its own headline is worse than a plain one.
    """
    for tag in tags:
        words = tag.replace("-", " ")
        m = re.search(rf"\b{re.escape(words)}\b", title, re.I)
        if m:
            return f"{title[:m.start()]}{{{title[m.start():m.end()]}}}{title[m.end():]}"
    return title


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = []
    for path in sorted(POSTS.glob("*.md")):
        slug = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", path.stem)
        title, tags = frontmatter(path)
        # Stable per slug, so re-running does not reshuffle every card.
        pick = NEUTRAL[int(hashlib.sha1(slug.encode()).hexdigest(), 16) % len(NEUTRAL)]
        jobs.append((slug, headline(title, tags), tags[0].replace("-", " ") if tags else "Blog", pick))

    for slug, head, kicker, mascot in jobs:
        cmd = [sys.executable, str(RENDER), "--size", "card", "--mascot", mascot,
               "--kicker", kicker, "--headline", head, "--seed", slug,
               "--out", str(OUT / f"{slug}.png")]
        r = subprocess.run(cmd, capture_output=True, text=True)
        status = "ok" if r.returncode == 0 else f"FAILED: {r.stderr.strip()[:120]}"
        print(f"  {slug[:52]:<52} {mascot:<12} {status}")

    # The default card, used by every page that has no image of its own.
    subprocess.run([sys.executable, str(RENDER), "--size", "card", "--mascot", "smile",
                    "--kicker", "Dash0 \u00b7 CNCF Ambassador \u00b7 Golden Kubestronaut",
                    "--headline", "I talk {Observability}, {Platform Engineering} & {AI}",
                    "--seed", "default", "--out", str(REPO / "public/og-default.png")], check=True)
    print("  og-default.png")


if __name__ == "__main__":
    main()
