import os, termios, threading, time, json, re, argparse, select
from collections import deque
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from uuid import uuid4
parser=argparse.ArgumentParser(description='Panel local MyoWare (macOS/Linux, Python 3.10+)')
parser.add_argument('--serial-port', required=True, help='Puerto del UNO; consultar arduino-cli board list')
parser.add_argument('--http-port', type=int, default=8766)
args=parser.parse_args()
PORT=args.serial_port
state={'connected':False,'error':'','last':0,'received':0,'unrecognized':0}
samples=deque(maxlen=6000)
gesture_frames=deque(maxlen=128)
lock=threading.Lock()
source=None
toki_dir=Path(__file__).resolve().parent.parent/'toki-os'
dual_sample=re.compile(r'A0:(\d{1,4}),A3:(\d{1,4})', re.ASCII)
legacy_sample=re.compile(r'(?:ENV:)?(\d{1,4})', re.ASCII)

def parse_sample(line):
    if match := dual_sample.fullmatch(line):
        a0,a3=map(int,match.groups())
        if a0<=1023 and a3<=1023:
            return a0,a3
    elif match := legacy_sample.fullmatch(line):
        a0=int(match[1])
        if a0<=1023:
            return a0,None
    return None

def reader():
    global source
    while True:
        fd=None
        try:
            fd=os.open(PORT,os.O_RDONLY|os.O_NOCTTY|os.O_NONBLOCK)
            a=termios.tcgetattr(fd); a[0]=0; a[1]=0; a[2]=termios.CS8|termios.CREAD|termios.CLOCAL; a[3]=0
            a[4]=a[5]=termios.B115200; a[6][termios.VMIN]=0; a[6][termios.VTIME]=0
            termios.tcsetattr(fd,termios.TCSANOW,a)
            with lock:
                state.update(connected=True,error='',last=0)
                source=uuid4().hex
                gesture_frames.clear()
            buf=b''
            while True:
                ready,_,_=select.select([fd],[],[],.1)
                if not ready: continue
                try: chunk=os.read(fd,4096)
                except BlockingIOError: continue
                if not chunk: raise OSError('Puerto serie desconectado')
                if chunk:
                    buf=(buf+chunk)[-8192:]
                    while b'\n' in buf:
                        line,buf=buf.split(b'\n',1)
                        s=line.decode('ascii',errors='replace').strip()
                        sample=parse_sample(s)
                        with lock:
                            if sample is not None:
                                now=time.time(); samples.append([now,*sample]);state['last']=now;state['received']+=1
                                gesture_frames.append([time.monotonic_ns()//1_000_000,*sample])
                            else: state['unrecognized']+=1
                if not os.path.exists(PORT): raise OSError('Arduino desconectado')
                time.sleep(.01)
        except Exception as e:
            with lock:state.update(connected=False,error=str(e))
            time.sleep(1)
        finally:
            if fd is not None:os.close(fd)
class Handler(SimpleHTTPRequestHandler):
    def send_body(self, body, content_type):
        self.send_response(200)
        self.send_header('Content-Type',content_type)
        self.send_header('Cache-Control','no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path in ('/data','/data?seconds=60'):
            with lock:
                now=time.time()
                recent=list(samples)
                if self.path=='/data':
                    recent=recent[-1500:]
                else:
                    recent=[sample for sample in recent if sample[0] >= now-60]
                payload={**state,'samples':recent,'now':now}
            self.send_body(json.dumps(payload).encode(),'application/json')
        elif self.path=='/emg/gestures':
            with lock:
                frames=list(gesture_frames)
                now=time.monotonic_ns()//1_000_000
                payload={'source':source,'sequence':state['received'],
                         'age':now-frames[-1][0] if frames and state['connected'] else None,
                         'frames':frames}
            self.send_body(json.dumps(payload).encode(),'application/json')
        elif self.path=='/woki-os.html':
            self.send_body((toki_dir/'woki-os.html').read_bytes(),'text/html; charset=utf-8')
        elif self.path=='/myoware-click.js':
            self.send_body((toki_dir/'myoware-click.js').read_bytes(),'text/javascript; charset=utf-8')
        elif self.path in ('/', '/index.html'):super().do_GET()
        else:self.send_error(404)
    def log_message(self,*args):pass
os.chdir(Path(__file__).parent)
threading.Thread(target=reader,daemon=True).start()
print(f'Panel local: http://127.0.0.1:{args.http_port}',flush=True)
ThreadingHTTPServer(('127.0.0.1',args.http_port),Handler).serve_forever()
