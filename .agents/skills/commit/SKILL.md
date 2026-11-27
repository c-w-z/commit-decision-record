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

- Do not use `--no-verify`.
- Do not force-push `main`. Do not rewrite the commits that are in `main`.
- You can amend or rebase unpushed commits that you made in this task.
- To rewrite other commits of a PR branch that is not merged, for example pushed commits or commits that you did not make, ask the user first. Then push with `git push --force-with-lease`.
- If a hook fails, fix the cause and make the commit again.

## After you commit

Report the short hash and the branch.
