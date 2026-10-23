"""Open every positioning study in headless Chrome and verify local images."""

from __future__ import annotations

import base64
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

import websocket
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "http://localhost:8000/positioning"
CHROME = Path(os.environ.get("PROGRAMFILES", r"C:\Program Files")) / "Google/Chrome/Application/chrome.exe"
SCREENSHOT_DIR = ROOT / "artifacts/positioning-check"


class DevTools:
    def __init__(self, socket):
        self.socket = socket
        self.command_id = 0
        self.errors: list[str] = []
        self.external_images: set[str] = set()
        self.failed_responses: list[str] = []

    def call(self, method, params=None, timeout=15):
        self.command_id += 1
        command_id = self.command_id
        self.socket.send(json.dumps({"id": command_id, "method": method, "params": params or {}}))
        deadline = time.time() + timeout
        while time.time() < deadline:
            message = json.loads(self.socket.recv())
            if message.get("method") == "Runtime.consoleAPICalled" and message.get("params", {}).get("type") == "error":
                self.errors.append("console.error: " + " ".join(a.get("value", a.get("description", "")) for a in message["params"].get("args", [])))
            elif message.get("method") == "Runtime.exceptionThrown":
                self.errors.append("uncaught exception: " + message["params"]["exceptionDetails"].get("text", "unknown"))
            elif message.get("method") == "Log.entryAdded" and message["params"]["entry"].get("level") == "error":
                entry = message["params"]["entry"]
                self.errors.append("browser error: " + entry.get("text", "unknown") + (f" ({entry.get('url')})" if entry.get("url") else ""))
            elif message.get("method") == "Network.requestWillBeSent":
                params = message["params"]
                if params.get("type") == "Image":
                    url = params["request"]["url"]
                    if urlparse(url).hostname not in {"localhost", "127.0.0.1"}:
                        self.external_images.add(url)
            elif message.get("method") == "Network.responseReceived" and message["params"]["response"].get("status", 200) >= 400:
                response = message["params"]["response"]
                self.failed_responses.append(f"{response.get('status')} {response.get('url')}")
            if message.get("id") == command_id:
                if "error" in message:
                    raise RuntimeError(message["error"])
                return message.get("result", {})
        raise TimeoutError(method)

    def evaluate(self, expression, timeout=15):
        result = self.call("Runtime.evaluate", {"expression": expression, "returnByValue": True, "awaitPromise": True}, timeout)
        if result.get("exceptionDetails"):
            raise RuntimeError(result["exceptionDetails"].get("text", "evaluation failed"))
        return result.get("result", {}).get("value")


def wait_for(devtools, expression, timeout=15):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if devtools.evaluate(expression):
            return
        time.sleep(0.15)
    raise TimeoutError(f"Browser condition not met: {expression}")


def main():
    if not CHROME.exists():
        raise FileNotFoundError(f"Chrome not found: {CHROME}")
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    profile = Path(tempfile.mkdtemp(prefix="radiotomy-positioning-chrome-"))
    process = subprocess.Popen([
        str(CHROME), "--headless=new", "--disable-gpu", "--no-sandbox",
        "--remote-debugging-port=0", f"--user-data-dir={profile}", "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        port_file = profile / "DevToolsActivePort"
        deadline = time.time() + 20
        while not port_file.exists() and time.time() < deadline:
            if process.poll() is not None:
                raise RuntimeError(f"Chrome exited with {process.returncode}")
            time.sleep(0.1)
        if not port_file.exists():
            raise TimeoutError("Chrome remote debugging port did not start")
        port = int(port_file.read_text().splitlines()[0])
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list", timeout=5) as response:
            target = next(item for item in json.load(response) if item.get("type") == "page")
        socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=15, suppress_origin=True)
        devtools = DevTools(socket)
        devtools.call("Runtime.enable")
        devtools.call("Network.enable")
        devtools.call("Page.enable")
        devtools.call("Log.enable")
        devtools.call("Page.navigate", {"url": BASE_URL})
        wait_for(devtools, "document.readyState === 'complete' && !!document.querySelector('[data-page=positioning]')")
        devtools.evaluate("document.querySelector('[data-page=positioning]').click()")
        wait_for(devtools, "!document.querySelector('#page-positioning').hidden && document.querySelectorAll('.study-choice').length > 0")
        forbidden_media = devtools.evaluate("document.querySelectorAll('#page-positioning iframe, #page-positioning embed, #page-positioning object').length")
        if forbidden_media:
            raise AssertionError(f"Positioning page contains {forbidden_media} embedded media elements")
        studies = devtools.evaluate("JSON.stringify([...document.querySelectorAll('.study-choice')].map(b => ({id:b.dataset.study,title:b.textContent.trim()})))")
        studies = json.loads(studies)
        devtools.evaluate("document.querySelector('[data-position-tab=image]').click()")
        wait_for(devtools, "!!document.querySelector('#position-diagram img, #position-diagram .position-image-fallback')")
        metadata = json.loads((ROOT / "positioning-images.json").read_text(encoding="utf-8"))["images"]
        rows = []
        hashes: dict[str, str] = {}
        for study in studies:
            devtools.evaluate(f"document.querySelector('[data-study={json.dumps(study['id'])}]').click()")
            # The image key used by each study is also read from the active DOM data.
            key = devtools.evaluate("(() => { const b=document.querySelector('.study-choice.on'); return ({pa:'image',lateral:'lateral','ap-erect':'ap','ap-supine':'supine','ap-lordotic':'lordotic','decubitus-left':'decubitusLeft','decubitus-right':'decubitusRight'})[b.dataset.study] })()")
            expected_image = metadata[key]
            if expected_image.get("file"):
                wait_for(devtools, "(() => {const i=document.querySelector('#position-diagram img');return i && i.complete && i.naturalWidth > 0})()")
                image_result = devtools.evaluate("(() => {const i=document.querySelector('#position-diagram img');return {src:i.currentSrc,width:i.naturalWidth,height:i.naturalHeight,caption:document.querySelector('#position-diagram figcaption')?.innerText}})()")
                path = ROOT / expected_image["file"].removeprefix("./")
                digest = hashlib.sha256(path.read_bytes()).hexdigest()
                if digest in hashes:
                    raise AssertionError(f"Repeated image hash: {study['id']} matches {hashes[digest]}")
                hashes[digest] = study["id"]
                if image_result["width"] <= 0:
                    raise AssertionError(f"Image has no naturalWidth: {study['id']}")
                status = f"loaded {image_result['width']}×{image_result['height']} sha256={digest[:12]}"
            else:
                wait_for(devtools, "document.querySelector('#position-diagram .position-image-fallback')?.textContent === 'ยังไม่มีภาพสำหรับท่านี้'")
                image_result = {"src": None, "caption": None}
                status = "placeholder (no verified licensed image)"
            screenshot = devtools.call("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": True})["data"]
            screenshot_path = SCREENSHOT_DIR / f"{study['id']}.png"
            screenshot_path.write_bytes(base64.b64decode(screenshot))
            rows.append({"id": study["id"], "title": study["title"], "key": key, "status": status, "screenshot": str(screenshot_path.relative_to(ROOT)), "src": image_result["src"]})

        # Create a single visual proof sheet from the real browser screenshots.
        thumb_w, thumb_h = 360, 520
        label_h = 36
        columns = 2
        sheet = Image.new("RGB", (columns * thumb_w, ((len(rows) + 1) // 2) * (thumb_h + label_h)), "#e7edf4")
        draw = ImageDraw.Draw(sheet)
        for index, row in enumerate(rows):
            shot = Image.open(ROOT / row["screenshot"]).convert("RGB")
            shot.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
            x = (index % columns) * thumb_w + (thumb_w - shot.width) // 2
            y0 = (index // columns) * (thumb_h + label_h)
            sheet.paste(shot, (x, y0))
            draw.text(((index % columns) * thumb_w + 8, y0 + thumb_h + 6), row["title"], fill="#111820")
        sheet.save(SCREENSHOT_DIR / "contact-sheet.jpg", quality=88)

        time.sleep(1.0)
        summary = {
            "url": BASE_URL,
            "studies": rows,
            "external_image_requests": sorted(devtools.external_images),
            "console_errors": devtools.errors,
            "failed_responses": devtools.failed_responses,
            "unique_image_sha256": len(hashes),
        }
        (SCREENSHOT_DIR / "result.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
        sys.stdout.reconfigure(encoding="utf-8")
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        if devtools.external_images:
            raise AssertionError("External image requests were made")
        if devtools.errors:
            raise AssertionError("Browser console errors were recorded")
        if len(hashes) != sum(bool(item.get("file")) for item in metadata.values()):
            raise AssertionError("Not all local files are distinct and checked")
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()


if __name__ == "__main__":
    main()
