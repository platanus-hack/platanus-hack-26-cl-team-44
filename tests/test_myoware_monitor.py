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
        def get():
            with urllib.request.urlopen(base+'/data', timeout=1) as response:
                return json.load(response)
        try:
            deadline=time.monotonic()+5
            while True:
                try:
                    if get()['connected']: break
                except (OSError, urllib.error.URLError): pass
                if time.monotonic()>deadline: self.fail('Server did not start')
                time.sleep(.05)
            os.write(master,b'ENV:100\nENV:600\n1023\nENV:1024\n-1\nnoise\n')
            deadline=time.monotonic()+2
            while True:
                data=get()
                if data['received']==3: break
                if time.monotonic()>deadline: self.fail('Serial samples not parsed')
                time.sleep(.02)
            self.assertEqual([v for _,v in data['samples']],[100,600,1023])
            self.assertEqual(data['unrecognized'],3)
            self.assertLess(data['now']-data['last'],1.5)
            with urllib.request.urlopen(base) as r:
                self.assertIn('TOKI / BANCO DE PRUEBA',r.read().decode())
            for route in ['/server.py','/../README.md']:
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
        finally:
            process.terminate();process.wait(timeout=3)
            if master is not None:os.close(master)
            os.close(slave)

if __name__=='__main__':unittest.main()
