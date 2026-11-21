"""Verify the MyoWareEnvTest wire format and pairing without requiring Bluetooth."""
import importlib.util
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import patch


spec = importlib.util.spec_from_file_location(
    'ble_input', Path(__file__).resolve().parents[1] / 'software/myoware-monitor/ble_input.py'
)
ble = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ble)


class BleInputTest(unittest.TestCase):
    def test_env_is_decimal_and_normalized_to_monitor_scale(self):
        for raw, expected in [(b'0', 0), (b'2048', 512), (b'4095', 1023)]:
            self.assertEqual(ble.parse_env(bytearray(raw)), expected)
        for raw in (b'4096', b'1\r\n', b'-1', b'0x80', b'', b'ENV:512'):
            self.assertIsNone(ble.parse_env(raw))

    def test_both_values_must_be_fresh_and_cannot_be_reused(self):
        pairs = []
        with patch.object(ble.time, 'monotonic', side_effect=[0, .01, .19, .20, .30, .40]):
            receive, silence = ble.pair_samples(lambda *pair: pairs.append(pair))
            receive(0, b'100')
            receive(1, b'800')
            self.assertEqual(pairs, [], 'isolated/stale jaw sample must never form an active pair')
            receive(0, b'4000')
            receive(0, b'0')
            self.assertEqual(pairs, [(1000, 200)], 'brow value must not be reused')
            self.assertAlmostEqual(silence(), .20)

    def test_duplicate_names_require_distinct_identifiers(self):
        def device(address):
            sensor = SimpleNamespace(address=address, name='MyoWareENV')
            adv = SimpleNamespace(local_name=sensor.name, service_uuids=[ble.SERVICE_UUID])
            return sensor, adv
        devices = {address: device(address) for address in ('A0', 'A3')}
        with self.assertRaisesRegex(OSError, 'encontrados 2'):
            ble.find_device(devices, 'MyoWareENV')
        self.assertEqual(ble.find_device(devices, 'a3').address, 'A3')
