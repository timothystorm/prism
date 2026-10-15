# Workspace Biome Design

## Goal

Add a single Biome setup that checks lint rules and formatting for supported files across the pnpm workspace.

## Scope

- Install Biome as a workspace-root development dependency.
- Add a root `biome.json` configuration shared by current and future packages.
- Add a root package script to check lint and formatting across the workspace.
- Exclude dependency and generated output directories from checks.
- Do not add Nx configuration; the repository is currently a pnpm workspace without Nx.
- Do not add separate tools for Markdown or YAML, which Biome does not check.

## Behavior

The root check command runs Biome over the workspace and reports lint or formatting violations without modifying files. Existing supported source and configuration files should be brought into compliance as part of the change. Package-specific overrides are not needed unless existing files require a deliberate exception.

## Validation

Run the root Biome check after configuration and formatting changes. Also run the existing context package tests to ensure the setup does not affect runtime behavior.
