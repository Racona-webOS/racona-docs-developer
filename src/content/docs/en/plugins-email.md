---
title: Email Service
description: Sending emails from applications – email templates, context.email API, template registration lifecycle
---

:::note[Since v0.1.7]
The Email Service is available from Racona core version `0.1.7`.
:::

## Overview

Applications can send emails through the core `EmailManager` system using the `context.email` service available in [server functions](/en/plugins-server-functions/). This allows plugins to send templated emails (e.g. welcome messages, approval notifications) without direct access to the platform schema or the `EmailManager` class.

The feature has two parts:

1. **Declarative email template registration** — JSON files in the `email-templates/` folder are automatically registered during installation
2. **Email sending via `context.email`** — server functions call `context.email.send()` to send emails using registered templates

Required permission: `notifications` in `manifest.json`.

## Quick Start

### 1. Add the `notifications` permission

```json title="manifest.json" {5}
{
  "id": "my-app",
  "permissions": ["database", "remote_functions", "notifications"]
}
```

### 2. Create an email template

```json title="email-templates/welcome.json"
{
  "name": "Welcome Email",
  "locales": {
    "en": {
      "subject": "Welcome to the system!",
      "html": "<h1>Hello {{name}}!</h1><p>Your account has been created.</p>",
      "text": "Hello {{name}}! Your account has been created."
    },
    "hu": {
      "subject": "Üdvözöljük a rendszerben!",
      "html": "<h1>Kedves {{name}}!</h1><p>Fiókja létrejött.</p>",
      "text": "Kedves {{name}}! Fiókja létrejött."
    }
  },
  "requiredData": ["name", "email"],
  "optionalData": ["position"]
}
```

### 3. Send the email from a server function

```typescript title="server/functions.ts"
export async function createUser(params, context) {
  // ... create user logic ...

  // Send welcome email
  const result = await context.email.send({
    to: params.email,
    template: 'welcome',       // Just the template name — no prefix needed
    data: { name: params.name, email: params.email },
    locale: 'en'
  });

  if (!result.success) {
    console.warn('Email sending failed:', result.error);
  }

  return { success: true };
}
```

## The `context.email` API

The `email` property is available on the `context` object in server functions when the application has the `notifications` permission.

### `context.email.send(params)`

Sends a templated email through the core `EmailManager`.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `to` | `string \| string[]` | Yes | Recipient email address(es) |
| `template` | `string` | Yes | Template name (without app ID prefix) |
| `data` | `Record<string, unknown>` | Yes | Template variables |
| `locale` | `string` | No | Locale code (default: `'hu'`) |

**Returns:** `Promise<{ success: boolean; messageId?: string; error?: string }>`

```typescript
const result = await context.email.send({
  to: 'user@example.com',
  template: 'order_confirmation',
  data: { orderId: 1234, total: '€99.00' },
  locale: 'en'
});
```

### Automatic template name prefixing

The `template` parameter is automatically prefixed with the application ID. You only need to provide the template name as defined in your `email-templates/` folder:

| You write | What gets resolved |
|---|---|
| `'welcome'` | `'my-app:welcome'` |
| `'order_confirmation'` | `'my-app:order_confirmation'` |

This means you never need to know or use the full prefixed name in your code.

### Permission check

If the application does not have the `notifications` permission, `context.email` is `undefined`. Always check before using:

```typescript
if (context.email) {
  await context.email.send({ /* ... */ });
}
```

Or handle it gracefully:

```typescript
export async function sendNotification(params, context) {
  if (!context.email) {
    throw new Error('Email service is not available — check notifications permission');
  }
  // ...
}
```

## Email Template Format

Templates are JSON files in the `email-templates/` directory of your application.

### File structure

```
my-app/
├── email-templates/
│   ├── welcome.json
│   ├── order_confirmation.json
│   └── password_reset.json
├── manifest.json
└── ...
```

### JSON schema

```json
{
  "name": "Human-readable template name",
  "locales": {
    "en": {
      "subject": "Email subject with {{variable}} support",
      "html": "<h1>HTML body with {{variable}} support</h1>",
      "text": "Plain text body with {{variable}} support"
    },
    "hu": {
      "subject": "Email tárgya {{variable}} támogatással",
      "html": "<h1>HTML törzs {{variable}} támogatással</h1>",
      "text": "Szöveges törzs {{variable}} támogatással"
    }
  },
  "requiredData": ["variable"],
  "optionalData": ["optionalVariable"]
}
```

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Display name for the template |
| `locales` | `Record<string, LocaleData>` | Locale-specific content (subject, html, text) |
| `requiredData` | `string[]` | Required template variables |
| `optionalData` | `string[]` | Optional template variables |

Each locale entry contains:

| Field | Type | Description |
|---|---|---|
| `subject` | `string` | Email subject line (supports `{{variable}}` syntax) |
| `html` | `string` | HTML email body |
| `text` | `string` | Plain text fallback body |

### Template variables

Use `{{variableName}}` syntax in subject, html, and text fields. Variables are replaced with values from the `data` parameter when sending.

## Template Registration Lifecycle

### Installation

When a plugin is installed, the core `PluginInstaller` automatically:

1. Reads all `.json` files from the `email-templates/` directory
2. For each file and each locale, creates a row in `platform.email_templates`
3. The `type` column is set to `{appId}:{fileName}` (e.g. `my-app:welcome`)
4. Uses upsert (ON CONFLICT DO UPDATE) — reinstalling updates existing templates

:::tip
The `email-templates/` directory is optional. If it doesn't exist, the installer simply skips this step.
:::

### Uninstallation

When a plugin is removed, all email template records with the `{appId}:%` prefix are deleted from `platform.email_templates`.

### Update flow

Reinstalling or updating a plugin re-registers all templates using upsert. Changed templates are updated, new ones are added, but templates that were removed from the `email-templates/` folder are **not** automatically deleted — they remain in the database until the plugin is fully uninstalled.

## Error Handling

Email sending failures do not throw exceptions. Instead, `context.email.send()` returns an error object:

```typescript
const result = await context.email.send({
  to: 'user@example.com',
  template: 'welcome',
  data: { name: 'John' }
});

if (!result.success) {
  // Log the error, show a toast, or ignore
  console.error('Email failed:', result.error);
  // The calling function decides how to handle it
}
```

:::caution
Email failures should generally **not** roll back the main operation. For example, if creating an employee succeeds but the welcome email fails, the employee record should still be saved. Handle email errors as non-critical.
:::

## Complete Example

```typescript title="server/functions.ts"
export async function createEmployeeWithUser(params, context) {
  const { db, email } = context;
  const { name, emailAddress, position, department } = params;

  // 1. Create user and employee in a transaction
  const employee = await db.execute(`
    -- ... insert logic ...
  `);

  // 2. Send welcome email (non-blocking, non-critical)
  if (email) {
    const emailResult = await email.send({
      to: emailAddress,
      template: 'employee_welcome',
      data: { name, email: emailAddress, position, department },
      locale: 'hu'
    });

    if (!emailResult.success) {
      console.warn(`Welcome email failed for ${emailAddress}: ${emailResult.error}`);
    }
  }

  return { employee: employee.rows[0] };
}
```
