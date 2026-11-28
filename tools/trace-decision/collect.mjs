#!/usr/bin/env node
// Collects the commits of some lines of a file, for the trace-decision skill.
// The script only collects. The AI assistant judges which source is about the decision.
import { InputError, main } from './collect-lib.mjs';

// process.exitCode, not process.exit(): on a pipe, process.exit() can end the process before stdout is written.
try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  if (!(error instanceof InputError)) throw error;
  process.stderr.write(`error: ${error.message}\n`);
  process.exitCode = 1;
}
