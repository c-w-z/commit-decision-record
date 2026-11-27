# Doc rules

This file says how the docs, comments and agent instructions of this repo share the work, and how to write them. People and AI assistants follow it. The rules for commits, PRs and issues are in [CONTRIBUTING.md](../CONTRIBUTING.md). Design docs are in `docs/design/`.

## When to write

Write a doc, a section or a procedure only when all four conditions are true:

1. **The problem that it prevents is real.** The problem occurred, or it will occur soon. "Large projects do this" is not a reason.
2. **Somebody will update it.** It has a clear location and an event that forces an update, for example a code change that always shows it. A doc that nobody updates becomes a false truth. That is worse than no doc.
3. **It costs less to maintain than the damage that it prevents.** A small team with AI assistants has a higher threshold than a large team.
4. **No tool can do it.** If the compiler, project references, tests or CI can enforce a rule, let the tool do it. Do not write it as text.

## Where to write

Each fact has one source. Put the source where a change to the fact always touches it.

| Type | Location | Reader | Write | Do not write |
|---|---|---|---|---|
| Rules | [Rules](design/overview.md#rules) | All | The guarantees and technical rules that no change can break, and how each rule is enforced | Details of mechanisms |
| Design | `docs/design/` | Contributors | Mechanisms, decisions, current reasons, rejected options | Methods, fields, call sequences |
| Glossary | [Glossary](design/GLOSSARY.md) | All | Design terms and their code names | Explanations of mechanisms |
| Usage | `README.md` | Users | Install, start, stop, settings, update | Architecture, development process |
| Development | `docs/development.md` | Contributors and AI | What a contributor must do by hand: complete commands to build, run and check, the folder map, how to reproduce and fix a failed CI job, the branch protection setup | Design reasons, content that a config file or script already gives, behavior that tools handle automatically |
| Parameters | The `--help` text of programs and scripts | Contributors and AI | What each parameter does, its default value, examples | — |
| Contribution rules | `CONTRIBUTING.md` | Contributors and AI | Formats and procedures for commits, PRs and issues, the checks before a commit | How to write docs (this file) |
| Security policy | `SECURITY.md` | People who report a security problem | Supported versions, the private channel, what to include, the scope | Details of vulnerabilities |
| Comments | Code | People who change that code | Why the code is so, invariants, limits, workarounds for problems in other software | Progress, design reasons across modules (link the design doc) |
| Agent instructions | `AGENTS.md` | AI | Hard conventions, which doc to read first for each task, where the skills are | Procedure steps (skills), architecture (development doc), the full content of this file (point to the section) |
| Skills | `.agents/skills/` | AI | Procedures that repeat, have fixed steps, and fail silently when a step is missing | Rules and background knowledge, content of `AGENTS.md` |

<!-- TEMPLATE: Add rows for project-specific sources, for example data files that hold the official values. -->

To find where a fact goes, ask these questions in this order:

1. Can a reader see it in the code in one minute? Then do not write it.
2. Is it about one part of the code only, and does it change with that code? Then write a comment.
3. Is it a reason or a decision? Then write it in a design doc.
4. Is it how to do something? Then put it in the usage doc, the development doc, the parameter help or a skill, by reader.

Only `--help` and the commented examples in config files give the full list of parameters and settings. The usage doc and the development doc give the complete command for a task. When they need a list, they point to `--help` or the config file.

Each section of the development doc answers "when must a contributor do what". If a section cannot answer this, it does not go into the development doc:

- For content that a config file or script already gives, for example triggers, check rules, package lists or groups, point to that file.
- Write behavior that tools handle automatically, with no action from the contributor, as a comment in the config file.
- Write the reason for a setting as a config comment or in a design doc, in the order above.

Text for AI assistants has layers by the time that the assistant loads it. A lower layer does not repeat a higher layer:

1. **Tools**: Do not write what the compiler, project references, Git hooks or CI enforce.
2. **`AGENTS.md`**: AI assistants read it every time. Skills do not repeat it.
3. **This file and `CONTRIBUTING.md`**: AI assistants read them only when they write a doc, a comment, a commit message, a PR or an issue. `AGENTS.md` and skills point to their sections and do not copy them.
4. **Skills**: AI assistants read a skill only when its condition is true. A skill gives only the steps of its procedure.

## Precedence

1. [Rules](design/overview.md#rules)
2. The design docs in `docs/design/`

<!-- TEMPLATE: Add levels if you have them, for example "Data files are the source for values" or a plan doc. -->

Only the maintainer can decide to change a rule. If a doc and the code do not agree, do not choose a side. Stop and ask the maintainer. After the maintainer decides, correct the wrong side.

## Writing style

- **Current state only**: Write the current decisions, reasons and evidence. Do not write how they changed, for example "removed", "changed to", "no longer" or "originally". Git holds the history (see [History in CONTRIBUTING.md](../CONTRIBUTING.md#history)).
- **Rejected options**: Keep only options that somebody can still propose under the current conditions, with the reason. Delete options that are no longer relevant.
- **Evidence**: For a measurement or a check, give the environment, the method and the numbers. Put them next to the decision.
- **Names**: Design docs can name folders, projects and files to show where a structure is. Write design terms as the [glossary](design/GLOSSARY.md) gives them. Add a new term to the glossary first.
- **Commands**: Give complete commands that a reader can copy and run.
  - Do not write a local path of any person.
  - Put other paths in a variable first. Use the variable in the commands after it.
- **Format**: Use GitHub Markdown, so that every editor can read and write it.
  - Use lowercase English for file and folder names, with `-` between words, for example `design/architecture.md`. Keep conventional uppercase names, for example `README.md` and `GLOSSARY.md`.
  - Use relative links, for example `[Rules](design/overview.md#rules)`. The anchor is the heading id that GitHub makes.
  - Use `![description](path)` for images. Use `> [!IMPORTANT]` for notes.
  - Do not use syntax that only one editor knows, for example `[[wikilink]]` or `![[embed]]`. Do not add frontmatter to docs.
- **Sentences** (from ASD-STE100). These rules apply in every language:
  - One sentence gives one fact. One instruction gives one action.
  - Do not join sentences with a semicolon. Write two sentences.
  - Say who does what, for example "the program draws the frame". Use the active voice.
  - Use a list for three or more steps or conditions.
  - Use one term for one thing from start to end, as the [glossary](design/GLOSSARY.md) gives it. Do not alternate synonyms.
  - Do not stack hedges, for example "may possibly help". State a fact directly. Keep one "can" or "possibly" for a fact that is not certain.
  - Do not use marketing adjectives, for example powerful, seamless or efficient. Give a number or a behavior.
  - One paragraph has one topic.
  - English text only: an instruction has 20 words or fewer. A description sentence has 25 words or fewer.

## Languages

<!-- TEMPLATE: Choose the language of each row that is not fixed. If the issue and PR templates use a different language, translate the text in `.github/ISSUE_TEMPLATE/` and `.github/pull_request_template.md`. -->

| Text | Language | Fixed |
|---|---|---|
| `AGENTS.md`, skills, `CONTRIBUTING.md` and this file | English | Yes |
| Code and comments | English | No |
| Commit subjects and PR titles (a PR title becomes the subject of its merge commit) | English | No |
| Commit bodies, PR bodies and issues | English | No |
| Issue and PR templates | English | No |
| Design docs, `README.md` and `docs/development.md` | English | No |

The fixed rows stay in English for two reasons:

- AI assistants follow these files. The word limits in Sentences apply only to English.
- The template gives the skills in English. A translation costs much work and gives an AI reader nothing.

Some names stay in English in every language, because tools and the English files find them by name:

- The commit types and the trailer names, for example `Why:` and `Supersedes:`. The `trace-decision` skill searches for them.
- File and folder names.
- The headings that the English files name:
  - Rules in `docs/design/overview.md`.
  - Modules and Where a feature goes in `docs/design/architecture.md`, and the column names of the Modules table.
  - Build and test, CI and Branch protection in `docs/development.md`.

AI assistants write explanations and reports in the conversation in the language that the user uses.

## Rejected approaches

| Approach | Why not |
|---|---|
| ADR (one record for each decision, a new record when a decision is overturned) | ADRs keep history by design, so old decisions go into the context. The current reason is in the docs, and the changes are in the commits |
| A separate decision log folder that tools exclude from search | Exclusion depends on the search tool of each agent. One fact is then in three places: the doc, the commit and the log |
| Editor-specific vault settings and syntax | Not every contributor uses the same editor. A wikilink is not a link on GitHub. Standard Markdown works in every editor |
| Change proposals with an archive (for example OpenSpec) | The design docs are the specification. An archive keeps history |
| Process docs: plans, audits, logs, retrospectives | Git and the commits cover them. Write the cause of a bug that is not clear as a comment next to the fix |
| Architecture doc templates (C4, arc42) | Too large for a small project. The architecture doc and the folder map in the development doc are sufficient |
| Folders by reader type: tutorials, how-to, reference, explanation | Too few docs. Use this split only to choose between the usage doc, the development doc and the parameter help |
| Word limits of ASD-STE100 for text in other languages | The limits count English words, and the STE dictionary is English. Text in other languages uses only the structure rules in Sentences |
