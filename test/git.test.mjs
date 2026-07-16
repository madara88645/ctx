import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { gitInfo } from '../src/git.mjs';

test('gitInfo - typeof gitInfo is function', () => {
  assert.strictEqual(typeof gitInfo, 'function');
});

test('gitInfo - on a fresh temp dir (not a git repo) returns null', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-git-test-'));
  try {
    const result = gitInfo(tempDir);
    assert.strictEqual(result, null);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('gitInfo - on a path that does not exist returns null', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-git-test-'));
  const nonExistentPath = path.join(tempDir, 'nope-xyz');
  try {
    const result = gitInfo(nonExistentPath);
    assert.strictEqual(result, null);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('gitInfo - returns without throwing when given "/"', () => {
  assert.doesNotThrow(() => {
    const result = gitInfo('/');
    if (result !== null) {
      assert.strictEqual(typeof result.branch, 'string');
      assert.strictEqual(typeof result.statusShort, 'string');
    }
  });
});
