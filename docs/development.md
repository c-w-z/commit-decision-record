# Development

Install, settings and general use are in the [README](../README.md). The rules for commits, PRs and issues are in [CONTRIBUTING.md](../CONTRIBUTING.md). Design docs are in [design/](design/). How to write docs is in [Doc rules](doc-rules.md). Run the commands below in the repo root.

## First setup

<!-- TEMPLATE: List the tools and versions to install, and the environment variables to set. -->

1. Install Git and the tools of the project.
2. Clone the repo, enable the Git hook (see [Git hook](#git-hook)), then build and test:

   ```sh
   git clone https://github.com/{{OWNER}}/{{REPO}}.git
   cd {{REPO}}
   git config core.hooksPath .githooks
   {{BUILD_COMMAND}}
   {{TEST_COMMAND}}
   ```

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

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs the checks on PRs and on pushes to `main`. The `changes` job decides from the changed files which other jobs run. A skipped job counts as passed. The comments in `ci.yml` and the scripts that the jobs run say what each job checks.

When a job fails, reproduce and fix it on your computer:

- `build-and-test`: Run the commands in [Build and test](#build-and-test).
- `markdown-links`: A relative link points to a missing file, or an anchor matches no heading. Run the link check below, and fix the links that it shows.
- `no-merge-commits`: The PR branch has a merge commit. Rebase the branch (see [Branches and PRs in CONTRIBUTING.md](../CONTRIBUTING.md#branches-and-prs)).

The link check tool is in `tools/markdown-links/`. To run it on your computer, install [Node.js](https://nodejs.org/). Then run:

```sh
npm ci --prefix tools/markdown-links
git ls-files -z '*.md' | xargs -0 tools/markdown-links/node_modules/.bin/remark --use ./tools/markdown-links/node_modules/remark-validate-links/index.js --frail --quiet --no-stdout
```

To upgrade the tool, change the versions in `tools/markdown-links/package.json`. Run `npm install --prefix tools/markdown-links`. Commit `package.json` and `package-lock.json` together.

## Git hook

`.githooks/pre-push` blocks a direct push to `main` (see [Branches and PRs in CONTRIBUTING.md](../CONTRIBUTING.md#branches-and-prs)). Enable the hook once in each clone with `git config core.hooksPath .githooks` (step 2 of [First setup](#first-setup)).

If the maintainer must push directly to `main`, set this option in their clone. The option goes only into the local `.git/config`:

```sh
git config --bool workflow.allowMainPush true
```
