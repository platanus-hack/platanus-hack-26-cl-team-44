export function handleRequestSecurity(req, res, port) {
  const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
  if (!hosts.includes(req.headers.host)) {
    res.writeHead(403);
    res.end();
    return true;
  }
  // Port 8766 is the MyoWare stage monitor.
  const allowed = [`http://127.0.0.1:${port}`, `http://localhost:${port}`, 'http://localhost:8000', 'http://127.0.0.1:8000', 'http://127.0.0.1:8766', 'http://localhost:8766'];
  const origin = req.headers.origin;
  if (req.url.startsWith('/api/') && ((origin && !allowed.includes(origin)) || (!origin && req.headers['sec-fetch-site'] === 'cross-site'))) {
    res.writeHead(403);
    res.end();
    return true;
  }
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Headers', 'content-type,x-toki-token');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}

export function requireApiToken(req, token, fault) {
  if (req.headers['x-toki-token'] !== token) throw fault('Vuelve a abrir Apps para conectar el servicio local.', 401);
}
