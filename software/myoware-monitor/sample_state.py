"""Thread-safe transport state and normalized MyoWare samples."""

import re
import threading
import time
from collections import deque
from uuid import uuid4


DUAL_SAMPLE = re.compile(r'A0:(\d{1,4}),A3:(\d{1,4})', re.ASCII)
LEGACY_SAMPLE = re.compile(r'(?:ENV:)?(\d{1,4})', re.ASCII)


def parse_sample(line):
    if match := DUAL_SAMPLE.fullmatch(line):
        a0, a3 = map(int, match.groups())
        if a0 <= 1023 and a3 <= 1023:
            return a0, a3
    elif match := LEGACY_SAMPLE.fullmatch(line):
        a0 = int(match[1])
        if a0 <= 1023:
            return a0, None
    return None


class SampleState:
    def __init__(self):
        self._lock = threading.Lock()
        self._state = {'connected': False, 'error': '', 'last': 0, 'received': 0, 'unrecognized': 0}
        self._samples = deque(maxlen=6000)
        self._gesture_frames = deque(maxlen=128)
        self._source = None

    def connected(self):
        with self._lock:
            self._state.update(connected=True, error='', last=0)
            self._source = uuid4().hex
            self._gesture_frames.clear()

    def disconnected(self, error):
        with self._lock:
            self._state.update(connected=False, error=error)

    def record(self, a0, a3):
        with self._lock:
            if not self._state['connected']:
                return
            now = time.time()
            self._samples.append([now, a0, a3])
            self._state['last'] = now
            self._state['received'] += 1
            self._gesture_frames.append([time.monotonic_ns() // 1_000_000, a0, a3])

    def unrecognized(self):
        with self._lock:
            self._state['unrecognized'] += 1

    def data_payload(self, seconds=None):
        with self._lock:
            now = time.time()
            recent = list(self._samples)
            if seconds is None:
                recent = recent[-1500:]
            else:
                recent = [sample for sample in recent if sample[0] >= now - seconds]
            return {
                **self._state,
                'samples': recent,
                'now': now,
            }

    def gesture_payload(self):
        with self._lock:
            frames = list(self._gesture_frames)
            now = time.monotonic_ns() // 1_000_000
            return {
                'source': self._source,
                'sequence': self._state['received'],
                'age': now - frames[-1][0] if frames and self._state['connected'] else None,
                'frames': frames,
            }
