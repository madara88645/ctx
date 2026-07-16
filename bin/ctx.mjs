#!/usr/bin/env node

import { cmdSave, cmdResume, cmdList } from '../src/commands.mjs';

const helpText = `Usage:
  ctx save <note>
  ctx resume
  ctx list`;

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help') {
  console.log(helpText);
  process.exit(0);
} else if (command === 'save') {
  const result = cmdSave(process.cwd(), args.slice(1));
  console.log(result.text);
  process.exitCode = result.ok ? 0 : 1;
} else if (command === 'resume') {
  const result = cmdResume(process.cwd());
  console.log(result.text);
  process.exitCode = result.ok ? 0 : 1;
} else if (command === 'list') {
  const result = cmdList();
  console.log(result.text);
  process.exitCode = result.ok ? 0 : 1;
} else {
  console.log(helpText);
  process.exit(1);
}
