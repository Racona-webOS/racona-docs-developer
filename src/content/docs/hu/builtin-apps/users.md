---
title: Felhasználók alkalmazás
description: Felhasználók alkalmazás fejlesztői dokumentáció - felhasználók, csoportok, szerepkörök és jogosultságok kezelése
---

A Felhasználók alkalmazás a Rocona központi felhasználó- és jogosultságkezelő rendszere. Admin jogosultsággal rendelkező felhasználók itt kezelhetik a felhasználókat, csoportokat, szerepköröket, jogosultságokat és erőforrásokat.

## Áttekintés

**Hely:** `apps/web/src/apps/users/`

**Jellemzők:**
- Hierarchikus menü 5 fő szekcióval
- RBAC (Role-Based Access Control) rendszer
- Lapozható listák és részletes nézetek
- Többnyelvű név és leírás mezők (JSONB)
- Jogosultság-alapú menü szűrés

**Hozzáférés:** Csak admin jogosultsággal rendelkező felhasználók

## Fájl struktúra

```
users/
├── index.svelte                    # App entry point
├── menu.json                       # Hierarchikus menü jogosultságokkal
├── icon.svg                        # App ikon
├── users.remote.ts                 # Felhasználó server action-ök
├── groups.remote.ts                # Csoport server action-ök
├── roles.remote.ts                 # Szerepkör server action-ök
├── permissions.remote.ts           # Jogosultság server action-ök
├── resources.remote.ts             # Erőforrás server action-ök
├── user-repository.test.ts         # Repository tesztek
└── components/                     # Lista és részlet komponensek
    ├── UserList.svelte             # Felhasználók listája
    ├── UserDetail.svelte           # Felhasználó részletei
    ├── GroupList.svelte            # Csoportok listája
    ├── GroupDetail.svelte          # Csoport részletei
    ├── RoleList.svelte             # Szerepkörök listája
    ├── RoleDetail.svelte           # Szerepkör részletei
    ├── PermissionList.svelte       # Jogosultságok listája
    ├── PermissionDetail.svelte     # Jogosultság részletei
    ├── ResourceList.svelte         # Erőforrások listája
    ├── ResourceDetail.svelte       # Erőforrás részletei
    └── *Columns.ts                 # Táblázat oszlop definíciók
```

## Menü struktúra

A `menu.json` jogosultság-alapú menüt definiál:

```json
[
  {
    "labelKey": "menu.users",
    "href": "#users",
    "icon": "Users",
    "component": "UserList",
    "requiredPermission": "users.users.view"
  },
  {
    "labelKey": "menu.accessManagement",
    "href": "#",
    "icon": "ShieldCheck",
    "children": [
      {
        "labelKey": "menu.groups",
        "href": "#groups",
        "icon": "UsersRound",
        "component": "GroupList",
        "requiredPermission": "users.groups.view"
      },
      {
        "labelKey": "menu.roles",
        "href": "#roles",
        "icon": "Crown",
        "component": "RoleList",
        "requiredPermission": "users.roles.view"
      }
    ]
  }
]
```

**Új mező:** `requiredPermission` — a menüpont csak akkor jelenik meg, ha a felhasználónak megvan a jogosultsága.

## RBAC rendszer

A Rocona egy teljes RBAC (Role-Based Access Control) rendszert implementál:

```
Felhasználó (User)
  ├─ Csoportok (Groups) — több csoporthoz tartozhat
  │   └─ Jogosultságok (Permissions)
  └─ Szerepkörök (Roles) — több szerepköre lehet
      └─ Jogosultságok (Permissions)

Jogosultság (Permission)
  └─ Erőforrás (Resource) — mire vonatkozik
      └─ Akció (action) — mit lehet vele csinálni
```

**Példa jogosultság:**
- Erőforrás: `users`
- Akció: `view`, `create`, `update`, `delete`
- Teljes jogosultság: `users.users.view`

## Server action-ök

### users.remote.ts

**fetchUsers** — Felhasználók listázása lapozással és szűréssel

```typescript
const fetchUsersSchema = v.object({
  page: v.optional(v.pipe(v.number(), v.minValue(1)), 1),
  pageSize: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
  sortBy: v.optional(v.string()),
  sortOrder: v.optional(v.picklist(['asc', 'desc'])),
  isActive: v.optional(v.boolean()),
  providerId: v.optional(v.array(v.string())),
  search: v.optional(v.string())
});

export const fetchUsers = command(fetchUsersSchema, async (input) => {
  const { page, limit, offset } = validatePaginationParams(input.page, input.pageSize);

  const [rows, totalCount] = await Promise.all([
    userRepository.findManyPaginated({ limit, offset, ...filterParams }),
    userRepository.countAll(filterParams)
  ]);

  return {
    success: true,
    data: rows,
    pagination: { page, pageSize: limit, totalCount, totalPages }
  };
});
```

**fetchUser** — Egy felhasználó részletes adatai csoportokkal és szerepkörökkel

**addUserToGroup** / **removeUserFromGroup** — Felhasználó hozzáadása/eltávolítása csoporthoz

**addUserToRole** / **removeUserFromRole** — Felhasználó hozzáadása/eltávolítása szerepkörhöz

**setUserActiveStatus** — Felhasználó aktív/inaktív állapotának beállítása

### groups.remote.ts

**createGroup** / **updateGroup** / **deleteGroup** — Csoport CRUD műveletek

```typescript
const createGroupSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  description: v.optional(v.string()),
  locale: v.pipe(v.string(), v.minLength(2))
});

export const createGroup = command(createGroupSchema, async (input) => {
  const nameObj: Record<string, string> = { [input.locale]: input.name };
  const descObj = input.description ? { [input.locale]: input.description } : undefined;

  const group = await groupRepository.create({ name: nameObj, description: descObj });
  return { success: true, data: group };
});
```

**fetchGroups** — Csoportok listázása lapozással

**fetchGroup** — Egy csoport részletes adatai

**fetchGroupUsers** — Csoport felhasználói lapozással

**fetchGroupPermissions** — Csoport jogosultságai lapozással

**fetchGroupApps** — Csoporthoz rendelt alkalmazások

**addUserToGroup** / **removeUserFromGroup** — Felhasználó kezelés

**addPermissionToGroup** / **removePermissionFromGroup** — Jogosultság kezelés

**addAppToGroup** / **removeAppFromGroup** — Alkalmazás hozzáférés kezelés

### roles.remote.ts

Hasonló struktúra mint a `groups.remote.ts`, de szerepkörökre:

- **createRole** / **updateRole** / **deleteRole**
- **fetchRoles** / **fetchRole**
- **fetchRoleUsers** / **fetchRolePermissions** / **fetchRoleApps**
- **addUserToRole** / **removeUserFromRole**
- **addPermissionToRole** / **removePermissionToRole**
- **addAppToRole** / **removeAppFromRole**

### permissions.remote.ts

Jogosultságok kezelése:

- **createPermission** / **updatePermission** / **deletePermission**
- **fetchPermissions** / **fetchPermission**

### resources.remote.ts

Erőforrások kezelése:

- **createResource** / **updateResource** / **deleteResource**
- **fetchResources** / **fetchResource**

## Komponensek

### Lista komponensek

Minden entitásnak van egy lista komponense, amely:
- Lapozható táblázatot jelenít meg
- Szűrési és rendezési lehetőségeket kínál
- Részletes nézetre navigál kattintásra
- Új elem létrehozása gomb

**Példa: UserList.svelte**

```svelte
<script lang="ts">
  import { DataTable } from '$lib/components/ui/data-table';
  import { fetchUsers } from '../users.remote';
  import { userListColumns } from './userListColumns';

  let users = $state([]);
  let pagination = $state({ page: 1, pageSize: 20, totalCount: 0 });

  async function loadUsers() {
    const result = await fetchUsers({ page: pagination.page, pageSize: pagination.pageSize });
    if (result.success) {
      users = result.data;
      pagination = result.pagination;
    }
  }

  $effect(() => {
    loadUsers();
  });
</script>

<DataTable
  data={users}
  columns={userListColumns}
  {pagination}
  onPageChange={(page) => { pagination.page = page; }}
/>
```

### Részlet komponensek

Minden entitásnak van egy részletes nézete, amely:
- Alapadatokat jelenít meg
- Kapcsolódó entitásokat listázza (pl. felhasználó csoportjai)
- Hozzáadás/eltávolítás műveleteket kínál
- Szerkesztés és törlés gombokat tartalmaz

**Példa: UserDetail.svelte**

```svelte
<script lang="ts">
  import { fetchUser, addUserToGroup, removeUserFromGroup } from '../users.remote';

  let { userId } = $props<{ userId: number }>();
  let user = $state(null);
  let groups = $state([]);

  async function loadUser() {
    const result = await fetchUser({ id: userId });
    if (result.success) {
      user = result.data;
      groups = result.data.groups;
    }
  }

  async function handleAddGroup(groupId: number) {
    const result = await addUserToGroup({ userId, groupId });
    if (result.success) {
      await loadUser();
      toast.success('Csoport hozzáadva');
    }
  }
</script>

<div class="user-detail">
  <h2>{user?.name}</h2>
  <p>{user?.email}</p>

  <h3>Csoportok</h3>
  <ul>
    {#each groups as group}
      <li>{group.name}</li>
    {/each}
  </ul>
</div>
```

### Táblázat oszlop definíciók

Minden listához tartozik egy `*Columns.ts` fájl, amely definiálja a táblázat oszlopait:

```typescript
// userListColumns.ts
import type { ColumnDef } from '@tanstack/table-core';
import type { UserListItem } from '$lib/server/database/repositories';

export const userListColumns: ColumnDef<UserListItem>[] = [
  {
    accessorKey: 'name',
    header: 'Név',
    cell: ({ row }) => row.original.name
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => row.original.email
  },
  {
    accessorKey: 'isActive',
    header: 'Aktív',
    cell: ({ row }) => (row.original.isActive ? 'Igen' : 'Nem')
  },
  {
    accessorKey: 'createdAt',
    header: 'Létrehozva',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
  }
];
```

## Többnyelvű mezők

A csoportok, szerepkörök, jogosultságok és erőforrások neve és leírása többnyelvű (JSONB):

```typescript
// Csoport létrehozása magyar névvel
await createGroup({
  name: 'Adminisztrátorok',
  description: 'Rendszergazdák csoportja',
  locale: 'hu'
});

// Adatbázisban:
{
  name: { "hu": "Adminisztrátorok", "en": "Administrators" },
  description: { "hu": "Rendszergazdák csoportja", "en": "System administrators group" }
}
```

**Megjelenítés:**

```svelte
<script>
  import { useI18n } from '$lib/i18n/hooks';
  const { locale } = useI18n();

  let group = $state({ name: { hu: 'Adminisztrátorok', en: 'Administrators' } });
  const displayName = $derived(
    typeof group.name === 'object' ? group.name[locale] : group.name
  );
</script>

<h2>{displayName}</h2>
```

## Jogosultság ellenőrzés

A menü automatikusan szűri a menüpontokat a felhasználó jogosultságai alapján:

```typescript
// AppShell automatikusan ellenőrzi a requiredPermission mezőt
const shell = createAppShell({
  appName: 'users',
  menuData: menuData as RawMenuItem[]
});

// Ha a felhasználónak nincs meg a jogosultsága, a menüpont nem jelenik meg
```

## Lapozás és szűrés

Minden lista komponens támogatja a lapozást és szűrést:

```typescript
// Lapozás paraméterek validálása
const { page, limit, offset } = validatePaginationParams(input.page, input.pageSize);

// Szűrési paraméterek
const filterParams = {
  isActive: input.isActive,        // Csak aktív felhasználók
  providerId: input.providerId,    // Auth provider szűrés
  search: input.search             // Szöveges keresés
};

// Lekérdezés
const [rows, totalCount] = await Promise.all([
  userRepository.findManyPaginated({ limit, offset, ...filterParams }),
  userRepository.countAll(filterParams)
]);
```

## Fordítások

A Users app fordításai a `users` namespace-ben vannak:

```sql
-- translations_user.sql
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'menu.users', 'Felhasználók'),
('hu', 'users', 'menu.groups', 'Csoportok'),
('hu', 'users', 'menu.roles', 'Szerepkörök'),
('hu', 'users', 'menu.permissions', 'Jogosultságok'),
('hu', 'users', 'menu.resources', 'Erőforrások'),
('hu', 'users', 'list.empty', 'Nincs felhasználó'),
('hu', 'users', 'detail.title', 'Felhasználó részletei'),
-- ... további fordítások
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value;
```

## Tesztelés

**Repository tesztek:**

```typescript
// user-repository.test.ts
import { describe, it, expect } from 'vitest';
import { userRepository } from '$lib/server/database/repositories';

describe('UserRepository', () => {
  it('should find user by id', async () => {
    const user = await userRepository.findById(1);
    expect(user).toBeDefined();
    expect(user?.id).toBe(1);
  });

  it('should find users with groups and roles', async () => {
    const user = await userRepository.findByIdWithGroupsAndRoles(1);
    expect(user).toBeDefined();
    expect(user?.groups).toBeInstanceOf(Array);
    expect(user?.roles).toBeInstanceOf(Array);
  });
});
```

## Best practice-ek

1. **Mindig ellenőrizd a jogosultságokat** — szerver oldalon is
2. **Használj többnyelvű mezőket** — név és leírás JSONB formátumban
3. **Lapozz minden listát** — ne töltsd be az összes rekordot egyszerre
4. **Validálj minden inputot** — Valibot sémákkal
5. **Használj tranzakciókat** — több kapcsolódó művelet esetén
6. **Kezelj hibákat** — minden server action-ben try-catch
7. **Toast értesítések** — felhasználói visszajelzés minden műveletnél

## Gyakori hibák

**Probléma:** Menüpont nem jelenik meg

**Megoldás:** Ellenőrizd, hogy a felhasználónak megvan-e a `requiredPermission` jogosultsága.

---

**Probléma:** Többnyelvű mező nem jelenik meg helyesen

**Megoldás:** Ellenőrizd, hogy a mező JSONB típusú-e, és tartalmazza-e az aktuális locale-t.

---

**Probléma:** Lapozás nem működik

**Megoldás:** Használd a `validatePaginationParams` függvényt a paraméterek validálásához.

## További információk

- [Adatbázis](/database) — Repository-k használata
- [Server Actions](/server-actions) — Command/query pattern
- [Validáció](/data-validation) — Valibot sémák
- [Többnyelvűség](/i18n) — JSONB mezők kezelése
