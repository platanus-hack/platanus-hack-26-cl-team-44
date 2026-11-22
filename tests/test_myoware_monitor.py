"""Integration checks with synthetic serial input; no physical sensor involved."""
import json
import os
from pathlib import Path
import pty
import socket
import subprocess
import sys
import time
import unittest
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parents[1]

class MonitorTest(unittest.TestCase):
    def test_serial_http_freshness_and_disconnect(self):
        master, slave = pty.openpty()
        device = os.ttyname(slave)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        process = subprocess.Popen([sys.executable, str(ROOT/'software/myoware-monitor/server.py'),
                                    '--serial-port', device, '--http-port', str(port)],
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        base = f'http://127.0.0.1:{port}'
        def get(path='/data'):
            with urllib.request.urlopen(base+path, timeout=1) as response:
                return json.load(response)
        try:
            deadline=time.monotonic()+5
            while True:
                try:
                    if get()['connected']: break
                except (OSError, urllib.error.URLError): pass
                if time.monotonic()>deadline: self.fail('Server did not start')
                time.sleep(.05)
            os.write(master,b'ENV:100\n1023\nA0:0,A3:1023\r\nA0:1023,A3:')
            deadline=time.monotonic()+2
            while True:
                data=get()
                if data['received']==3: break
                if time.monotonic()>deadline: self.fail('Serial samples not parsed')
                time.sleep(.02)
            self.assertEqual([row[1:] for row in data['samples']],[[100,None],[1023,None],[0,1023]])
            os.write(master,b'0\nA0:1024,A3:2\nA0:2,A3:1024\nA0:2,A3:-1\nA0:2\nENV:1024\nnoise\n')
            deadline=time.monotonic()+2
            while True:
                data=get()
                if data['received']==4 and data['unrecognized']==6: break
                if time.monotonic()>deadline: self.fail(f'Unexpected serial counts: {data}')
                time.sleep(.02)
            self.assertEqual([row[1:] for row in data['samples']],[[100,None],[1023,None],[0,1023],[1023,0]])
            self.assertEqual(get('/data?seconds=60')['samples'],data['samples'])
            self.assertLess(data['now']-data['last'],1.5)
            stream=get('/emg/gestures')
            self.assertTrue(stream['source'])
            self.assertEqual(stream['sequence'],4)
            self.assertEqual([row[1:] for row in stream['frames']],[[100,None],[1023,None],[0,1023],[1023,0]])
            self.assertEqual(sorted(stream['frames'],key=lambda row: row[0]),stream['frames'])
            self.assertIsInstance(stream['age'],int)
            with urllib.request.urlopen(base) as r:
                self.assertIn('TOKI / BANCO DE PRUEBA',r.read().decode())
            for route, content_type, marker in [
                ('/woki-os.html','text/html','Calibrar gestos'),
                ('/woki-os.html?iphone=sim','text/html','Mirada con iPhone'),
                ('/myoware-click.js','text/javascript','setupMyoWareGestures'),
                ('/iphone-gaze.js','text/javascript','window.IPHONE'),
                ('/layout.css','text/css','.rest-wake'),
                ('/magnetic-pointer.js?v=24','text/javascript','createMenuPointer'),
                ('/magnetic-pointer.css?v=24','text/css','.dwell-outline'),
                ('/tablet-keyboard.js?v=21','text/javascript','toki-'),
                ('/tablet-keyboard.css?v=21','text/css','tablet'),
                ('/eye-engine/connection.js','text/javascript','createConnection'),
                ('/presets/index.json','application/json','calibracion-iphone'),
            ]:
                with urllib.request.urlopen(base+route,timeout=1) as r:
                    self.assertEqual(r.headers.get_content_type(),content_type)
                    self.assertIn(marker,r.read().decode())
            for route in ['/server.py','/../README.md','/README.md','/eye-engine/../server.py','/presets/%2e%2e/Info.json']:
                with self.assertRaises(urllib.error.HTTPError) as caught:
                    urllib.request.urlopen(base+route)
                self.assertEqual(caught.exception.code,404)
                caught.exception.close()
            time.sleep(1.6)
            data=get()
            self.assertGreater(data['now']-data['last'],1.5)
            os.close(master);master=None
            deadline=time.monotonic()+3
            while get()['connected']:
                if time.monotonic()>deadline:self.fail('Disconnect not detected')
                time.sleep(.05)
            self.assertIsNone(get('/emg/gestures')['age'])
        finally:
            process.terminate();process.wait(timeout=3)
            if master is not None:os.close(master)
            os.close(slave)

if __name__=='__main__':unittest.main()


class TokiConfigTest(unittest.TestCase):
    """/toki-config.js entrega TOKI_REMOTO y TOKI_WA_TOKEN solo a la propia TV."""
    def test_config_from_env_only_same_origin(self):
        master, slave = pty.openpty()
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        env = {**os.environ, 'TOKI_REMOTO': 'https://vps.example/', 'TOKI_WA_TOKEN': 't0k', 'TOKI_APPS_URL': 'http://127.0.0.1:8793/'}
        process = subprocess.Popen([sys.executable, str(ROOT/'software/myoware-monitor/server.py'),
                                    '--serial-port', os.ttyname(slave), '--http-port', str(port)],
                                   env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        def get(headers):
            req = urllib.request.Request(f'http://127.0.0.1:{port}/toki-config.js', headers=headers)
            try:
                with urllib.request.urlopen(req, timeout=1) as r:
                    return r.status, r.read().decode()
            except urllib.error.HTTPError as e:
                return e.code, ''
        try:
            deadline = time.monotonic() + 5
            while True:
                try:
                    status, body = get({'Sec-Fetch-Site': 'same-origin'})
                    break
                except (OSError, urllib.error.URLError):
                    if time.monotonic() > deadline: self.fail('Server did not start')
                    time.sleep(.05)
            self.assertEqual(status, 200)
            self.assertEqual(json.loads(body.removeprefix('window.TOKI_ENV=').rstrip(';')),
                             {'remoto': 'https://vps.example', 'waToken': 't0k', 'apps': 'http://127.0.0.1:8793'})
            self.assertEqual(get({'Sec-Fetch-Site': 'cross-site'})[0], 403)
            self.assertEqual(get({'Sec-Fetch-Site': 'same-origin', 'Host': f'evil.example:{port}'})[0], 403)
        finally:
            process.terminate(); process.wait(timeout=5)
            os.close(master); os.close(slave)
