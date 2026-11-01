"""Run the editorial checker on a toolkit page.

    python check.py PAGE.html [--json]

Prints every finding. Exit code 0 when there are no errors (warnings allowed), 1 when there
is at least one error, 2 when the page wrote no report (a script error, or no UF.Stage).
"""
import json
import pathlib
import sys

import _chrome


def main() -> None:
    sys.stdout.reconfigure(errors="replace")
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 1:
        sys.exit(__doc__)
    page = pathlib.Path(args[0]).resolve()
    if not page.exists():
        sys.exit(f"{page} not found.")
    text = _chrome.extract(_chrome.dump(page, "check", timeout=120, budget=1500), "uf-check")
    if text is None or text.startswith("ERROR:"):
        print(_chrome.plain(text or f"{page.name} wrote no check report. Open it in Chrome and look at the console."), file=sys.stderr)
        sys.exit(2)
    rep = json.loads(text)
    if "--json" in sys.argv:
        print(json.dumps(rep, indent=2, ensure_ascii=False))
    else:
        print(_chrome.plain(f"{rep['title']} | {rep['scenes']} scenes | {rep['errors']} errors | {rep['warnings']} warnings"))
        for f in rep["findings"]:
            print(_chrome.plain(f"  {f['level'].upper():<8} scene {f['scene']:>2} ({f['id']}) | {f['rule']}"))
            print(_chrome.plain(f"           {f['message']}"))
    sys.exit(1 if rep["errors"] else 0)


if __name__ == "__main__":
    main()
