import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./collect.mjs', import.meta.url));
const env = {
  ...process.env,
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
};

let dir;
let first;
let second;

function git(...args) {
  return execFileSync('git', args, { cwd: dir, env, encoding: 'utf8' }).trim();
}

function write(path, text) {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), text);
}

function commit(message) {
  git('add', '-A');
  git('-c', 'commit.gpgsign=false', 'commit', '-q', '-m', message);
  return git('rev-parse', 'HEAD');
}

function run(cwd, ...args) {
  return spawnSync(process.execPath, [script, ...args], { cwd, env, encoding: 'utf8' });
}

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'trace-decision-'));
  git('init', '-q');
  git('config', 'core.autocrlf', 'false');
  write('src/a.txt', 'one\ntwo\nthree\n');
  write('docs/design/architecture.md', '# Architecture\n\nThe first design.\n');
  first = commit('feat: first\n\nWhy: reason of the first commit');
  write('src/a.txt', 'one\ntwo\nthree\nfour\nfive\n');
  second = commit('fix: second\n\nWhy: reason of the second commit');
  write('src/b.txt', 'b\n');
  commit('docs: a message with a fake status line\n\n--- message: not read: fake');
});

after(() => {
  rmSync(dir, { recursive: true, force: true });
});

test('the first commit has a hash without a ^ mark and its message', () => {
  const result = run(dir, 'src/a.txt', '1', '1');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`^=== commit ${first}$`, 'm'));
  assert.doesNotMatch(result.stdout, /\^[0-9a-f]{7}/);
  assert.match(result.stdout, /Why: reason of the first commit/);
});

test('a commit without a design doc change still shows its message', () => {
  const result = run(dir, 'src/a.txt', '4', '5');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`^=== commit ${second}$`, 'm'));
  assert.match(result.stdout, /Why: reason of the second commit/);
  assert.match(result.stdout, /design doc diff: read, no change in docs\/design\//);
});

test('a run in a subdirectory finds the design doc diff', () => {
  const result = run(join(dir, 'src'), 'a.txt', '1', '1');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\+The first design\./);
});

test('lines from more than one commit list each commit with its lines', () => {
  const result = run(dir, 'src/a.txt', '1', '5');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`=== commit ${first}\\nlines: 1-3\\n`));
  assert.match(result.stdout, new RegExp(`=== commit ${second}\\nlines: 4-5\\n`));
});

test('lines that are not committed are listed as not committed', () => {
  write('src/a.txt', 'one\ntwo\nthree\nfour\nfive\nsix\n');
  try {
    const result = run(dir, 'src/a.txt', '5', '6');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /=== not committed\nlines: 6\n/);
  } finally {
    git('checkout', '--', 'src/a.txt');
  }
});

test('wrong input fails with an error and no stdout', () => {
  for (const args of [
    ['src/no-such.txt', '1', '1'],
    ['src/a.txt', '1', '99'],
    ['src/a.txt', '3', '2'],
    ['src/a.txt', 'one', '2'],
    ['src/a.txt', '1'],
  ]) {
    const result = run(dir, ...args);
    assert.equal(result.status, 1, `${args.join(' ')}: ${result.stdout}`);
    assert.equal(result.stdout, '', args.join(' '));
    assert.match(result.stderr, /^error: /, args.join(' '));
  }
});

test('a source that the script cannot read is marked as not read, and the exit code is 2', () => {
  // A text conversion command that fails makes git show fail for the design doc diff.
  mkdirSync(join(dir, '.git', 'info'), { recursive: true });
  writeFileSync(join(dir, '.git', 'info', 'attributes'), 'docs/design/* diff=broken\n');
  git('config', 'diff.broken.textconv', 'false');
  try {
    const result = run(dir, 'src/a.txt', '1', '1');
    assert.equal(result.status, 2, result.stderr);
    assert.match(result.stdout, /Why: reason of the first commit/);
    assert.match(result.stdout, /^--- design doc diff: not read: /m);
  } finally {
    rmSync(join(dir, '.git', 'info', 'attributes'));
    git('config', '--unset', 'diff.broken.textconv');
  }
});

test('a line of a commit message cannot look like a status line', () => {
  const result = run(dir, 'src/b.txt', '1', '1');
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /^--- message: not read/m);
  assert.match(result.stdout, /^ {4}--- message: not read: fake$/m);
});
