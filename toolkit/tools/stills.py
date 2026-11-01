"""Render preview stills of a toolkit HTML page with headless Chrome or Edge.

    python stills.py PAGE.html OUT_DIR 1@2.5 1@8 3@12.0 ...

Each frame is SCENE@SECONDS (scene number from 1, seconds local to that scene).
Use 0@SECONDS for an absolute time on the full reel.
"""
import pathlib
import sys

import _chrome


def render(page: pathlib.Path, out_dir: pathlib.Path, spec: str, width: int, height: int) -> str:
    scene, sec = spec.split("@")
    query = f"frame={sec}" + (f"&scene={scene}" if scene != "0" else "")
    url = page.resolve().as_uri() + "?" + query
    out = out_dir / f"s{scene}_{sec.replace('.', '_')}.png"
    for _ in range(2):
        out.unlink(missing_ok=True)
        _chrome.run([f"--window-size={width},{height}", "--virtual-time-budget=2500", f"--screenshot={out}", url],
                    timeout=60, until_file=out)
        if out.exists() and out.stat().st_size > 0:
            return str(out)
    return f"{out}  (failed)"


def main() -> None:
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    page, out_dir = pathlib.Path(sys.argv[1]).resolve(), pathlib.Path(sys.argv[2]).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    _chrome.browser()
    # One browser at a time: two headless swiftshader launches started together tend to hang.
    for spec in sys.argv[3:]:
        print(render(page, out_dir, spec, 1280, 720), flush=True)


if __name__ == "__main__":
    main()
