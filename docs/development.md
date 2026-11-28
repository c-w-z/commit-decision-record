# Development

Install, settings and general use are in the [README](../README.md). The rules for commits, PRs and issues are in [CONTRIBUTING.md](../CONTRIBUTING.md). Design docs are in [design/](design/). How to write docs is in [Doc rules](doc-rules.md). Run the commands below in the repo root.

## First setup

<!-- TEMPLATE: List the tools and versions to install, and the environment variables to set. -->

1. Install Git, [Node.js](https://nodejs.org/) and the tools of the project. AI assistants need Node.js to run the script of the `trace-decision` skill. The script also reads GitHub with [GitHub CLI](https://cli.github.com/) (`gh`), logged in. Without `gh`, it reads only Git.
2. Clone the repo, then build and test:

   ```sh
   git clone https://github.com/{{OWNER}}/{{REPO}}.git
   cd {{REPO}}
   {{BUILD_COMMAND}}
   {{TEST_COMMAND}}
   ```

3. If [Branch protection](#branch-protection) gives a setup for each clone, do it.

## Build and test

```sh
{{BUILD_COMMAND}}
{{TEST_COMMAND}}
```

<!-- TEMPLATE: Say when a contributor must run each command, and what to do after a pull, a rename or a new file. -->

## Folders

<!-- TEMPLATE: Give the folder map. Say which project or package each folder belongs to. -->

| Folder | Content |
|---|---|
| `docs/design/` | Design docs |
| `tools/markdown-links/` | Markdown link check (see [CI](#ci)) |
| `tools/trace-decision/` | The script that the `trace-decision` skill runs to collect the commits of code lines (see [CI](#ci)) |

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs the checks on PRs and on pushes to `main`. The `changes` job decides from the changed files which other jobs run. A skipped job counts as passed. The comments in `ci.yml` and the scripts that the jobs run say what each job checks.

When a job fails, reproduce and fix it on your computer:

- `build-and-test`: Run the commands in [Build and test](#build-and-test).
- `markdown-links`: A relative link points to a missing file, or an anchor matches no heading. Run the link check below, and fix the links that it shows.
- `trace-decision-tool`: A test of `tools/trace-decision/` fails on one OS. The failed `trace-decision-tool-os` job names the OS. Run the tests below, and fix the script or the test.
- `no-merge-commits`: The PR branch has a merge commit. Rebase the branch (see [Branches and PRs in CONTRIBUTING.md](../CONTRIBUTING.md#branches-and-prs)).

The link check tool is in `tools/markdown-links/`. To run it on your computer, install [Node.js](https://nodejs.org/). Then run:

```sh
npm ci --prefix tools/markdown-links
git ls-files -z '*.md' | xargs -0 tools/markdown-links/node_modules/.bin/remark --use ./tools/markdown-links/node_modules/remark-validate-links/index.js --frail --quiet --no-stdout
```

To upgrade the tool, change the versions in `tools/markdown-links/package.json`. Run `npm install --prefix tools/markdown-links`. Commit `package.json` and `package-lock.json` together.

The tests of `tools/trace-decision/` need Node.js and Git, and no packages. Run them after a change to the script:

```sh
node --test tools/trace-decision/collect.test.mjs
```

The parameters of the script are in its `--help` text.

## Branch protection

`main` accepts changes only through a PR (see [Branches and PRs in CONTRIBUTING.md](../CONTRIBUTING.md#branches-and-prs)). The repo enforces this with one of the two methods below.

<!-- TEMPLATE: Keep one method and delete the other. Use the ruleset if the repo is public, or if the owner has a paid GitHub plan. GitHub Free does not enforce rulesets in private repos. To delete the Git hook method, also delete `.githooks/`. To delete the ruleset method, also delete `.github/rulesets/`. -->

### Ruleset

GitHub enforces `.github/rulesets/main.json` on the default branch. The file gives the rules. Contributors do not have to set up anything.

The maintainer applies the file once:

```sh
gh api -X POST repos/{{OWNER}}/{{REPO}}/rulesets --input .github/rulesets/main.json
```

When you add or rename a CI job, change `required_status_checks` in the file. After each change to the file, the maintainer applies it again:

```sh
id=$(gh api repos/{{OWNER}}/{{REPO}}/rulesets --jq '.[] | select(.name == "main") | .id')
gh api -X PUT repos/{{OWNER}}/{{REPO}}/rulesets/$id --input .github/rulesets/main.json
```

### Git hook

`.githooks/pre-push` blocks a direct push to `main`. The hook runs only on the computer of the contributor, and GitHub does not enforce it. Enable the hook once in each clone:

```sh
git config core.hooksPath .githooks
```

If the maintainer must push directly to `main`, set this option in their clone. The hook still blocks a push that deletes or rewrites `main`. The option goes only into the local `.git/config`:

```sh
git config --bool workflow.allowMainPush true
```
