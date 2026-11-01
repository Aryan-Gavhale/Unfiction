"""Save YouTube thumbnails from a toolkit page: 1280x720 JPEG, under 2 MB.

    python thumbnail.py PAGE.html OUT_DIR 1@2.5 [2@4 ...]

Each frame is SCENE@SECONDS (scene number from 1, seconds local to that scene), as in stills.py.
Files are named thumb-SCENE-SECONDS.jpg. Grain is turned down for these frames so they compress
cleanly; everything else matches the video.
"""
import base64
import pathlib
import struct
import sys

import _chrome

LIMIT = 2_000_000


def jpeg_size(data: bytes) -> tuple[int, int]:
    """(width, height) from a JPEG's frame header."""
    i = 2
    while i + 9 < len(data):
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker in (0xC0, 0xC1, 0xC2):
            h, w = struct.unpack(">HH", data[i + 5:i + 9])
            return w, h
        if marker == 0x01 or 0xD0 <= marker <= 0xD8:
            i += 2
            continue
        i += 2 + struct.unpack(">H", data[i + 2:i + 4])[0]
    raise ValueError("not a JPEG")


def main() -> None:
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    page, out_dir = pathlib.Path(sys.argv[1]).resolve(), pathlib.Path(sys.argv[2]).resolve()
    if not page.exists():
        sys.exit(f"{page} not found.")
    out_dir.mkdir(parents=True, exist_ok=True)
    failed = False
    # One browser at a time: two headless swiftshader launches started together tend to hang.
    for spec in sys.argv[3:]:
        scene, sec = spec.split("@")
        text = _chrome.extract(_chrome.dump(page, f"scene={scene}&frame={sec}&thumb", timeout=120, budget=1500), "uf-thumb")
        if text is None or not text.startswith("data:image/jpeg;base64,"):
            print(_chrome.plain(f"{spec}: {text or 'no thumbnail written'}"))
            failed = True
            continue
        data = base64.b64decode(text.split(",", 1)[1])
        out = out_dir / f"thumb-{scene}-{sec.replace('.', '_')}.jpg"
        out.write_bytes(data)
        w, h = jpeg_size(data)
        ok = (w, h) == (1280, 720) and len(data) < LIMIT
        failed |= not ok
        print(f"{out}  {w}x{h}, {len(data) // 1024} KB{'' if ok else '  (NOT a valid YouTube thumbnail)'}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
