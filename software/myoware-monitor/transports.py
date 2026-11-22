"""Serial and BLE input loops feeding the shared sample state."""

import asyncio
import os
import select
import termios
import time

from sample_state import parse_sample


def read_serial(port, samples):
    while True:
        fd = None
        try:
            fd = os.open(port, os.O_RDONLY | os.O_NOCTTY | os.O_NONBLOCK)
            attrs = termios.tcgetattr(fd)
            attrs[0] = 0
            attrs[1] = 0
            attrs[2] = termios.CS8 | termios.CREAD | termios.CLOCAL
            attrs[3] = 0
            attrs[4] = attrs[5] = termios.B115200
            attrs[6][termios.VMIN] = 0
            attrs[6][termios.VTIME] = 0
            termios.tcsetattr(fd, termios.TCSANOW, attrs)
            samples.connected()
            buf = b''
            while True:
                ready, _, _ = select.select([fd], [], [], .1)
                if not ready:
                    continue
                try:
                    chunk = os.read(fd, 4096)
                except BlockingIOError:
                    continue
                if not chunk:
                    raise OSError('Puerto serie desconectado')
                buf = (buf + chunk)[-8192:]
                while b'\n' in buf:
                    line, buf = buf.split(b'\n', 1)
                    sample = parse_sample(line.decode('ascii', errors='replace').strip())
                    if sample is not None:
                        samples.record(*sample)
                    else:
                        samples.unrecognized()
                if not os.path.exists(port):
                    raise OSError('Arduino desconectado')
                time.sleep(.01)
        except Exception as error:
            samples.disconnected(str(error))
            time.sleep(1)
        finally:
            if fd is not None:
                os.close(fd)


def read_ble(jaw, brow, samples):
    from ble_input import read_ble as run_ble

    asyncio.run(run_ble(jaw, brow, samples.connected, samples.record, samples.disconnected))
