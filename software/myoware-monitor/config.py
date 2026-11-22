"""Command-line configuration for the local MyoWare monitor."""

import argparse
from dataclasses import dataclass


@dataclass(frozen=True)
class MonitorConfig:
    serial_port: str | None
    ble_jaw: str | None
    ble_brow: str | None
    http_port: int


def parse_config(argv=None):
    parser = argparse.ArgumentParser(
        description='Panel local MyoWare (macOS/Linux, Python 3.10+)'
    )
    parser.add_argument('--serial-port', help='Puerto del UNO; consultar arduino-cli board list')
    parser.add_argument('--ble-jaw', help='Nombre anunciado o identificador del MyoWare BLE de la mandíbula')
    parser.add_argument('--ble-brow', help='Nombre anunciado o identificador del MyoWare BLE de la ceja')
    parser.add_argument('--http-port', type=int, default=8766)
    args = parser.parse_args(argv)

    if args.serial_port:
        if args.ble_jaw or args.ble_brow:
            parser.error('Usa --serial-port o ambos --ble-jaw y --ble-brow, no los tres.')
    elif not args.ble_jaw or not args.ble_brow or args.ble_jaw.lower() == args.ble_brow.lower():
        parser.error('Indica --serial-port o dos periféricos distintos con --ble-jaw y --ble-brow.')
    else:
        try:
            import bleak  # noqa: F401
        except ImportError:
            parser.error('Instala Bleak en el entorno Python para usar los MyoWare BLE.')

    return MonitorConfig(args.serial_port, args.ble_jaw, args.ble_brow, args.http_port)
