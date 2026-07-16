import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { snapshotDir, diffSnapshots } from '../src/fingerprint.mjs';

test('fingerprint - snapshotDir walks files and filters ignores', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ctx-test-"));
  try {
    // Create files as requested
    fs.writeFileSync(path.join(tempDir, 'a.txt'), 'content of a.txt');

    fs.mkdirSync(path.join(tempDir, 'sub'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'sub', 'b.txt'), 'content of b.txt');

    fs.mkdirSync(path.join(tempDir, 'sub', 'deep'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'sub', 'deep', 'c.txt'), 'content of c.txt');

    fs.mkdirSync(path.join(tempDir, 'node_modules'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'node_modules', 'x.js'), 'content of x.js');

    fs.writeFileSync(path.join(tempDir, '.DS_Store'), 'some system data');

    // Run snapshot
    const result = snapshotDir(tempDir);

    // Assert: exact sorted key list ["a.txt","sub/b.txt","sub/deep/c.txt"]
    const keys = Object.keys(result.files);
    assert.deepStrictEqual(keys, ["a.txt", "sub/b.txt", "sub/deep/c.txt"]);

    // Assert: each value equals the real `${size}:${floor(mtimeMs)}` from fs.statSync
    for (const key of keys) {
      const absPath = path.join(tempDir, key);
      const stat = fs.statSync(absPath);
      const expectedValue = `${stat.size}:${Math.floor(stat.mtimeMs)}`;
      assert.strictEqual(result.files[key], expectedValue);
    }

    // Assert truncated is false
    assert.strictEqual(result.truncated, false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('fingerprint - empty temp dir', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ctx-test-"));
  try {
    const result = snapshotDir(tempDir);
    assert.deepStrictEqual(result, { files: {}, truncated: false });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('fingerprint - skip symbolic links entirely', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ctx-test-"));
  try {
    fs.writeFileSync(path.join(tempDir, 'a.txt'), 'hello');
    
    // Create symlink
    fs.symlinkSync(path.join(tempDir, 'a.txt'), path.join(tempDir, 'link.txt'));

    const result = snapshotDir(tempDir);
    assert.deepStrictEqual(Object.keys(result.files), ['a.txt']);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('fingerprint - truncate at 5000 files', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ctx-test-"));
  try {
    // Write 5005 files.
    for (let i = 0; i < 5005; i++) {
      // pad with leading zeros to maintain deterministic alphabetical order
      const name = `file_${String(i).padStart(5, '0')}.txt`;
      fs.writeFileSync(path.join(tempDir, name), 'x');
    }
    const result = snapshotDir(tempDir);
    assert.strictEqual(result.truncated, true);
    assert.strictEqual(Object.keys(result.files).length, 5000);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('fingerprint - diffSnapshots empty -> some', () => {
  const result = diffSnapshots({}, {"a": "1:1"});
  assert.deepStrictEqual(result, { added: ["a"], removed: [], modified: [] });
});

test('fingerprint - diffSnapshots some -> empty', () => {
  const result = diffSnapshots({"a": "1:1"}, {});
  assert.deepStrictEqual(result, { added: [], removed: ["a"], modified: [] });
});

test('fingerprint - diffSnapshots modified', () => {
  const result = diffSnapshots({"a": "1:1"}, {"a": "2:1"});
  assert.deepStrictEqual(result, { added: [], removed: [], modified: ["a"] });
});

test('fingerprint - diffSnapshots mixed case with >= 2 entries per category', () => {
  const oldFiles = {
    "unchanged2.txt": "60:6000",
    "modified2.txt": "40:4000",
    "removed2.txt": "20:2000",
    "removed1.txt": "10:1000",
    "modified1.txt": "30:3000",
    "unchanged1.txt": "50:5000"
  };
  const newFiles = {
    "added2.txt": "80:8000",
    "unchanged1.txt": "50:5000",
    "modified1.txt": "35:3000",
    "unchanged2.txt": "60:6000",
    "added1.txt": "70:7000",
    "modified2.txt": "45:4000"
  };
  const result = diffSnapshots(oldFiles, newFiles);
  assert.deepStrictEqual(result, {
    added: ["added1.txt", "added2.txt"],
    removed: ["removed1.txt", "removed2.txt"],
    modified: ["modified1.txt", "modified2.txt"]
  });
});

test('fingerprint - diffSnapshots null and undefined', () => {
  const result = diffSnapshots(null, undefined);
  assert.deepStrictEqual(result, { added: [], removed: [], modified: [] });
});

