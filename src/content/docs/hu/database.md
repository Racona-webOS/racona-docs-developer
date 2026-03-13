---
title: Adatbázis
description: Drizzle ORM használata, séma struktúra, migrációk, repository minta és adatbázis műveletek
---

## Áttekintés

Az ElyOS PostgreSQL adatbázist használ [Drizzle ORM](https://orm.drizzle.team)-mel. A séma a `packages/database` csomagban él, a repository-k az `apps/web/src/lib/server/database/repositories/` mappában.

## Séma struktúra

```
packages/database/src/schemas/
├── auth/                    # better-auth táblák
│   ├── users/               # Felhasználók
│   ├── authentication/      # Munkamenetek, tokenek
│   ├── groups/              # Csoportok
│   ├── roles/               # Szerepkörök
│   ├── permissions/         # Jogosultságok
│   └── audit/               # Audit napló
└── platform/                # Platform táblák
    ├── apps/                # Alkalmazás regisztráció
    ├── chat/                # Chat üzenetek
    ├── desktop/             # Asztali konfiguráció
    ├── i18n/                # Fordítások
    ├── logging/             # Rendszernapló
    ├── notifications/       # Értesítések
    ├── plugins/             # Plugin metaadatok
    ├── settings/            # Felhasználói beállítások
    └── files/               # Fájl metaadatok
```

## Importálás

```typescript
import { db, schema } from '@elyos/database';
```

## Drizzle ORM alapok

### Lekérdezés

```typescript
import { db, schema } from '@elyos/database';
import { eq, and, like, desc, asc } from 'drizzle-orm';

// Összes rekord
const users = await db.select().from(schema.users);

// Szűréssel
const activeUsers = await db
  .select()
  .from(schema.users)
  .where(eq(schema.users.isActive, true));

// Több feltétel
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

// Egy rekord
const user = await db
  .select()
  .from(schema.users)
  .where(eq(schema.users.id, userId))
  .then(rows => rows[0] ?? null);
```

### Beszúrás

```typescript
const [newUser] = await db
  .insert(schema.users)
  .values({
    name: 'Teszt Felhasználó',
    email: 'teszt@example.com',
    isActive: true
  })
  .returning();
```

### Frissítés

```typescript
const [updated] = await db
  .update(schema.users)
  .set({ name: 'Új Név', updatedAt: new Date() })
  .where(eq(schema.users.id, userId))
  .returning();
```

### Törlés

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

## Repository minta

Az adatbázis műveletek repository osztályokban vannak szervezve. Minden repository egy adott entitáshoz tartozó CRUD és üzleti logikát tartalmaz.

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

### Repository importálása

```typescript
import { userRepository } from '$lib/server/database/repositories';
```

### Elérhető repository-k

| Export                    | Leírás                              |
| ------------------------- | ----------------------------------- |
| `userRepository`          | Felhasználók kezelése               |
| `groupRepository`         | Csoportok kezelése                  |
| `roleRepository`          | Szerepkörök kezelése                |
| `permissionRepository`    | Jogosultságok kezelése              |
| `appRepository`           | Alkalmazás regisztráció             |
| `notificationRepository`  | Értesítések                         |
| `translationRepository`   | Fordítások (i18n)                   |
| `themePresetsRepository`  | Téma presetek                       |

## Séma definiálása

Új tábla hozzáadásakor a `packages/database/src/schemas/platform/` mappában kell dolgozni:

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

### Relációk definiálása

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

## Migrációk

Sémaváltozás után mindig generálj migrációt:

```bash
# Migráció generálása
bun db:generate

# Migráció futtatása
bun db:migrate

# Vizuális ellenőrzés
bun db:studio
```

:::caution
Soha ne módosítsd kézzel a generált migrációs fájlokat. Ha hibás migráció keletkezett, töröld és generáld újra.
:::

## Seed adatok

A seed adatok kezdeti adatokat töltenek be az adatbázisba — alapértelmezett felhasználók, szerepkörök, alkalmazások, fordítások stb. Az ElyOS seed rendszere **idempotens** (biztonságosan futtatható többször is) és **függőség-alapú** (automatikus sorrendezés).

### Seed struktúra

```
packages/database/src/seeds/
├── config.ts              # Seed definíciók és függőségek
├── runner.ts              # Seed futtatási logika
├── init-db.ts             # Teljes adatbázis inicializálás
├── reset.ts               # Teljes adatbázis reset (Docker)
├── demo-reset.ts          # Demo környezet reset
├── sql/                   # SQL seed fájlok
│   ├── auth/              # Auth séma seed-ek
│   │   ├── users.sql
│   │   ├── roles.sql
│   │   ├── groups.sql
│   │   ├── permissions.sql
│   │   └── ...
│   └── platform/          # Platform séma seed-ek
│       ├── apps.sql
│       ├── locales.sql
│       ├── translations_*.sql
│       └── ...
└── procedures/            # Stored procedure-ök
    └── auth/
        ├── getGroups.sql
        └── ...
```

### Seed konfigurációs rendszer

A `config.ts` fájl definiálja az összes seed-et és azok függőségeit:

```typescript
export const seedConfig: Record<string, SeedDefinition> = {
  // Nincs függőség
  roles: {
    file: 'auth/roles.sql',
    dependsOn: [],
    description: 'User roles'
  },

  // Függ a roles seed-től
  role_permissions: {
    file: 'auth/role_permissions.sql',
    dependsOn: ['roles', 'permissions'],
    description: 'Role-permission assignments'
  }
};
```

A seed runner automatikusan **topológiai rendezést** végez, így a függőségek mindig a megfelelő sorrendben futnak.

### Seed parancsok

```bash
# Teljes adatbázis inicializálás (séma + migráció + seed)
bun db:init

# Csak seed-ek futtatása (idempotens, nem truncate-el)
bun db:seed

# Teljes reset (truncate + seed)
bun db:reset

# Csak bizonyos seed-ek futtatása (truncate nélkül)
bun db:seed --no-truncate --only=users,roles,apps

# Csak bizonyos procedure-ök futtatása
bun db:seed --no-truncate --only-procedures=get_groups,get_groups_2
```

:::tip[Haladó használat]
A `runner.ts` közvetlenül is futtatható paraméterekkel:

```bash
# Csak seed-ek, truncate nélkül
bun --env-file=.env packages/database/src/seeds/runner.ts --no-truncate

# Csak bizonyos seed-ek
bun --env-file=.env packages/database/src/seeds/runner.ts --no-truncate --only=users,roles

# Csak procedure-ök
bun --env-file=.env packages/database/src/seeds/runner.ts --no-truncate --only-procedures=get_groups
```
:::

### Idempotens seed-ek (upsert logika)

Minden seed fájl `ON CONFLICT DO UPDATE` logikát használ, így biztonságosan futtatható többször is:

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

-- Szekvencia frissítése a legnagyobb id alapján
SELECT setval('auth.roles_id_seq', (SELECT COALESCE(MAX(id), 0) FROM auth.roles));
```

:::tip[Upsert előnyei]
- Biztonságosan futtatható többször
- Frissíti a meglévő rekordokat
- Nem duplikál adatokat
- Ideális fejlesztéshez és CI/CD-hez
:::

### Seed kategóriák

#### Auth séma seed-ek

| Seed                  | Leírás                                    | Függőségek                |
| --------------------- | ----------------------------------------- | ------------------------- |
| `resources`           | Erőforrás definíciók (permission system)  | -                         |
| `providers`           | Auth provider-ek (email, Google)          | -                         |
| `groups`              | Felhasználói csoportok                    | -                         |
| `roles`               | Szerepkörök (admin, user, stb.)           | -                         |
| `permissions`         | Jogosultságok                             | `resources`               |
| `role_permissions`    | Szerepkör-jogosultság hozzárendelések     | `roles`, `permissions`    |
| `group_permissions`   | Csoport-jogosultság hozzárendelések       | `groups`, `permissions`   |
| `users`               | Kezdeti felhasználók (admin)              | -                         |
| `accounts`            | Auth fiókok                               | `users`, `providers`      |
| `user_roles`          | Felhasználó-szerepkör hozzárendelések     | `users`, `roles`          |
| `user_groups`         | Felhasználó-csoport hozzárendelések       | `users`, `groups`         |
| `role_app_access`     | Szerepkör-alkalmazás hozzáférés           | `apps`, `roles`           |
| `group_app_access`    | Csoport-alkalmazás hozzáférés             | `apps`, `groups`          |

#### Platform séma seed-ek

| Seed                            | Leírás                                    | Függőségek  |
| ------------------------------- | ----------------------------------------- | ----------- |
| `locales`                       | Támogatott nyelvek (hu, en)               | -           |
| `translations_common`           | Közös fordítások (gombok, státuszok)      | `locales`   |
| `translations_settings`         | Beállítások app fordítások                | `locales`   |
| `translations_log`              | Napló app fordítások                      | `locales`   |
| `translations_desktop`          | Desktop környezet fordítások              | `locales`   |
| `translations_auth`             | Auth oldalak fordítások                   | `locales`   |
| `translations_user`             | Felhasználók app fordítások               | `locales`   |
| `translations_notifications`    | Értesítési rendszer fordítások            | `locales`   |
| `translations_plugin_manager`   | Plugin Manager fordítások                 | `locales`   |
| `apps`                          | Alkalmazás regisztráció (metadata)        | -           |
| `email_templates`               | Email sablonok (HU/EN)                    | `locales`   |
| `theme_presets`                 | Téma presetek                             | `locales`   |

### Alapértelmezett admin felhasználó

A `users.sql` seed létrehoz egy rendszergazda felhasználót:

```sql
INSERT INTO auth.users (id, full_name, email, email_verified, username, image, user_settings, oauth_image) VALUES
  (1, 'ElyOS admin', 'youradminemail@eyoursomain.com', true, null, null, '{}', null)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email_verified = EXCLUDED.email_verified;
```

Az admin email cím **futásidőben felülírható** a `ADMIN_USER_EMAIL` környezeti változóval:

```bash
# .env
ADMIN_USER_EMAIL=admin@example.com
```

A seed runner automatikusan frissíti az admin user email címét:

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

:::note[Alapértelmezett jelszó]
Az admin felhasználó alapértelmezett jelszava: `Admin123.`

Az első bejelentkezés után azonnal változtasd meg a **Beállítások → Biztonság** menüpontban.
:::

### Új seed hozzáadása

1. **Hozd létre az SQL fájlt:**

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

2. **Regisztráld a `config.ts` fájlban:**

```typescript
export const seedConfig: Record<string, SeedDefinition> = {
  // ... meglévő seed-ek

  my_data: {
    file: 'platform/my_data.sql',
    dependsOn: ['locales'], // ha van függőség
    description: 'My custom data'
  }
};
```

3. **Frissítsd a truncate sorrendet (ha szükséges):**

```typescript
export const truncateOrder = [
  // ... meglévő táblák
  'platform.my_table',
  // ...
];
```

4. **Futtasd a seed-et:**

```bash
bun db:seed
```

### Stored procedure-ök

A seed rendszer támogatja stored procedure-ök létrehozását is:

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
) AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.name, g.description
  FROM auth.groups g
  WHERE g.id = ANY(group_ids);
END;
$$ LANGUAGE plpgsql;
```

### Docker inicializálás

A Docker Compose automatikusan futtatja a seed-eket a `db-init` konténerben:

```yaml
db-init:
  command: >
    sh -c 'bun --filter @elyos/database db:init ${RESET:+-- --reset}'
  depends_on:
    postgres:
      condition: service_healthy
```

**Normál indítás (idempotens):**

```bash
bun docker:up
```

**Teljes reset (truncate + seed):**

```bash
RESET=1 bun docker:up
```

### Seed futtatási folyamat

A `db:init` parancs a következő lépéseket hajtja végre:

1. **PostgreSQL elérhetőség ellenőrzése** — health check
2. **Sémák létrehozása** — `auth`, `platform`, `extensions`
3. **PostgreSQL extensionök engedélyezése** — `postgres-json-schema`
4. **Drizzle migrációk futtatása** — séma alkalmazása
5. **Seed-ek futtatása** — függőségi sorrendben
6. **Stored procedure-ök létrehozása** — ha vannak
7. **Admin email frissítése** — ha `ADMIN_USER_EMAIL` meg van adva

```bash
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        Database Initialization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔌 Connecting to PostgreSQL...
   ✓ PostgreSQL is ready

🏗️  Creating database schemas...
   ✓ Schema "auth" ready
   ✓ Schema "platform" ready
   ✓ Schema "extensions" ready

🔌 Enabling PostgreSQL extensions...
   ✓ Extension "postgres-json-schema" enabled

📦 Applying database schema...
   ✓ Migrations completed

🌱 Seeding database...
   ✓ resources - Resource definitions
   ✓ providers - Authentication providers
   ✓ groups - User groups
   ✓ roles - User roles
   ✓ permissions - Permissions linked to resources
   ✓ users - Initial users
   ✓ locales - Supported locales
   ✓ apps - Application registry
   ... (további seed-ek)

⚙️  Creating stored procedures...
   ✓ get_groups - Get groups by ID

👤 Admin email beállítása: admin@example.com
   ✓ Admin user email frissítve

🎉 Database initialization completed successfully!
```

### Best practice-ek

1. **Mindig használj upsert logikát** — `ON CONFLICT DO UPDATE`
2. **Frissítsd a szekvenciákat** — `SELECT setval(...)`
3. **Definiálj függőségeket** — a `dependsOn` tömbben
4. **Használj leíró neveket** — `description` mező
5. **Tesztelj idempotenciát** — futtasd többször is
6. **Dokumentáld az adatokat** — SQL kommentekkel
7. **Használj JSONB-t többnyelvű adatokhoz** — `{"hu": "...", "en": "..."}`

### Troubleshooting

**Probléma:** Seed hiba — `duplicate key value violates unique constraint`

**Megoldás:** Ellenőrizd, hogy az `ON CONFLICT` klauzula megfelelően van-e beállítva.

---

**Probléma:** Szekvencia nem frissül — az auto-increment ütközik

**Megoldás:** Add hozzá a szekvencia frissítést a seed végére:

```sql
SELECT setval('schema.table_id_seq', (SELECT COALESCE(MAX(id), 0) FROM schema.table));
```

---

**Probléma:** Függőségi hiba — seed nem fut le a megfelelő sorrendben

**Megoldás:** Ellenőrizd a `dependsOn` tömböt a `config.ts` fájlban.

## Tranzakciók

```typescript
await db.transaction(async (tx) => {
  const [user] = await tx
    .insert(schema.users)
    .values({ name: 'Új Felhasználó', email: 'uj@example.com' })
    .returning();

  await tx
    .insert(schema.userGroups)
    .values({ userId: user.id, groupId: defaultGroupId });
});
```

## Adatbázis-kapcsolat ellenőrzése

```typescript
import { ensureDatabaseHealth } from '$lib/server/database/health';

// Ellenőrzi, hogy az adatbázis elérhető-e
await ensureDatabaseHealth();
```

## Lapozás (paginálás)

```typescript
import { validatePaginationParams } from '$lib/server/utils/database';

const { page, limit, offset } = validatePaginationParams(
  input.page,    // kért oldal (1-től)
  input.pageSize // oldal méret
);
```
