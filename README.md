# ctx — Context Snapshot & Resume CLI

**ctx** is a zero-dependency command-line utility designed to help you quickly save your current coding state ("where was I") and seamlessly reconstruct it when returning to a project. It tracks files modified, added, or removed, and records best-effort git context alongside a developer note, making context switching lightweight and frictionless.

## Requirements
- **Node.js**: version `20` or higher is required.
- **Dependencies**: Zero runtime dependencies.

## Installation & Usage

You can run `ctx` directly without installation by invoking it with Node:
```bash
node bin/ctx.mjs save "your developer note"
node bin/ctx.mjs resume
node bin/ctx.mjs list
```

Alternatively, you can link it globally using `npm link` so it is available globally under `ctx`:
```bash
npm link
# Now you can run it directly:
ctx save "your developer note"
```

## Commands & Examples

### `ctx save <note>`
Saves a snapshot of the current working directory under the specified note.
```bash
$ ctx save "fixing login screen authentication bug"
Saved snapshot for /Users/developer/project-alpha (14 files tracked).
```

### `ctx resume`
Compares the current directory footprint with the last saved snapshot, listing added, modified, and removed files since that snapshot, and displaying the saved note.
```bash
$ ctx resume
Resume brief for /Users/developer/project-alpha
Last save: 10 minutes ago
Note: fixing login screen authentication bug
Git then: main
Added (1): src/components/LoginButton.js
Modified (2): src/App.js, src/utils/auth.js
```

### `ctx list`
Lists all tracked projects with saved snapshots, sorted by the most recent save.
```bash
$ ctx list
10 minutes ago  /Users/developer/project-alpha  —  fixing login screen authentication bug
2 hours ago    /Users/developer/project-beta   —  refactored database query helper
```

## CTX_HOME Override
By default, the store is saved in your user home directory. You can override the directory where snapshots are stored by setting the `CTX_HOME` environment variable:
```bash
export CTX_HOME="/path/to/custom/dir"
```

## How it Works
`ctx` is designed to be extremely lightweight and secure. It saves all state as a single JSON store at `~/.ctx/store.json` (or under `CTX_HOME` if set). It builds project footprints using file size and modification time (`mtime`) fingerprints, completely skipping ignored directories such as `node_modules` and `.git`. It resolves best-effort git repository status using standard git subprocess calls. There are no running background daemons, and `ctx` never makes network requests, keeping your data entirely local.
