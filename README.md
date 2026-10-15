# Prism

## Setup

Prerequisites: Node.js 24.11 or newer in the 24.x release line and pnpm 12.11.2.

Use pnpm for dependency installation and project scripts. The root `package.json`
enforces this through `devEngines.packageManager`; npm versions that support
`devEngines` reject install, ci, and run commands in this project.

Clone the repository and install dependencies:

```sh
git clone https://github.com/timothystorm/prism.git
cd prism
pnpm install
```

Run the following commands from the repository root.

## Verify

Run lint, typechecking, and tests:

```sh
pnpm verify
```

`pnpm install` activates Husky through the `prepare` script. Before each commit,
the pre-commit hook runs `pnpm verify`; if any check fails, the commit is blocked.

## Pull requests

The `PR checks` GitHub Actions workflow runs `pnpm verify` and builds all workspace
packages for pull requests targeting `main`. Any failure fails the
`Verify and build` status check.

To block merging when checks fail, configure an active branch ruleset in
**Settings > Rules > Rulesets** targeting `main`. Enable **Require a pull request
before merging** and **Require status checks to pass**, and select
**Verify and build** from GitHub Actions. Enable **Require branches to be up to
date before merging** so checks must pass against the latest `main`. Leave the
bypass list empty so the requirement applies to everyone.

The check may need to run once before it appears in the status-check selector.
These repository settings must be configured on GitHub; the workflow file alone
does not prevent merging a failing pull request.

## Test

Run all tests once:

```sh
pnpm test --run
```

Run tests in watch mode:

```sh
pnpm test
```

## Build

Build all workspace packages:

```sh
pnpm -r build
```

The context package outputs its ESM bundle and TypeScript declarations to
`packages/context/dist/`.
