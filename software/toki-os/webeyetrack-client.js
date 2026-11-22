const aborted = () => new DOMException('Cancelled', 'AbortError');

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const cancel = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve(); }, ms);
    signal?.addEventListener('abort', cancel, { once: true });
  });
}

// Runs inference on an existing video; permission and track ownership stay with the caller.
export function createWebEyeTrackClient(video, { signal, onFailure = () => {} } = {}) {
  signal?.throwIfAborted();
  const worker = new Worker(new URL('./webeyetrack-worker.js', import.meta.url));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const pending = new Map();
  let id = 0, raf, inFlight, videoTime, point, consumed, failure, closed = false, paused = true;

  function failRequests(cause) {
    for (const { reject } of pending.values()) reject(cause);
    pending.clear();
  }

  function call(action, value, transfer = [], timeoutMs = 45_000) {
    return new Promise((resolve, reject) => {
      signal?.throwIfAborted();
      if (closed) throw aborted();
      if (failure) throw failure;
      const key = ++id;
      const timeout = setTimeout(() => {
        pending.delete(key);
        const stage = { start: 'al cargar el modelo', frame: 'al procesar la cámara', calibrate: 'al ajustar el modelo' }[action] || 'durante la calibración';
        reject(new Error(`WebEyeTrack no respondió ${stage}.`));
      }, timeoutMs);
      pending.set(key, {
        resolve: result => { clearTimeout(timeout); resolve(result); },
        reject: cause => { clearTimeout(timeout); reject(cause); },
      });
      try { worker.postMessage({ id: key, action, value }, transfer); }
      catch (cause) { pending.delete(key); clearTimeout(timeout); reject(cause); }
    });
  }
  worker.onmessage = ({ data }) => {
    const done = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) done?.reject(new Error(data.error));
    else done?.resolve(data.result);
  };
  function fail(cause) {
    if (closed || failure) return;
    failure = cause;
    failRequests(cause);
    onFailure(cause);
  }
  worker.onerror = event => fail(new Error(event.message || 'No se pudo iniciar WebEyeTrack.'));

  async function sample(timeoutMs) {
    if (video.readyState < 2 || video.currentTime === videoTime) return;
    videoTime = video.currentTime;
    const capturedAt = performance.now();
    if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
    if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const estimate = await call('frame', { image, t: videoTime }, [image.data.buffer], timeoutMs);
    return point = { ...estimate, capturedAt, t: performance.now() };
  }

  function frame() {
    if (closed || paused || failure) return;
    inFlight = sample(10_000).catch(fail).finally(() => {
      inFlight = null;
      if (!closed && !paused && !failure) raf = requestAnimationFrame(frame);
    });
  }

  async function warmUp() {
    const deadline = performance.now() + 30_000;
    while (performance.now() < deadline) {
      const first = await sample(Math.max(1, deadline - performance.now()));
      if (first?.x !== undefined) {
        paused = false;
        raf = requestAnimationFrame(frame);
        return;
      }
      await delay(40, signal);
    }
    throw new Error('WebEyeTrack no detectó ambos ojos. Mira hacia la pantalla y revisa la luz antes de reintentar.');
  }

  function close() {
    if (closed) return;
    closed = true;
    cancelAnimationFrame(raf);
    worker.terminate();
    failRequests(aborted());
    point = null;
    signal?.removeEventListener('abort', close);
  }
  signal?.addEventListener('abort', close, { once: true });
  return {
    load: profile => call('start', profile),
    warmUp,
    target: position => call('target', position),
    capture: mode => call('capture', mode),
    async adjust(saveProfile = false) {
      paused = true;
      cancelAnimationFrame(raf);
      await inFlight;
      return call('calibrate', { saveProfile });
    },
    peek: () => point,
    read() {
      if (failure) throw failure;
      if (!point || consumed === point) return;
      return consumed = point;
    },
    close,
  };
}
