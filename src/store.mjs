import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

export function storePath() {
  const dir = process.env.CTX_HOME ?? path.join(os.homedir(), ".ctx");
  return path.join(dir, "store.json");
}

export function loadStore() {
  const p = storePath();
  try {
    const data = fs.readFileSync(p, 'utf8');
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    // Ignore and fallback
  }
  return { version: 1, projects: {} };
}

export function saveStore(store) {
  const p = storePath();
  const dir = path.dirname(p);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(store, null, 2) + "\n");
}
