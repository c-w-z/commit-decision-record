# commit-decision-record

A GitHub template repository for projects that people and AI coding agents build together. Each decision keeps its reason in the commit that makes it, and the docs show only the current state.

## Compared with ADR

An architecture decision record (ADR) keeps each decision in its own file. This template keeps each decision in a commit.

| Question | ADR | commit-decision-record |
|---|---|---|
| Where is the reason? | One file for each decision, for example in `docs/adr/` | The body of the commit that makes the change: `Why`, `Rejected`, `Evidence`, `Supersedes` |
| What happens when a decision is overturned? | A new ADR. The old ADR is marked superseded and stays in the tree | A new commit with `Supersedes:`. The docs change to the new decision. The old reason stays only in Git history |
| What does an AI agent read? | All ADRs in the tree, also the superseded ones | Only the current docs. The `trace-decision` skill searches history when somebody asks for a reason |
| How does code point to its decision? | A link that somebody adds by hand | `git blame` finds the commit. Its `Design:` line names the doc section |
| Can the record and the change get out of step? | Yes. The ADR is a separate file | No. The reason is in the same commit as the change |

Use ADRs if people must read the decisions without Git, for example on a website for stakeholders. The full list of rejected approaches is in [Rejected approaches in docs/doc-rules.md](docs/doc-rules.md#rejected-approaches).

## Contents

The template gives:

- `AGENTS.md`: hard conventions for AI assistants, and pointers to the docs and skills.
- `CONTRIBUTING.md`: the formats and rules for commits, pull requests (PRs) and issues.
- `docs/doc-rules.md`: what to document, where, and how to write it.
- `docs/development.md`: setup, build, test, CI and the Git hook.
- `docs/design/`: the design rules, the glossary and the architecture.
- `SECURITY.md`: how to report a vulnerability.
- `.agents/skills/`: procedures for AI assistants (commit, PR, reviews, decision history).
- `.github/`: issue templates, the PR template and the CI workflow.
- `.githooks/pre-push`: blocks a direct push to `main`.

## Use the template

1. On GitHub, click **Use this template** and make a new repository. Clone it.
2. Replace each placeholder in the table. Then delete the `TEMPLATE:` comments after you fill their sections.

   | Placeholder | Value |
   |---|---|
   | `{{PROJECT_NAME}}` | The display name of the project |
   | `{{OWNER}}` | The GitHub user or organization that owns the repository |
   | `{{REPO}}` | The repository name |
   | `{{MAINTAINER}}` | The GitHub user name of the maintainer, without `@` |
   | `{{BUILD_COMMAND}}` | The command that builds the project |
   | `{{TEST_COMMAND}}` | The command that runs the tests |

   To find the places that remain, run:

   ```sh
   git grep -n -e '{{' -e 'TEMPLATE:' -- ':!README.md'
   ```

3. In `.github/workflows/ci.yml`, remove the comment marks from the `build-and-test` job. Add the setup step for your language.
4. Make the labels that the issue templates use:

   ```sh
   gh label create type/bug --description "Something does not work as designed"
   gh label create type/feature --description "A new feature or an improvement"
   gh label create type/refactor --description "A code change that does not change behavior"
   gh label create type/documentation --description "A doc or a comment is wrong, unclear or missing"
   gh label create type/ci --description "A problem with CI or a check"
   ```

5. Enable the Git hook in each clone: `git config core.hooksPath .githooks`.
6. Replace this README with the usage docs of your project (see Where to write in `docs/doc-rules.md`).
7. Replace `LICENSE` if your project uses a different license or copyright holder.
