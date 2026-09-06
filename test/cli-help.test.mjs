import test from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const binPath = path.resolve(__dirname, '../bin/ctx.mjs');

test('CLI Help - no args exits 0 and contains ctx save <note>', () => {
  const result = spawnSync(process.execPath, [binPath], { encoding: 'utf8' });
  assert.strictEqual(result.status, 0);
  assert.match(result.stdout, /ctx save <note>/);
});

test('CLI Help - bogus command exits 1, names the command, and stays off stdout', () => {
  const result = spawnSync(process.execPath, [binPath, 'bogus'], { encoding: 'utf8' });
  assert.strictEqual(result.status, 1);
  assert.match(result.stderr, /Unknown command: bogus/);
  assert.match(result.stderr, /ctx save <note>/);
  assert.strictEqual(result.stdout, '');
});

test('CLI - a failing command writes its message to stderr, not stdout', () => {
  const result = spawnSync(process.execPath, [binPath, 'save'], { encoding: 'utf8' });
  assert.strictEqual(result.status, 1);
  assert.match(result.stderr, /Note required\. Usage: ctx save <note>/);
  assert.strictEqual(result.stdout, '');
});
