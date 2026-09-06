# ctx

> A zero-dependency **"where was I"** CLI: snapshot your working directory, then pick up exactly where you left off — files changed, time away, your note, and git context.

[![npm](https://img.shields.io/npm/v/@madara88645/ctx)](https://www.npmjs.com/package/@madara88645/ctx)
[![CI](https://github.com/madara88645/ctx/actions/workflows/ci.yml/badge.svg)](https://github.com/madara88645/ctx/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@madara88645/ctx)](./LICENSE)
[![node](https://img.shields.io/node/v/@madara88645/ctx)](https://nodejs.org)

![ctx — stamp where you are, then resume exactly where you left off](https://raw.githubusercontent.com/madara88645/ctx/main/docs/demo.gif)

**I never wrote a line of this tool's code.** An AI picked the idea, cheap delegated
[Google Antigravity](https://antigravity.google) (Gemini) agents wrote every module and every
test across eight bounded slices, and I orchestrated and verified the build while watching it
live through [Understudy](https://github.com/madara88645/agy-understudy). `ctx` is the working
proof of that method — the full story is in **[docs/making-of.md](./docs/making-of.md)**.

## What it does

You're deep in a project, you context-switch, and days later you're back staring at it going
"…where was I?" `ctx` answers that:

- **`ctx save "<note>"`** stamps the moment — a fingerprint of every file in the directory
  (size + mtime), the current git branch/status, and your note.
- **`ctx resume`** tells you how long you were gone, replays your note, and lists exactly what
  changed since — added, modified, removed.
- **`ctx list`** shows every project you've stamped, most recent first.

No daemon, no network, no telemetry, **zero dependencies.** Everything lives in a single JSON
file at `~/.ctx/store.json`.

## Requirements

- Node.js **≥ 20**
- Zero runtime dependencies

## Install & use

Run it without installing anything:

```bash
npx @madara88645/ctx save "fixing the login redirect"
npx @madara88645/ctx resume
npx @madara88645/ctx list
```

Or install it globally for a bare `ctx`:

```bash
npm install -g @madara88645/ctx
ctx save "fixing the login redirect"
```

> **Why the `@madara88645/` prefix?** The name is scoped, so a bare `npx ctx` won't resolve — always use `@madara88645/ctx`. Prefer typing `ctx`? Add a shell alias: `alias ctx='npx @madara88645/ctx'`.

### `ctx save <note>`

```
$ ctx save "fixing the login redirect"
Saved snapshot for /Users/you/project-alpha (142 files tracked).
```

### `ctx resume`

```
$ ctx resume
Resume brief for /Users/you/project-alpha
Last save: 3 days ago
Note: fixing the login redirect
Git then: main
Added (1): src/auth/redirect.js
Modified (2): src/App.js, src/routes.js
```

### `ctx list`

```
$ ctx list
3 days ago   /Users/you/project-alpha  —  fixing the login redirect
1 week ago   /Users/you/project-beta   —  refactor the query builder
```

## `CTX_HOME`

By default the store lives at `~/.ctx/store.json`. Override the directory with `CTX_HOME`:

```bash
export CTX_HOME="/path/to/store-dir"
```

## How it works

`ctx` builds a *footprint* of a directory from each file's size and modification time, skipping
noisy directories (`node_modules`, `.git`, `dist`, `build`, `__pycache__`) and `.DS_Store`.
`resume` re-fingerprints the directory and diffs it against the saved snapshot. A snapshot
records at most 5000 files, and paths it cannot read are skipped; when either happens, `save`
and `resume` say so rather than quietly reporting a partial answer. Git context is
best-effort: if `git` is present it records the branch and short status, and if anything fails
it simply records nothing. All state is one pretty-printed JSON file; there is no background
process and no network access, ever.

## For AI agents

You probably won't type these commands — your agent will. `ctx` is a plain CLI with stable
output, so any coding agent (Claude Code, Cursor, Cline, Copilot, …) can drive it with no
plugin. It gives an agent a durable, one-line handoff between sessions: `ctx resume` at the
start reloads "where we were", and `ctx save "<state + next step>"` at a stopping point writes
that handoff for the next run — agent or human.

Drop this into your agent's rules file (`AGENTS.md` / `CLAUDE.md` / `.cursorrules` / `.clinerules`):

```md
## ctx — where-was-I memory
When you start work in this project, run `ctx resume` first and use its note + changed-files
list to orient. At a stopping point (task done, pausing, or before the context window compacts),
run `ctx save "<what you just did + the next step>"` so the next session can pick up. Save at
checkpoints, not after every edit. If `ctx` isn't installed, skip this.
```

Full protocol and a ready-to-install Claude Code skill: **[docs/agent-usage.md](./docs/agent-usage.md)**.

## How it was built

Every line of product code was written by delegated Gemini agents, one bounded slice at a
time, orchestrated and verified by a human-driven frontier model and watched live through the
[Understudy](https://github.com/madara88645/agy-understudy) cockpit. The recovery run, the
Node-version footgun a cheap agent debugged on its own, and the slice-by-slice evidence are all
in **[docs/making-of.md](./docs/making-of.md)**.

## Roadmap

`ctx` v0.1 is intentionally the exact tool the delegated agents produced. A few conveniences
are planned for v0.2 — and, to keep the experiment honest, they will be built the same way, by
a delegated agent watched through Understudy:

- `--version` / `-v` and `--help` / `-h` flags
- `.gitignore`-aware snapshots — skip whatever your project already ignores, on top of the
  built-in `node_modules` / `.git` / `dist` / `build` / `__pycache__` skips

## License

[MIT](./LICENSE) © Mehmet Özel
