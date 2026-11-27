---
name: review-pr
description: Use when the user asks you to review a PR, a branch or a commit.
---

# Review a PR

The deliverable is a verdict in the conversation. Do not edit code. A GitHub comment is a remote action (see `AGENTS.md`).

## What you do not check

Do not report these. Do not run the checks of CI again.

- The jobs in CI in `docs/development.md`.
- Rules that the compiler, project references, tests or CI enforce. Rules in `docs/design/overview.md` give their enforcement.
- Problems that were in the code before the change.
- Style preferences. "I would write it differently" is not a finding. A readability finding must name the part that a reader can misread.
- A failure that needs a case with no real caller. Find the call site, or drop the finding.

## 1. Get the change

- PR: run `gh pr view <N>`, `gh pr diff <N>` and `gh pr checks <N>`.
- Branch: run `git log main..HEAD` and `git diff main...HEAD`.
- Commit: run `git show <sha>`.

If CI failed, report the failed job. Do not do the work of that job.

## 2. State the intent

Write one paragraph: what the change must do. Use the PR body, the `Why` lines of the commits, and the linked issue or design section. If the intent is not clear, ask the user before you continue.

You judge how well the change does the intent. You do not judge the intent.

## 3. Read the context

Read each changed file around the change. Read the design docs for the area. The table "What to read first" in `AGENTS.md` names them.

## 4. Find candidate findings

Check the change against this list only.

1. Rules in Rules in `docs/design/overview.md` with the enforcement "Design and review", or with no automatic check. Quote the rule.
2. Docs and code. A change to behavior, a parameter, a setting or a command must change the affected docs and `--help` in the same commit. If a doc and the code do not agree, report it. Do not choose a side (see Precedence in `docs/doc-rules.md`).
3. Writing style in `docs/doc-rules.md`. These sections of `CONTRIBUTING.md`: Commits, Text for outside readers, Pull requests, Before you commit.
4. The columns "Responsible for" and "Not responsible for" in Modules in `docs/design/architecture.md`, and the table "Where a feature goes".
5. Correctness. Write the execution path that fails.
6. Root cause. Does the change fix the cause, or does it only hide the symptom?
7. Tests. Does a test fail when the behavior breaks?
8. Simplicity. Is there a smaller change that does the same intent? Look for dead code, an abstraction with one user, and a new path next to an existing path.
9. Maintainability. Does the next change in this area touch one place only? Look for a fact in two places, code in the wrong module, and a value in code that belongs in a data or config file.
10. Readability. Can a reader understand the code with only the repo? Look for names that do not use the terms in `docs/design/GLOSSARY.md`, and for comments that only repeat the code.

Each finding must have a `file:line`, the evidence, and the rule with its doc and section if a rule applies.

## 5. Check each finding again

For each candidate finding:

1. Read the code again around the line. Make sure that the code shows the evidence.
2. If the finding says "the project always does X", search the repo. Show the places that do X.
3. If the finding needs a special input, find the real caller that gives that input.

If one of these steps fails, move the finding to Dismissed.

## 6. Sort the findings

|Group|Meaning|
|---|---|
|Act on|The change must not merge before the author fixes this. Examples: a bug, a broken rule, docs that do not agree with code.|
|Consider|The problem is real, but the user must decide if the fix is worth the cost. Give the trade-off.|
|Noted|True, but not worth work now.|
|Dismissed|Wrong, or the check in step 5 failed. Give the reason. The user can overturn it.|

- If all findings are small, say that the change can merge. Do not add findings to fill the report.
- If Act on has more than 5 findings, sort them again. Some are probably Consider.
- If 3 or more findings in Act on or Consider share one cause, do not list them as separate fixes. Run `review-design` on them. Put its cause and verdict in the report in place of those findings.

## Report

Write in the language that the user uses. Use these parts in this order:

1. Intent: the paragraph from step 2.
2. CI: the status from step 1.
3. Act on, Consider, Noted, Dismissed: each finding with its `file:line`, evidence and reason.
4. Verdict: one line. The change can merge, or can merge after the author fixes Act on, or needs a discussion.
