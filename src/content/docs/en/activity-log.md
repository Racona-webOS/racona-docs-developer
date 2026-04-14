---
title: Activity Log
description: Logging user and system-level actions in Racona
---

The Activity Log feature records user and system-level actions. Entries are stored in the `platform.activity_logs` database table and can be viewed in the Log application.

## Quick Start

```typescript
import { activityLogService } from '$lib/server/activity-log/service';

// Minimal call
await activityLogService.log({ actionKey: 'user.login' });

// Full call
await activityLogService.log({
  actionKey: 'plugin.installed',
  userId: String(locals.user.id),
  resourceType: 'plugin',
  resourceId: pluginId,
  context: { name: 'my-plugin', version: '1.0.0' }
});
```

The `log()` method is **fire-and-forget**: it never throws, never blocks business logic. On error it only writes `console.error`.

## Env Configuration

```env
# Enable/disable activity logging (default: true)
ACTIVITY_LOG_ENABLED=true
```

When `false`, all `activityLogService.log()` calls return immediately — nothing is written to the database.

## File Structure

```
apps/web/src/
├── lib/server/activity-log/
│   ├── service.ts          # ActivityLogService + singleton
│   ├── repository.ts       # ActivityLogRepository (findMany, count, insert)
│   ├── types.ts            # ActivityEntry, ActivityLogInput, ActivityLogFilters
│   └── interpolate.ts      # {{key}} → value substitution
└── apps/log/
    ├── activity-logs.remote.ts          # fetchActivityLogs server action
    └── components/
        ├── ActivityLog.svelte           # Table view component
        └── activityLogColumns.ts        # Column definitions
```

## Action Key Conventions

The `actionKey` is a translation key stored in the `platform.translations` table under the `activity` namespace.

### Naming Convention

```
{resource}.{action}
```

### Built-in Action Keys

| actionKey | Description |
|---|---|
| `user.login` | User logged in |
| `user.logout` | User logged out |
| `user.profile.updated` | Profile updated |
| `user.activated` | User activated |
| `user.deactivated` | User deactivated |
| `user.group.added` | User added to group |
| `user.group.removed` | User removed from group |
| `user.role.assigned` | Role assigned |
| `user.role.removed` | Role removed |
| `role.created` | Role created |
| `role.deleted` | Role deleted |
| `role.permission.added` | Permission added to role |
| `role.permission.removed` | Permission removed from role |
| `plugin.installed` | Plugin installed |
| `plugin.uninstalled` | Plugin uninstalled |

## Adding Translations

Translations must be inserted into `platform.translations` under the `activity` namespace:

```sql
INSERT INTO platform.translations (namespace, key, locale, value) VALUES
  ('activity', 'user.login', 'hu', 'Bejelentkezés'),
  ('activity', 'user.login', 'en', 'Login'),
  ('activity', 'plugin.installed', 'hu', '{{name}} plugin telepítve'),
  ('activity', 'plugin.installed', 'en', 'Plugin {{name}} installed');
```

If no translation exists, the `actionKey` value is shown as a fallback (e.g. `user.login`).

Seed file: `packages/database/src/seeds/sql/platform/translations_activity.sql`

## Context Interpolation

The `context` field is an optional JSON object whose values can be substituted into the translation template using `{{key}}` syntax.

```typescript
activityLogService.log({
  actionKey: 'plugin.installed',
  context: { name: 'chat-plugin', version: '2.1.0' }
});
```

Translation template: `"Plugin {{name}} installed (v{{version}})"`
Result: `"Plugin chat-plugin installed (v2.1.0)"`

## Data Model

### `platform.activity_logs` Table

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `uuid` | yes | Auto-generated unique identifier |
| `action_key` | `varchar(255)` | yes | Translation key (e.g. `user.login`) |
| `user_id` | `varchar(255)` | no | Affected user ID |
| `resource_type` | `varchar(100)` | no | Resource type (e.g. `plugin`, `user`) |
| `resource_id` | `varchar(255)` | no | Resource identifier |
| `context` | `jsonb` | no | Interpolation parameters |
| `created_at` | `timestamptz` | yes | Auto-generated timestamp |

### TypeScript Interfaces

```typescript
interface ActivityLogInput {
  actionKey: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  context?: Record<string, unknown>;
}

interface ActivityEntry {
  id: string;
  actionKey: string;
  translatedAction?: string; // Populated on query
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  context?: Record<string, unknown>;
  createdAt: string; // ISO 8601
}
```

## Adding a New Logging Point

1. Import the service:

```typescript
import { activityLogService } from '$lib/server/activity-log/service';
```

2. Call it after a successful operation:

```typescript
export const myCommand = command(schema, async (input) => {
  const result = await doSomething(input);

  if (result.success) {
    activityLogService.log({
      actionKey: 'resource.action',
      userId: String(locals.user.id),
      resourceType: 'resource',
      resourceId: String(result.id),
      context: { /* optional data */ }
    });
  }

  return result;
});
```

:::tip
Don't `await` the `log()` call if you don't want logging to slow down the response. The fire-and-forget semantics are intentional.
:::

## fetchActivityLogs Server Action

```typescript
import { fetchActivityLogs } from '$apps/log/activity-logs.remote';

const result = await fetchActivityLogs({
  page: 1,
  pageSize: 20,
  userId: '123',           // optional filter
  actionKey: 'user.login', // optional filter
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

if (result.success) {
  console.log(result.data);       // ActivityEntry[]
  console.log(result.pagination); // { page, pageSize, totalCount, totalPages }
}
```

**Required permission**: `log.activity.view`

## ActivityLogRepository

```typescript
import { activityLogRepository } from '$lib/server/activity-log/repository';

// Fetch entries
const entries = await activityLogRepository.findMany(
  { userId: '123', limit: 20, offset: 0 },
  'en' // locale for translations
);

// Count
const count = await activityLogRepository.count({ userId: '123' });

// Insert
await activityLogRepository.insert({
  actionKey: 'user.login',
  userId: '123'
});
```

## Existing Logging Points

| File | Action key | Event |
|---|---|---|
| `apps/users/users.remote.ts` | `user.group.added` | User added to group |
| `apps/users/users.remote.ts` | `user.group.removed` | User removed from group |
| `apps/users/users.remote.ts` | `user.role.assigned` | Role assigned |
| `apps/users/users.remote.ts` | `user.role.removed` | Role removed |
| `apps/users/users.remote.ts` | `user.activated` | User activated |
| `apps/users/users.remote.ts` | `user.deactivated` | User deactivated |
| `apps/settings/profile.remote.ts` | `user.profile.updated` | Profile updated |
| `apps/plugin-manager/plugins.remote.ts` | `plugin.uninstalled` | Plugin uninstalled |
| `routes/api/plugins/upload/+server.ts` | `plugin.installed` | Plugin installed |
| `apps/users/roles.remote.ts` | `role.created` | Role created |
| `apps/users/roles.remote.ts` | `role.deleted` | Role deleted |
| `apps/users/roles.remote.ts` | `role.permission.added` | Permission added |
| `apps/users/roles.remote.ts` | `role.permission.removed` | Permission removed |

## Testing

```bash
# Run from apps/web directory
bun test src/lib/server/activity-log
```
