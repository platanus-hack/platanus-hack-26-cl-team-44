import net from 'node:net';
import {mkdirSync, chmodSync, unlinkSync} from 'node:fs';
import {join} from 'node:path';

const ACTIVATE = 'activate\n';
const REPLY_TIMEOUT_MS = 15000;

function handleActivation(socket, activate) {
  socket.on('error', () => {});
  socket.setTimeout(REPLY_TIMEOUT_MS, () => socket.destroy());
  socket.setEncoding('utf8');
  let line = '';

  async function read(part) {
    line += part;
    if (line.length > ACTIVATE.length) return socket.destroy();
    if (!line.endsWith('\n')) return;
    socket.off('data', read);
    if (line !== ACTIVATE) return socket.destroy();
    try {
      await activate();
      socket.end('ok\n');
    } catch {
      socket.end('error\n');
    }
  }
  socket.on('data', read);
}

function listen(server, path) {
  return new Promise((resolve, reject) => {
    function onError(error) {
      server.off('listening', onListening);
      reject(error);
    }
    function onListening() {
      server.off('error', onError);
      resolve();
    }
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(path);
  });
}

function activateExisting(path) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection(path);
    let reply = '';
    client.setTimeout(REPLY_TIMEOUT_MS, () => client.destroy(Error('La sesión Myo no responde')));
    client.once('connect', () => client.write(ACTIVATE));
    client.on('data', data => { reply += data; });
    client.once('error', reject);
    client.once('end', () => {
      if (reply === 'ok\n') resolve();
      else reject(Error('No se pudo activar la sesión Myo existente'));
    });
  });
}

// The socket is also the lock: two launchers cannot own it at the same time.
export async function claimSession(directory, activate) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const path = join(directory, 'session.sock');
  const server = net.createServer(socket => handleActivation(socket, activate));
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await listen(server, path);
      chmodSync(path, 0o600);
      return server;
    } catch (error) {
      if (error.code !== 'EADDRINUSE') throw error;
    }
    try {
      await activateExisting(path);
      return null;
    } catch (error) {
      // Only remove a socket with no listener; never replace a slow live session.
      if (!['ECONNREFUSED', 'ENOENT'].includes(error.code)) throw error;
      try {
        unlinkSync(path);
      } catch (unlinkError) {
        if (unlinkError.code !== 'ENOENT') throw unlinkError;
      }
    }
  }
  throw Error('No se pudo reservar la sesión Myo');
}
