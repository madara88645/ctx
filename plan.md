# ctx — Context Snapshot & Resume CLI: Implementation Plan

> **For agentic workers (AGY/Gemini via Understudy):** each Slice below becomes ONE bounded
> `understudy run` (--mode accept-edits, non-interactive, ≤6 min). The orchestrator (Claude)
> writes no implementation code; it generates each slice prompt from this plan, runs it,
> and independently verifies the acceptance checks before the next slice.

**Goal:** A zero-dependency Node.js CLI that saves a "where was I" snapshot of a project
(`ctx save "note"`) and reconstructs it on return (`ctx resume`, `ctx list`): time since
last visit, your note, exactly which files changed, plus best-effort git context.

**Architecture:** Thin bin dispatcher over pure, separately testable modules
(fingerprint walk+diff, SM-free plain relative-time formatter, JSON store, best-effort git
probe, command composers that return strings). All state in one JSON file under
`~/.ctx/` (overridable via `CTX_HOME` for tests). No daemon, no network, no deps.

**Tech Stack:** Node.js ≥ 20 built-ins only: node:fs, node:path, node:os, node:process,
node:child_process (git probe), node:test + node:assert (tests). ESM (`type: module`).

## Global Constraints (every slice inherits these)

- Sandbox root: `/Users/mehmetozel/agy-sandbox/ctx-cli` — nothing outside it is readable/writable.
- Zero runtime dependencies; `package.json` MUST NOT gain `dependencies`/`devDependencies`.
- No network, no package installs, no git commands in the sandbox (the PRODUCT may shell
  out to `git` at user runtime; slice validation never does).
- Every module is ESM `.mjs`; every public function is exported by the exact name given
  in its slice's **Produces** block (later slices import by these names).
- Store path resolution (single rule, used everywhere): dir = `process.env.CTX_HOME ??
  path.join(os.homedir(), ".ctx")`; file = `<dir>/store.json`.
- Tests: `node --test` (run from the sandbox root; auto-discovers `test/`) must pass at the
  end of EVERY slice — note: on Node 24 `node --test test/` (directory arg) is BROKEN; tests use
  `fs.mkdtempSync(path.join(os.tmpdir(), "ctx-test-"))` + `CTX_HOME`, never the real home dir.
- Determinism: anything time-dependent takes an injectable `now` (epoch ms) parameter.
- Validation command per slice (the ONLY command a worker may run):
  `cd /Users/mehmetozel/agy-sandbox/ctx-cli && node --test`

## Store schema (v1, fixed)

```json
{
  "version": 1,
  "projects": {
    "/abs/project/path": {
      "savedAt": 1752570000000,
      "note": "string ≤500 chars",
      "files": { "rel/path.js": "1234:1752569000000" },
      "truncated": false,
      "git": { "branch": "main", "statusShort": "M src/a.js" }
    }
  }
}
```
`files` maps relative path → `"<size>:<mtimeMs floor>"`. `git` is `null` when unavailable.

## File structure

- `package.json` — name `ctx-cli`, `"type":"module"`, `"bin":{"ctx":"bin/ctx.mjs"}`, `"scripts":{"test":"node --test"}`
- `bin/ctx.mjs` — argv dispatch only
- `src/timefmt.mjs` — relative time formatting (pure)
- `src/fingerprint.mjs` — directory walk → files map; diff of two maps (pure)
- `src/store.mjs` — load/save JSON store (CTX_HOME rule)
- `src/git.mjs` — best-effort branch + short status
- `src/commands.mjs` — save/resume/list composing the above, returning strings
- `test/*.test.mjs` — one test file per module + final CLI e2e
- `README.md` — usage

---

### Slice S1: Scaffold + help contract
**Files:** Create `package.json`, `bin/ctx.mjs`, `README.md`, `test/cli-help.test.mjs`
**Produces:** running `node bin/ctx.mjs` (no args, or `help`, or unknown cmd) prints a help
text that contains the literal lines `ctx save <note>`, `ctx resume`, `ctx list`; unknown
command exits with code 1, help/no-args exits 0.
**Test (must exist):** spawn `node bin/ctx.mjs` via `child_process.spawnSync`, assert exit 0
and stdout contains `ctx save <note>`; spawn with `bogus` arg, assert exit 1.

### Slice S2: timefmt
**Files:** Create `src/timefmt.mjs`, `test/timefmt.test.mjs`; Modify `package.json`
(scripts.test: `"node --test test/"` → `"node --test"` — the S1 form breaks on Node 24)
**Produces:** `formatRelative(thenMs, nowMs) -> string` with EXACT outputs:
<60s → `just now`; <60m → `N minute(s) ago`; <24h → `N hour(s) ago`; <30d → `N day(s) ago`;
else `on YYYY-MM-DD` (UTC). Singular "1 minute ago", plural "2 minutes ago", same for hour/day.
**Test:** exact-string asserts for: 30s, 1m, 59m, 1h, 23h, 1d, 29d, 45d.

### Slice S3: fingerprint walk
**Files:** Create `src/fingerprint.mjs`, `test/fingerprint.test.mjs`
**Produces:** `snapshotDir(rootAbs) -> { files: Record<string,string>, truncated: boolean }`.
Recursive walk; relative POSIX paths (`/` separator); entry format `"<size>:<mtimeMs floor>"`;
IGNORED dir names at any depth: `node_modules`, `.git`, `dist`, `build`, `__pycache__`;
ignored file name: `.DS_Store`; symlinks skipped; deterministic sorted key order;
stop adding after 5000 files and set `truncated: true`.
**Test:** build a temp tree (incl. an ignored `node_modules/x.js` and nested dirs), assert
exact keys and that values match real size/mtime; assert ignore + sorting behavior.

### Slice S4: fingerprint diff
**Files:** Modify `src/fingerprint.mjs` (add export), extend `test/fingerprint.test.mjs`
**Consumes:** the `files` map shape from S3.
**Produces:** `diffSnapshots(oldFiles, newFiles) -> { added: string[], removed: string[], modified: string[] }`
each sorted ascending; `modified` = same key, different value.
**Test:** pure-object cases: empty→some, some→empty, value change, mixed; exact arrays.

### Slice S5: store
**Files:** Create `src/store.mjs`, `test/store.test.mjs`
**Produces:** `loadStore() -> store` (missing/corrupt file → `{version:1, projects:{}}`),
`saveStore(store) -> void` (mkdir -p the dir, pretty JSON + trailing newline),
`storePath() -> string` (CTX_HOME rule from Global Constraints).
**Test:** with `CTX_HOME` set to a temp dir: load-when-missing, save-then-load roundtrip,
corrupt-file fallback, storePath composition.

### Slice S6: git probe
**Files:** Create `src/git.mjs`, `test/git.test.mjs`
**Produces:** `gitInfo(dirAbs) -> { branch: string, statusShort: string } | null` using
`spawnSync("git", ["rev-parse","--abbrev-ref","HEAD"], {cwd, timeout:1500})` and
`spawnSync("git", ["status","--short"], ...)`; ANY failure (ENOENT, non-zero, timeout, not a
repo) → `null`, never throws. `statusShort` trimmed, may be `""` when clean.
**Test:** ONLY the deterministic path: temp dir that is not a git repo → `null`; and
`gitInfo` on a path that does not exist → `null`. (Git-present path is verified manually
by the orchestrator, not in tests — sandbox forbids running git.)

### Slice S7: commands
**Files:** Create `src/commands.mjs`, `test/commands.test.mjs`
**Consumes:** `snapshotDir`, `diffSnapshots` (S3/S4), `loadStore`, `saveStore` (S5),
`gitInfo` (S6), `formatRelative` (S2).
**Produces (each returns `{ ok: boolean, text: string }` — text is what gets printed,
ok drives the exit code; `now` defaults to Date.now()):**
- `cmdSave(cwdAbs, noteWords: string[], now?) -> {ok,text}` — note = words joined by space,
  truncated to 500 chars; empty note → `ok:false`, text exactly `Note required. Usage: ctx save <note>`
  AND no store write; success → writes project entry (files, truncated, git, savedAt=now)
  and returns `ok:true`, text `Saved snapshot for <cwdAbs> (N files tracked).`
- `cmdResume(cwdAbs, now?) -> {ok,text}` — always `ok:true`; no entry → text
  `No snapshot for <cwdAbs> yet. Run: ctx save "<note>"`;
  else multi-line: line1 `Resume brief for <cwdAbs>`, line2 `Last save: <formatRelative>` ,
  line3 `Note: <note>`, optional line4 `Git then: <branch>` when git non-null, then a
  changes block from diffSnapshots(saved.files, snapshotDir(cwd).files): if all empty →
  `No file changes since then.` else lines `Added (N): a, b` / `Modified (N): ...` /
  `Removed (N): ...` (skip empty categories, max 20 names then `, …`).
- `cmdList(now?) -> {ok,text}` — always `ok:true`; empty store → text
  `No snapshots yet. Run: ctx save "<note>" inside a project.`;
  else one line per project, most recent first: `<relativeTime>  <path>  —  <note ≤60 chars…>`.
**Test:** fixed `now`, temp CTX_HOME + temp project dirs; exact-string asserts on every
branch above (incl. note truncation and 20-name cap with 21 files).

### Slice S8: wire CLI + e2e + README
**Files:** Modify `bin/ctx.mjs`; Create `test/cli-e2e.test.mjs`; Modify `README.md`
**Consumes:** `cmdSave`, `cmdResume`, `cmdList` (S7 exact signatures).
**Produces:** `ctx save <words...>` / `ctx resume` / `ctx list` print `result.text` and exit
`result.ok ? 0 : 1` (so save with empty note exits 1); help behavior from S1 unchanged.
README documents install-free usage (`node bin/ctx.mjs …` + optional `npm link`), the three
commands with realistic example output, CTX_HOME, and the zero-dependency guarantee.
**Test (e2e):** in a temp project dir with CTX_HOME temp: run save (spawnSync, exit 0,
stdout contains `Saved snapshot`), add + modify a file, run resume, assert stdout contains
`Added (1)` and `Modified (1)` and the note; run list, assert the note appears.

---

## Orchestrator verification per slice (not the worker's job)
1. Runner line is `status=completed exit=0 termination=-`.
2. Expected files exist; `git`-free sandbox unchanged outside allowed list.
3. `node --test` re-run independently by the orchestrator; all pass.
4. Slice evidence (`agy.log`, `.agy-viewer-run.json`, `.agy-prompt.md`) archived to
   `.slice-archive/sNN/` before the next run.
5. Panel spot-check at S1, S4, S8: http://127.0.0.1:4288
