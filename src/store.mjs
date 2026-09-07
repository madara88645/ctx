import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

export function storePath() {
  // An exported-but-empty CTX_HOME must not resolve the store to a relative
  // "store.json" in whatever directory ctx happens to run in.
  const dir = process.env.CTX_HOME || path.join(os.homedir(), ".ctx");
  return path.join(dir, "store.json");
}

function emptyStore() {
  return { version: 1, projects: {} };
}

export function loadStore() {
  const p = storePath();

  let data;
  try {
    data = fs.readFileSync(p, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return emptyStore(); // No store yet: a normal first run.
    }
    quarantine(p);
    return emptyStore();
  }

  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    // Fall through: unparseable content is handled like unreadable content.
  }

  quarantine(p);
  return emptyStore();
}

/**
 * Moves a store we cannot understand aside, so the next save does not
 * silently overwrite whatever snapshots it still holds.
 */
function quarantine(p) {
  // Exclusive copies cannot replace an earlier recovery file, even if another
  // process creates the same backup name between attempts.
  for (let suffix = 0; ; suffix += 1) {
    const backup = `${p}.corrupt${suffix ? `.${suffix}` : ''}`;
    try {
      fs.copyFileSync(p, backup, fs.constants.COPYFILE_EXCL);
    } catch (err) {
      if (err.code === 'EEXIST') continue;
      throw new Error(`ctx: could not preserve ${p}; refusing to start a fresh store.`, { cause: err });
    }
    fs.unlinkSync(p);
    console.error(`ctx: could not read ${p}; kept it as ${backup} and started a fresh store.`);
    return;
  }
}

export function saveStore(store) {
  const p = storePath();
  const dir = path.dirname(p);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

  // Write-then-rename, so an interrupted save cannot leave a half-written
  // store behind. The store holds your notes and project paths, so it is
  // created owner-only, like a shell history file.
  const tmp = `${p}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2) + "\n", { mode: 0o600 });
  fs.renameSync(tmp, p);
}
