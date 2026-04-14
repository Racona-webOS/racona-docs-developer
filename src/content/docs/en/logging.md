---
title: Logging
description: Using server-side logger, logging levels, configuring targets, and the Log application
next:
  link: /en/notifications/
  label: Notifications
---

## Overview

Racona uses its own logging system that can write to multiple targets simultaneously (console, file, database). Logs can be viewed in the built-in **Log** application.

## Importing Logger

```typescript
import { logger } from '$lib/server/logging';
```

## Logging Levels

```typescript
logger.debug('Detailed debug information', { extra: 'data' });
logger.info('General information');
logger.warn('Warning', { context: 'something' });
logger.error('An error occurred', { error: err });
logger.fatal('Critical error', { error: err });
```

## Structured Logging

The logger accepts structured data as a second parameter:

```typescript
logger.info('User logged in', {
  userId: user.id,
  email: user.email,
  ip: event.getClientAddress()
});

logger.error('Database error', {
  operation: 'findUser',
  userId: id,
  error: error.message
});
```

## Logging in Server Actions

```typescript
import { command, getRequestEvent } from '$app/server';
import { logger } from '$lib/server/logging';

export const myAction = command(schema, async (input) => {
  const { locals } = getRequestEvent();

  logger.info('Action executed', {
    action: 'myAction',
    userId: locals.user?.id,
    input
  });

  try {
    // ... logic
    return { success: true };
  } catch (error) {
    logger.error('Action failed', {
      action: 'myAction',
      error: error instanceof Error ? error.message : String(error)
    });
    return { success: false, error: 'Internal error' };
  }
});
```

## Configuration

Logging is configured in the `.env` file:

| Variable      | Default   | Description                                           |
| ------------- | --------- | ----------------------------------------------------- |
| `LOG_TARGETS` | `console` | Comma-separated targets: `console`, `file`, `database` |
| `LOG_LEVEL`   | `error`   | Minimum level: `debug`, `info`, `warn`, `error`, `fatal` |
| `LOG_DIR`     | `./logs`  | Log files directory (if `file` target active)         |

### Development Configuration

```bash
LOG_TARGETS=console
LOG_LEVEL=debug
```

### Production Configuration

```bash
LOG_TARGETS=console,database
LOG_LEVEL=info
```

## Log Application

The built-in **Log** application (`src/apps/log/`) displays logs saved to the database. Accessible only with admin permissions.

Logs are stored in the `error_logs` table when the `database` target is active.

## Client-Side Error Logging

Client-side JavaScript errors are automatically logged via the `/api/log` endpoint. This is configured in `hooks.client.ts`.
