import os, termios, threading, time, json, re, argparse, select
from collections import deque
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
parser=argparse.ArgumentParser(description='Panel local MyoWare (macOS/Linux, Python 3.10+)')
parser.add_argument('--serial-port', required=True, help='Puerto del UNO; consultar arduino-cli board list')
parser.add_argument('--http-port', type=int, default=8766)
args=parser.parse_args()
PORT=args.serial_port
state={'connected':False,'error':'','last':0,'received':0,'unrecognized':0}
samples=deque(maxlen=1500)
lock=threading.Lock()
def reader():
    while True:
        fd=None
        try:
            fd=os.open(PORT,os.O_RDONLY|os.O_NOCTTY|os.O_NONBLOCK)
            a=termios.tcgetattr(fd); a[0]=0; a[1]=0; a[2]=termios.CS8|termios.CREAD|termios.CLOCAL; a[3]=0
            a[4]=a[5]=termios.B115200; a[6][termios.VMIN]=0; a[6][termios.VTIME]=0
            termios.tcsetattr(fd,termios.TCSANOW,a)
            with lock: state.update(connected=True,error='')
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
                        m=re.fullmatch(r'(?:ENV:)?(\d{1,4})',s)
                        with lock:
                            if m and 0<=int(m[1])<=1023:
                                now=time.time(); samples.append([now,int(m[1])]);state['last']=now;state['received']+=1
                            else: state['unrecognized']+=1
                if not os.path.exists(PORT): raise OSError('Arduino desconectado')
                time.sleep(.01)
        except Exception as e:
            with lock:state.update(connected=False,error=str(e))
            time.sleep(1)
        finally:
            if fd is not None:os.close(fd)
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path=='/data':
            with lock: payload={**state,'samples':list(samples),'now':time.time()}
            body=json.dumps(payload).encode();self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(body)
        elif self.path in ('/', '/index.html'):super().do_GET()
        else:self.send_error(404)
    def log_message(self,*args):pass
os.chdir(Path(__file__).parent)
threading.Thread(target=reader,daemon=True).start()
print(f'Panel local: http://127.0.0.1:{args.http_port}',flush=True)
ThreadingHTTPServer(('127.0.0.1',args.http_port),Handler).serve_forever()
