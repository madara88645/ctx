# VHS tape for ctx's README demo GIF.
# Regenerate with: cd docs && vhs demo.tape
# (requires `vhs`: https://github.com/charmbracelet/vhs — `brew install vhs`)

Output demo.gif

Require node

Set Shell "bash"
Set FontSize 20
Set Width 1360
Set Height 600
Set Padding 20
Set Theme "Dracula"
Set WindowBar Rings
Set BorderRadius 8
Set Margin 30
Set MarginFill "#1e1f29"
Set TypingSpeed 45ms

# --- hidden setup: temp store, ctx on PATH, land in a small demo project ---
Hide
Type "export CTX_HOME=/tmp/ctx-gif-home && export PATH=/tmp/ctx-gif-shim:$PATH && cd /tmp/ctx-gif-demo/project-alpha && clear"
Enter
Sleep 500ms
Show

Sleep 800ms

# 1. Snapshot the moment before context-switching away.
Type "ctx save 'TODO: finish login validation — bug near line 12'"
Enter
Sleep 2500ms

# --- hidden: simulate time passing — edit one file, add one file, fresh screen ---
Hide
Type "bash /tmp/ctx-gif-demo/mutate.sh && clear"
Enter
Sleep 500ms
Show

Type "# ...back after a break..."
Enter
Sleep 1500ms

# 2. Resume: time since save, the note, and exactly what changed.
Type "ctx resume"
Enter
Sleep 4000ms

# 3. See every project ever stamped, most recent first.
Type "ctx list"
Enter
Sleep 3500ms

Sleep 1500ms
