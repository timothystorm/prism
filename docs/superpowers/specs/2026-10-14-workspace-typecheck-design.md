# Workspace Typecheck Design

## Goal

Add typechecking commands that cover TypeScript source, tests, and build configuration across workspace packages.

## Design

Keep the root `tsconfig.json` as the shared compiler-options base. Each package adds a `tsconfig.json` that extends the root config and explicitly includes its TypeScript source, tests, and package build configuration. Each package exposes a `typecheck` script using `tsc --noEmit`; the root exposes a recursive `typecheck` script to run each package's check.

The root package remains the orchestration point. No new dependencies or runtime behavior are required.

## Validation

Run the root typecheck command and the context package's typecheck command. Both must exit successfully, and the package command must cover source, spec, and build-config TypeScript files.
