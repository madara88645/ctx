---
name: ctx
description: Where-was-I memory for a project, backed by the `ctx` CLI. Use when starting or resuming work in a project (run `ctx resume` to reload the last note plus what changed) and at stopping points or before the context window compacts (run `ctx save "<state + next step>"` so the next session can pick up). Only for projects where the `ctx` command is available.
---

# ctx — where-was-I memory

`ctx` is a zero-dependency CLI that snapshots a working directory and lets you resume it later.
Use it to carry context across sessions instead of starting cold.

## When to use it

- **Starting work in a project** → run `ctx resume` FIRST. If it prints a brief, read the
  `Note:` and the `Added` / `Modified` / `Removed` lists and orient before doing anything else.
  If it says "No snapshot … yet", just continue normally.
- **At a stopping point** — the task is done, you're pausing, or your context window is about to
  compact → run `ctx save "<one line: what you just did + the next step>"`. Save at meaningful
  checkpoints, not after every edit.
- **When the user asks "where was I" / "what were we doing"** → run `ctx resume`.

## Writing the note

One line, concrete, and it must name the next step so the following session can act on it:

```bash
ctx save "auth refactor: extracted validateToken(); NEXT: wire into login route + add tests"
```

## Commands

- `ctx resume` — time since last save, your note, the git branch then, and which files changed since.
- `ctx save "<note>"` — snapshot the current directory under that note.
- `ctx list` — every project you've stamped, most recent first.

That's the whole tool. It writes one local JSON file (`~/.ctx/store.json`), makes no network
calls, and has zero dependencies. If `ctx` is not installed, skip this skill.
