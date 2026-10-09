---
title: Variables Reference
description: Complete environment variables reference – all available configuration in tables
---

This page is the **complete reference of all available environment variables** in tabular format.

**Detailed documentation:**
- [Environment Variables Overview →](/en/environment) — Varlock, Infisical, architecture
- [Varlock Schema Format →](/en/env-validation) — annotations, types
- [Adding a New Variable →](/en/environment-add-variable) — step-by-step

---

## Environment Management

Racona uses **Varlock** for typesafe environment variable management. Varlock validates all configuration values at application startup, so configuration errors are caught immediately.

### Bootstrap Credentials

Only **bootstrap credentials** remain in the `.env` file:

```dotenv
INFISICAL_CLIENT_ID=machine-identity-client-id
INFISICAL_CLIENT_SECRET=machine-identity-client-secret
```

All other secrets (database URL, auth secret, SMTP password, etc.) come from Infisical at runtime.

**Details:** [Infisical Integration →](/en/environment-infisical)

### Local Fallback Mode

For offline development or without Infisical:

```dotenv
VARLOCK_FALLBACK=local
NODE_ENV=development
DATABASE_URL=postgresql://racona:racona123@localhost:5432/racona
BETTER_AUTH_SECRET=local-secret
BETTER_AUTH_URL=http://localhost:3000
ORIGIN=http://localhost:5173
# ... all other variables
```

---

## Quick Start

```bash
cp .env.example .env
```

**With Varlock + Infisical (recommended):**

```dotenv
INFISICAL_CLIENT_ID=machine-identity-client-id
INFISICAL_CLIENT_SECRET=machine-identity-client-secret
```

**Without Infisical (local fallback mode):**

```dotenv
VARLOCK_FALLBACK=local
NODE_ENV=development
DATABASE_URL=postgresql://racona:racona123@localhost:5432/racona
BETTER_AUTH_SECRET=generated-random-secret
BETTER_AUTH_URL=http://localhost:3000
ORIGIN=http://localhost:5173
```

---

## Server Configuration

| Variable          | Required | Default | Description                                              |
| ----------------- | -------- | ------- | -------------------------------------------------------- |
| `NODE_ENV`        | Yes      | —       | `development`, `production`, or `test`                   |
| `BODY_SIZE_LIMIT` | No       | `10485760` | Maximum request size in bytes (10 MB)                  |
| `RACONA_PORT`      | No       | `3000`  | Application port (Docker host port mapping)              |
| `APP_URL`         | Prod     | —       | Base URL (e.g., `https://racona.example.com`)             |
| `ORIGIN`          | Yes      | —       | CSRF protection — must match application URL             |

## Database

| Variable            | Required | Default | Description                                                    |
| ------------------- | -------- | ------- | -------------------------------------------------------------- |
| `DATABASE_URL`      | Yes      | —       | PostgreSQL connection string: `postgresql://USER:PASS@HOST:PORT/DB` |
| `POSTGRES_USER`     | Yes      | —       | PostgreSQL username                                            |
| `POSTGRES_PASSWORD` | Yes      | —       | PostgreSQL password                                            |
| `POSTGRES_HOST`     | Yes      | `localhost` | PostgreSQL server address                                  |
| `POSTGRES_DB`       | Yes      | —       | PostgreSQL database name                                       |
| `POSTGRES_PORT`     | Yes      | `5432`  | PostgreSQL port                                                |

> **Note:** `DATABASE_URL` is automatically built from `POSTGRES_*` variables in the schema. When using Docker Compose, `POSTGRES_HOST` should be `postgres` (the service name).

## Application Branding

| Variable          | Required | Default | Description                                    |
| ----------------- | -------- | ------- | ---------------------------------------------- |
| `APP_NAME`        | No       | `Racona` | Displayed application name                     |
| `APP_LOGO_URL`    | No       | —       | Logo URL — absolute or relative                |
| `EMAIL_USE_LOGO`  | No       | `false` | Use logo image in emails instead of text       |

## Authentication

| Variable               | Required | Default | Description                                    |
| ---------------------- | -------- | ------- | ---------------------------------------------- |
| `BETTER_AUTH_SECRET`   | Prod     | —       | Token signing secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL`      | Yes      | —       | Auth callback base URL                         |
| `REGISTRATION_ENABLED` | No       | `true`  | Enable registration                            |
| `SOCIAL_LOGIN_ENABLED` | No       | `true`  | Enable Google sign-in                          |
| `GOOGLE_CLIENT_ID`     | No       | —       | Google OAuth client ID                         |
| `GOOGLE_CLIENT_SECRET` | No       | —       | Google OAuth client secret                     |

## Email

| Variable               | Required | Default | Description                                    |
| ---------------------- | -------- | ------- | ---------------------------------------------- |
| `EMAIL_PROVIDER`       | No       | `resend` | `smtp`, `resend`, `sendgrid`, or `ses`         |
| `EMAIL_TEST_MODE`      | No       | `false` | Log emails to console instead of sending       |
| `EMAIL_OTP_EXPIRES_IN` | No       | `10`    | OTP expiration time in minutes (1–20)          |

### SMTP

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=noreply@example.com
SMTP_PASSWORD=password
```

### Resend

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@example.com
```

### SendGrid

```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@example.com
```

### AWS SES

```bash
EMAIL_PROVIDER=ses
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

## Internationalization

| Variable             | Default | Description                                   |
| -------------------- | ------- | --------------------------------------------- |
| `SUPPORTED_LOCALES`  | `hu,en` | Comma-separated supported languages           |
| `DEFAULT_LOCALE`     | `hu`    | Default language                              |

## Logging

| Variable       | Default | Description                                           |
| -------------- | ------- | ----------------------------------------------------- |
| `LOG_TARGETS`  | `console` | `console`, `file`, `database` (comma-separated)      |
| `LOG_LEVEL`    | `error` | `debug`, `info`, `warn`, `error`, `fatal`             |
| `LOG_DIR`      | `./logs` | Log files directory                                   |

## Initial Administrator

| Variable            | Required | Default | Description                                                           |
| ------------------- | -------- | ------- | --------------------------------------------------------------------- |
| `ADMIN_USER_EMAIL`  | Yes      | —       | First admin user email (used during db:init / db:reset)               |

## Developer Mode

| Variable    | Default | Description                                           |
| ----------- | ------- | ----------------------------------------------------- |
| `DEV_MODE`  | `false` | Enable plugin loading from localhost URLs             |

:::danger
Never enable `DEV_MODE=true` in production. It allows arbitrary code execution from localhost.
:::

## Demo Mode

| Variable                   | Default | Description                                                                |
| -------------------------- | ------- | -------------------------------------------------------------------------- |
| `DEMO_MODE`                | `false` | Enable demo mode (indicates to users they're in demo environment)          |
| `DEMO_RESET_HOUR`          | `4`     | Hour (UTC, 0–23) when demo database resets daily                          |
| `DEMO_RESET_UPLOADS_KEEP`  | —       | Comma-separated upload subdirectories to preserve during reset             |

## Plugin System

| Variable                    | Default              | Description                                    |
| --------------------------- | -------------------- | ---------------------------------------------- |
| `PLUGIN_PACKAGE_EXTENSION`  | `raconapkg`           | Plugin package file extension                  |
| `PLUGIN_MAX_SIZE`           | `10485760`           | Maximum plugin size in bytes (max: 100 MB)     |
| `PLUGIN_STORAGE_DIR`        | `/var/webos/plugins` | Installed plugin files directory               |
| `PLUGIN_FILE_MAX_BYTES`     | `10485760`           | Size limit of a file stored by a plugin (`file_access`), in bytes. Must not exceed `BODY_SIZE_LIMIT` |

Plugins with the `file_access` permission store files under `uploads/plugin-files/` (see [File Storage](/en/plugins-files/)). Back up the whole `uploads` folder: it holds these files, backgrounds, avatars and the installed plugins.

---

## Scheduler

Plugins can declare scheduled jobs in their manifest (`scheduledJobs`, `scheduler` permission, see [Scheduled Jobs](/en/plugins-scheduler/)); the core also runs its own maintenance jobs this way. The scheduler runs inside the app process and keeps its state in the database, so no system cron is needed. Jobs are locked in the database: with several app instances a job still runs only once.

| Variable                         | Default           | Description                                                       |
| -------------------------------- | ----------------- | ----------------------------------------------------------------- |
| `SCHEDULER_ENABLED`              | `true`            | Run scheduled jobs on this instance                               |
| `SCHEDULER_TICK_SECONDS`         | `30`              | How often due jobs are checked (5–3600 s)                         |
| `SCHEDULER_START_DELAY_SECONDS`  | `15`              | Delay of the first check after start-up (s)                       |
| `SCHEDULER_MAX_CONCURRENT`       | `2`               | Jobs running at the same time per instance (1–20)                 |
| `SCHEDULER_JOB_TIMEOUT_SECONDS`  | `600`             | Default job timeout when the job does not set its own (10–3600 s) |
| `SCHEDULER_MISSED_GRACE_SECONDS` | `300`             | Jobs with `catchUp: "skip"` are skipped when later than this (s)  |
| `SCHEDULER_DEFAULT_TIMEZONE`     | `Europe/Budapest` | Default IANA timezone of cron expressions                         |
| `SCHEDULER_RUN_RETENTION_DAYS`   | `30`              | Days to keep the run history                                      |

---

## Docker Configuration

```bash
# Start full stack
bun docker:up

# Database only
bun docker:db

# Stop
bun docker:down

# Logs
bun docker:logs
```

### Data Persistence

PostgreSQL data is stored in the `racona-data` Docker volume. For complete reset:

```bash
docker compose -f docker/docker-compose.yml down -v
```

---

## Production Deployment Recommended Settings

```dotenv
NODE_ENV=production
DEV_MODE=false
PUBLIC_SITE_ENABLED=false
REQUIRE_EMAIL_VERIFICATION=true
BETTER_AUTH_SECRET=<strong-random-value>
POSTGRES_PASSWORD=<strong-random-value>
ADMIN_USER_EMAIL=admin@example.com
LOG_TARGETS=console,database
LOG_LEVEL=info
```
