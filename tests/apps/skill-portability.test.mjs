import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, copyFile, readFile, writeFile, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

test('generator uses its checkout skill from a path with spaces, independent of the launch directory', async t => {
  const checkout = await mkdtemp(join(tmpdir(), 'toki skill checkout '));
  t.after(() => rm(checkout, {recursive: true, force: true}));
  const generatorDir = join(checkout, 'software/apps-bridge/generator');
  const skillDir = join(checkout, '.agents/skills/adapt-app');
  await mkdir(generatorDir, {recursive: true});
  await mkdir(skillDir, {recursive: true});
  const generatorPath = join(generatorDir, 'codex.mjs');
  await copyFile(new URL('../../software/apps-bridge/generator/codex.mjs', import.meta.url), generatorPath);
  const sentinel = `checkout-only-${Date.now()}`;
  const skill = await readFile(new URL('../../.agents/skills/adapt-app/SKILL.md', import.meta.url), 'utf8') + '\n' + sentinel;
  await writeFile(join(skillDir, 'SKILL.md'), skill);
  const recipe = {schemaVersion:1,kind:'rss-reader',name:'Fixture',sourceUrl:'https://example.org/rss',capabilities:['list','read'],unsupportedTasks:[],reason:'Prueba aislada'};
  const binary = join(checkout, 'fake-codex');
  // The executable checks the prompt, not the developer's home directory or real Codex login.
  await writeFile(binary, `#!/usr/bin/env node
const fs = require('node:fs');
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  if (!input.includes(${JSON.stringify(sentinel)})) process.exit(2);
  const output = process.argv[process.argv.indexOf('--output-last-message') + 1];
  fs.writeFileSync(output, ${JSON.stringify(JSON.stringify(recipe))});
});
`, {mode:0o700});
  const {generateRecipe} = await import(pathToFileURL(generatorPath).href);
  const result = await generateRecipe({name:'Fixture',sourceUrl:'https://example.org/rss',tasks:'Leer extractos'}, {binary});
  assert.deepEqual(result.recipe, recipe);
  assert.equal(result.provenance.skillSha256, createHash('sha256').update(skill).digest('hex'));
  assert.equal(result.provenance.skill, 'adapt-app');
});
