import { spawnSync } from "node:child_process";

/**
 * Returns best-effort git information for a directory.
 * @param {string} dirAbs - Absolute path to the directory
 * @returns {{ branch: string, statusShort: string } | null} git info or null
 */
export function gitInfo(dirAbs) {
  try {
    const res1 = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: dirAbs,
      encoding: "utf8",
      timeout: 1500,
    });

    if (res1.error || res1.status !== 0 || !res1.stdout) {
      return null;
    }

    const branch = res1.stdout.trim();
    if (!branch) {
      return null;
    }

    const res2 = spawnSync("git", ["status", "--short"], {
      cwd: dirAbs,
      encoding: "utf8",
      timeout: 1500,
    });

    if (res2.error || res2.status !== 0 || res2.stdout === undefined || res2.stdout === null) {
      return null;
    }

    const statusShort = res2.stdout.trimEnd();

    return {
      branch,
      statusShort,
    };
  } catch (e) {
    return null;
  }
}
