# Security policy

## Supported versions

<!-- TEMPLATE: Say which versions get security fixes. Example for a project without releases: -->

This project has no releases. Only the latest commit on `main` gets security fixes.

## Reporting a vulnerability

On GitHub, select **Report a vulnerability** on this repository's **Advisories** page. Do not open a public issue for a security problem.

Include:

- The version: the output of `git rev-parse --short HEAD`.
- The steps to reproduce.
- What an attacker can do, and what the attacker needs first (for example, local access or a changed file).

Logs can contain your user name and paths. Check them before you send them.

Please do not make the problem public before a fix is on `main`. After the fix, the maintainer publishes an advisory and names the reporter if the reporter agrees.

## Scope

<!-- TEMPLATE: List the parts of the project that handle untrusted input, run with privileges or change the user's system. -->

In scope:

- The code in this repository.

Out of scope:

- Problems in third-party dependencies. Report them to those projects.

## Response

The maintainer handles reports on a best-effort basis. Expect a first reply within a few days.
