---
title: Troubleshooting
description: Common problems and solutions for Racona installation and operation
---

This guide covers the most common problems encountered when installing and operating Racona.

## Application Won't Start

### Missing Required Environment Variables

**Symptom:** Application crashes on startup with missing configuration error.

**Cause:** `DATABASE_URL`, `BETTER_AUTH_SECRET`, or `BETTER_AUTH_URL` not set.

**Solution:** Ensure `.env` file contains at least:

```bash
DATABASE_URL=postgresql://elyos:elyos123@localhost:5432/elyos
BETTER_AUTH_SECRET=<generate: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
```

---

### Port Already in Use

**Symptom:** `Error: listen EADDRINUSE :::3000`

**Cause:** Another process is already using port 3000 (or configured port).

**Solution:** Stop the conflicting process or change the port:

```bash
ELYOS_PORT=3001
```

---

### `NODE_ENV` Not Set

**Symptom:** Unexpected behavior, missing features, or insecure defaults.

**Cause:** If `NODE_ENV` is not set, the application runs in `development` mode. In production, this causes performance and security issues.

**Solution:** Always set in production: `NODE_ENV=production`.

---

## Database Problems

### Cannot Connect to PostgreSQL

**Symptom:** `Connection refused` or `ECONNREFUSED` error on startup.

**Cause:** Host/port in `DATABASE_URL` is unreachable.

**Common mistakes:**

- Using `localhost` as host inside Docker (use service name: `postgres`)
- Wrong port (default: `5432`)
- PostgreSQL container not ready when app tries to connect

**Solution (local):**

```bash
DATABASE_URL=postgresql://elyos:elyos123@localhost:5432/elyos
```

**Solution (Docker Compose):** Don't set `DATABASE_URL` in `.env` — Docker Compose automatically builds it from `POSTGRES_*` variables using internal `postgres` hostname.

---

### Authentication Error

**Symptom:** `password authentication failed for user "elyos"`

**Cause:** `POSTGRES_USER` / `POSTGRES_PASSWORD` in `.env` don't match database initialization values.

**Solution:** Ensure `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` match values used when volume was first created. If changed after creation, delete volume and restart:

```bash
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

---

### Migrations Not Run / Missing Tables

**Symptom:** `relation "..." does not exist` errors.

**Cause:** Database never initialized or migrations didn't run.

**Solution (Docker):** `db-init` service runs automatically on first startup. If it failed, check logs:

```bash
docker logs elyos-db-init
```

**Solution (local):**

```bash
bun db:init
```

---

## Authentication Issues

### `BETTER_AUTH_SECRET` Still Has Default Placeholder

**Symptom:** Sessions insecure or auth tokens invalid after deployment.

**Cause:** `BETTER_AUTH_SECRET` value is `your-secret-here` or `change-me-in-production`.

**Solution:** Generate proper secret before first startup:

```bash
openssl rand -base64 32
```

:::danger[Important]
If you change this secret after users have logged in, all existing sessions become invalid.
:::

---

### `BETTER_AUTH_URL` Doesn't Match `APP_URL`

**Symptom:** OAuth callbacks fail, email verification links are wrong, or users redirected to wrong URL.

**Cause:** `BETTER_AUTH_URL` must exactly match application's public URL.

**Solution:** Both values must be identical:

```bash
APP_URL=https://elyos.example.com
BETTER_AUTH_URL=https://elyos.example.com
```

---

### Google Sign-In Not Working

**Symptom:** Google sign-in button missing or returns error.

**Cause:** `SOCIAL_LOGIN_ENABLED` is `false`, or `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` not set.

**Solution:**

```bash
SOCIAL_LOGIN_ENABLED=true
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

Also ensure OAuth redirect URI is set in Google Cloud Console: `<APP_URL>/api/auth/callback/google`.

---

### Registration Disabled But No Admin User Exists

**Symptom:** Nobody can log in and no account creation option.

**Cause:** `REGISTRATION_ENABLED=false` set before first admin user created.

**Solution:** Temporarily enable registration, create admin account, then disable again. Or set `ADMIN_USER_EMAIL` before running `bun db:init`:

```bash
ADMIN_USER_EMAIL=admin@example.com
```

:::danger[Default Password]
Default password is **`Admin1234!`** — change immediately after first login. Keeping the default password is a critical security risk.
:::

---

## Email Issues

### Emails Not Arriving

**Symptom:** Verification emails, OTP codes, or password reset emails never arrive.

**Cause:** Email provider not properly configured, or `EMAIL_TEST_MODE=true` (emails only logged to console).

**Solution:** First check `EMAIL_TEST_MODE`:

```bash
EMAIL_TEST_MODE=false
```

Then verify provider-specific variables match selected `EMAIL_PROVIDER`.

---

### SMTP Authentication Error

**Symptom:** `535 Authentication failed` or similar SMTP error in logs.

**Cause:** Wrong `SMTP_USERNAME` / `SMTP_PASSWORD`, or SMTP server requires app-specific password (e.g., Gmail).

**Solution:** For Gmail, generate [App Password](https://support.google.com/accounts/answer/185833) and use as `SMTP_PASSWORD`. Requires two-factor authentication enabled on Google account.

---

### Wrong SMTP Port / TLS Mismatch

**Symptom:** Connection timeout or TLS handshake error.

**Cause:** `SMTP_PORT` and `SMTP_SECURE` values don't match.

**Solution:**

| Port | `SMTP_SECURE` | Protocol  |
| ---- | ------------- | --------- |
| 587  | `false`       | STARTTLS  |
| 465  | `true`        | SSL/TLS   |
| 25   | `false`       | Plain     |

---

## Translation Keys Showing Instead of Text

**Symptom:** Raw translation keys appear instead of text — e.g., `auth.login.title` instead of "Login".

**Cause 1: Missing `ORIGIN` → 403 errors on translation fetch**

Translation loader makes server calls on startup. If `ORIGIN` not set correctly, these calls return `403 Forbidden` and UI shows raw keys.

**Solution:** Set `ORIGIN` to exact public URL:

```bash
ORIGIN=https://elyos.example.com
```

Check browser Network tab — if translation requests return `403`, this is the cause.

**Cause 2: Missing translations in database**

Translations stored in `platform.translations` table. If database not seeded or seed incomplete, table is empty and no text loads.

**Solution:** Run seed to populate translations:

```bash
# Local
bun db:seed

# Or full reset
bun db:init
```

Docker case, restart with volume deletion:

```bash
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

Check table directly:

```sql
SELECT COUNT(*) FROM platform.translations;
```

If result is `0`, seed didn't run.

---

## 403 Error on Remote Calls

**Symptom:** Server actions (form submissions, data modifications) return `403 Forbidden`.

**Cause:** `ORIGIN` variable not set or doesn't match URL application is accessed from. SvelteKit CSRF protection rejects requests where `Origin` header doesn't match.

**Solution:** Set `ORIGIN` to exact public URL:

```bash
ORIGIN=https://elyos.example.com
```

Must match URL in browser address bar — including protocol and port if non-standard.

---

## Docker Issues

### Container Keeps Restarting

**Symptom:** `docker logs elyos-app` shows repeated startup errors.

**Cause:** Usually missing environment variable, failed database connection, or `db-init` service didn't complete.

**Solution:**

1. Check `db-init` logs: `docker logs elyos-db-init`
2. Check app logs: `docker logs elyos-app`
3. Ensure all required variables set in `.env`

---

### Uploaded Files Disappear After Container Restart

**Symptom:** Uploaded files disappear when container restarts.

**Cause:** `apps/web/uploads` directory not mounted as volume.

**Solution:** Default `docker-compose.yml` already includes `../apps/web/uploads:/app/uploads` volume mount. If using custom config, ensure this mount exists.

---

### Port Conflict with PostgreSQL

**Symptom:** `bind: address already in use` on port 5432.

**Cause:** Local PostgreSQL instance already running on host.

**Solution:** Change host-side port mapping:

```bash
POSTGRES_PORT=5433
```

---

## Plugin System Issues

### Plugin Upload Fails with Size Limit Error

**Symptom:** Plugin upload rejected with size limit error.

**Cause:** Plugin package exceeds `PLUGIN_MAX_SIZE` (default: 10 MB).

**Solution:** Increase limit (max 100 MB):

```bash
PLUGIN_MAX_SIZE=52428800  # 50 MB
```

---

### Plugin Storage Directory Not Writable

**Symptom:** Plugin installation fails with permission error.

**Cause:** Process doesn't have write permission to `PLUGIN_STORAGE_DIR` or `PLUGIN_TEMP_DIR`.

**Solution:** Ensure directories exist and are writable:

```bash
mkdir -p /var/webos/plugins /tmp/webos-plugins
chmod 755 /var/webos/plugins
```

---

## Logging and Diagnostics

### No Log Output

**Symptom:** Application runs but produces no log output.

**Cause:** `LOG_LEVEL` set too high (e.g., `fatal`), or `LOG_TARGETS` doesn't include `console`.

**Solution:**

```bash
LOG_TARGETS=console
LOG_LEVEL=info
```

---

### Log Files Not Written

**Symptom:** `LOG_TARGETS=file` set but no files appear in `LOG_DIR`.

**Cause:** Log directory doesn't exist or not writable.

**Solution:** Create directory and ensure it's writable:

```bash
mkdir -p ./logs
```

Or set custom path:

```bash
LOG_DIR=/var/log/elyos
```

---

### Enable Detailed Logging for Debugging

For maximum verbosity during troubleshooting:

```bash
LOG_TARGETS=console,file
LOG_LEVEL=debug
LOG_DIR=./logs
```

:::caution[Production]
Remember to reset `LOG_LEVEL` to `info` or `warn` in production to avoid performance degradation and log noise.
:::
