"""Shared headless Chrome / Edge helpers for the toolkit tools.

Every launch gets a throwaway profile and is killed as a whole process tree when it
hangs, so no GPU or renderer process is left running in the background.
"""
import html
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import time

CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]

BASE_FLAGS = [
    "--headless=new", "--no-first-run", "--no-default-browser-check", "--disable-extensions",
    "--disable-background-networking", "--disable-component-update", "--disable-sync",
    "--disable-gpu-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars",
]


def browser() -> str:
    for c in CANDIDATES:
        if pathlib.Path(c).exists():
            return c
    found = shutil.which("chrome") or shutil.which("msedge") or shutil.which("google-chrome")
    if not found:
        sys.exit("Chrome or Edge not found.")
    return found


def kill_tree(proc: subprocess.Popen) -> None:
    if proc.poll() is not None:
        return
    if sys.platform == "win32":
        subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    else:
        proc.kill()
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        pass


def run(args: list, timeout: float = 60, stdout=None, until_file: pathlib.Path | None = None) -> bool:
    """Run the browser with a fresh profile. Returns False on timeout.

    With until_file, the run also ends once that file exists and has stopped growing,
    which skips the occasional hang on exit after a screenshot is written.
    """
    with tempfile.TemporaryDirectory(prefix="uf-chrome-", ignore_cleanup_errors=True) as profile:
        cmd = [browser(), *BASE_FLAGS, f"--user-data-dir={profile}", *args]
        proc = subprocess.Popen(cmd, stdout=stdout or subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        end, last = time.monotonic() + timeout, -1
        try:
            while time.monotonic() < end:
                if proc.poll() is not None:
                    return True
                if until_file is not None and until_file.exists():
                    size = until_file.stat().st_size
                    if size > 0 and size == last:
                        return True
                    last = size
                time.sleep(0.5)
            return False
        finally:
            kill_tree(proc)


def dump(page: pathlib.Path, query: str = "", timeout: float = 120, budget: int = 4000, size=(1280, 720)) -> str:
    """Load PAGE?QUERY and return the DOM after the page's scripts have run."""
    url = page.resolve().as_uri() + (f"?{query}" if query else "")
    with tempfile.TemporaryFile() as out:
        ok = run([f"--window-size={size[0]},{size[1]}", f"--virtual-time-budget={budget}", "--dump-dom", url], timeout, stdout=out)
        out.seek(0)
        text = out.read().decode("utf-8", "replace")
    if not ok and not text:
        sys.exit(f"Browser timed out loading {page.name}.")
    return text


PLAIN = str.maketrans({"·": "|", "—": "-", "–": "-", "‘": "'", "’": "'", "“": '"', "”": '"', "…": "...", "≈": "~", "•": "*", "×": "x"})


def plain(text: str) -> str:
    """ASCII text for the console; Windows PowerShell mis-decodes anything else."""
    return text.translate(PLAIN).encode("ascii", "replace").decode("ascii")


def extract(dom: str, element_id: str) -> str | None:
    """Text content of <pre id=ELEMENT_ID> in a dumped DOM, or None when the page did not write it."""
    m = re.search(rf'<pre id="{re.escape(element_id)}"[^>]*>(.*?)</pre>', dom, re.S)
    return html.unescape(m.group(1)) if m else None
