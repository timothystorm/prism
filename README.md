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
