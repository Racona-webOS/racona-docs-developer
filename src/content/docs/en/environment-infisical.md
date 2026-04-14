---
title: Infisical Integration
description: Secrets management with Infisical — bootstrap credentials, operation and fallback mode
---

Racona uses **Infisical** for centralized secrets management. This ensures that secrets are not stored in version control and access can be managed centrally.

## What is Infisical?

Infisical is an open-source secrets manager that provides:

- **Centralized secrets storage** — all secrets in one place
- **Environment-specific values** — dev, staging, prod
- **Audit log** — who, when, what was modified
- **Access control** — role-based access control
- **Machine Identity** — API access for applications

## Bootstrap Credentials

To start the application, only **2 environment variables** are needed in the local `.env` file:

```bash
INFISICAL_CLIENT_ID=your-machine-identity-client-id
INFISICAL_CLIENT_SECRET=your-machine-identity-client-secret
```

All other secrets are automatically fetched from Infisical.

### Creating a Machine Identity

1. Log in to Infisical
2. Go to project settings
3. Create a new Machine Identity
4. Copy the `Client ID` and `Client Secret` values
5. Add them to the `.env.local` file

## How It Works

The `src/lib/secrets/varlock.ts` file handles the Infisical integration:

### 1. Bootstrap credentials validation

```typescript
if (!clientId || !clientSecret) {
  throw new Error('Missing bootstrap credential');
}
```

### 2. Creating the Infisical client

The client authenticates itself with the bootstrap credentials.

### 3. Fetching secrets (with retry logic)

3 retries with exponential backoff (1s, 2s, 4s):

```typescript
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    return await infisical.fetchSecrets();
  } catch (error) {
    if (attempt < 3) {
      await sleep(Math.pow(2, attempt - 1) * 1000);
    }
  }
}
```

### 4. Runtime validation

Validating the fetched secrets against `schema.ts`:

```typescript
const validated = validateSchema(secrets);
```

### 5. Automatic token renewal

If the token expires, it is automatically renewed with the bootstrap credentials:

```typescript
if (tokenExpired && infisical.renewToken) {
  await infisical.renewToken(clientId, clientSecret);
}
```

## Startup Modes

### Production (Docker)

```dockerfile
CMD ["varlock", "run", "--", "bun", "run", "apps/web/server.js"]
```

The `varlock run` wrapper:
1. Loads bootstrap credentials from the `.env` file
2. Fetches all secrets from Infisical
3. Validates them
4. Loads them into `process.env`
5. Starts the application

### Development (Varlock + Infisical)

```bash
bun app:dev:varlock
```

Same as production, but with the Vite dev server.

### Development (local .env)

```bash
bun app:dev
```

Does not use Varlock, reads directly from the `.env.local` file.

## Fallback Mode

If you don't have Infisical access or are working offline:

```bash
VARLOCK_FALLBACK=local
```

In this mode, Varlock reads all variables directly from the `.env` file, without Infisical.

**Usage:**

1. Copy the `.env.example` file as `.env.local`
2. Fill in all variables
3. Add: `VARLOCK_FALLBACK=local`
4. Start: `bun app:dev:varlock`

## Error Messages

### Missing bootstrap credential

```
[Varlock] ERROR: Missing bootstrap credential: INFISICAL_CLIENT_ID
```

**Solution:** Add the Infisical credentials to the `.env.local` file.

### Infisical not reachable

```
[Varlock] ERROR: Infisical server not reachable (after 3/3 retries)
```

**Solution:**
- Check internet connection
- Use fallback mode: `VARLOCK_FALLBACK=local`

### Invalid credentials

```
[Varlock] ERROR: Authentication failed
```

**Solution:** Verify that `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET` are correct.

## Successful Startup

```
[Varlock] 42 secrets successfully loaded (production/elyos-core)
```

This means 42 environment variables were fetched from the Infisical `production` environment of the `elyos-core` project.

## Benefits

- **Secrets are not stored in version control** — only bootstrap credentials
- **Centralized secrets management** — one place for all environments
- **Audit log** — who, when, what was modified
- **Access control** — role-based access control
- **Environment-specific values** — dev, staging, prod
- **Automatic token renewal** — no need to restart

## Next Steps

- [Runtime validation →](/en/environment-runtime) — schema.ts in detail
- [Adding a new variable →](/en/environment-add-variable) — step by step
- [Varlock schema format →](/en/environment-schema) — annotations and types
