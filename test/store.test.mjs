import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { storePath, loadStore, saveStore } from '../src/store.mjs';

test('storePath - matches CTX_HOME/store.json when CTX_HOME is set', () => {
  const originalCtxHome = process.env.CTX_HOME;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-'));
  process.env.CTX_HOME = tempDir;

  try {
    const expected = path.join(tempDir, 'store.json');
    assert.strictEqual(storePath(), expected);
  } finally {
    if (originalCtxHome === undefined) {
      delete process.env.CTX_HOME;
    } else {
      process.env.CTX_HOME = originalCtxHome;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('storePath - falls back to homedir/.ctx/store.json when CTX_HOME is not set', () => {
  const originalCtxHome = process.env.CTX_HOME;
  delete process.env.CTX_HOME;

  try {
    const expected = path.join(os.homedir(), '.ctx', 'store.json');
    assert.strictEqual(storePath(), expected);
  } finally {
    if (originalCtxHome !== undefined) {
      process.env.CTX_HOME = originalCtxHome;
    }
  }
});

test('loadStore - with no file returns default structure', () => {
  const originalCtxHome = process.env.CTX_HOME;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-'));
  process.env.CTX_HOME = tempDir;

  try {
    const expected = { version: 1, projects: {} };
    assert.deepStrictEqual(loadStore(), expected);
  } finally {
    if (originalCtxHome === undefined) {
      delete process.env.CTX_HOME;
    } else {
      process.env.CTX_HOME = originalCtxHome;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('saveStore - saves data correctly and loadStore retrieves it', () => {
  const originalCtxHome = process.env.CTX_HOME;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-'));
  process.env.CTX_HOME = tempDir;

  try {
    const storeData = {
      version: 1,
      projects: {
        "/p": {
          savedAt: 1,
          note: "n",
          files: {},
          truncated: false,
          git: null
        }
      }
    };
    saveStore(storeData);

    // Assert that loadStore retrieves the exact same data
    assert.deepStrictEqual(loadStore(), storeData);

    // Assert that the file is saved with pretty formatting (2 spaces indentation) and trailing newline
    const filePath = storePath();
    const rawContent = fs.readFileSync(filePath, 'utf8');
    const expectedRaw = JSON.stringify(storeData, null, 2) + "\n";
    assert.strictEqual(rawContent, expectedRaw);
  } finally {
    if (originalCtxHome === undefined) {
      delete process.env.CTX_HOME;
    } else {
      process.env.CTX_HOME = originalCtxHome;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('loadStore - with corrupt JSON returns default structure', () => {
  const originalCtxHome = process.env.CTX_HOME;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-'));
  process.env.CTX_HOME = tempDir;

  try {
    const filePath = path.join(tempDir, 'store.json');
    fs.writeFileSync(filePath, 'not json{');

    const expected = { version: 1, projects: {} };
    assert.deepStrictEqual(loadStore(), expected);
  } finally {
    if (originalCtxHome === undefined) {
      delete process.env.CTX_HOME;
    } else {
      process.env.CTX_HOME = originalCtxHome;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('loadStore - with non-object JSON returns default structure', () => {
  const originalCtxHome = process.env.CTX_HOME;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-'));
  process.env.CTX_HOME = tempDir;

  try {
    const filePath = path.join(tempDir, 'store.json');
    
    // Test Array
    fs.writeFileSync(filePath, '[]');
    assert.deepStrictEqual(loadStore(), { version: 1, projects: {} });

    // Test Null
    fs.writeFileSync(filePath, 'null');
    assert.deepStrictEqual(loadStore(), { version: 1, projects: {} });

    // Test String
    fs.writeFileSync(filePath, '"hello"');
    assert.deepStrictEqual(loadStore(), { version: 1, projects: {} });

    // Test Number
    fs.writeFileSync(filePath, '123');
    assert.deepStrictEqual(loadStore(), { version: 1, projects: {} });
  } finally {
    if (originalCtxHome === undefined) {
      delete process.env.CTX_HOME;
    } else {
      process.env.CTX_HOME = originalCtxHome;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
