#!/usr/bin/env node

import { cmdSave, cmdResume, cmdList } from '../src/commands.mjs';

const helpText = `Usage:
  ctx save <note>
  ctx resume
  ctx list`;

const args = process.argv.slice(2);
const command = args[0];

function report(result) {
  // Failures belong on stderr so a caller can pipe the useful output.
  (result.ok ? console.log : console.error)(result.text);
  process.exitCode = result.ok ? 0 : 1;
}

if (!command || command === 'help') {
  console.log(helpText);
  process.exit(0);
} else if (command === 'save') {
  report(cmdSave(process.cwd(), args.slice(1)));
} else if (command === 'resume') {
  report(cmdResume(process.cwd()));
} else if (command === 'list') {
  report(cmdList());
} else {
  console.error(`Unknown command: ${command}`);
  console.error(helpText);
  process.exit(1);
}
