from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs
from urllib.request import Request, urlopen
from io import BytesIO
from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parent
class Handler(SimpleHTTPRequestHandler):
    ROUTES = {'/', '/atlas', '/reference', '/quiz', '/positioning', '/bmd'}
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def translate_path(self, path):
        route_path = urlparse(path).path.rstrip('/') or '/'
        if route_path in self.ROUTES:
            path = '/index.html'
        return super().translate_path(path)
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path != '/nlm-proxy':
            return super().do_GET()
        target = parse_qs(parsed.query).get('url', [''])[0]
        parsed_target = urlparse(target)
        is_visible_data = parsed_target.hostname == 'data.lhncbc.nlm.nih.gov' and parsed_target.path.startswith('/public/Visible-Human/')
        is_nlm_page_asset = parsed_target.hostname == 'www.nlm.nih.gov' and parsed_target.path.startswith('/research/visible/')
        if parsed_target.scheme != 'https' or not (is_visible_data or is_nlm_page_asset):
            self.send_error(400, 'Unsupported NLM image URL')
            return
        try:
            request = Request(target, headers={'User-Agent': 'RADIOTOMY learning viewer'})
            with urlopen(request, timeout=20) as response:
                original = response.read()
            image = Image.open(BytesIO(original))
            if image.mode.startswith('I;16') or image.mode == 'I':
                values = np.asarray(image, dtype=np.uint16)
                # Preserve the 12-bit NLM grayscale range when converting to 8-bit display pixels.
                display = Image.fromarray(np.minimum(255, np.rint(values / 16)).astype(np.uint8), mode='L')
                buffer = BytesIO(); display.save(buffer, format='PNG'); payload = buffer.getvalue()
            else:
                payload = original
            self.send_response(200)
            self.send_header('Content-Type', 'image/png')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(payload)))
            self.send_header('Cache-Control', 'public, max-age=3600')
            self.end_headers(); self.wfile.write(payload)
        except Exception as error:
            self.send_error(502, f'NLM image proxy failed: {error}')

if __name__ == '__main__':
    server = ThreadingHTTPServer(('', 8000), Handler)
    print('RADIOTOMY dev server at http://localhost:8000', flush=True)
    server.serve_forever()

