"""Read the two MyoWareEnvTest BLE peripherals, keeping the UNO ADC scale."""
import asyncio
import re
import time


SERVICE_UUID = 'ec3af789-2154-49f4-a9fc-bc6c88e9e930'
ENV_UUID = 'f3a56edf-8f1e-4533-93bf-5601b2e91308'
MAX_PAIR_SKEW = 0.12
MAX_SILENCE = 1.0


def parse_env(payload):
    if re.fullmatch(rb'[0-9]{1,4}', payload):
        value = int(payload)
        if value <= 4095:
            return value >> 2
    return None


def pair_samples(emit):
    pending = {}
    last_pair = time.monotonic()

    def receive(channel, payload):
        nonlocal last_pair
        value = parse_env(payload)
        if value is None:
            return
        now = time.monotonic()
        pending[channel] = (now, value)
        if 0 in pending and 1 in pending and abs(pending[0][0] - pending[1][0]) <= MAX_PAIR_SKEW:
            emit(pending[0][1], pending[1][1])
            pending.clear()
            last_pair = now

    return receive, lambda: time.monotonic() - last_pair


def find_device(devices, selector):
    matches = [
        device for device, adv in devices.values()
        if device.address.lower() == selector.lower()
        or ((adv.local_name == selector or device.name == selector)
            and SERVICE_UUID in {uuid.lower() for uuid in adv.service_uuids})
    ]
    if len(matches) != 1:
        raise OSError(f'{selector}: se esperaba un MyoWare BLE; encontrados {len(matches)}')
    return matches[0]


async def read_ble(jaw, brow, on_connect, on_sample, on_error):
    from bleak import BleakClient, BleakScanner

    while True:
        try:
            devices = await BleakScanner.discover(timeout=5, return_adv=True)
            a0, a3 = (find_device(devices, selector) for selector in (jaw, brow))
            if a0.address == a3.address:
                raise OSError('La ceja y la mandíbula deben usar periféricos distintos.')
            async with BleakClient(a0) as client0, BleakClient(a3) as client3:
                receive, silence = pair_samples(on_sample)
                on_connect()
                await client0.start_notify(ENV_UUID, lambda _, data: receive(0, data))
                await client3.start_notify(ENV_UUID, lambda _, data: receive(1, data))
                while client0.is_connected and client3.is_connected and silence() < MAX_SILENCE:
                    await asyncio.sleep(.1)
                on_error('MyoWare BLE desconectado o sin muestras de ambos canales.')
        except Exception as error:
            on_error(str(error))
        await asyncio.sleep(1)
