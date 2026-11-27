# AGENTS.md

For AI assistants: read this file before you start. It contains only hard conventions and pointers. Developer commands are in `docs/development.md`. Procedures are in skills.

## Documents

Design docs are in `docs/design/`.

- **Read `docs/doc-rules.md` before you write a doc or a comment.** It says what to write, where to write it and how much detail to give.
- **Read `CONTRIBUTING.md` before you write a commit message, a PR or an issue.** It gives the formats and the rules. Text for outside readers (PR, issue, commit body, comment) must make sense without the conversation (see Text for outside readers in `CONTRIBUTING.md`).
- Do not break the rules in Rules in `docs/design/overview.md`. Only the maintainer can change a rule.
- If two docs, or a doc and the code, do not agree, do not choose one. Stop and tell the user. The maintainer decides which side is wrong. The order of precedence is in Precedence in `docs/doc-rules.md`.
- Design terms and their code names: `docs/design/GLOSSARY.md`.

## What to read first

<!-- TEMPLATE: Add one row for each type of task. Name the design doc and the section to read first. -->

| Task | Read first (in `docs/design/`) |
|---|---|
| Any task | Rules in `overview.md` |
| Project boundaries, modules, where a feature goes | `architecture.md` |

## Conventions

- Write messages and reports to the user in the language that the user uses in the conversation. Write docs, code, commits, PRs and issues in English (see Languages in `docs/doc-rules.md`).
- Make every commit with the `commit` skill.
- Ask the user before you push or do a different remote action.

<!-- TEMPLATE: Add the hard conventions of the project that no tool can enforce. Examples: the folder layout, environment variables for tool paths, processes that must not be stopped. -->

## Skills

Read `.agents/skills/<name>/SKILL.md` when the task matches:

| Skill | When |
|---|---|
| `commit` | Every commit in this repo |
| `pull-request` | You write a PR title or description, or an issue |
| `review-architecture` | The user asks for an architecture review, for refactor candidates, or to make the code easier to test |
| `trace-decision` | The user asks for the reason for a decision or if it was different before, or you want to overturn a decision. Do not search history for other reasons |
| `review-pr` | The user asks you to review a PR, a branch or a commit |
| `review-design` | Review findings or fixes keep coming in the same area, `review-pr` finds 3 or more findings with one cause, or the user asks if the premise of a design is right |

## Before you finish

Do the steps in "Before you commit" in `CONTRIBUTING.md`.
