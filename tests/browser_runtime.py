"""
Shared Chromium resolution and CDP session management for v07 browser tests.

All CDP scripts must resolve the Chromium binary through resolve_chromium()
rather than maintaining their own lookup lists.
"""
import glob
import json
import os
import shutil
import socket
import subprocess
import tempfile
import time

import requests
import websocket


def resolve_chromium(diagnostic: bool = False) -> str:
    """
    Return the path to a usable Chromium executable.

    Resolution order (first match wins):
    1. TAROKE_CHROMIUM_PATH env var — validated file + executable
    2. PLAYWRIGHT_BROWSERS_PATH env var — glob for chrome-linux64/chrome,
       chrome-linux/chrome inside the directory tree
    3. ~/.cache/ms-playwright and /root/.cache/ms-playwright — same glob
    4. Hardcoded /opt/pw-browsers layouts (present in the dev container)
    5. PATH executables — chromium-browser, chromium, google-chrome
    6. Raise RuntimeError (fail clearly; never silently misuse wrong binary)
    """
    candidates = []

    def _add_glob(base: str, *patterns: str):
        for pat in patterns:
            for m in sorted(glob.glob(os.path.join(base, pat))):
                if os.path.isfile(m) and os.access(m, os.X_OK):
                    candidates.append(m)

    # 1. Explicit override
    explicit = os.environ.get("TAROKE_CHROMIUM_PATH", "").strip()
    if explicit and os.path.isfile(explicit) and os.access(explicit, os.X_OK):
        candidates.append(explicit)

    # 2. PLAYWRIGHT_BROWSERS_PATH
    pw_base = os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "").strip()
    if pw_base and os.path.isdir(pw_base):
        _add_glob(pw_base,
                  "chromium*/chrome-linux64/chrome",
                  "chromium*/chrome-linux/chrome",
                  "chromium*/chrome")

    # 3. Default Playwright cache dirs
    for cache in [
        os.path.expanduser("~/.cache/ms-playwright"),
        "/root/.cache/ms-playwright",
    ]:
        if os.path.isdir(cache):
            _add_glob(cache,
                      "chromium*/chrome-linux64/chrome",
                      "chromium*/chrome-linux/chrome",
                      "chromium*/chrome")

    # 4. Container / dev-environment hardcoded paths
    for c in [
        "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
        "/opt/pw-browsers/chromium/chrome-linux/chrome",
        "/opt/pw-browsers/chromium",
    ]:
        if os.path.isfile(c) and os.access(c, os.X_OK):
            candidates.append(c)

    # 5. PATH executables
    for name in ["chromium-browser", "chromium", "google-chrome"]:
        found = shutil.which(name)
        if found:
            candidates.append(found)

    if not candidates:
        raise RuntimeError(
            "No usable Chromium binary found. "
            "Set TAROKE_CHROMIUM_PATH or install Playwright with "
            "'npx playwright install --with-deps chromium'."
        )

    chosen = candidates[0]
    if diagnostic:
        print(f"[browser_runtime] chromium: {chosen}")
    return chosen


def alloc_port(base: int = 9200) -> int:
    """Return a free TCP port starting at base."""
    for port in range(base, base + 200):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    raise RuntimeError(f"No free port found in range {base}–{base + 200}")


def page_ws_url(port: int, timeout: float = 30) -> str:
    """
    Return the DevTools WebSocket URL of Chrome's first page target.

    /json/version can answer before Chrome has created the initial
    about:blank tab, so /json may briefly be an empty list. Poll until a
    page target exists instead of indexing [0] immediately.
    """
    deadline = time.time() + timeout
    while True:
        try:
            targets = requests.get(f"http://127.0.0.1:{port}/json", timeout=2).json()
            pages = [t for t in targets if t.get("type") == "page" and t.get("webSocketDebuggerUrl")]
            if pages:
                return pages[0]["webSocketDebuggerUrl"]
        except Exception:
            pass
        if time.time() > deadline:
            raise RuntimeError(f"Chrome on port {port} exposed no page target within {timeout}s")
        time.sleep(0.2)


def boot_chrome(port: int, prof: str, chromium: str | None = None, timeout: int = 60):
    """
    Start a headless Chrome process on *port* with a fresh profile at *prof*.
    Returns (proc, ws, send_fn, eval_fn).

    send_fn(method, params=None)  → raw CDP response dict
    eval_fn(expr, await_p=False)  → Python value of the JS expression
    """
    chrome = chromium or resolve_chromium()
    shutil.rmtree(prof, ignore_errors=True)
    os.makedirs(prof, exist_ok=True)

    cmd = [
        chrome,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-extensions",
        "--disable-background-networking",
        "--no-first-run",
        "--no-default-browser-check",
        f"--user-data-dir={prof}",
        f"--remote-debugging-port={port}",
        "--remote-allow-origins=*",
        "about:blank",
    ]
    proc = subprocess.Popen(
        cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True
    )

    # Wait for CDP to become available
    for _ in range(timeout * 5):
        try:
            requests.get(f"http://127.0.0.1:{port}/json/version", timeout=0.2)
            break
        except Exception:
            time.sleep(0.2)
    else:
        proc.terminate()
        proc.wait(timeout=5)
        raise RuntimeError(f"Chrome DevTools on port {port} did not start within {timeout}s")

    ws_url = page_ws_url(port)
    ws = websocket.create_connection(ws_url, timeout=10)
    _cid = [0]

    def send(method, params=None):
        _cid[0] += 1
        ws.send(json.dumps({"id": _cid[0], "method": method, "params": params or {}}))
        while True:
            msg = json.loads(ws.recv())
            if msg.get("id") == _cid[0]:
                return msg

    def ev(expr, await_p=False):
        res = send(
            "Runtime.evaluate",
            {"expression": expr, "returnByValue": True, "awaitPromise": await_p},
        )
        if "exceptionDetails" in res.get("result", {}):
            detail = res["result"]["exceptionDetails"]
            raise RuntimeError(
                detail.get("text", "JS exception: " + repr(detail))
            )
        return res.get("result", {}).get("result", {}).get("value")

    send("Runtime.enable")
    send("Page.enable")
    return proc, ws, send, ev


def shutdown_chrome(proc, ws, prof: str | None = None):
    """
    Close the WebSocket, terminate the Chrome process, and remove the profile dir.
    Safe to call even if proc/ws are None.
    """
    try:
        if ws is not None:
            ws.close()
    except Exception:
        pass

    try:
        if proc is not None:
            proc.terminate()
            proc.wait(timeout=10)
    except Exception:
        try:
            if proc is not None:
                proc.kill()
                proc.wait(timeout=5)
        except Exception:
            pass

    if prof:
        shutil.rmtree(prof, ignore_errors=True)
