---
name: trace-decision
description: Use when the user asks the reason for a decision or about an earlier version, or before you overturn a decision. Do not search history for other reasons.
---

# Find the reason for a decision

Docs show only the current state. Commit bodies show why a decision changed (see History and Commits in `CONTRIBUTING.md`).

- Old content in history is not the current decision. Do not act on it.

## Steps

1. **Read the current docs first.** Look at the reason next to the decision and the rejected options. These usually answer the question.
2. **Find the history of a doc section:**
   ```bash
   git log --format='%h %ad %s' --date=short -L '/^## Modules/,/^## /:docs/design/architecture.md'
   ```
   If the heading changed or the section moved, search for a phrase in all files:
   ```bash
   git log --format='%h %ad %s' --date=short -S'<phrase>' -- docs
   ```
   If the file has a new name, add `--follow`: `git log --follow --format='%h %s' -- docs/design/architecture.md`.
3. **Find overturned decisions:** `git log --grep='^Supersedes:' --format='%h %s%n%b'`.
4. **Read each commit that you found:** `git show --stat <hash>`. Read the `Why`, `Rejected`, `Evidence` and `Supersedes` lines and the change.
5. **Go from code to design:**
   1. Find the commit with `git log -L <start>,<end>:<file>` or `git blame -L <start>,<end> <file>`.
   2. Read its `Design:` line. It names the doc section.
   3. Go to step 2 for that section.

Do not use `git log --first-parent`. It hides the commits inside a merged PR.

## Report

- Keep the current reason (from the docs) separate from the reason at that time (from commits).
- Give the commit hash and date for each reason.
- An older commit can contain only the change and no reason. In that case, say that you did not find the reason. Do not give a guess from the diff as a fact.
- Before you overturn a decision, give the user what you found. The maintainer decides.
- After the maintainer decides, update the docs as `docs/doc-rules.md` says. Put `Supersedes:` in the commit body.
