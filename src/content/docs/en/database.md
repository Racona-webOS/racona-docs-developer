
---
title: Database
description: Drizzle ORM usage, schema structure, migrations, repository pattern, and database operations
---

## Overview

Racona uses PostgreSQL with [Drizzle ORM](https://orm.drizzle.team). The schema lives in the `packages/database` package, and repositories are located in `apps/web/src/lib/server/database/repositories/`.

## Schema Structure

```
packages/database/src/schemas/
├── auth/                    # better-auth tables
│   ├── users/               # Users
│   ├── authentication/      # Sessions, tokens
│   ├── groups/              # Groups
│   ├── roles/               # Roles
│   ├── permissions/         # Permissions
│   └── audit/               # Audit log
└── platform/                # Platform tables
    ├── apps/                # Application registration
    ├── chat/                # Chat messages
    ├── desktop/             # Desktop configuration
    ├── i18n/                # Translations
    ├── logging/             # System log
    ├── notifications/       # Notifications
    ├── plugins/             # Plugin metadata
    ├── settings/            # User settings
    └── files/               # File metadata
```

## Importing

```typescript
import { db, schema } from '@elyos/database';
```

## Drizzle ORM Basics

### Querying

```typescript
import { db, schema } from '@elyos/database';
import { eq, and, like, desc, asc } from 'drizzle-orm';

// All records
const users = await db.select().from(schema.users);

// With filter
const activeUsers = await db
  .select()
  .from(schema.users)
  .where(eq(schema.users.isActive, true));

// Multiple conditions
const result = await db
  .select()
  .from(schema.users)
  .where(
    and(
      eq(schema.users.isActive, true),
      like(schema.users.name, '%admin%')
    )
  )
  .orderBy(desc(schema.users.createdAt))
  .limit(20)
  .offset(0);

// Single record
const user = await db
  .select()
  .from(schema.users)
  .where(eq(schema.users.id, userId))
  .then(rows => rows[0] ?? null);
```

### Inserting

```typescript
const [newUser] = await db
  .insert(schema.users)
  .values({
    name: 'Test User',
    email: 'test@example.com',
    isActive: true
  })
  .returning();
```

### Updating

```typescript
const [updated] = await db
  .update(schema.users)
  .set({ name: 'New Name', updatedAt: new Date() })
  .where(eq(schema.users.id, userId))
  .returning();
```

### Deleting

```typescript
await db
  .delete(schema.users)
  .where(eq(schema.users.id, userId));
```

### JOIN

```typescript
const usersWithGroups = await db
  .select({
    userId: schema.users.id,
    userName: schema.users.name,
    groupName: schema.groups.name
  })
  .from(schema.users)
  .leftJoin(
    schema.userGroups,
    eq(schema.users.id, schema.userGroups.userId)
  )
  .leftJoin(
    schema.groups,
    eq(schema.userGroups.groupId, schema.groups.id)
  );
```

## Repository Pattern

Database operations are organized in repository classes. Each repository contains CRUD operations and business logic for a specific entity.

```typescript
// src/lib/server/database/repositories/user-repository.ts
import { db, schema } from '@elyos/database';
import { eq, and, like, desc, count } from 'drizzle-orm';

export class UserRepository {
  async findById(id: number) {
    return db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .then(rows => rows[0] ?? null);
  }

  async findManyPaginated(params: {
    limit: number;
    offset: number;
    search?: string;
  }) {
    const conditions = [];

    if (params.search) {
      conditions.push(like(schema.users.name, `%${params.search}%`));
    }

    return db
      .select()
      .from(schema.users)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.users.createdAt))
      .limit(params.limit)
      .offset(params.offset);
  }

  async countAll(params: { search?: string } = {}) {
    const conditions = [];

    if (params.search) {
      conditions.push(like(schema.users.name, `%${params.search}%`));
    }

    const [result] = await db
      .select({ count: count() })
      .from(schema.users)
      .where(conditions.length ? and(...conditions) : undefined);

    return result?.count ?? 0;
  }
}

// Singleton export
export const userRepository = new UserRepository();
```

### Importing Repositories

```typescript
import { userRepository } from '$lib/server/database/repositories';
```

### Available Repositories

| Export                    | Description                         |
| ------------------------- | ----------------------------------- |
| `userRepository`          | User management                     |
| `groupRepository`         | Group management                    |
| `roleRepository`          | Role management                     |
| `permissionRepository`    | Permission management               |
| `appRepository`           | Application registration            |
| `notificationRepository`  | Notifications                       |
| `translationRepository`   | Translations (i18n)                 |
| `themePresetsRepository`  | Theme presets                       |

## Defining Schemas

When adding a new table, work in the `packages/database/src/schemas/platform/` directory:

```typescript
// packages/database/src/schemas/platform/items/schema.ts
import { pgTable, serial, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  userId: integer('user_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
```

### Defining Relations

```typescript
// packages/database/src/schemas/platform/relations.ts
import { relations } from 'drizzle-orm';
import { items } from './items/schema';
import { users } from '../auth/users/schema';

export const itemsRelations = relations(items, ({ one }) => ({
  user: one(users, {
    fields: [items.userId],
    references: [users.id]
  })
}));
```

## Migrations

Always generate a migration after schema changes:

```bash
# Generate migration
bun db:generate

# Run migration
bun db:migrate

# Visual inspection
bun db:studio
```

:::caution
Never manually edit generated migration files. If a migration is incorrect, delete it and regenerate.
:::

## Seed Data

Seed data populates the database with initial data — default users, roles, applications, translations, etc. The Racona seed system is **idempotent** (safe to run multiple times) and **dependency-based** (automatic ordering).

### Seed Structure

```
packages/database/src/seeds/
├── config.ts              # Seed definitions and dependencies
├── runner.ts              # Seed execution logic
├── init-db.ts             # Full database initialization
├── reset.ts               # Full database reset (Docker)
├── demo-reset.ts          # Demo environment reset
├── sql/                   # SQL seed files
│   ├── auth/              # Auth schema seeds
│   │   ├── users.sql
│   │   ├── roles.sql
│   │   ├── groups.sql
│   │   ├── permissions.sql
│   │   └── ...
│   └── platform/          # Platform schema seeds
│       ├── apps.sql
│       ├── locales.sql
│       ├── translations_*.sql
│       └── ...
└── procedures/            # Stored procedures
    └── auth/
        ├── getGroups.sql
        └── ...
```

### Seed Configuration System

The `config.ts` file defines all seeds and their dependencies:

```typescript
export const seedConfig: Record<string, SeedDefinition> = {
  // No dependencies
  roles: {
    file: 'auth/roles.sql',
    dependsOn: [],
    description: 'User roles'
  },

  // Depends on roles seed
  role_permissions: {
    file: 'auth/role_permissions.sql',
    dependsOn: ['roles', 'permissions'],
    description: 'Role-permission assignments'
  }
};
```

The seed runner automatically performs **topological sorting**, ensuring dependencies run in the correct order.

### Seed Commands

```bash
# Full database initialization (schema + migration + seed)
bun db:init

# Run seeds only (idempotent, no truncate)
bun db:seed

# Full reset (truncate + seed)
bun db:reset

# Run only specific seeds (no truncate)
bun db:seed --no-truncate --only=users,roles,apps

# Run only specific procedures
bun db:seed --no-truncate --only-procedures=get_groups,get_groups_2
```

:::tip[Advanced Usage]
The `runner.ts` can be run directly with parameters:

```bash
# Seeds only, no truncate
bun --env-file=.env packages/database/src/seeds/runner.ts --no-truncate

# Only specific seeds
bun --env-file=.env packages/database/src/seeds/runner.ts --no-truncate --only=users,roles

# Only procedures
bun --env-file=.env packages/database/src/seeds/runner.ts --no-truncate --only-procedures=get_groups
```
:::

### Idempotent Seeds (Upsert Logic)

Every seed file uses `ON CONFLICT DO UPDATE` logic, making it safe to run multiple times:

```sql
-- auth/roles.sql
INSERT INTO auth.roles (id, name, description) VALUES
  (1, '{"hu": "Rendszergazda", "en": "System Administrator"}',
      '{"hu": "Korlátlan jogosultsággal rendelkező szerep", "en": "Role with unlimited privileges"}'),
  (2, '{"hu": "Adminisztrátor", "en": "Administrator"}',
      '{"hu": "Adminisztrációs feladatok elvégzésére jogosult szerep", "en": "Role authorized for administrative tasks"}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Update sequence based on max id
SELECT setval('auth.roles_id_seq', (SELECT COALESCE(MAX(id), 0) FROM auth.roles));
```

:::tip[Upsert Benefits]
- Safe to run multiple times
- Updates existing records
- No data duplication
- Ideal for development and CI/CD
:::

### Seed Categories

#### Auth Schema Seeds

| Seed                  | Description                               | Dependencies           |
| --------------------- | ----------------------------------------- | ---------------------- |
| `resources`           | Resource definitions (permission system)  | -                      |
| `providers`           | Auth providers (email, Google)            | -                      |
| `groups`              | User groups                               | -                      |
| `roles`               | Roles (admin, user, etc.)                 | -                      |
| `permissions`         | Permissions                               | `resources`            |
| `role_permissions`    | Role-permission assignments               | `roles`, `permissions` |
| `group_permissions`   | Group-permission assignments              | `groups`, `permissions`|
| `users`               | Initial users (admin)                     | -                      |
| `accounts`            | Auth accounts                             | `users`, `providers`   |
| `user_roles`          | User-role assignments                     | `users`, `roles`       |
| `user_groups`         | User-group assignments                    | `users`, `groups`      |
| `role_app_access`     | Role-app access                           | `apps`, `roles`        |
| `group_app_access`    | Group-app access                          | `apps`, `groups`       |

#### Platform Schema Seeds

| Seed                            | Description                             | Dependencies |
| ------------------------------- | --------------------------------------- | ------------ |
| `locales`                       | Supported languages (hu, en)            | -            |
| `translations_common`           | Common translations (buttons, statuses) | `locales`    |
| `translations_settings`         | Settings app translations               | `locales`    |
| `translations_log`              | Log app translations                    | `locales`    |
| `translations_desktop`          | Desktop environment translations        | `locales`    |
| `translations_auth`             | Auth pages translations                 | `locales`    |
| `translations_user`             | Users app translations                  | `locales`    |
| `translations_notifications`    | Notification system translations        | `locales`    |
| `translations_plugin_manager`   | Plugin Manager translations             | `locales`    |
| `apps`                          | Application registration (metadata)     | -            |
| `email_templates`               | Email templates (HU/EN)                 | `locales`    |
| `theme_presets`                 | Theme presets                           | `locales`    |

### Default Admin User

The `users.sql` seed creates a system administrator user:

```sql
INSERT INTO auth.users (id, full_name, email, email_verified, username, image, user_settings, oauth_image) VALUES
  (1, 'Racona admin', 'youradminemail@yourdomain.com', true, null, null, '{}', null)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email_verified = EXCLUDED.email_verified;
```

The admin email can be **overridden at runtime** via the `ADMIN_USER_EMAIL` environment variable:

```bash
# .env
ADMIN_USER_EMAIL=admin@example.com
```

The seed runner automatically updates the admin user's email:

```typescript
// runner.ts
async function applyAdminEmail() {
  const adminEmail = process.env.ADMIN_USER_EMAIL?.trim();
  if (!adminEmail) return;

  await pool.query(
    `UPDATE auth.users SET email = $1 WHERE id = (SELECT id FROM auth.users ORDER BY id ASC LIMIT 1)`,
    [adminEmail]
  );
}
```

:::note[Default Password]
The admin user's default password is: `Admin123.`

Change it immediately after first login in **Settings → Security**.
:::

### Adding a New Seed

1. **Create the SQL file:**

```sql
-- packages/database/src/seeds/sql/platform/my_data.sql
INSERT INTO platform.my_table (id, name, value) VALUES
  (1, 'Item 1', 'Value 1'),
  (2, 'Item 2', 'Value 2')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  value = EXCLUDED.value;

SELECT setval('platform.my_table_id_seq', (SELECT COALESCE(MAX(id), 0) FROM platform.my_table));
```

2. **Register in `config.ts`:**

```typescript
export const seedConfig: Record<string, SeedDefinition> = {
  // ... existing seeds

  my_data: {
    file: 'platform/my_data.sql',
    dependsOn: ['locales'],
    description: 'My custom data'
  }
};
```

3. **Update truncate order (if needed):**

```typescript
export const truncateOrder = [
  // ... existing tables
  'platform.my_table',
];
```

4. **Run the seed:**

```bash
bun db:seed
```

### Stored Procedures

The seed system also supports creating stored procedures:

```typescript
// config.ts
export const procedureConfig: Record<string, ProcedureDefinition> = {
  get_groups: {
    file: 'auth/getGroups.sql',
    description: 'Get groups by ID'
  }
};
```

```sql
-- procedures/auth/getGroups.sql
CREATE OR REPLACE FUNCTION auth.get_groups(group_ids INTEGER[])
RETURNS TABLE (
  id INTEGER,
  name JSONB,
  description JSONB
) AS $
BEGIN
  RETURN QUERY
  SELECT g.id, g.name, g.description
  FROM auth.groups g
  WHERE g.id = ANY(group_ids);
END;
$ LANGUAGE plpgsql;
```

### Docker Initialization

Docker Compose automatically runs seeds in the `db-init` container:

```yaml
db-init:
  command: >
    sh -c 'bun --filter @elyos/database db:init ${RESET:+-- --reset}'
  depends_on:
    postgres:
      condition: service_healthy
```

**Normal startup (idempotent):**

```bash
bun docker:up
```

**Full reset (truncate + seed):**

```bash
RESET=1 bun docker:up
```

### Seed Execution Process

The `db:init` command performs these steps:

1. **Check PostgreSQL availability** — health check
2. **Create schemas** — `auth`, `platform`, `extensions`
3. **Enable PostgreSQL extensions** — `postgres-json-schema`
4. **Run Drizzle migrations** — apply schema
5. **Run seeds** — in dependency order
6. **Create stored procedures** — if any
7. **Update admin email** — if `ADMIN_USER_EMAIL` is set

### Best Practices

1. **Always use upsert logic** — `ON CONFLICT DO UPDATE`
2. **Update sequences** — `SELECT setval(...)`
3. **Define dependencies** — in the `dependsOn` array
4. **Use descriptive names** — `description` field
5. **Test idempotency** — run multiple times
6. **Document data** — with SQL comments
7. **Use JSONB for multilingual data** — `{"hu": "...", "en": "..."}`

### Troubleshooting

**Problem:** Seed error — `duplicate key value violates unique constraint`

**Solution:** Verify the `ON CONFLICT` clause is properly configured.

---

**Problem:** Sequence not updating — auto-increment conflicts

**Solution:** Add sequence update at the end of the seed:

```sql
SELECT setval('schema.table_id_seq', (SELECT COALESCE(MAX(id), 0) FROM schema.table));
```

---

**Problem:** Dependency error — seed not running in correct order

**Solution:** Check the `dependsOn` array in `config.ts`.

## Transactions

```typescript
await db.transaction(async (tx) => {
  const [user] = await tx
    .insert(schema.users)
    .values({ name: 'New User', email: 'new@example.com' })
    .returning();

  await tx
    .insert(schema.userGroups)
    .values({ userId: user.id, groupId: defaultGroupId });
});
```

## Database Connection Health Check

```typescript
import { ensureDatabaseHealth } from '$lib/server/database/health';

// Check if database is accessible
await ensureDatabaseHealth();
```

## Pagination

```typescript
import { validatePaginationParams } from '$lib/server/utils/database';

const { page, limit, offset } = validatePaginationParams(
  input.page,    // requested page (1-based)
  input.pageSize // page size
);
```
