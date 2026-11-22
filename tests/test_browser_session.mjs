import assert from 'node:assert/strict';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { claimSession } from '../software/browser-bridge/session.mjs';

test('a second launcher activates the existing session without taking ownership', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'myo-'));
  let activations = 0;
  let owner;
  try {
    owner = await claimSession(directory, () => { activations++; });
    assert.ok(owner.listening);
    assert.equal((await stat(join(directory, 'session.sock'))).mode & 0o777, 0o600);
    assert.equal(await claimSession(directory, () => assert.fail('second owner')), null);
    assert.equal(activations, 1);
  } finally {
    if (owner?.listening) await new Promise(resolve => owner.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
