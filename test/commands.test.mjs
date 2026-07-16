import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { cmdSave, cmdResume, cmdList } from '../src/commands.mjs';
import { loadStore } from '../src/store.mjs';

const NOW = 1_752_570_000_000;

function withTempEnv(fn) {
  const originalCtxHome = process.env.CTX_HOME;
  const tempCtxHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-home-'));
  const tempProjDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-proj-'));
  process.env.CTX_HOME = tempCtxHome;
  
  try {
    fs.writeFileSync(path.join(tempProjDir, 'file1.txt'), 'hello');
    fs.writeFileSync(path.join(tempProjDir, 'file2.txt'), 'world');
    fn(tempCtxHome, tempProjDir);
  } finally {
    if (originalCtxHome === undefined) {
      delete process.env.CTX_HOME;
    } else {
      process.env.CTX_HOME = originalCtxHome;
    }
    fs.rmSync(tempCtxHome, { recursive: true, force: true });
    fs.rmSync(tempProjDir, { recursive: true, force: true });
  }
}

test('cmdSave with empty noteWords -> ok false, exact usage text, and loadStore() still empty', () => {
  withTempEnv((tempCtxHome, tempProjDir) => {
    const res = cmdSave(tempProjDir, [], NOW);
    assert.deepStrictEqual(res, {
      ok: false,
      text: 'Note required. Usage: ctx save <note>'
    });
    const store = loadStore();
    assert.deepStrictEqual(store.projects, {});
  });
});

test('cmdSave with ["fix","auth","bug"] -> ok true, text matches, store entry matches', () => {
  withTempEnv((tempCtxHome, tempProjDir) => {
    const res = cmdSave(tempProjDir, ['fix', 'auth', 'bug'], NOW);
    assert.deepStrictEqual(res, {
      ok: true,
      text: `Saved snapshot for ${tempProjDir} (2 files tracked).`
    });

    const store = loadStore();
    const entry = store.projects[tempProjDir];
    assert.ok(entry);
    assert.strictEqual(entry.note, 'fix auth bug');
    assert.strictEqual(entry.savedAt, NOW);
    assert.strictEqual(Object.keys(entry.files).length, 2);
    assert.strictEqual(entry.files['file1.txt'], `${'hello'.length}:${Math.floor(fs.statSync(path.join(tempProjDir, 'file1.txt')).mtimeMs)}`);
  });
});

test('note truncation: 600-char note saved as 500 chars', () => {
  withTempEnv((tempCtxHome, tempProjDir) => {
    const longNoteWord = 'a'.repeat(600);
    const res = cmdSave(tempProjDir, [longNoteWord], NOW);
    assert.strictEqual(res.ok, true);

    const store = loadStore();
    const entry = store.projects[tempProjDir];
    assert.ok(entry);
    assert.strictEqual(entry.note.length, 500);
    assert.strictEqual(entry.note, 'a'.repeat(500));
  });
});

test('cmdResume with no entry -> exact "No snapshot..." text', () => {
  withTempEnv((tempCtxHome, tempProjDir) => {
    const res = cmdResume(tempProjDir, NOW);
    assert.deepStrictEqual(res, {
      ok: true,
      text: `No snapshot for ${tempProjDir} yet. Run: ctx save "<note>"`
    });
  });
});

test('cmdResume after save with no changes -> contains "Last save: just now" and "No file changes since then."', () => {
  withTempEnv((tempCtxHome, tempProjDir) => {
    cmdSave(tempProjDir, ['initial'], NOW);
    const res = cmdResume(tempProjDir, NOW);
    assert.strictEqual(res.ok, true);
    
    const expectedText = [
      `Resume brief for ${tempProjDir}`,
      `Last save: just now`,
      `Note: initial`,
      `No file changes since then.`
    ].join('\n');
    assert.strictEqual(res.text, expectedText);
  });
});

test('cmdResume after adding one file and modifying one -> contains Added (1) and Modified (1) lines', () => {
  withTempEnv((tempCtxHome, tempProjDir) => {
    cmdSave(tempProjDir, ['initial'], NOW);

    // Modify file1.txt (different size)
    fs.writeFileSync(path.join(tempProjDir, 'file1.txt'), 'different size!');
    // Add new file
    fs.writeFileSync(path.join(tempProjDir, 'newfile.txt'), 'content');

    const res = cmdResume(tempProjDir, NOW);
    assert.strictEqual(res.ok, true);

    const expectedText = [
      `Resume brief for ${tempProjDir}`,
      `Last save: just now`,
      `Note: initial`,
      `Added (1): newfile.txt`,
      `Modified (1): file1.txt`
    ].join('\n');
    assert.strictEqual(res.text, expectedText);
  });
});

test('21+ added files -> the Added line ends with , …', () => {
  withTempEnv((tempCtxHome, tempProjDir) => {
    cmdSave(tempProjDir, ['initial'], NOW);

    const fileNames = [];
    for (let i = 1; i <= 21; i++) {
      const name = `added${String(i).padStart(2, '0')}.txt`;
      fs.writeFileSync(path.join(tempProjDir, name), 'x');
      fileNames.push(name);
    }
    // fileNames is already sorted: added01.txt, added02.txt, ...

    const res = cmdResume(tempProjDir, NOW);
    assert.strictEqual(res.ok, true);

    const first20Str = fileNames.slice(0, 20).join(', ');
    const expectedAddedLine = `Added (21): ${first20Str}, …`;
    
    assert.ok(res.text.includes(expectedAddedLine), `Expected resume text to include Added line with ellipsis. Got:\n${res.text}`);
  });
});

test('cmdList empty -> exact text; after two saves in two dirs -> two lines, most recent first', () => {
  const originalCtxHome = process.env.CTX_HOME;
  const tempCtxHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-home-'));
  const tempProjDir1 = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-proj1-'));
  const tempProjDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-proj2-'));
  process.env.CTX_HOME = tempCtxHome;

  try {
    fs.writeFileSync(path.join(tempProjDir1, 'f.txt'), '1');
    fs.writeFileSync(path.join(tempProjDir2, 'f.txt'), '2');

    // Empty list check
    const emptyRes = cmdList(NOW);
    assert.deepStrictEqual(emptyRes, {
      ok: true,
      text: 'No snapshots yet. Run: ctx save "<note>" inside a project.'
    });

    // Save project 2 first at NOW - 60_000 (1 minute ago)
    cmdSave(tempProjDir2, ['note2'], NOW - 60_000);
    // Save project 1 second at NOW (just now)
    cmdSave(tempProjDir1, ['note1'], NOW);

    const res = cmdList(NOW);
    assert.strictEqual(res.ok, true);

    const expectedText = [
      `just now  ${tempProjDir1}  —  note1`,
      `1 minute ago  ${tempProjDir2}  —  note2`
    ].join('\n');
    assert.strictEqual(res.text, expectedText);
  } finally {
    if (originalCtxHome === undefined) {
      delete process.env.CTX_HOME;
    } else {
      process.env.CTX_HOME = originalCtxHome;
    }
    fs.rmSync(tempCtxHome, { recursive: true, force: true });
    fs.rmSync(tempProjDir1, { recursive: true, force: true });
    fs.rmSync(tempProjDir2, { recursive: true, force: true });
  }
});

test('cmdList 70-char note -> 60 chars + …', () => {
  withTempEnv((tempCtxHome, tempProjDir) => {
    const longNote = 'a'.repeat(70);
    cmdSave(tempProjDir, [longNote], NOW);

    const res = cmdList(NOW);
    assert.strictEqual(res.ok, true);

    const expectedNoteTrunc = 'a'.repeat(60) + '…';
    const expectedLine = `just now  ${tempProjDir}  —  ${expectedNoteTrunc}`;
    assert.strictEqual(res.text, expectedLine);
  });
});
