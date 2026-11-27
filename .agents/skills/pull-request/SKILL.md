---
name: pull-request
description: Use before you write a PR or an issue.
---

# Pull request and issue

The rules are in `CONTRIBUTING.md`: Branches and PRs, Text for outside readers, Pull requests and Issues. The reader has only the repo and your text. The reader did not see the conversation. This skill gives the procedure.

## Before you open

1. Make sure that the commits are done.
2. Check the scope. The PR must hold one group of decisions that a reviewer can judge alone. If it holds two groups, split it into two PRs.

## Write the text

- For a PR, follow Pull requests in `CONTRIBUTING.md`.
- For an issue, follow Issues in `CONTRIBUTING.md`.
- Write a commit hash as plain text. Do not put it in backticks. GitHub links a plain hash to its commit, but it does not link a hash in a code span.

## Cold-read check

Run this check on the title and the body before you submit.

1. Read the text again. Use only the diff and the repo. Do not use the conversation.
2. Find each phrase that points to the conversation. Examples: "as you said", "earlier", "the above", "option B", "this time", "as discussed". Rewrite it with the fact that it points to, or link a commit, an issue or a doc section.
3. Find each name or abbreviation that you or the user made up in the conversation. Replace it with the term in `docs/design/GLOSSARY.md`. If no term exists, write the full description.
4. Check each claim. The diff, the repo or a linked source must support it.

## Labels

If you have triage access or more, add labels when you open the issue or the PR (`gh issue create --label`, `gh pr create --label`).

- Run `gh label list` and read the descriptions. The descriptions define the labels.
- Add one `type/` label. An issue template adds it to a new issue. Make sure that it is correct.

## After you open

Report the PR or issue number and the branch.
