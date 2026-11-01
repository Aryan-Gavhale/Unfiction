"""Time how long each scene of a toolkit page takes to draw, in headless Chrome or Edge.

    python perf.py PAGE.html [SAMPLES]

Draws every scene at SAMPLES points (default 12) and prints the mean and worst milliseconds per
frame, without the film-look pass. Export records in real time, so a scene that is slow to draw
drops frames.

The page is drawn in software here, which is several times slower than Chrome with a GPU, so
read the numbers against each other rather than against 16 ms: the "floor" is an empty black
frame, and scenes far heavier than the rest of the page are flagged as the ones to simplify.
"""
import json
import pathlib
import statistics
import sys
import tempfile

import _chrome


def main() -> None:
    sys.stdout.reconfigure(errors="replace")
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args or len(args) > 2:
        sys.exit(__doc__)
    page = pathlib.Path(args[0]).resolve()
    if not page.exists():
        sys.exit(f"{page} not found.")
    samples = int(args[1]) if len(args) > 1 else 12
    url = page.as_uri() + f"?perf={samples}"
    # No virtual time here: it would stop the clock that the timings are read from.
    with tempfile.TemporaryFile() as out:
        _chrome.run(["--window-size=1280,720", "--dump-dom", url], timeout=900, stdout=out)
        out.seek(0)
        dom = out.read().decode("utf-8", "replace")
    text = _chrome.extract(dom, "uf-perf")
    if text is None or text.startswith("ERROR:"):
        print(_chrome.plain(text or f"{page.name} wrote no perf report. Open it in Chrome and look at the console."), file=sys.stderr)
        sys.exit(2)
    rep = json.loads(text)
    rows = rep["rows"]
    median = statistics.median(r["mean"] for r in rows) if rows else 0
    print(_chrome.plain(f"{rep['title']} | {len(rows)} scenes | {rep['samples']} samples each | "
                        f"ms per frame in software | floor {rep['floor']:.1f} | page median {median:.1f}"))
    for r in rows:
        flag = "  HEAVY" if r["max"] > 2.5 * median and r["max"] > 4 * rep["floor"] else ""
        print(_chrome.plain(f"  {r['scene']:>2}  {r['id']:<34} mean {r['mean']:6.1f}   worst {r['max']:6.1f} at {r['at']:5.1f}s{flag}"))


if __name__ == "__main__":
    main()
