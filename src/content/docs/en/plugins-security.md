---
title: Security
description: Application security rules, forbidden code patterns, and allowed dependencies
next:
  link: /en/builtin-apps/
  label: Built-in Applications
---

## Overview

The Racona application system runs applications in a sandboxed environment. The system performs static code analysis on uploaded applications and rejects those containing forbidden patterns.

---

## Forbidden Code Patterns

The following code patterns are not permitted for security reasons:

| Pattern | Why it's forbidden |
|---|---|
| `eval()` | Executes arbitrary code |
| `new Function(...)` | Executes arbitrary code |
| `innerHTML =` | XSS attack vector |
| `outerHTML =` | XSS attack vector |
| `document.write()` | DOM manipulation, XSS |
| `dangerouslySetInnerHTML` | React-style XSS |
| `fetch()` to external domain | Data exfiltration |
| `XMLHttpRequest` to external domain | Data exfiltration |
| `import()` from external URL | Loading arbitrary code |
| Accessing another plugin's schema | Violates data isolation |
| Accessing `platform.*` schema | Accessing system data |
| Accessing `auth.*` schema | Accessing authentication data |

### Examples

```typescript
// ❌ FORBIDDEN
eval('console.log("hello")');
new Function('return 1 + 1')();
element.innerHTML = userInput;
document.write('<script>...</script>');
fetch('https://external-api.com/data');
import('https://cdn.example.com/lib.js');

// ✅ ALLOWED
console.log('hello');
const result = 1 + 1;
element.textContent = userInput;  // textContent is safe
window.webOS.remote.call('myFunction');  // via SDK
```

---

## Allowed Dependencies

Only whitelisted packages may be specified in the `dependencies` field of `manifest.json`. The plugin upload will fail if other dependencies are included.

### Whitelist

| Package | Version |
|---|---|
| `svelte` | `^5.x.x` |
| `lucide-svelte` | `^0.x.x` |
| `@elyos/*` | any version |

```json
// manifest.json — allowed
{
  "dependencies": {
    "svelte": "^5.0.0",
    "lucide-svelte": "^0.263.1",
    "@elyos/my-package": "^1.0.0"
  }
}

// manifest.json — FORBIDDEN (upload will fail)
{
  "dependencies": {
    "axios": "^1.0.0",
    "lodash": "^4.17.0"
  }
}
```

:::tip
If you need a utility function (e.g. date formatting, deep clone), implement it yourself, or request that it be added to the `@elyos/*` scope.
:::

---

## Permissions

A plugin can only access the SDK functions for which it has requested permission in `manifest.json`. The system checks permissions at runtime.

| Permission | Description | Affected SDK functions |
|---|---|---|
| `database` | Read/write to the plugin's own schema | `data.set()`, `data.get()`, `data.delete()`, `data.query()`, `data.transaction()` |
| `notifications` | Send notifications to users | `notifications.send()` |
| `remote_functions` | Call server-side functions | `remote.call()` |
| `file_access` | File upload/download | (planned) |
| `user_data` | Read user profile data | (planned) |

```json
// manifest.json
{
  "permissions": [
    "database",
    "notifications",
    "remote_functions"
  ]
}
```

:::caution
Only request permissions you actually need. Unnecessary permissions reduce the plugin's trustworthiness and make admin approval more difficult.
:::

---

## Data Isolation

Each plugin gets its own database schema: `plugin_{plugin_id}`. The schema is **only created** if the `"database"` permission is listed in the plugin's `manifest.json` — if the plugin doesn't use a database, no schema is created.

The plugin can only perform database operations within this schema.

```typescript
// ✅ Own schema — allowed
const rows = await window.webOS.data.query(
  'SELECT * FROM my_table WHERE user_id = $1',
  [userId]
);
// The system automatically runs this in the plugin_{id} schema

// ❌ Other schema — FORBIDDEN, throws an error
const rows = await window.webOS.data.query(
  'SELECT * FROM platform.users'
);
```

### Custom Table Structure (migrations/)

If the plugin needs its own tables, you can place SQL files in the `migrations/` folder. Details: [SDK — Data Service](/en/plugins-sdk/#migrations-migrations-folder).

---

## Error Handling from a Security Perspective

```typescript
try {
  const result = await window.webOS.remote.call('sensitiveFunction');
} catch (error) {
  // Error types:
  // PERMISSION_DENIED — missing permission
  // PLUGIN_INACTIVE   — plugin is not activated
  // REMOTE_CALL_TIMEOUT — timeout

  // ✅ User-friendly error message
  window.webOS.ui.toast('Operation failed', 'error');

  // ❌ Do not display the raw error message to the user
  // window.webOS.ui.toast(error.message, 'error');
}
```

---

## Security Best Practices

- Validate user input before writing to the database
- Use parameterized queries (`$1`, `$2`, ...) to prevent SQL injection
- Do not store sensitive data (passwords, tokens) in the plugin database
- Do not trust client-side validation — also validate in server functions
- Follow the principle of least privilege (only request what you actually use)
