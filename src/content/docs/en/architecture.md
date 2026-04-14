---
title: Architecture Overview
description: Racona monorepo structure, SvelteKit application architecture, and main layers
next:
  link: /en/environment/
  label: Environment Variables
---

## Monorepo Structure

Racona is a Bun workspaces-based monorepo:

```
elyos-core/
├── apps/
│   └── web/                  # Main SvelteKit application (@elyos/core)
├── packages/
│   ├── database/             # Drizzle ORM schemas, migrations, seeds (@elyos/database)
│   ├── sdk/                  # Plugin SDK (@racona/sdk)
│   └── @racona/cli/  # CLI tool for plugin generation
├── examples/
│   └── plugins/              # Example plugin implementations
├── docker/                   # Dockerfile and docker-compose.yml
├── docs/                     # Project documentation
└── package.json              # Root workspace configuration
```

## Web Application Layers

```
apps/web/src/
├── routes/          # SvelteKit file-based routing
├── apps/            # Built-in desktop applications
├── lib/
│   ├── components/  # UI components
│   ├── stores/      # Global state management (Svelte 5 runes)
│   ├── server/      # Server-only code
│   ├── i18n/        # Internationalization
│   ├── auth/        # Authentication (better-auth client)
│   ├── services/    # Client-side services
│   ├── types/       # TypeScript types
│   └── utils/       # Helper functions
├── hooks.server.ts  # Server hooks (auth, i18n, session)
├── hooks.client.ts  # Client hooks
└── app.d.ts         # SvelteKit ambient types
```

## Routing Structure

```
routes/
├── (public)/          # Optional public website (marketing, landing)
├── admin/
│   ├── (auth)/        # Authentication pages (login, 2FA, etc.)
│   └── (protected)/   # Protected desktop interface (WebOS system itself)
└── api/               # REST API endpoints
    ├── apps/          # Application metadata
    ├── files/         # File management
    ├── notifications/ # Notification handling
    ├── plugins/       # Plugin loading and management
    └── health/        # Database availability check
```

The main WebOS desktop interface lives under `admin/(protected)/`. The `(public)/` route group is reserved for an optional public website (e.g., marketing page, product landing).

Behavior is controlled by the `PUBLIC_SITE_ENABLED` environment variable:

| Value | Behavior |
|-------|----------|
| `true` | The `/` route goes to `(public)/` — public site is shown |
| `false` | The `/` route redirects to `/admin` — no public site |

This allows the same deployment to work either as a standalone WebOS system or with a public website.

## Built-in Applications

The `src/apps/` folder contains all built-in desktop applications. Each application is a separate directory:

```
apps/
├── chat/            # Real-time internal messaging
├── help/            # Built-in documentation browser
├── log/             # System and error log viewer
├── notifications/   # Notification management
├── plugin-manager/  # Plugin upload and installation (admin)
├── settings/        # Appearance, security, language
└── users/           # User, group, role management (admin)
```

Required files for each application:

| File             | Description                                         |
| ---------------- | --------------------------------------------------- |
| `index.svelte`   | Entry point — loaded lazily by WindowManager        |
| `icon.svg`       | SVG icon file — required if metadata `icon` field contains a filename; not needed if using Lucide icon name (PascalCase, no dot) |
| `*.remote.ts`    | Server actions (`command`/`query`)                  |
| `menu.json`      | Optional sidebar menu definition                    |
| `stores/`        | Application-specific Svelte 5 rune stores           |
| `components/`    | Application-specific Svelte components              |

## Server Architecture

Racona uses two server layers:

**SvelteKit server** — main application logic, server actions, API routes, authentication.

**Express + Socket.IO** (`server.js`) — real-time communication for chat functionality. The Socket.IO server is accessible via the `global.io` variable from SvelteKit hooks.

```
Client
  │
  ├── HTTP/HTTPS ──→ SvelteKit (routes, server actions, API)
  │
  └── WebSocket ──→ Express + Socket.IO (chat, real-time)
```

## Database Layer

```
packages/database/src/
├── schemas/
│   ├── auth/        # better-auth tables (users, sessions, etc.)
│   └── platform/    # Platform tables (apps, chat, i18n, plugins, etc.)
├── seeds/           # Seed scripts
├── types/           # Exported DB types
└── index.ts         # Main export (db client, schemas, types)
```

The `@elyos/database` package can be imported from the application:

```typescript
import { db, schema } from '@elyos/database';
```

## Path Aliases

| Alias          | Resolution                        |
| -------------- | --------------------------------- |
| `$lib`         | `apps/web/src/lib`                |
| `$app/server`  | SvelteKit server module           |
| `@elyos/database` | `packages/database/src`        |

## Technology Stack

| Layer          | Technology                                          |
| -------------- | --------------------------------------------------- |
| Frontend       | SvelteKit 2, Svelte 5 (runes), TypeScript 5         |
| Styling        | Tailwind CSS 4 (Vite plugin, no config file)        |
| UI Primitives  | shadcn-svelte (bits-ui based), lucide-svelte        |
| Backend        | SvelteKit server + Express + Socket.IO              |
| Database       | PostgreSQL + Drizzle ORM                            |
| Authentication | better-auth                                         |
| Validation     | Valibot (data), Varlock (env)                       |
| Env Management | Varlock + Infisical                                 |
| Runtime        | Bun                                                 |
| Infrastructure | Docker + Docker Compose                             |
| Testing        | Vitest, fast-check, Playwright                      |

**Details:**
- [Environment Variables →](/en/environment) — Varlock and Infisical integration
