// The logic of collect.mjs. Tests call collect() with a fake gh, so they need no network.
import { execFileSync } from 'node:child_process';

export const HELP = `Usage: node tools/trace-decision/collect.mjs [--no-github] <file> <start> <end>

Prints the commits that last changed lines <start> to <end> of <file>.
For each commit, it prints the full message and the diff of the design docs (docs/design/).
It also reads GitHub with the gh command: the pull request of each commit, the messages of
its commits, its design doc diff and its body, and the issues and comments that the pull
request and the commit messages name. It reads these references, but not the references in them.
If gh cannot reach the GitHub repo of the current directory, for example because gh is not
installed or not logged in, the script prints one "--- github: not read" line and reads only Git.

  <file>       Path of the file, from the current directory.
  <start>      First line, 1 or more.
  <end>        Last line, <start> or more.
  --no-github  Read only Git.
  --help       Print this text.

Output:
  A line that starts with "=== " starts a block: a commit, a pull request or a reference.
  A line "--- <source>: <status>" gives the status of one source: "read", "not read: <reason>",
  "not read in full: <reason>" or "not confirmed: <reason>". After "not read in full", the
  text is the part that the script read. The text from Git and GitHub follows its status line,
  with 4 spaces before each line, so that the text cannot look like a status line.

Exit codes:
  0  The script read all sources.
  1  Wrong input, for example a path that Git does not know or a line out of range.
     The script prints the error and nothing on stdout.
  2  The script could not read a source in full, or could not confirm a pull request.
     The status line says "not read", "not read in full" or "not confirmed".
     The output keeps the evidence that the script read.

Example:
  node tools/trace-decision/collect.mjs .githooks/pre-push 3 32
`;

// Git gives this name to lines that are not committed.
const NOT_COMMITTED = '0'.repeat(40);

// The script reads at most this number of references, so that a large pull request does not make it run for minutes.
const MAX_REFERENCES = 30;

// An issue or pull request URL with an optional "#" part, or "#12", or "owner/repo#12".
const REFERENCE =
  /https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/(?:issues|pull)\/(\d+)(?:#([\w-]+))?|(?<![\w/#])(?:([\w.-]+\/[\w.-]+))?#(\d+)\b/g;

class InputError extends Error {}

function fail(message) {
  throw new InputError(message);
}

export function errorText(error) {
  return (error.stderr || error.message).toString().trim().replace(/[\r\n\u2028\u2029]+/g, ' ') || 'command failed';
}

function lines(text) {
  return text.split('\n').map((line) => line.replace(/\r$/, '')).filter((line) => line !== '');
}

function indent(text) {
  const body = (text ?? '').replace(/\r/g, '').trimEnd();
  if (body === '') return '    (empty)';
  return body
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n');
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

export function findReferences(text, repo) {
  const found = new Map();
  for (const match of text.matchAll(REFERENCE)) {
    const reference = match[1]
      ? { repo: match[1], number: Number(match[2]), part: match[3] ?? '' }
      : { repo: match[4] ?? repo, number: Number(match[5]), part: '' };
    found.set(referenceName(reference), reference);
  }
  return [...found.values()];
}

function referenceName({ repo, number, part }) {
  return `${repo}#${number}${part ? ` (#${part})` : ''}`;
}

export function realGit(cwd) {
  return (args) =>
    execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 });
}

export function realGh(cwd) {
  return (args) =>
    execFileSync('gh', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 });
}

// Returns { code, stdout, stderr }. git and gh take a list of arguments and return stdout, or throw.
export function collect({ args, git, gh }) {
  try {
    return run(args, git, gh);
  } catch (error) {
    if (!(error instanceof InputError)) throw error;
    return { code: 1, stdout: '', stderr: `error: ${error.message}\n` };
  }
}

function run(args, git, gh) {
  if (args.includes('--help')) return { code: 0, stdout: HELP, stderr: '' };
  const github = !args.includes('--no-github');
  const rest = args.filter((arg) => arg !== '--no-github');
  if (rest.length !== 3) fail('expected [--no-github] <file> <start> <end>. Run with --help.');

  const [file, startText, endText] = rest;
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
  let incomplete = false;
  const status = (source, error) => {
    if (error) incomplete = true;
    out.push(error ? `--- ${source}: not read: ${error}` : `--- ${source}: read`);
  };

  const commits = [];
  for (const [hash, numbers] of linesOfCommit) {
    numbers.sort((a, b) => a - b);
    if (hash === NOT_COMMITTED) {
      out.push('=== not committed', `lines: ${ranges(numbers)}`, '');
      continue;
    }
    out.push(`=== commit ${hash}`, `lines: ${ranges(numbers)}`);
    let message = '';
    try {
      const [date, body] = git(['show', '-s', '--date=short', '--format=%ad%x00%B', hash]).split('\0');
      message = body;
      out.push(`date: ${date}`);
      status('message');
      out.push(indent(message));
    } catch (error) {
      status('message', errorText(error));
    }
    try {
      // :(top) makes the path start at the repo root, also when the script runs in a subdirectory.
      const diff = git(['show', '--no-color', '--no-ext-diff', '--format=', hash, '--', ':(top)docs/design']);
      if (diff.trim() === '') out.push('--- design doc diff: read, no change in docs/design/');
      else {
        status('design doc diff');
        out.push(indent(diff));
      }
    } catch (error) {
      status('design doc diff', errorText(error));
    }
    out.push('');
    commits.push({ hash, message });
  }

  if (github && commits.length > 0 && readGitHub(gh, commits, out)) incomplete = true;

  return { code: incomplete ? 2 : 0, stdout: out.join('\n'), stderr: '' };
}

// gh emits one JSON record per line. A failed page can leave records on stdout.
function readPaginatedRows(gh, endpoint, query) {
  let stdout;
  let error;
  try {
    stdout = gh(['api', '--paginate', endpoint, '--jq', query]);
  } catch (failure) {
    stdout = failure.stdout?.toString() ?? '';
    error = errorText(failure);
  }

  const rows = [];
  for (const line of lines(stdout)) {
    try {
      const row = JSON.parse(line);
      if (!Array.isArray(row) || typeof row[0] !== 'string') throw new Error('Invalid row in GitHub output');
      rows.push(row);
    } catch (failure) {
      error ??= errorText(failure);
      break;
    }
  }
  return { rows, error };
}

function readPullRequest(gh, repo, number) {
  try {
    const pr = JSON.parse(gh(['api', `repos/${repo}/pulls/${number}`]));
    const { rows, error: commitError } = readPaginatedRows(gh, `repos/${repo}/pulls/${number}/commits`, '.[] | [.sha, .commit.message] | @json');
    const commits = rows.map(([sha, message]) => ({ sha, message }));
    return { number, title: pr.title, url: pr.html_url, body: pr.body, total: pr.commits, files: pr.changed_files, commits, commitError };
  } catch (error) {
    return { number, error: errorText(error) };
  }
}

// Adds the GitHub blocks to out. Returns true if a source was not read or a pull request was not confirmed.
function readGitHub(gh, commits, out) {
  let incomplete = false;
  const status = (source, error) => {
    if (error) incomplete = true;
    out.push(error ? `--- ${source}: not read: ${error}` : `--- ${source}: read`);
  };

  // The first query tells if gh can reach GitHub. If not, one status line replaces all GitHub blocks.
  let repo;
  try {
    repo = gh(['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']).trim();
  } catch (error) {
    out.push('=== github');
    status('github', error.code === 'ENOENT' ? 'the gh command is not installed' : errorText(error));
    out.push('');
    return true;
  }

  // The texts in which the script looks for references, and the pull requests that it printed.
  const texts = [];
  const printed = new Set();

  for (const { hash, message } of commits) {
    out.push(`=== pull request of commit ${hash}`);
    texts.push(message);
    let numbers;
    try {
      numbers = lines(gh(['api', '--paginate', `repos/${repo}/commits/${hash}/pulls`, '--jq', '.[].number'])).map(Number);
    } catch (error) {
      status('pull request', errorText(error));
      out.push('');
      continue;
    }

    // GitHub also lists a pull request that has the commit only through its base branch.
    // The commit list of the pull request tells them apart, if the list is complete.
    const contains = [];
    const unsure = [];
    for (const number of numbers) {
      const pr = readPullRequest(gh, repo, number);
      if (pr.error) unsure.push(`#${number}: ${pr.error}`);
      else if (pr.commits.some((commit) => commit.sha === hash)) contains.push(pr);
      else if (pr.commitError) unsure.push(`#${number}: ${pr.commitError}`);
      else if (pr.commits.length < pr.total)
        unsure.push(`#${number}: GitHub gave ${pr.commits.length} of ${pr.total} commits, without this commit`);
    }
    if (contains.length > 1) unsure.push(`more than one pull request contains the commit: ${contains.map((pr) => `#${pr.number}`).join(', ')}`);
    if (unsure.length > 0) {
      incomplete = true;
      out.push(`--- pull request: not confirmed: ${unsure.join('; ')}`, '');
      continue;
    }
    if (contains.length === 0) {
      out.push('--- pull request: read, no pull request contains the commit', '');
      continue;
    }

    const pr = contains[0];
    out.push(`--- pull request: read, #${pr.number}`, indent(`${pr.title}\n${pr.url}`));
    if (printed.has(pr.number)) {
      out.push(`    The block of pull request #${pr.number} is above.`, '');
      continue;
    }
    printed.add(pr.number);

    status('pull request body');
    out.push(indent(pr.body));
    texts.push(pr.body ?? '');

    // A partial list can confirm membership even when a later page fails.
    const commitGap = pr.commitError ?? (pr.commits.length < pr.total
      ? `GitHub gave ${pr.commits.length} of ${pr.total} commits`
      : undefined);
    if (commitGap) {
      incomplete = true;
      out.push(`--- commits of pull request #${pr.number}: not read in full: ${commitGap}`);
    } else out.push(`--- commits of pull request #${pr.number}: read, ${pr.commits.length}`);
    for (const commit of pr.commits) {
      out.push(indent(`commit ${commit.sha}\n${commit.message}`), '');
      texts.push(commit.message);
    }

    const source = `design doc diff of pull request #${pr.number}`;
    // Compare the count of all files with the PR total. GitHub gives at most 3000 files.
    const { rows: all, error: fileError } = readPaginatedRows(
      gh, `repos/${repo}/pulls/${pr.number}/files`, '.[] | [.filename, .patch] | @json',
    );
    if (fileError && all.length === 0) {
      status(source, fileError);
    } else {
      const files = all.filter(([name]) => name.startsWith('docs/design/'));
      const gaps = [];
      if (fileError) gaps.push(fileError);
      if (all.length < pr.files) gaps.push(`GitHub gave ${all.length} of ${pr.files} changed files`);
      const missing = files.filter(([, patch]) => patch == null).length;
      if (missing > 0) gaps.push(`GitHub gave no patch for ${missing} of ${files.length} listed design files`);
      if (gaps.length > 0) {
        incomplete = true;
        out.push(`--- ${source}: not read in full: ${gaps.join('. ')}`);
      } else if (files.length === 0) out.push(`--- ${source}: read, no change in docs/design/`);
      else status(source);
      for (const [name, patch] of files) out.push(indent(`${name}\n${patch ?? '(GitHub gives no patch for this file)'}`), '');
    }

    try {
      // A pull request can close an issue by a manual link. Only GraphQL, so gh pr view, gives these links.
      const urls = gh(['pr', 'view', String(pr.number), '--repo', repo, '--json', 'closingIssuesReferences', '--jq', '.closingIssuesReferences[].url']);
      status(`closing issues of pull request #${pr.number}`);
      out.push(indent(urls));
      texts.push(urls);
    } catch (error) {
      status(`closing issues of pull request #${pr.number}`, errorText(error));
    }
    out.push('');
  }

  const references = findReferences(texts.join('\n'), repo).filter(
    (reference) => !(reference.repo === repo && reference.part === '' && printed.has(reference.number)),
  );
  for (const reference of references.slice(0, MAX_REFERENCES)) {
    out.push(`=== reference ${referenceName(reference)}`);
    readReference(gh, reference, out, status);
    out.push('');
  }
  if (references.length > MAX_REFERENCES) {
    out.push('=== references over the limit');
    status('references', `the script reads at most ${MAX_REFERENCES}: ${references.slice(MAX_REFERENCES).map(referenceName).join(', ')}`);
    out.push('');
  }
  return incomplete;
}

function readReference(gh, { repo, number, part }, out, status) {
  try {
    if (part.startsWith('issuecomment-')) {
      const body = gh(['api', `repos/${repo}/issues/comments/${part.slice('issuecomment-'.length)}`, '--jq', '.body']);
      status('comment');
      out.push(indent(body));
      return;
    }
    if (part.startsWith('discussion_r')) {
      const body = gh(['api', `repos/${repo}/pulls/comments/${part.slice('discussion_r'.length)}`, '--jq', '.body']);
      status('review comment');
      out.push(indent(body));
      return;
    }
    // The issues endpoint also gives pull requests.
    const issue = JSON.parse(gh(['api', `repos/${repo}/issues/${number}`]));
    const kind = issue.pull_request ? 'pull request' : 'issue';
    status(kind);
    out.push(indent(`${issue.title}\n${issue.html_url}\n\n${issue.body ?? ''}`));
    if (part) status(`part #${part}`, 'the script reads only #issuecomment- and #discussion_r parts');
  } catch (error) {
    status('reference', errorText(error));
  }
}
