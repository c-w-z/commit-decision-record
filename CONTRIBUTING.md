# Contributing

This file gives the rules for commits, pull requests (PRs) and issues. People and AI assistants follow the same rules.

- Setup, build, test and CI: [docs/development.md](docs/development.md).
- How to write docs and comments: [docs/doc-rules.md](docs/doc-rules.md).
- The design rules that no change can break: Rules in [docs/design/overview.md](docs/design/overview.md#rules). Only the maintainer can change a rule.
- AI assistants also read [AGENTS.md](AGENTS.md).

## Branches and PRs

- Work on a feature branch. `main` accepts changes only through a PR (see [Branch protection](docs/development.md#branch-protection)).
- One PR holds one group of decisions that a reviewer can judge alone. If a PR holds two groups, split it into two PRs.
- The maintainer merges a PR with a merge commit.
- If your PR branch has a conflict with `main`, rebase the branch on the latest `main`. Then update the PR with `git push --force-with-lease`. Do not merge `main` into the branch. The CI job `no-merge-commits` fails on a PR branch that has a merge commit.

## Commits

- **One decision per commit.** Then `git blame` and a search of the log point to the reason.
- **Moves and rewrites go in different commits.** A commit that renames a file, splits a file or moves a section does not change the content. Then `git log --follow` and `git log -L` can follow the text.
- **Write the reason when you make the decision.** After the conversation ends, nobody can find the reason again.
- **A decision to change nothing also gets a commit.** Use `git commit --allow-empty` with only a message.

### Message format

```text
<type>[!]: <imperative summary>

[- optional list of the changes, for large commits]

Why: <the reason>                           (only when the diff does not show the reason)
Rejected: <alternative> — <why not>         (one line for each alternative that you considered)
Evidence: <a fact that supports Why>        (only when a fact outside the diff and CI supports Why)
Supersedes: <the earlier decision>          (only when this commit overturns a decision)
Design: <doc>#<section>                     (only for code that implements a design decision)

BREAKING CHANGE: <what breaks and how to migrate>   (use with `!` after the type)
```

- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `ci`, `chore`.
- Write the message in the languages that [Languages](docs/doc-rules.md#languages) gives. Keep doc and section names as they are (`architecture#modules`).
- `Evidence` gives facts that the diff and CI do not show. Examples are a measurement, an experiment or the behavior of an external program. Do not write build or test results, or the results of a grep or a link check. CI checks them.
- Write each fact in one field only. A common mistake is to give the reason against an alternative in `Why` and again in `Rejected`.
- `Design` connects code to its design section. Do not add it to a docs commit. A docs change is the design itself.

## Text for outside readers

The reader of a PR, an issue, a commit body, a comment or a design doc has only the repo and the text. The reader did not see the conversation that made the text. AI assistants often copy words from the conversation into the text. Obey these rules:

- **Do not point to the conversation.** Do not write "as you said", "earlier", "the one above", "option B" or "this time". To point to earlier work, link an issue, a commit or a doc section.
- **Do not use temporary names.** Names and abbreviations that the conversation made up do not go into the text. Write design terms as [docs/design/GLOSSARY.md](docs/design/GLOSSARY.md) gives them. Write other words in full the first time.
- **Make the text complete.** With only the text, the diff and the repo, the reader knows what changed and why.

## Pull requests

Fill every section of [.github/pull_request_template.md](.github/pull_request_template.md).

- **Title:** `<type>[!]: <imperative summary>`, with the types of [Message format](#message-format). The title becomes the subject of the merge commit. If the commits of the PR have different types, use the type of the main decision.
- **Body:** Write it in the language that [Languages](docs/doc-rules.md#languages) gives. Use the source text when you name a doc or one of its sections.
- **Why:** State the problem and why it is a problem. Link the issue or the design section that holds the reason. The reason for each smaller decision goes in the `Why` of its commit.
- **Summary:** State what the PR does. Do not list every commit.
- **To reviewer:** Name the main files and the files that only follow the change. Name the commits that only move or rename.
- **Validations:** Write the commands that you ran and the results that you saw. Do not write a result that you did not see. For a visual change, attach a screenshot.

## Issues

Use a template in `.github/ISSUE_TEMPLATE/` and fill every field. Give the facts that a stranger needs to reproduce the problem or to judge the request.

## Before you commit

1. If you changed code, run the commands in [Build and test](docs/development.md#build-and-test).
2. Check these items:
   - Can a reader understand the outside text (PR, issue, commit body, comment) with only the diff and the repo? Does it point to the conversation or use a temporary name?
   - Does the change affect a behavior, parameter, setting or command that a doc describes? If yes, change the doc and the `--help` text in the same commit.
   - Does the change add or change a decision? If yes, does the commit body give the reason?
   - Does a doc tell how something changed? Docs give only the current state (see [Writing style](docs/doc-rules.md#writing-style)).

<!-- TEMPLATE: Add the checks that CI cannot do, for example a manual check of visuals on a real device. -->

## History

Docs give only the current state, so that old content does not go into the context of AI assistants. Git holds the history. Search it only when you need it.

AI assistants search history with the skill `trace-decision`. They use it only when somebody asks for the reason for a decision or for an earlier version, or before they overturn a decision.

## Rejected approaches

| Approach | Why not |
|---|---|
| Squash merge | The commits of a PR and their `Why` become one commit. Moves and rewrites can then not be traced apart |
| Rebase merge | It keeps the commits, but their hashes change, and the PR boundary disappears. A merge commit keeps the boundary and the hashes |
| Merge `main` into a PR branch to fix a conflict | The PR commits go into `main` as they are, so this merge commit stays in the history. It adds a branch that has no relation to a decision. A rebase changes hashes too, but those commits are not in `main` before the PR merges |
