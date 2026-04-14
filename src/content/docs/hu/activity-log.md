---
title: Aktivitás napló
description: Felhasználói és rendszerszintű műveletek naplózása a Rocona rendszerben
---

Az aktivitás napló funkció naplózza a felhasználói és rendszerszintű műveleteket. A bejegyzések a `platform.activity_logs` adatbázis táblában tárolódnak, és a Napló alkalmazásban tekinthetők meg.

## Gyors kezdés

```typescript
import { activityLogService } from '$lib/server/activity-log/service';

// Minimális hívás
await activityLogService.log({ actionKey: 'user.login' });

// Teljes hívás
await activityLogService.log({
  actionKey: 'plugin.installed',
  userId: String(locals.user.id),
  resourceType: 'plugin',
  resourceId: pluginId,
  context: { name: 'my-plugin', version: '1.0.0' }
});
```

A `log()` metódus **fire-and-forget**: nem dob kivételt, nem blokkolja az üzleti logikát. Hiba esetén csak `console.error`-t ír.

## Env konfiguráció

```env
# Aktivitás napló be/kikapcsolása (alapértelmezett: true)
ACTIVITY_LOG_ENABLED=true
```

Ha `false`, az összes `activityLogService.log()` hívás azonnal visszatér, semmi sem kerül az adatbázisba.

## Fájlstruktúra

```
apps/web/src/
├── lib/server/activity-log/
│   ├── service.ts          # ActivityLogService + singleton
│   ├── repository.ts       # ActivityLogRepository (findMany, count, insert)
│   ├── types.ts            # ActivityEntry, ActivityLogInput, ActivityLogFilters
│   └── interpolate.ts      # {{kulcs}} → érték helyettesítés
└── apps/log/
    ├── activity-logs.remote.ts          # fetchActivityLogs szerver akció
    └── components/
        ├── ActivityLog.svelte           # Táblázatos megjelenítő komponens
        └── activityLogColumns.ts        # Oszlopdefiníciók
```

## Action key konvenciók

Az `actionKey` egy fordítási kulcs, amelyet a `platform.translations` táblában az `activity` névtérben kell tárolni.

### Névkonvenció

```
{erőforrás}.{művelet}
```

### Beépített action key-ek

| actionKey | Leírás |
|---|---|
| `user.login` | Felhasználó bejelentkezett |
| `user.logout` | Felhasználó kijelentkezett |
| `user.profile.updated` | Profil frissítve |
| `user.activated` | Felhasználó aktiválva |
| `user.deactivated` | Felhasználó deaktiválva |
| `user.group.added` | Felhasználó csoporthoz adva |
| `user.group.removed` | Felhasználó csoportból eltávolítva |
| `user.role.assigned` | Szerepkör hozzárendelve |
| `user.role.removed` | Szerepkör eltávolítva |
| `role.created` | Szerepkör létrehozva |
| `role.deleted` | Szerepkör törölve |
| `role.permission.added` | Jogosultság hozzáadva szerepkörhöz |
| `role.permission.removed` | Jogosultság eltávolítva szerepkörtől |
| `plugin.installed` | Plugin telepítve |
| `plugin.uninstalled` | Plugin eltávolítva |

## Fordítások hozzáadása

A fordításokat a `platform.translations` táblába kell felvenni az `activity` névtérben:

```sql
INSERT INTO platform.translations (namespace, key, locale, value) VALUES
  ('activity', 'user.login', 'hu', 'Bejelentkezés'),
  ('activity', 'user.login', 'en', 'Login'),
  ('activity', 'plugin.installed', 'hu', '{{name}} plugin telepítve'),
  ('activity', 'plugin.installed', 'en', 'Plugin {{name}} installed');
```

Ha nincs fordítás, az `actionKey` értéke jelenik meg tartalékként (pl. `user.login`).

A seed fájl: `packages/database/src/seeds/sql/platform/translations_activity.sql`

## Kontextus interpoláció

A `context` mező opcionális JSON objektum, amelynek értékei behelyettesíthetők a fordítási sablonba `{{kulcs}}` szintaxissal.

```typescript
activityLogService.log({
  actionKey: 'plugin.installed',
  context: { name: 'chat-plugin', version: '2.1.0' }
});
```

Fordítási sablon: `"{{name}} plugin telepítve (v{{version}})"`
Eredmény: `"chat-plugin plugin telepítve (v2.1.0)"`

## Adatmodell

### `platform.activity_logs` tábla

| Mező | Típus | Kötelező | Leírás |
|---|---|---|---|
| `id` | `uuid` | igen | Auto-generált egyedi azonosító |
| `action_key` | `varchar(255)` | igen | Fordítási kulcs (pl. `user.login`) |
| `user_id` | `varchar(255)` | nem | Érintett felhasználó azonosítója |
| `resource_type` | `varchar(100)` | nem | Erőforrás típusa (pl. `plugin`, `user`) |
| `resource_id` | `varchar(255)` | nem | Erőforrás azonosítója |
| `context` | `jsonb` | nem | Interpolációs paraméterek |
| `created_at` | `timestamptz` | igen | Auto-generált időbélyeg |

### TypeScript interfészek

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
  translatedAction?: string; // Lekérdezéskor töltődik ki
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  context?: Record<string, unknown>;
  createdAt: string; // ISO 8601
}
```

## Új naplózási pont hozzáadása

1. Importáld a service-t:

```typescript
import { activityLogService } from '$lib/server/activity-log/service';
```

2. Hívd meg a sikeres művelet után:

```typescript
export const myCommand = command(schema, async (input) => {
  const result = await doSomething(input);

  if (result.success) {
    activityLogService.log({
      actionKey: 'resource.action',
      userId: String(locals.user.id),
      resourceType: 'resource',
      resourceId: String(result.id),
      context: { /* opcionális adatok */ }
    });
  }

  return result;
});
```

:::tip
Ne tegyél `await`-et a `log()` hívás elé, ha nem akarod, hogy a naplózás lassítsa a választ. A fire-and-forget szemantika szándékos.
:::

## fetchActivityLogs szerver akció

```typescript
import { fetchActivityLogs } from '$apps/log/activity-logs.remote';

const result = await fetchActivityLogs({
  page: 1,
  pageSize: 20,
  userId: '123',        // opcionális szűrő
  actionKey: 'user.login', // opcionális szűrő
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

if (result.success) {
  console.log(result.data);       // ActivityEntry[]
  console.log(result.pagination); // { page, pageSize, totalCount, totalPages }
}
```

**Jogosultság**: `log.activity.view` szükséges.

## ActivityLogRepository

```typescript
import { activityLogRepository } from '$lib/server/activity-log/repository';

// Bejegyzések lekérése
const entries = await activityLogRepository.findMany(
  { userId: '123', limit: 20, offset: 0 },
  'hu' // locale a fordításhoz
);

// Darabszám
const count = await activityLogRepository.count({ userId: '123' });

// Mentés
await activityLogRepository.insert({
  actionKey: 'user.login',
  userId: '123'
});
```

## Meglévő naplózási pontok

| Fájl | Action key | Esemény |
|---|---|---|
| `apps/users/users.remote.ts` | `user.group.added` | Felhasználó csoporthoz adva |
| `apps/users/users.remote.ts` | `user.group.removed` | Felhasználó csoportból eltávolítva |
| `apps/users/users.remote.ts` | `user.role.assigned` | Szerepkör hozzárendelve |
| `apps/users/users.remote.ts` | `user.role.removed` | Szerepkör eltávolítva |
| `apps/users/users.remote.ts` | `user.activated` | Felhasználó aktiválva |
| `apps/users/users.remote.ts` | `user.deactivated` | Felhasználó deaktiválva |
| `apps/settings/profile.remote.ts` | `user.profile.updated` | Profil frissítve |
| `apps/plugin-manager/plugins.remote.ts` | `plugin.uninstalled` | Plugin eltávolítva |
| `routes/api/plugins/upload/+server.ts` | `plugin.installed` | Plugin telepítve |
| `apps/users/roles.remote.ts` | `role.created` | Szerepkör létrehozva |
| `apps/users/roles.remote.ts` | `role.deleted` | Szerepkör törölve |
| `apps/users/roles.remote.ts` | `role.permission.added` | Jogosultság hozzáadva |
| `apps/users/roles.remote.ts` | `role.permission.removed` | Jogosultság eltávolítva |

## Tesztelés

```bash
# Futtatás az apps/web könyvtárból
bun test src/lib/server/activity-log
```
