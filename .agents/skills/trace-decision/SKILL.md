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
   2. Find the commits that changed the lines. The lines of one decision can come from more than one commit. Put the file and all lines of the decision in variables first. `--root` prints the hash of the first commit without a `^` mark, so that the hash works in the next commands:
      ```bash
      file=.githooks/pre-push
      start=3
      end=32
      git blame --root -L "$start,$end" -- "$file"
      ```
      List the different commits:
      ```bash
      git blame --root -s -L "$start,$end" -- "$file" | cut -d' ' -f1 | sort -u
      ```
      Do the rest of this step and step 5.3 for each commit in the list. Put the commit in a variable, and read its message. A commit can also do more than the decision in the code, so its `Why` can be about a different decision:
      ```bash
      hash=e92a4cd
      git show -s --format=%B "$hash"
      ```
   3. Show the design doc changes of the commit. A commit can also change sections about other decisions. If a changed section is about the decision, follow it with step 2 (Find the history of a doc section). `:(top)` makes the path start at the repo root, so the command also works in a subdirectory:
      ```bash
      design=':(top)docs/design'
      git show --format= "$hash" -- "$design"
      ```
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
- Before you overturn a decision, give the user what you found. The maintainer decides.
- After the maintainer decides, update the docs as `docs/doc-rules.md` says. Put `Supersedes:` in the commit body.
