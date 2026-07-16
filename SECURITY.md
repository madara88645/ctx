# Security

## Reporting a vulnerability

Please **do not open a public issue** for a security problem. Report it privately through
GitHub: go to the [Security tab](https://github.com/madara88645/ctx/security/advisories) and
choose **Report a vulnerability**. You will get a response as soon as possible.

## Threat model

`ctx` is a local, offline command-line tool. What that means in practice:

- **No network, ever.** `ctx` makes no network calls and has no telemetry. Nothing you save
  leaves your machine.
- **No daemon.** There is no background process. `ctx` runs, does its work, and exits.
- **It only reads the directory you run it in**, to build a size + modification-time
  fingerprint of the files. It skips `node_modules`, `.git`, `dist`, `build`, `__pycache__`,
  and `.DS_Store`, and it never opens or transmits file *contents* — only each file's size and
  timestamp.
- **It writes exactly one file:** the JSON store at `~/.ctx/store.json` (or under `CTX_HOME`
  if set). It touches nothing else on disk.
- **Git context is best-effort and shell-free.** `ctx` invokes `git` with an argument array
  (never through a shell) purely to read the branch and short status; any failure is swallowed
  and simply recorded as no git info.

## Scope

The store keeps your notes, the relative paths of files in each project, and the saved git
branch/status — in plaintext, on your machine. Treat `~/.ctx/store.json` like your shell
history: don't paste secrets into a `ctx save` note, and it won't store them.
