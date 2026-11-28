#!/usr/bin/env node
// Collects the commits of some lines of a file, for the trace-decision skill.
// The script only collects. The AI assistant judges which source is about the decision.
import { execFileSync } from 'node:child_process';

const HELP = `Usage: node tools/trace-decision/collect.mjs <file> <start> <end>

Prints the commits that last changed lines <start> to <end> of <file>.
For each commit, it prints the full message and the diff of the design docs (docs/design/).

  <file>    Path of the file, from the current directory.
  <start>   First line, 1 or more.
  <end>     Last line, <start> or more.
  --help    Print this text.

Exit codes:
  0  The script read all sources.
  1  Wrong input, for example a path that Git does not know or a line out of range.
     The script prints the error and nothing on stdout.
  2  The script could not read some sources. Each such source has the status line
     "--- <source>: not read". The other sources of the same commit are read.

Example:
  node tools/trace-decision/collect.mjs .githooks/pre-push 3 32
`;

// Git gives this name to lines that are not committed.
const NOT_COMMITTED = '0'.repeat(40);

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 });
}

function errorText(error) {
  return (error.stderr || error.message).trim();
}

class InputError extends Error {}

function fail(message) {
  throw new InputError(message);
}

// Turns sorted line numbers into "3-5, 9".
function ranges(numbers) {
  const parts = [];
  let first = numbers[0];
  let last = first;
  for (const n of numbers.slice(1)) {
    if (n === last + 1) {
      last = n;
      continue;
    }
    parts.push(first === last ? `${first}` : `${first}-${last}`);
    first = last = n;
  }
  parts.push(first === last ? `${first}` : `${first}-${last}`);
  return parts.join(', ');
}

function main(args) {
  if (args.includes('--help')) {
    process.stdout.write(HELP);
    return 0;
  }
  if (args.length !== 3) fail('expected <file> <start> <end>. Run with --help.');

  const [file, startText, endText] = args;
  const start = Number(startText);
  const end = Number(endText);
  if (!Number.isInteger(start) || start < 1) fail(`<start> must be a whole number of 1 or more: ${startText}`);
  if (!Number.isInteger(end) || end < start) fail(`<end> must be a whole number of <start> or more: ${endText}`);

  let blame;
  try {
    // --root prints the first commit without a "^" mark.
    blame = git(['blame', '--root', '--porcelain', '-L', `${start},${end}`, '--', file]);
  } catch (error) {
    fail(errorText(error));
  }

  // The porcelain format starts each line with "<hash> <original line> <final line>".
  const linesOfCommit = new Map();
  for (const line of blame.split('\n')) {
    const match = /^([0-9a-f]{40}) \d+ (\d+)/.exec(line);
    if (!match) continue;
    if (!linesOfCommit.has(match[1])) linesOfCommit.set(match[1], []);
    linesOfCommit.get(match[1]).push(Number(match[2]));
  }

  // Git shortens an <end> past the last line without an error. A wrong range is wrong input.
  const lastLine = Math.max(...[...linesOfCommit.values()].flat());
  if (lastLine < end) fail(`${file} has only ${lastLine} lines`);

  const out = [];
  let notRead = false;
  for (const [hash, numbers] of linesOfCommit) {
    numbers.sort((a, b) => a - b);
    if (hash === NOT_COMMITTED) {
      out.push('=== not committed', `lines: ${ranges(numbers)}`, '');
      continue;
    }
    out.push(`=== commit ${hash}`, `lines: ${ranges(numbers)}`);
    try {
      const [date, message] = git(['show', '-s', '--date=short', '--format=%ad%x00%B', hash]).split('\0');
      out.push(`date: ${date}`, '--- message: read', message.trimEnd());
    } catch (error) {
      notRead = true;
      out.push(`--- message: not read: ${errorText(error)}`);
    }
    try {
      // :(top) makes the path start at the repo root, also when the script runs in a subdirectory.
      const diff = git(['show', '--no-color', '--no-ext-diff', '--format=', hash, '--', ':(top)docs/design']);
      if (diff.trim() === '') out.push('--- design doc diff: read, no change in docs/design/');
      else out.push('--- design doc diff: read', diff.trimEnd());
    } catch (error) {
      notRead = true;
      out.push(`--- design doc diff: not read: ${errorText(error)}`);
    }
    out.push('');
  }

  process.stdout.write(out.join('\n'));
  return notRead ? 2 : 0;
}

// process.exitCode, not process.exit(): on a pipe, process.exit() can end the process before stdout is written.
try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  if (!(error instanceof InputError)) throw error;
  process.stderr.write(`error: ${error.message}\n`);
  process.exitCode = 1;
}
