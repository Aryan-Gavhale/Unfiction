"""Render a contact sheet of a toolkit page: a row of frames for every scene, on one JPEG.

    python contact_sheet.py PAGE.html [OUT.jpg] [--frames N]

OUT defaults to PAGE-sheet.jpg beside the page. N frames per scene (default 4, at most 12),
spread evenly through each scene and stamped with their scene-local time.
"""
import base64
import pathlib
import sys

import _chrome


def main() -> None:
    args, frames = [], 4
    it = iter(sys.argv[1:])
    for a in it:
        if a == "--frames":
            frames = int(next(it, "4"))
        else:
            args.append(a)
    if len(args) not in (1, 2):
        sys.exit(__doc__)
    page = pathlib.Path(args[0]).resolve()
    if not page.exists():
        sys.exit(f"{page} not found.")
    out = pathlib.Path(args[1]).resolve() if len(args) == 2 else page.with_name(f"{page.stem}-sheet.jpg")
    text = _chrome.extract(_chrome.dump(page, f"sheet={frames}", timeout=300, budget=1500), "uf-sheet")
    if text is None or not text.startswith("data:image/jpeg;base64,"):
        sys.exit(_chrome.plain(text or f"{page.name} wrote no contact sheet. Open it in Chrome and look at the console."))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(base64.b64decode(text.split(",", 1)[1]))
    print(f"{out}  ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
