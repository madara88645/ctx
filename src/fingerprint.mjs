import fs from 'node:fs';
import path from 'node:path';

/**
 * Generates a fingerprint snapshot of the specified directory.
 * Walks the directory recursively, skipping symbolic links, .DS_Store files,
 * and ignored directories (node_modules, .git, dist, build, __pycache__).
 *
 * Paths that cannot be read (permissions, or removed mid-walk) are skipped and
 * counted in `skipped` rather than aborting the snapshot.
 *
 * @param {string} rootAbs Absolute path to the directory to snapshot.
 * @returns {{ files: Record<string, string>, truncated: boolean, skipped: number }}
 */
export function snapshotDir(rootAbs) {
  const resolvedRoot = path.resolve(rootAbs);
  const filesList = [];
  let truncated = false;
  let skipped = 0;

  function walk(currentDirAbs) {
    if (truncated) return;

    let entries;
    try {
      entries = fs.readdirSync(currentDirAbs, { withFileTypes: true });
    } catch (err) {
      skipped += 1;
      return;
    }

    // Sort entries alphabetically to ensure deterministic traversal order.
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    for (const entry of entries) {
      if (truncated) return;

      const entryAbs = path.join(currentDirAbs, entry.name);

      let stat;
      try {
        stat = fs.lstatSync(entryAbs);
      } catch (err) {
        skipped += 1;
        continue;
      }

      if (stat.isSymbolicLink()) {
        continue;
      }

      if (stat.isDirectory()) {
        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === 'dist' ||
          entry.name === 'build' ||
          entry.name === '__pycache__'
        ) {
          continue;
        }
        walk(entryAbs);
      } else if (stat.isFile()) {
        if (entry.name === '.DS_Store') {
          continue;
        }

        const relPath = path.relative(resolvedRoot, entryAbs);
        // Ensure always using POSIX-style "/" separators
        const posixRelPath = relPath.split(path.sep).join('/');

        if (filesList.length >= 5000) {
          truncated = true;
          return;
        }

        filesList.push({
          key: posixRelPath,
          value: `${stat.size}:${Math.floor(stat.mtimeMs)}`
        });
      }
    }
  }

  walk(resolvedRoot);

  // Deterministic sorting of keys using plain < comparison on strings.
  filesList.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  const files = {};
  for (const item of filesList) {
    files[item.key] = item.value;
  }

  return {
    files,
    truncated,
    skipped
  };
}

/**
 * Compares two fingerprint snapshots and returns the added, removed, and modified files.
 *
 * @param {Record<string, string>|null|undefined} oldFiles The old files map.
 * @param {Record<string, string>|null|undefined} newFiles The new files map.
 * @returns {{ added: string[], removed: string[], modified: string[] }}
 */
export function diffSnapshots(oldFiles, newFiles) {
  const old = oldFiles == null ? {} : oldFiles;
  const current = newFiles == null ? {} : newFiles;

  const added = [];
  const removed = [];
  const modified = [];

  const oldKeys = Object.keys(old);
  const currentKeys = Object.keys(current);

  const oldKeysSet = new Set(oldKeys);
  const currentKeysSet = new Set(currentKeys);

  for (const key of currentKeys) {
    if (!oldKeysSet.has(key)) {
      added.push(key);
    } else if (current[key] !== old[key]) {
      modified.push(key);
    }
  }

  for (const key of oldKeys) {
    if (!currentKeysSet.has(key)) {
      removed.push(key);
    }
  }

  const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  added.sort(compare);
  removed.sort(compare);
  modified.sort(compare);

  return {
    added,
    removed,
    modified
  };
}
