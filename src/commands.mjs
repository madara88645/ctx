import { snapshotDir, diffSnapshots } from './fingerprint.mjs';
import { loadStore, saveStore } from './store.mjs';
import { gitInfo } from './git.mjs';
import { formatRelative } from './timefmt.mjs';

/**
 * Saves a snapshot of the current working directory.
 * 
 * @param {string} cwdAbs - Absolute path to the current working directory
 * @param {string[]} noteWords - The note words to join and trim
 * @param {number} now - Current epoch timestamp
 * @returns {{ ok: boolean, text: string }}
 */
export function cmdSave(cwdAbs, noteWords, now = Date.now()) {
  const note = noteWords.join(" ").trim();
  if (note === "") {
    return { ok: false, text: "Note required. Usage: ctx save <note>" };
  }

  const truncatedNote = note.slice(0, 500);
  const snap = snapshotDir(cwdAbs);
  const git = gitInfo(cwdAbs);

  const store = loadStore();
  store.projects = store.projects || {};
  store.projects[cwdAbs] = {
    savedAt: now,
    note: truncatedNote,
    files: snap.files,
    truncated: snap.truncated,
    git: git
  };

  saveStore(store);

  const numFiles = Object.keys(snap.files).length;
  return {
    ok: true,
    text: `Saved snapshot for ${cwdAbs} (${numFiles} files tracked).`
  };
}

/**
 * Resumes and shows the changes between the last saved snapshot and now.
 * 
 * @param {string} cwdAbs - Absolute path to the current working directory
 * @param {number} now - Current epoch timestamp
 * @returns {{ ok: boolean, text: string }}
 */
export function cmdResume(cwdAbs, now = Date.now()) {
  const store = loadStore();
  const entry = store.projects && store.projects[cwdAbs];
  if (!entry) {
    return {
      ok: true,
      text: `No snapshot for ${cwdAbs} yet. Run: ctx save "<note>"`
    };
  }

  const lines = [
    `Resume brief for ${cwdAbs}`,
    `Last save: ${formatRelative(entry.savedAt, now)}`,
    `Note: ${entry.note}`
  ];

  if (entry.git) {
    lines.push(`Git then: ${entry.git.branch}`);
  }

  const snap = snapshotDir(cwdAbs);
  const diff = diffSnapshots(entry.files, snap.files);

  const hasAdded = diff.added && diff.added.length > 0;
  const hasModified = diff.modified && diff.modified.length > 0;
  const hasRemoved = diff.removed && diff.removed.length > 0;

  if (!hasAdded && !hasModified && !hasRemoved) {
    lines.push("No file changes since then.");
  } else {
    const formatCategory = (label, files) => {
      const count = files.length;
      let line = `${label} (${count}): ${files.slice(0, 20).join(", ")}`;
      if (count > 20) {
        line += ", …";
      }
      return line;
    };

    if (hasAdded) {
      lines.push(formatCategory("Added", diff.added));
    }
    if (hasModified) {
      lines.push(formatCategory("Modified", diff.modified));
    }
    if (hasRemoved) {
      lines.push(formatCategory("Removed", diff.removed));
    }
  }

  return {
    ok: true,
    text: lines.join("\n")
  };
}

/**
 * Lists all projects that have saved snapshots.
 * 
 * @param {number} now - Current epoch timestamp
 * @returns {{ ok: boolean, text: string }}
 */
export function cmdList(now = Date.now()) {
  const store = loadStore();
  const projects = Object.entries(store.projects || {});
  if (projects.length === 0) {
    return {
      ok: true,
      text: `No snapshots yet. Run: ctx save "<note>" inside a project.`
    };
  }

  // Sort by savedAt descending (most recent first)
  projects.sort((a, b) => b[1].savedAt - a[1].savedAt);

  const lines = projects.map(([path, entry]) => {
    let displayNote = entry.note;
    if (displayNote.length > 60) {
      displayNote = displayNote.slice(0, 60) + "…";
    }
    return `${formatRelative(entry.savedAt, now)}  ${path}  —  ${displayNote}`;
  });

  return {
    ok: true,
    text: lines.join("\n")
  };
}
