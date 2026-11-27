---
name: review-architecture
description: Use when the user asks for an architecture review, for refactor candidates, or to make the code easier to test or to navigate.
---

# Architecture review

Find modules that are hard to change or to test. Propose refactors that make them deep. The user decides which refactor to do.

## Vocabulary

Use these words for the architecture. Do not use "component", "service", "API" or "boundary".

| Word | Meaning |
|---|---|
| module | A thing with an interface and an implementation: a function, a class, a project. |
| interface | All that a caller must know: types, invariants, call order, errors, settings. |
| depth | The quantity of behavior behind the interface. Deep: small interface, much behavior. Shallow: the interface is almost as large as the implementation. |
| seam | The place where the interface is. You can change behavior there and not edit the callers. |
| adapter | A concrete thing that satisfies the interface at a seam. |
| leverage | What callers get from depth: more behavior for each thing that they learn. |
| locality | What maintainers get from depth: a change, a bug and its test stay in one place. |

Principles:

- **Deletion test.** Imagine that you delete the module. If the complexity goes away, the module was shallow. If the complexity appears again in the callers, keep the module.
- **The interface is the test surface.** Tests use the same seam as callers.
- **One adapter is a possible seam. Two adapters are a real seam.** Do not add a seam if nothing changes across it.

Use the words in `docs/design/GLOSSARY.md` for the domain. Do not invent a generic name such as "the data service".

## 1. Read first

Read the docs that `AGENTS.md` lists for the area, and `docs/design/GLOSSARY.md`. Read the rejected options in those docs. Do not propose a candidate that a rejected option already answers.

## 2. Find where to look

- If the user named a module or a problem, start there.
- If not, find the hot spots. A hot spot is a path that changed many times recently:
  ```bash
  git log -40 --name-only --format= | sort | uniq -c | sort -rn | head -15
  ```
- If there is no clear hot spot, look at the largest files and at the code without tests.

## 3. Explore

Read the code and its tests. Record where you have difficulty:

- You must read many small modules to understand one concept.
- A module is shallow.
- A pure function has tests, but the bugs are in how callers use it.
- A module must know the internals of a different module.
- The code has no tests, or its interface makes tests difficult.

Apply the deletion test to each module that looks shallow.

You can give the exploration to a subagent. Give it this skill and the paths from step 2.

## 4. Report

Give the report in the conversation. Do not write a report file.

- Give three candidates or fewer. Remove a candidate if its code will not change again soon.
- Keep the vocabulary words above in English. Use the `docs/design/GLOSSARY.md` words for the domain.
- Each candidate has these parts:
  - **Files**: the files and modules.
  - **Problem**: one sentence.
  - **Solution**: one sentence. Do not design the interface yet.
  - **Benefits**: short items about locality, leverage and tests.
  - **Before and after**: a short text diagram or a list of the modules and their callers. Show the shallow modules and the deep module.
  - **Strength**: `Strong`, `Worth exploring` or `Speculative`.
- If a candidate changes a public interface that other projects or users depend on, say so.
- If a candidate goes against a rejected option, show a warning in the candidate. Include the candidate only if the difficulty is large.
- End with the candidate that you recommend first and one sentence of reason.

Then ask the user which candidate to examine.

## 5. Examine one candidate with the user

Ask one question at a time. Give your recommended answer with each question. If the code can answer a question, read the code and do not ask.

Topics: the limits, the dependencies, the interface of the deep module, what is behind the seam, which tests stay.

If the user rejects a candidate for a reason that stays true, ask if you must add it to the rejected options of the design doc for that area.
