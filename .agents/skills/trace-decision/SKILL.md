---
name: trace-decision
description: Use when the user asks the reason for a decision or about an earlier version, or before you overturn a decision. Do not search history for other reasons.
---

# Find the reason for a decision

Docs show only the current state. Commit bodies show why a decision changed (see History and Commits in `CONTRIBUTING.md`).

- Old content in history is not the current decision. Do not act on it.

## Steps

1. **Read the current docs first.** Look at the reason, the accepted costs and the rejected options next to the decision. These usually answer the question.
2. **Find the history of a doc section:**
   ```bash
   git log --format='%h %ad %s' --date=short -L '/^## Modules/,/^## /:docs/design/architecture.md'
   ```
   If the heading changed or the section moved, search for a phrase in all files. Replace `<phrase>` with a quoted sentence from the section. `:(top)` makes the path start at the repo root:
   ```bash
   git log --format='%h %ad %s' --date=short -S <phrase> -- ':(top)docs'
   ```
   If the file has a new name, add `--follow`: `git log --follow --format='%h %s' -- ':(top)docs/design/architecture.md'`.
3. **Find overturned decisions:** `git log --grep='^Supersedes:' --format='%h %s%n%b'`.
4. **Read each commit that you found:** `git show --stat <hash>`. Read the `Why`, `Rejected`, `Cost`, `Evidence` and `Supersedes` lines and the change.
5. **Go from code to design:**
   1. Read the comments next to the code. If a comment links a design section, follow it with step 2 (Find the history of a doc section).
   2. Collect the commits of all lines of the decision. The lines of one decision can come from more than one commit. The script prints each commit with its lines, its full message and its design doc diff. Its `--help` text gives the parameters and the exit codes. The command finds the script from the repo root, and `<file>` is a path from the current directory:
      ```bash
      node "$(git rev-parse --show-toplevel)/tools/trace-decision/collect.mjs" <file> <start> <end>
      ```
      If the script exits with 1, fix the input. If it exits with 2, each status line `--- <source>: not read` marks one source that you did not read. Only these status lines give the status, because a commit message can also contain the words "not read". The other sources in the same block are read.
   3. Judge each commit block. A commit can also do more than the decision in the code. Its `Why` and its changed design sections can be about a different decision. If a changed section is about the decision, follow it with step 2 (Find the history of a doc section).
   4. Use this step when no comment links a design section about the decision, and no changed design section is about it:
      - Report the sources that you read: the comment and the commits.
      - Say that none of them links a design section about the decision. Do not say that no design section exists.
      - Give the `Why` of each commit that is about the decision. If no `Why` is about it, say that the sources that you read do not give the reason.

Do not use `git log --first-parent`. It hides the commits inside a merged PR.

## Report

- Keep the current reason and accepted costs (from the docs) separate from the reason and costs at that time (from commits).
- If the question is about a downside, say if a design doc or a `Cost:` line lists it.
- Give the commit hash and date for each reason and cost.
- A commit can have no reason or no `Cost:` line. In that case, say that you did not find it. Do not conclude that the author accepted or missed a downside. Do not give a guess from the diff as a fact.
- Report each source that the script of step 5 marks as "not read" as not read, also when you found a design section.
- Before you overturn a decision, give the user what you found. The maintainer decides.
- After the maintainer decides, update the docs as `docs/doc-rules.md` says. Put `Supersedes:` in the commit body.
