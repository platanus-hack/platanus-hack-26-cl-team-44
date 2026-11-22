"""HTTP routes for the monitor and its explicitly allowlisted local assets."""

import json
import os
import re
from http.client import HTTPConnection, HTTPException
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


WEBEYETRACK_ASSETS = {
    '/web/tracker.js': 'text/javascript',
    '/web/index.js.LICENSE.txt': 'text/plain',
    '/web/model.json': 'application/json',
    '/web/group1-shard1of1.bin': 'application/octet-stream',
}
TOKI_ASSETS = {
    '/woki-os.html': 'text/html',
    **{f'/{name}.js': 'text/javascript' for name in (
        'myoware-click', 'iphone-gaze', 'iphone-presets', 'predict', 'lexicon-es',
        'magnetic-pointer', 'tablet-keyboard', 'gaze-calibration', 'care-wheel',
        'woki-voz', 'dev-agente', 'toki-sse', 'toki-apps',
    )},
    **{f'/{name}.css': 'text/css' for name in (
        'iphone-gaze', 'theme', 'layout', 'magnetic-pointer', 'tablet-keyboard', 'toki-apps',
    )},
}


def make_handler(config, samples, monitor_dir, toki_dir, apps_url):
    apps_loopback = re.fullmatch(
        r'http://(?:127\.0\.0\.1|localhost):([0-9]{1,5})/?',
        apps_url,
        re.ASCII,
    )

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(monitor_dir), **kwargs)

        def send_body(self, body, content_type):
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(body)

        def send_toki_asset(self, path, content_type):
            directory = (toki_dir / path.parent).resolve()
            asset = (directory / path.name).resolve()
            if asset.parent != directory or not asset.is_file():
                self.send_error(404)
                return
            self.send_body(asset.read_bytes(), f'{content_type}; charset=utf-8')

        def send_webeyetrack_asset(self, path):
            port = int(apps_loopback[1]) if apps_loopback else 0
            if not 0 < port <= 65535 or port == config.http_port:
                return self.send_error(404)
            conn = HTTPConnection('127.0.0.1', port, timeout=18)
            try:
                # Only fixed model assets; never forward headers, redirects or stage credentials.
                conn.request('GET', path)
                response = conn.getresponse()
                if response.status != 200:
                    return self.send_error(502)
                body = response.read(8 * 1024 * 1024 + 1)
                if len(body) > 8 * 1024 * 1024:
                    return self.send_error(502)
            except (OSError, HTTPException):
                return self.send_error(502)
            finally:
                conn.close()
            self.send_body(body, WEBEYETRACK_ASSETS[path])

        def do_GET(self):
            path = self.path.partition('?')[0]
            if self.path in ('/data', '/data?seconds=60'):
                payload = samples.data_payload(seconds=60 if self.path == '/data?seconds=60' else None)
                payload['transport'] = 'serial' if config.serial_port else 'ble'
                self.send_body(json.dumps(payload).encode(), 'application/json')
            elif self.path == '/emg/gestures':
                self.send_body(json.dumps(samples.gesture_payload()).encode(), 'application/json')
            elif path == '/toki-config.js':
                # Solo para la propia TV: un <script src> de otro sitio no puede leer el token.
                local = self.headers.get('Host', '') in (
                    f'127.0.0.1:{config.http_port}',
                    f'localhost:{config.http_port}',
                )
                if not local or self.headers.get('Sec-Fetch-Site', 'same-origin') != 'same-origin':
                    return self.send_error(403)
                cfg = {
                    'remoto': os.environ.get('TOKI_REMOTO', '').rstrip('/'),
                    'waToken': os.environ.get('TOKI_WA_TOKEN', ''),
                    'apps': os.environ.get('TOKI_APPS_URL', '').rstrip('/'),
                }
                self.send_body(('window.TOKI_ENV=' + json.dumps(cfg) + ';').encode(), 'text/javascript')
            elif path in TOKI_ASSETS:
                self.send_toki_asset(Path(path[1:]), TOKI_ASSETS[path])
            elif path in WEBEYETRACK_ASSETS:
                self.send_webeyetrack_asset(path)
            elif re.fullmatch(r'/eye-engine/[\w-]+\.js', path, re.ASCII):
                self.send_toki_asset(Path(path[1:]), 'text/javascript')
            elif re.fullmatch(r'/[\w-]+\.(js|css)', path, re.ASCII) and (toki_dir / path[1:]).is_file():
                self.send_toki_asset(Path(path[1:]), 'text/javascript' if path.endswith('.js') else 'text/css')
            elif re.fullmatch(r'/game-covers/[a-z]+\.webp', path, re.ASCII):
                self.send_toki_asset(Path(path[1:]), 'image/webp')
            elif re.fullmatch(r'/brands/[\w-]+\.svg', path, re.ASCII):
                self.send_toki_asset(Path(path[1:]), 'image/svg+xml')
            elif re.fullmatch(r'/presets/[\w-]+\.json', path, re.ASCII):
                self.send_toki_asset(Path(path[1:]), 'application/json')
            elif path in ('/myoware', '/myoware/'):
                self.send_response(302)
                self.send_header('Location', '/')
                self.end_headers()
            elif self.path in ('/', '/index.html'):
                super().do_GET()
            else:
                self.send_error(404)

        def log_message(self, *args):
            pass

    return Handler


def serve(config, samples, monitor_dir, toki_dir, apps_url):
    handler = make_handler(config, samples, monitor_dir, toki_dir, apps_url)
    ThreadingHTTPServer(('127.0.0.1', config.http_port), handler).serve_forever()
