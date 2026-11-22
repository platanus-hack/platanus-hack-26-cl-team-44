"""Import-safe CLI entrypoint for the local MyoWare monitor."""

import os
from pathlib import Path
import threading

from config import parse_config
from http_server import serve
from sample_state import SampleState
from transports import read_ble, read_serial


def main(argv=None):
    config = parse_config(argv)
    monitor_dir = Path(__file__).resolve().parent
    toki_dir = monitor_dir.parent / 'toki-os'
    samples = SampleState()
    apps_url = os.environ.get('TOKI_APPS_URL', '')

    reader = (
        (lambda: read_serial(config.serial_port, samples))
        if config.serial_port
        else (lambda: read_ble(config.ble_jaw, config.ble_brow, samples))
    )
    threading.Thread(target=reader, daemon=True).start()
    print(f'Panel local: http://127.0.0.1:{config.http_port}', flush=True)
    serve(config, samples, monitor_dir, toki_dir, apps_url)


if __name__ == '__main__':
    main()
