"""Verify BMD calculations and layouts in headless Chrome with screenshots."""
from __future__ import annotations

import base64
import json
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import urllib.request
import websocket

ROOT = Path(__file__).resolve().parents[1]
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
OUT = ROOT / "artifacts/bmd-check"
sys.path.insert(0, str(ROOT / "scripts"))
from check_positioning import DevTools, wait_for  # noqa: E402


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    profile = Path(tempfile.mkdtemp(prefix="radiotomy-bmd-chrome-"))
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
            raise TimeoutError("Chrome debugging port did not start")
        port = int(port_file.read_text().splitlines()[0])
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list", timeout=5) as response:
            target = next(item for item in json.load(response) if item.get("type") == "page")
        socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=15, suppress_origin=True)
        dev = DevTools(socket)
        dev.call("Runtime.enable")
        dev.call("Network.enable")
        dev.call("Page.enable")
        dev.call("Log.enable")
        dev.call("Page.navigate", {"url": "http://localhost:8000/bmd"})
        wait_for(dev, "document.readyState === 'complete' && !!document.querySelector('[data-page=bmd]')")
        dev.evaluate("document.querySelector('[data-page=bmd]').click()")
        wait_for(dev, "!document.querySelector('#page-bmd').hidden && !!window.bmdTScoreToPercent")

        edge_values = [-4.5, -2.5, -1.9, -1.0, 0, 2.5]
        edge_results = []
        for score in edge_values:
            # score = (BMD - 5.000) / 1.000; BMD stays nonnegative.
            dev.evaluate(f"document.querySelector('#bmd-group').value='t'; document.querySelector('#bmd-value').value='{5 + score:.3f}'; document.querySelector('#bmd-mean').value='5.000'; document.querySelector('#bmd-sd').value='1.000'; document.querySelector('#bmd-value').dispatchEvent(new Event('input',{{bubbles:true}}))")
            result = dev.evaluate("(() => {const bar=document.querySelector('#score-scale').getBoundingClientRect(), marker=document.querySelector('#score-marker').getBoundingClientRect(), x=marker.left+marker.width/2; return {score:parseFloat(document.querySelector('#bmd-score').textContent.replace('−','-')), expected:window.bmdTScoreToPercent(parseFloat(document.querySelector('#bmd-score').textContent.replace('−','-'))), actual:((x-bar.left)/bar.width)*100, out:document.querySelector('#bmd-out-of-range').textContent, bounds:[...document.querySelectorAll('.scale-band')].map(x=>parseFloat(x.style.width)), labels:[...document.querySelectorAll('.scale-tick')].map(x=>parseFloat(x.style.left))}})()")
            if abs(result["actual"] - result["expected"]) > 0.7:
                raise AssertionError(f"Marker position mismatch for {score}: {result}")
            if result["score"] != score:
                raise AssertionError(f"Score mismatch for {score}: {result}")
            if score < -4 or score > 2:
                if not result["out"]:
                    raise AssertionError(f"Missing out-of-range notice for {score}")
            else:
                if result["out"]:
                    raise AssertionError(f"Unexpected out-of-range notice for {score}")
            if result["bounds"] != [25, 25, 50] or result["labels"] != [25, 50]:
                raise AssertionError(f"Scale boundaries do not match thresholds: {result}")
            edge_results.append({"value": score, "marker_percent": round(result["actual"], 2), "expected_percent": result["expected"], "out_of_scale": bool(result["out"])})

        # Required validation is checked directly in the browser; do not display a result for invalid input.
        validation = dev.evaluate("(() => {const i=document.querySelector('#bmd-value'); i.value=''; i.dispatchEvent(new Event('input',{bubbles:true})); const empty={error:document.querySelector('#bmd-value-error').textContent,hidden:document.querySelector('#bmd-result').hidden}; i.value='not-a-number'; i.dispatchEvent(new Event('input',{bubbles:true})); const nonNumber={error:document.querySelector('#bmd-value-error').textContent,hidden:document.querySelector('#bmd-result').hidden}; i.value='-0.100'; i.dispatchEvent(new Event('input',{bubbles:true})); const negative={error:document.querySelector('#bmd-value-error').textContent,hidden:document.querySelector('#bmd-result').hidden}; document.querySelector('#bmd-mean').value='-1'; document.querySelector('#bmd-mean').dispatchEvent(new Event('input',{bubbles:true})); const negativeMean={error:document.querySelector('#bmd-mean-error').textContent,hidden:document.querySelector('#bmd-result').hidden}; document.querySelector('#bmd-mean').value='1'; document.querySelector('#bmd-sd').value='0'; document.querySelector('#bmd-sd').dispatchEvent(new Event('input',{bubbles:true})); const sd={error:document.querySelector('#bmd-sd-error').textContent,hidden:document.querySelector('#bmd-result').hidden}; document.querySelector('#bmd-sd').value='0.1'; i.value='2.001'; i.dispatchEvent(new Event('input',{bubbles:true})); return {empty,nonNumber,negative,negativeMean,sd,highBmdWarning:document.querySelector('#bmd-warning').textContent}})()")
        fields = [validation[key] for key in ["empty", "nonNumber", "negative", "negativeMean", "sd"]]
        if not all(item["error"] and item["hidden"] for item in fields) or "2.0" not in validation["highBmdWarning"]:
            raise AssertionError(f"Validation failed: {validation}")
        dev.evaluate("document.querySelector('#bmd-group').value='z'; document.querySelector('#bmd-value').value='0.810'; document.querySelector('#bmd-mean').value='1.000'; document.querySelector('#bmd-sd').value='0.100'; document.querySelector('#bmd-sd').dispatchEvent(new Event('input',{bubbles:true}))")
        z_above = dev.evaluate("({label:document.querySelector('#bmd-label').textContent,copy:document.querySelector('#bmd-education').textContent+' '+document.querySelector('#bmd-label').textContent})")
        if z_above["label"] != "อยู่ในช่วงที่คาดตามอายุ" or "กระดูกพรุน" in z_above["copy"] or "กระดูกบาง" in z_above["copy"]:
            raise AssertionError(f"Z-score mode text is incorrect: {z_above}")

        screenshots = []
        layout_data = []
        for width, height in [(1366, 900), (1920, 1080)]:
            dev.call("Emulation.setDeviceMetricsOverride", {"width": width, "height": height, "deviceScaleFactor": 1, "mobile": False})
            for mode in ["t", "z"]:
                dev.evaluate(f"document.querySelector('#bmd-group').value='{mode}'; document.querySelector('#bmd-value').value='0.800'; document.querySelector('#bmd-mean').value='1.000'; document.querySelector('#bmd-sd').value='0.100'; document.querySelector('#bmd-sd').dispatchEvent(new Event('input',{{bubbles:true}}))")
                wait_for(dev, "!document.querySelector('#bmd-result').hidden")
                state = dev.evaluate("(() => ({label:document.querySelector('#bmd-label').textContent,score:document.querySelector('#bmd-score').textContent,formula:document.querySelector('#bmd-formula').textContent,scaleHidden:document.querySelector('#bmd-scale-wrap').hidden,spine:!!document.querySelector('#spine-diagram svg'),spineRect:document.querySelector('#spine-diagram').getBoundingClientRect().toJSON(),rightCard:document.querySelector('#page-bmd .position-right .card').getBoundingClientRect().toJSON(),leftNote:document.querySelector('#page-bmd .tool-left > p:last-child').getBoundingClientRect().toJSON(),bodyWidth:document.body.scrollWidth,viewportWidth:innerWidth,bodyHeight:document.body.scrollHeight,viewportHeight:innerHeight}))()")
                if mode == "z" and (state["label"] != "ต่ำกว่าช่วงที่คาดตามอายุ" or not state["scaleHidden"]):
                    raise AssertionError(f"Z-score mode is incorrect: {state}")
                if mode == "t" and state["scaleHidden"]:
                    raise AssertionError(f"T-score scale is missing: {state}")
                if not state["spine"]:
                    raise AssertionError("The authored L1-L4 illustration did not render")
                if state["bodyWidth"] > width:
                    raise AssertionError(f"Horizontal overflow at {width}: {state}")
                shot = OUT / f"bmd-{mode}-{width}.png"
                data = dev.call("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})["data"]
                shot.write_bytes(base64.b64decode(data))
                screenshots.append(str(shot.relative_to(ROOT)))
                layout_data.append({"width": width, "mode": mode.upper(), "label": state["label"], "score": state["score"], "formula": state["formula"], "layout": {"spine_visible": state["spineRect"]["height"] > 0, "education_card_bottom": round(state["rightCard"]["bottom"]), "left_note_bottom": round(state["leftNote"]["bottom"]), "viewport_height": height}})

        time.sleep(0.4)
        summary = {"url": "http://localhost:8000/bmd", "marker_checks": edge_results, "validation": validation, "screenshots": screenshots, "layout_and_modes": layout_data, "console_errors": dev.errors, "failed_responses": dev.failed_responses}
        (OUT / "result.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
        sys.stdout.reconfigure(encoding="utf-8")
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        if dev.errors:
            raise AssertionError(f"Chrome console errors: {dev.errors}")
        if dev.failed_responses:
            raise AssertionError(f"Failed browser requests: {dev.failed_responses}")
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()


if __name__ == "__main__":
    main()
