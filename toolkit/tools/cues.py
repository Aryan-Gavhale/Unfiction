"""Export a toolkit page's cue sheet: every hit, flash and glitch, as CSV for the edit.

    python cues.py PAGE.html [OUT.csv]

OUT defaults to PAGE-cues.csv beside the page. Columns:
  reel_seconds, reel_tc          time on the full reel (export E), and as HH:MM:SS:FF
  scene, scene_id, scene_time    which scene, and the time inside it
  each_file_seconds              time inside that scene's own file (export SHIFT+E)
  type                           GLITCH, IMPACT (shake + flash), HIT (shake), FLASH, ACCENT (colour split)
  strength                       soft, medium or hard
  source                         the component (or transition) that fires it
"""
import collections
import csv
import io
import pathlib
import sys

import _chrome


def main() -> None:
    sys.stdout.reconfigure(errors="replace")
    if len(sys.argv) not in (2, 3):
        sys.exit(__doc__)
    page = pathlib.Path(sys.argv[1]).resolve()
    if not page.exists():
        sys.exit(f"{page} not found.")
    out = pathlib.Path(sys.argv[2]).resolve() if len(sys.argv) == 3 else page.with_name(f"{page.stem}-cues.csv")
    text = _chrome.extract(_chrome.dump(page, "cues", timeout=900, budget=1500), "uf-cues")
    if text is None or text.startswith("ERROR:"):
        sys.exit(_chrome.plain(text or f"{page.name} wrote no cue sheet. Open it in Chrome and look at the console."))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding="utf-8", newline="")
    rows = list(csv.DictReader(io.StringIO(text)))
    kinds = collections.Counter(r["type"] for r in rows)
    print(f"{out}  ({len(rows)} cues: " + ", ".join(f"{n} {k.lower()}" for k, n in kinds.most_common()) + ")")


if __name__ == "__main__":
    main()
