# Using ctx from an AI agent

Most people don't type terminal commands anymore — their coding agent does. `ctx` is built for
that: it's a plain CLI with stable, greppable output, so any agent (Claude Code, Cursor, Cline,
Copilot, …) can drive it with no plugin and no setup. This page is the protocol to give your
agent.

## Why an agent wants this

An agent starts every session cold — it has no memory of what it (or you) were doing last time.
`ctx` is a durable, one-line handoff between sessions:

- **`ctx resume`** at the start of a session reloads "where we were" — your last note plus
  exactly which files changed since — so the agent orients in one command instead of re-reading
  the whole tree.
- **`ctx save "<state + next step>"`** at a stopping point writes that handoff for the next
  session, whether the next driver is another agent run or you.

It's tool-agnostic memory: the note one agent leaves is picked up by whatever agent — or human —
comes next.

## The protocol

Give your agent these three rules:

1. **On starting work in a project, run `ctx resume` first.** If it prints a brief, use the
   `Note:` and the `Added/Modified/Removed` lists to orient before doing anything else. If it
   says "No snapshot … yet", just continue.
2. **At a natural stopping point — the task is done, you're pausing, or the context window is
   about to compact — run `ctx save "<one line: what you just did + the next step>"`.** Save at
   checkpoints, not after every edit.
3. **When the user asks "where was I" / "what were we doing", run `ctx resume`.**

Good notes are one line, concrete, and name the next step:

```bash
ctx save "auth refactor: extracted validateToken(); NEXT: wire it into the login route + add tests"
```

## Copy-paste rules snippet

Drop this into your agent's rules file — `AGENTS.md`, `CLAUDE.md`, `.cursorrules`,
`.clinerules`, or whatever your agent reads:

```md
## ctx — where-was-I memory
When you start work in this project, run `ctx resume` first and use its note + changed-files
list to orient. At a stopping point (task done, pausing, or before the context window compacts),
run `ctx save "<what you just did + the next step>"` so the next session can pick up. Save at
checkpoints, not after every edit. If `ctx` isn't installed, skip this.
```

## Claude Code skill

If you use Claude Code, the same protocol is packaged as a skill in
[`skills/ctx/SKILL.md`](../skills/ctx/SKILL.md). Install it by copying it into your skills
directory:

```bash
mkdir -p ~/.claude/skills/ctx
cp skills/ctx/SKILL.md ~/.claude/skills/ctx/SKILL.md
```

Claude Code will then invoke it on its own when you resume or wrap up work in a project.
