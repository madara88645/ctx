# Contributing

Thanks for taking a look. Issues and pull requests are both welcome.

This tool was originally built end to end by delegated AI agents (see
[docs/making-of.md](docs/making-of.md)), but it is maintained like any other project — human
or agent contributions are equally welcome, as long as they come with tests and keep the tool
small.

## Getting set up

You need Node.js **≥ 20**. There is nothing to install — `ctx` has zero dependencies and no
lockfile.

```bash
npm test          # runs `node --test`, the whole suite
node bin/ctx.mjs save "trying it out"
```

Tests use a temporary `CTX_HOME` and temporary project directories, so running them never
touches your real `~/.ctx` store.

## Before you open a PR

Make sure the suite is green. CI runs the exact same thing on Linux and macOS across Node 20,
22, and 24:

```bash
npm test
```

New behaviour should come with a test. The suite is plain `node:test` + `node:assert`; each
module has its own `test/*.test.mjs`. Anything time-dependent takes an injectable `now`
(epoch ms) so tests stay deterministic — copy that pattern.

## Things worth knowing

- **Zero runtime dependencies, and it should stay that way.** The entire tool is Node.js
  built-ins (`fs`, `path`, `os`, `child_process`). A PR that adds a dependency needs a very
  good reason.
- **Local and offline.** No network calls, no daemon, no telemetry — see
  [SECURITY.md](SECURITY.md). Please don't loosen that.
- **The modules are pure and separately testable.** `fingerprint`, `timefmt`, `store`, `git`,
  and `commands` each do one thing and return values; `bin/ctx.mjs` is a thin dispatcher.
  Keep that shape.

## Scope

`ctx` is deliberately small. If you have an idea that grows it a lot, open an issue first so we
can talk about it before you spend time on the code.
