---
name: commit
description: Use for every commit in this repo (asked to commit, "/commit", or finishing a change).
---

# Commit

The rules and the message format are in Commits in `CONTRIBUTING.md`. This skill gives the procedure.

## Before you commit

1. Run `git status -sb`. The first line shows the branch.
   - Make sure that it is the branch of the current task. A different person or session can change the branch in the same folder. If the branch is wrong, stop and ask the user.
   - Commit only the changes that you made for the current task. If you find changes that you did not make, stop and ask the user.
2. Do the steps in "Before you finish" in `AGENTS.md`.

## Stage the changes

- Stage each path by name (`git add <path>...`). Do not use `git add -A` without a check of what it stages.
- Do not stage secrets, local settings (see `.gitignore`) or build output.

## Write the message

- Use the format in Message format in `CONTRIBUTING.md`.
- Check the complete draft commit message against Message format and "Text for outside readers" in `CONTRIBUTING.md`.
- Give a multi-line message with a quoted heredoc: `git commit -F - <<'EOF' ... EOF`.

## Safety

- Do not use `--no-verify`. Do not force-push, except in the next item. Do not rewrite commits that are on a remote, except in the next item.
- If your PR branch has a conflict with `main`, rebase the branch on `main`. Then ask the user and push with `git push --force-with-lease`. Use this only on a PR branch that is not merged.
- You can amend or rebase unpushed commits that you made in this task.
- If a hook fails, fix the cause and make the commit again.

## After you commit

Report the short hash and the branch.
