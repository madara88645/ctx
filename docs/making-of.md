# The making of `ctx` — a CLI I never wrote a line of

`ctx` is a small tool. The interesting part is how it got built: **I did not write a
single line of its product code.** An AI picked the idea, cheap delegated agents wrote
every module and every test, and I watched the whole thing happen live through a cockpit
called [Understudy](https://github.com/madara88645/agy-understudy). This page is the honest
record of that build — what worked, what broke, and what it proves.

## The premise

The bet behind this: let a frontier model do the *thinking* (planning, decomposition,
verification) and hand the *typing* to a cheap, fast model. The catch is trust — you will
not delegate real work to an agent you cannot see. So the loop needs a window.

- **The window:** [Understudy](https://github.com/madara88645/agy-understudy) — a zero-install
  cockpit (`npx agy-understudy`) that watches the coding agents you delegate to
  [Google Antigravity](https://antigravity.google) (the `agy` CLI, running Gemini).
- **The workers:** `agy` running **Gemini 3.5 Flash (High)**, one bounded run per slice.
- **The orchestrator:** Claude Code — it wrote the plan, generated each slice's prompt,
  ran it through `understudy run`, and independently re-verified the result before moving
  on. **It never wrote product code.**

The idea for the tool itself wasn't mine either: a research agent proposed a zero-dependency
"where was I" CLI as a good first dogfood target. `ctx` is that target.

## The plan: eight slices, hard contracts

Autonomous agents drift when the goal is fuzzy. So the whole build was written down first as
[`plan.md`](./making-of/plan.md): one architecture, a fixed store schema, and **eight slices**,
each a single bounded job with an exact *Produces* contract and its own test. A slice was only
"done" when the orchestrator re-ran `node --test` itself and saw green.

| Slice | What the agent built |
|-------|----------------------|
| S1 | Scaffold + `help` contract (`bin/ctx.mjs`, first test) |
| S2 | `formatRelative()` — relative-time formatting (pure) |
| S3 | `snapshotDir()` — directory walk → file fingerprints |
| S4 | `diffSnapshots()` — added / modified / removed |
| S5 | `store` — load/save the JSON store, `CTX_HOME` rule |
| S6 | `gitInfo()` — best-effort branch + short status |
| S7 | `commands` — `save` / `resume` / `list` composed |
| S8 | Wire the CLI + end-to-end test + README |

Each run was non-interactive (`--mode accept-edits`, imperative prompt, no "shall I?"
pauses). The per-slice prompts and raw run logs are preserved under
[`docs/making-of/slices/`](./making-of/slices/).

## What actually happened

**Eight slices, seven clean runs, one recovery — 41 out of 41 tests passing.** Watched live
on the Understudy panel at `127.0.0.1:4288`. The final slice (S8: wire + e2e + README) took
**66 seconds** end to end.

The one that didn't go clean is the most interesting, so here it is in full.

### The recovery: slice S1 hit a real footgun

S1's first attempt (`slices/s01-attempt1/`) **timed out** — Understudy's watchdog killed the
run when it stalled. The retry succeeded at writing the scaffold, but then the Gemini agent
tripped over a genuine bug: the validation command in the plan was `node --test test/`, and on
**Node v24 with `"type": "module"`**, passing a *directory* to `--test` throws
`Cannot find module .../test` — Node tries to import the directory itself.

The agent didn't give up or fake a pass. Its own log shows it:

1. ran `node --test test/` → failed,
2. tried `node --test` (no path) → **worked**,
3. tried the test file directly → worked,
4. **searched the web** to understand the Node v24 behavior,
5. then reported the limitation plainly instead of hiding it.

That finding fed straight back into the plan: slice S2 changed the test script from
`node --test test/` to bare `node --test`, which is why the shipped `package.json` uses the
bare form. **A cheap delegated agent found a Node-version footgun, debugged it, and reshaped
the plan** — exactly the kind of judgment the "cheap models can't be trusted" story says
won't happen.

### One more nice detail

The Gemini workers weren't running raw. Each run opened by reading its own skill files —
`using-superpowers`, `test-driven-development`, `verification-before-completion`,
`writing-plans` — and drove the work test-first. The logs show the worker writing the failing
test before the implementation, then verifying green before declaring done.

## The honest read

`ctx` lives in a crowded niche. "Save my dev context / where was I" tools are plentiful, and
the obvious names (`ctx`, `ctx-cli`, `ctxsnap`) are already taken on npm — which is why this
ships scoped, as `@madara88645/ctx`. As a *tool*, it is not going to stand out.

That's fine, because the tool isn't the point. The point is the **method**: a real, tested,
zero-dependency utility, built end to end by delegated agents you can afford to run all day,
with a human orchestrator who reviewed and verified but never typed the product code — and a
cockpit that made that delegation watchable enough to trust. `ctx` is the proof, not the
prize.

## Reproduce it

1. Install the cockpit: `npx agy-understudy`
2. Point `agy` at a bounded slice: `understudy run --dir <project> --prompt "<one slice>"`
3. Watch it at `127.0.0.1:4288`, then re-verify the result yourself before the next slice.

- Tool: [`@madara88645/ctx`](https://www.npmjs.com/package/@madara88645/ctx) · source in this repo
- Cockpit: [github.com/madara88645/agy-understudy](https://github.com/madara88645/agy-understudy)
- Full plan: [`docs/making-of/plan.md`](./making-of/plan.md) · raw run logs: [`docs/making-of/slices/`](./making-of/slices/)
