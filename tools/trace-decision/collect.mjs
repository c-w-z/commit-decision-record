#!/usr/bin/env node
// Collects the commits of some lines of a file, for the trace-decision skill. See --help.
// The script only collects. The AI assistant judges which source is about the decision.
import { collect, realGh, realGit } from './collect-lib.mjs';

const cwd = process.cwd();
const result = collect({ args: process.argv.slice(2), git: realGit(cwd), gh: realGh(cwd) });
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
// process.exitCode, not process.exit(): on a pipe, process.exit() can end the process before stdout is written.
process.exitCode = result.code;
