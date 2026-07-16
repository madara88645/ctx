import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const binPath = path.resolve(__dirname, '../bin/ctx.mjs');

test('CLI End-to-End Workflow', () => {
  const originalCtxHome = process.env.CTX_HOME;
  const tempCtxHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-home-e2e-'));
  const tempProjDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-proj-e2e-'));
  
  try {
    // Separate temp project dir containing one file a.txt
    const aPath = path.join(tempProjDir, 'a.txt');
    fs.writeFileSync(aPath, 'hello a\n');

    // run ["save", "testing", "e2e"] → status 0, stdout contains "Saved snapshot"
    const saveResult = spawnSync(
      process.execPath,
      [binPath, 'save', 'testing', 'e2e'],
      {
        cwd: tempProjDir,
        env: { ...process.env, CTX_HOME: tempCtxHome },
        encoding: 'utf8'
      }
    );
    assert.strictEqual(saveResult.status, 0);
    assert.match(saveResult.stdout, /Saved snapshot/);

    // then create b.txt and append to a.txt
    const bPath = path.join(tempProjDir, 'b.txt');
    fs.writeFileSync(bPath, 'hello b\n');
    fs.appendFileSync(aPath, 'more a\n');

    // run ["resume"] → status 0, stdout contains "Added (1): b.txt", "Modified (1): a.txt", and "Note: testing e2e"
    const resumeResult = spawnSync(
      process.execPath,
      [binPath, 'resume'],
      {
        cwd: tempProjDir,
        env: { ...process.env, CTX_HOME: tempCtxHome },
        encoding: 'utf8'
      }
    );
    assert.strictEqual(resumeResult.status, 0);
    assert.match(resumeResult.stdout, /Added \(1\): b\.txt/);
    assert.match(resumeResult.stdout, /Modified \(1\): a\.txt/);
    assert.match(resumeResult.stdout, /Note: testing e2e/);

    // run ["list"] → status 0, stdout contains "testing e2e"
    const listResult = spawnSync(
      process.execPath,
      [binPath, 'list'],
      {
        cwd: tempProjDir,
        env: { ...process.env, CTX_HOME: tempCtxHome },
        encoding: 'utf8'
      }
    );
    assert.strictEqual(listResult.status, 0);
    assert.match(listResult.stdout, /testing e2e/);

    // run ["save"] (no note words) → status 1, stdout contains "Note required."
    const emptySaveResult = spawnSync(
      process.execPath,
      [binPath, 'save'],
      {
        cwd: tempProjDir,
        env: { ...process.env, CTX_HOME: tempCtxHome },
        encoding: 'utf8'
      }
    );
    assert.strictEqual(emptySaveResult.status, 1);
    assert.match(emptySaveResult.stdout, /Note required\./);

  } finally {
    // Restore environment
    if (originalCtxHome === undefined) {
      delete process.env.CTX_HOME;
    } else {
      process.env.CTX_HOME = originalCtxHome;
    }
    // Clean up temporary directories
    fs.rmSync(tempCtxHome, { recursive: true, force: true });
    fs.rmSync(tempProjDir, { recursive: true, force: true });
  }
});
