import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collect, findReferences, realGit } from './collect-lib.mjs';

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

// The tests of the Git part do not read GitHub. The GitHub tests below give collect() a fake gh.
function run(cwd, ...args) {
  return spawnSync(process.execPath, [script, '--no-github', ...args], { cwd, env, encoding: 'utf8' });
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

// A fake gh. Each reply belongs to the first prefix that the joined arguments start with.
function fakeGh(replies) {
  return (args) => {
    const key = args.join(' ');
    const found = replies.find(([prefix]) => key.startsWith(prefix));
    if (!found) throw ghError(`no reply for: ${key}`);
    if (found[1] instanceof Error) throw found[1];
    return found[1];
  };
}

function ghError(text) {
  return Object.assign(new Error(text), { stderr: text });
}

function commitLine(sha, message) {
  return `${JSON.stringify([sha, message])}\n`;
}

function collectWithGitHub(replies) {
  return collect({ args: ['src/a.txt', '1', '1'], git: realGit(dir), gh: fakeGh([['repo view', 'o/r\n'], ...replies]) });
}

test('GitHub: the script reads the pull request, its commits, its design doc diff and the references', () => {
  const body = 'Fixes #7\nSee https://github.com/o/r/issues/8#issuecomment-99 and https://github.com/o/r/pull/9#discussion_r55';
  const result = collectWithGitHub([
    [`api --paginate repos/o/r/commits/${first}/pulls`, '5\n'],
    ['api --paginate repos/o/r/pulls/5/commits', commitLine(first, 'feat: first') + commitLine('a'.repeat(40), 'chore: other\n\nWhy: reason of the other commit')],
    ['api --paginate repos/o/r/pulls/5/files', `${JSON.stringify(['docs/design/architecture.md', '+The design in the pull request.'])}\n`],
    ['api repos/o/r/pulls/5', JSON.stringify({ title: 'Add a', html_url: 'https://github.com/o/r/pull/5', body, commits: 2, changed_files: 1 })],
    ['pr view 5', 'https://github.com/o/r/issues/7\n'],
    ['api repos/o/r/issues/comments/99', 'The reason in a comment.\n'],
    ['api repos/o/r/pulls/comments/55', 'The reason in a review comment.\n'],
    ['api repos/o/r/issues/7', JSON.stringify({ title: 'Issue seven', html_url: 'https://github.com/o/r/issues/7', body: 'The reason in issue seven.' })],
  ]);
  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /^--- pull request: read, #5$/m);
  assert.match(result.stdout, /^ {4}Why: reason of the other commit$/m);
  assert.match(result.stdout, /^ {4}\+The design in the pull request\.$/m);
  assert.match(result.stdout, /^=== reference o\/r#7\n--- issue: read\n/m);
  assert.equal(result.stdout.match(/^=== reference o\/r#7$/gm).length, 1);
  assert.match(result.stdout, /The reason in issue seven\./);
  assert.match(result.stdout, /^=== reference o\/r#8 \(#issuecomment-99\)\n--- comment: read\n {4}The reason in a comment\.$/m);
  assert.match(result.stdout, /^=== reference o\/r#9 \(#discussion_r55\)\n--- review comment: read\n {4}The reason in a review comment\.$/m);
});

test('GitHub: the script does not take a pull request that has the commit only through its base branch', () => {
  const result = collectWithGitHub([
    [`api --paginate repos/o/r/commits/${first}/pulls`, '5\n'],
    ['api --paginate repos/o/r/pulls/5/commits', commitLine('a'.repeat(40), 'chore: other')],
    ['api repos/o/r/pulls/5', JSON.stringify({ title: 'Other', html_url: 'https://github.com/o/r/pull/5', body: '', commits: 1 })],
  ]);
  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /^--- pull request: read, no pull request contains the commit$/m);
});

test('GitHub: the script does not confirm a pull request when GitHub gives only part of its commits', () => {
  const result = collectWithGitHub([
    [`api --paginate repos/o/r/commits/${first}/pulls`, '5\n'],
    ['api --paginate repos/o/r/pulls/5/commits', commitLine('a'.repeat(40), 'chore: other')],
    ['api repos/o/r/pulls/5', JSON.stringify({ title: 'Large', html_url: 'https://github.com/o/r/pull/5', body: '', commits: 300 })],
  ]);
  assert.equal(result.code, 2, result.stdout);
  assert.match(result.stdout, /^--- pull request: not confirmed: #5: GitHub gave 1 of 300 commits, without this commit$/m);
  assert.match(result.stdout, /Why: reason of the first commit/);
});

test('GitHub: a cut list that contains the commit confirms the pull request, but is not read in full', () => {
  const result = collectWithGitHub([
    [`api --paginate repos/o/r/commits/${first}/pulls`, '5\n'],
    ['api --paginate repos/o/r/pulls/5/commits', commitLine(first, 'feat: first')],
    ['api --paginate repos/o/r/pulls/5/files', `${JSON.stringify(['src/a.txt', '+one'])}\n`],
    ['api repos/o/r/pulls/5', JSON.stringify({ title: 'Large', html_url: 'https://github.com/o/r/pull/5', body: '', commits: 300, changed_files: 4000 })],
    ['pr view 5', ''],
  ]);
  assert.equal(result.code, 2, result.stdout);
  assert.match(result.stdout, /^--- pull request: read, #5$/m);
  assert.match(result.stdout, /^--- commits of pull request #5: not read in full: GitHub gave 1 of 300 commits$/m);
  assert.match(result.stdout, /^--- design doc diff of pull request #5: not read in full: GitHub gave 1 of 4000 changed files$/m);
});

test('GitHub: a failed lookup is not read, and the local sources stay', () => {
  const result = collectWithGitHub([[`api --paginate repos/o/r/commits/${first}/pulls`, ghError('HTTP 502')]]);
  assert.equal(result.code, 2, result.stdout);
  assert.match(result.stdout, /^--- pull request: not read: HTTP 502$/m);
  assert.match(result.stdout, /Why: reason of the first commit/);
});

test('GitHub: when gh cannot reach GitHub, one status line replaces all GitHub blocks', () => {
  const missing = Object.assign(new Error('spawnSync gh ENOENT'), { code: 'ENOENT' });
  for (const [error, reason] of [
    [missing, 'the gh command is not installed'],
    [ghError('To get started with GitHub CLI, please run:  gh auth login'), 'To get started with GitHub CLI, please run:  gh auth login'],
  ]) {
    const result = collect({ args: ['src/a.txt', '1', '5'], git: realGit(dir), gh: fakeGh([['repo view', error]]) });
    assert.equal(result.code, 2, result.stdout);
    assert.equal(result.stdout.match(/^--- github: not read: (.*)$/gm).length, 1);
    assert.match(result.stdout, new RegExp(`^--- github: not read: ${reason}$`, 'm'));
    assert.doesNotMatch(result.stdout, /^=== pull request/m);
    assert.match(result.stdout, /Why: reason of the first commit/);
    assert.match(result.stdout, /Why: reason of the second commit/);
  }
});

test('--no-github reads only Git', () => {
  const result = collect({ args: ['--no-github', 'src/a.txt', '1', '1'], git: realGit(dir), gh: fakeGh([]) });
  assert.equal(result.code, 0, result.stdout);
  assert.doesNotMatch(result.stdout, /github|pull request/);
});

test('references are found in keywords, trailers, mentions and URLs', () => {
  const text = [
    'Fixes #12',
    'closes: #3',
    'Refs: #45',
    'see #9 and #9',
    'Fixes octo-org/octo-repo#100',
    'https://github.com/cli/cli/issues/2545#issuecomment-751842548',
    'https://github.com/o/r/pull/7#discussion_r55.',
    'color #fff, step 5.3, abc#12',
  ].join('\n');
  const names = findReferences(text, 'o/r').map((r) => `${r.repo}#${r.number}${r.part ? `#${r.part}` : ''}`);
  assert.deepEqual(names, [
    'o/r#12',
    'o/r#3',
    'o/r#45',
    'o/r#9',
    'octo-org/octo-repo#100',
    'cli/cli#2545#issuecomment-751842548',
    'o/r#7#discussion_r55',
  ]);
});
