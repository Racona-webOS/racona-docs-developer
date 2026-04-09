---
title: Contributing
description: Guide to contributing to the ElyOS project
---

Thank you for your interest in developing ElyOS! This guide will help you get started, shows our conventions, and walks you through submitting your first contribution.

## Code of Conduct

We are committed to providing an inclusive, friendly, and harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, experience level, nationality, appearance, race, religion, or sexual identity and orientation.

### Expected Behavior

- Be respectful and considerate in all interactions
- Welcome newcomers and help them get started
- Accept constructive criticism openly
- Focus on what's best for the community and project
- Show empathy toward other community members

### Unacceptable Behavior

- Harassment, trolling, or personal attacks
- Publishing others' private information without consent
- Discriminatory language or imagery
- Any behavior that would be unacceptable in a professional environment

## Prerequisites

Before starting development, ensure you have the required tools installed (Bun, Node.js, Docker, Git).

**Detailed guide:** [Getting Started →](/en/getting-started)

## Setting Up Development Environment

1. **Fork and clone** — Fork the repo on GitHub, then clone it
2. **Install dependencies** — `bun install`
3. **Environment variables** — Copy `.env.example` to `.env` and fill in values
4. **Start database** — `bun docker:db` and `bun db:init`
5. **Dev server** — `bun app:dev`

**Detailed guide:** [Getting Started →](/en/getting-started)

## Code Style and Conventions

### Language

The codebase uses **English** for code comments, variable names, and documentation. When modifying existing files, follow the language convention already present in that file.

### TypeScript

- **Strict mode** enabled — avoid `any` where possible
- Use explicit return types for exported functions
- Prefer `interface` over `type` for object shapes
- Use `$lib/...` path aliases for internal imports

### Svelte 5

ElyOS uses **Svelte 5 with runes**. Key patterns:

- Use `$state`, `$derived`, and `$effect` runes for reactivity (not the old `$:` syntax)
- Class-based stores with `$state` properties, exported via `createX()` / `setX()` / `getX()` functions
- Store files use `.svelte.ts` extension

### Formatting and Linting

We use **Prettier** and **ESLint**. Before committing, always run:

```bash
bun format            # Automatic formatting
bun lint              # Check for issues
```

### Server Actions

Server-side logic in `*.remote.ts` files follows this pattern:

- `command(schema, handler)` for mutations
- `query(handler)` for reads
- Always validate input with **Valibot** schemas
- Return value: `{ success: boolean, error?: string, ...data }`

**Detailed guide:** [Server Actions →](/en/server-actions)

### Database

- Schemas live in `packages/database/src/schemas/`
- Use **Drizzle ORM** for all database operations
- After schema changes, run `bun db:generate` to create migrations

**Detailed guide:** [Database →](/en/database)

### Testing

- **Vitest** for unit tests
- **fast-check** for property-based tests
- **Playwright** for end-to-end tests
- Run tests from `apps/web`: `bun test`

**Detailed guide:** [Testing →](/en/testing)

## Commit Messages

We follow the **[Conventional Commits](https://www.conventionalcommits.org/)** specification.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                                                    |
| ---------- | -------------------------------------------------------------- |
| `feat`     | New feature                                                    |
| `fix`      | Bug fix                                                        |
| `docs`     | Documentation changes only                                     |
| `style`    | Formatting, missing semicolons, etc. (not code changes)        |
| `refactor` | Code change that neither fixes a bug nor adds a feature        |
| `perf`     | Performance improvement                                        |
| `test`     | Adding or updating tests                                       |
| `build`    | Build system or dependency changes                             |
| `ci`       | CI/CD configuration changes                                    |
| `chore`    | Other changes that don't modify src or test files              |

### Scope

Use the package or area name as scope:

- `core` — main SvelteKit app (`apps/web`)
- `sdk` — SDK package (`packages/sdk`)
- `cli` — CLI tool (`packages/create-elyos-app`)
- `db` — database package (`packages/database`)
- `docker` — Docker configuration
- `docs` — documentation

### Examples

```
feat(core): add keyboard shortcuts to window manager
fix(sdk): resolve mock data service localStorage race condition
docs(cli): update template selection instructions
refactor(db): simplify user schema relations
test(core): add property-based tests for taskbar sorting
ci: add arm64 platform to Docker build
```

## Branching Strategy

- `main` — stable, production-ready code
- `develop` — integration branch for next release
- `feat/<name>` — feature branches (branch from `develop`)
- `fix/<name>` — bugfix branches (branch from `develop` or `main` for hotfixes)

## Pull Request Process

### Before Submitting

1. **Sync with upstream:**

   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

2. **Run all checks:**

   ```bash
   bun format
   bun lint
   bun app:check
   bun test              # from apps/web directory
   ```

3. **Stay focused** — one PR for one feature or fix. Avoid mixing unrelated changes.

### Submitting PR

1. Push your branch to your fork
2. Open a Pull Request against the `develop` branch
3. Fill in the PR template with:
   - Clear description and rationale
   - Related issue number(s) (e.g., `Closes #42`)
   - Screenshots for UI changes
   - Breaking changes or migration steps, if any

### Review Process

- At least **one maintainer approval** required before merging
- CI checks (lint, type check, tests, build) must pass
- Reviewers may request changes — address feedback and push updates to the same branch
- After approval, maintainer **squash and merge**

## Reporting Issues

### Bug Reports

When reporting a bug, provide:

- **Description** — what happened and what was expected
- **Reproduction steps** — minimal steps to reproduce
- **Environment** — OS, browser, Bun version, Node.js version
- **Screenshots or logs** — if relevant
- **ElyOS version** — commit hash or release tag

### Feature Requests

When requesting a feature, provide:

- **Problem** — what problem does it solve?
- **Proposed solution** — how should it work?
- **Alternatives considered** — what other approaches did you explore?
- **Additional context** — mockups, examples, or references

## Development Tips

### Working with Built-in Applications

Each application has its own entry point (`index.svelte`), icon, and optional server actions in `src/apps/[app-name]/`.

**Detailed guide:** [Built-in Applications →](/en/builtin-apps)

### Hot Reload

The dev server supports hot module replacement. Changes to `.svelte`, `.ts`, and `.css` files appear instantly without full page reload.

### Database Changes

1. Modify schemas in `packages/database/src/schemas/`
2. Run `bun db:generate` to create migration
3. Run `bun db:migrate` to apply
4. Test with `bun db:studio` to inspect database

**Detailed guide:** [Database →](/en/database)

## Getting Help

If you have questions or get stuck:

- **Issues** — search existing issues or open a new one
- **Discussions** — use GitHub Discussions for questions and ideas
- **Documentation** — check this documentation site for guides
- **Troubleshooting** — common problems and solutions: [Troubleshooting →](/en/troubleshooting)

Thank you for contributing to ElyOS! Every contribution matters, no matter how small. 🎉

## Support

I'm a software developer from Hungary with several years of experience, building ElyOS in my spare time (solo, for now) – together with an AI who also needs to be fed. 🤑

If you find it useful or simply like what I'm doing, even a small contribution helps me keep going.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/H2H11XIQDF)
