---
name: review-design
description: Use when review findings or fixes keep coming in the same area, when review-pr finds 3 or more findings with one cause, or when the user asks if the premise of a design is right.
---

# Design review

Judge the premise of a design. Do not judge each finding alone. The input is a set of symptoms. The output is one cause and one alternative design. Do not edit code. The user decides.

Other skills start from a different place:

- `review-pr` checks one change against a rubric. It does not judge the intent.
- `review-architecture` starts from the module structure.
- This skill starts from symptoms that share a cause.

Before you start, read the Vocabulary and the Principles in `.agents/skills/review-architecture/SKILL.md`. Use the words `module`, `interface`, `depth` and `seam` as it defines them. Use the words in `docs/design/GLOSSARY.md` for the domain.

## 1. Collect the symptoms

Use these sources:

- Findings from `review-pr` (Act on and Consider), review threads and issues.
- Fix history of the paths. Fix commits that add many lines mark a place where the design was wrong:
  ```bash
  git log -30 --format='%h %s' --numstat -- <path>
  ```
- For a branch or a PR, also read its own commits. A later commit that rewrites an earlier commit in the same branch is fix history too:
  ```bash
  git log --format='%h %s' --numstat <base>..<head>
  ```
- Limits that the author wrote in a comment, a doc or the PR body.

Write each symptom as one line with its `file:line`.

## 2. State the goals and the premise

First write the goals once for the whole input. Number them G1, G2 and so on. A goal is an effect that the code must give. A goal must have an authority: a person or a doc that can decide what the product must do. Accept only these:

- The request: the issue, the user's words, or the intent of the PR in one sentence.
- A doc in Precedence in `docs/doc-rules.md`.
- A constraint that the user confirmed in the conversation.

`README.md` and other how-to docs are not an authority. They tell how the product works now, so they can contain means. If a behavior is only in a how-to doc, report that the design doc for it is missing.

Everything else is a means. This is also true when a user can see it. If the author states a limit without an authority, it is not a goal. Write it as a question to the author.

Also find goals that the code does not give yet. Read the design docs for the area. If you decide by your own judgment that a doc applies to this case, mark the goal [INFERENCE]. The user must confirm it.

A rule in `docs/design/overview.md` is always a goal. If you think that a rule is only a means, tell the user. Do not change the rule.

Then, for each symptom, write in one sentence the design decision that it assumes. This decision is a means. Ask:

- Is the information known when the thing is built, and later rebuilt by search, parsing or guessing?
- Does the code need a heuristic to decide? Was the heuristic added to fix an earlier symptom?
- Does one fact exist in two places, for example in two surfaces that each count it?
- Was a wrapper, a format or a file added only to make something easy to find?

## 3. Group by cause

Put the symptoms with the same premise in one group. Write the cause of each group in one sentence with its `file:line`.

- A group with one symptom is a bug. List it in the report as a bug for `review-pr`. Do not use it for the alternative.
- A group with 2 or more symptoms is a design problem.
- If a fix adds more code than it removes, treat the fix as a symptom of the cause. Do not treat it as the answer.

## 4. Check the project rules

Read Rules in `docs/design/overview.md` and the docs for the area. The table "What to read first" in `AGENTS.md` names them.

- If a rule or a rejected option already answers the alternative, stop. Report the rule and do not propose the alternative.
- If a doc and the code on `main` do not agree, stop and tell the user. Do not choose a side (see Precedence in `docs/doc-rules.md`).
- If the change under review makes the code disagree with a doc, do not stop. Write it as a symptom. The change must follow the doc, or change the doc in the same change and give the reason.

## 5. Propose the alternative

Find the smallest design that removes the cause.

- It must remove a concept that a reader must hold: a branch, a mode, a type or a layer. A change that only moves code relocates the cause. Do not propose it.
- For each thing that the alternative removes, check where its complexity goes. If the complexity goes away, the alternative removes a concept. If it appears again in the callers, the alternative only relocates it. Do not use this check to call a module deep or shallow. A deep module can go away because the alternative removes the problem that it solves.
- If the alternative adds more than about 100 lines of new logic, or adds more than it removes, it is probably wrong at that point.
- The alternative must give every goal from step 2. List each goal and show how the alternative gives it. If the alternative loses a goal, it is not an alternative.
- If the alternative changes a public interface that other projects or users depend on, say so.
- If it is cheap, prove the alternative with a throwaway script. Compare the output of the old and the new code on the same inputs. Delete the script after.

Give the evidence level of each claim: read in the code, traced by hand, or run.

## 6. Report

Give the report in the conversation. Do not write a report file. Use the language that the user uses.

1. **Symptoms**: the list from step 1, grouped as in step 3. List the bugs from step 3 apart from the groups.
2. **Goals**: the goals from step 2, each with its authority.
3. **Cause**: the premise of each group, with its `file:line`.
4. **Alternative**: what the design looks like, and what it deletes. Give the cost.
5. **Evidence**: the level for each claim.
6. **Questions**: the questions to the author from step 2, and the [INFERENCE] goals that the user must confirm.
7. **Verdict**: one line. Either a patch is enough, or the design must change.

If the user rejects the alternative for a reason that stays true, ask if you must add it to the rejected options of the design doc for that area.
