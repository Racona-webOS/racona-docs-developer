---
title: Users App
description: Users app developer documentation - managing users, groups, roles and permissions
---

The Users app is Racona's central user and permission management system. Users with admin privileges can manage users, groups, roles, permissions and resources here.

## Overview

**Location:** `apps/web/src/apps/users/`

**Features:**
- Hierarchical menu with 5 main sections
- RBAC (Role-Based Access Control) system
- Paginated lists and detail views
- Multilingual name and description fields (JSONB)
- Permission-based menu filtering

**Access:** Admin users only

## File Structure

```
users/
├── index.svelte                    # App entry point
├── menu.json                       # Hierarchical menu with permissions
├── icon.svg                        # App icon
├── users.remote.ts                 # User server actions
├── groups.remote.ts                # Group server actions
├── roles.remote.ts                 # Role server actions
├── permissions.remote.ts           # Permission server actions
├── resources.remote.ts             # Resource server actions
├── user-repository.test.ts         # Repository tests
└── components/                     # List and detail components
    ├── UserList.svelte             # User list
    ├── UserDetail.svelte           # User details
    ├── GroupList.svelte            # Group list
    ├── GroupDetail.svelte          # Group details
    ├── RoleList.svelte             # Role list
    ├── RoleDetail.svelte           # Role details
    ├── PermissionList.svelte       # Permission list
    ├── PermissionDetail.svelte     # Permission details
    ├── ResourceList.svelte         # Resource list
    ├── ResourceDetail.svelte       # Resource details
    └── *Columns.ts                 # Table column definitions
```

## Menu Structure

The `menu.json` defines a permission-based menu:

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

**New field:** `requiredPermission` — the menu item only appears if the user has the required permission.

## RBAC System

Racona implements a full RBAC (Role-Based Access Control) system:

```
User
  ├─ Groups — can belong to multiple groups
  │   └─ Permissions
  └─ Roles — can have multiple roles
      └─ Permissions

Permission
  └─ Resource — what it applies to
      └─ Action — what can be done with it
```

**Example permission:**
- Resource: `users`
- Action: `view`, `create`, `update`, `delete`
- Full permission: `users.users.view`

## Server Actions

### users.remote.ts

**fetchUsers** — List users with pagination and filtering

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

**fetchUser** — Detailed data for a single user with groups and roles

**addUserToGroup** / **removeUserFromGroup** — Add/remove user from group

**addUserToRole** / **removeUserFromRole** — Add/remove user from role

**setUserActiveStatus** — Set user active/inactive status

### groups.remote.ts

**createGroup** / **updateGroup** / **deleteGroup** — Group CRUD operations

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

**fetchGroups** — List groups with pagination

**fetchGroup** — Detailed data for a single group

**fetchGroupUsers** — Group users with pagination

**fetchGroupPermissions** — Group permissions with pagination

**fetchGroupApps** — Apps assigned to group

**addUserToGroup** / **removeUserFromGroup** — User management

**addPermissionToGroup** / **removePermissionFromGroup** — Permission management

**addAppToGroup** / **removeAppFromGroup** — App access management

### roles.remote.ts

Similar structure to `groups.remote.ts`, but for roles:

- **createRole** / **updateRole** / **deleteRole**
- **fetchRoles** / **fetchRole**
- **fetchRoleUsers** / **fetchRolePermissions** / **fetchRoleApps**
- **addUserToRole** / **removeUserFromRole**
- **addPermissionToRole** / **removePermissionToRole**
- **addAppToRole** / **removeAppFromRole**

### permissions.remote.ts

Permission management:

- **createPermission** / **updatePermission** / **deletePermission**
- **fetchPermissions** / **fetchPermission**

### resources.remote.ts

Resource management:

- **createResource** / **updateResource** / **deleteResource**
- **fetchResources** / **fetchResource**

## Components

### List Components

Each entity has a list component that:
- Displays a paginated table
- Offers filtering and sorting options
- Navigates to detail view on click
- Has a create new item button

**Example: UserList.svelte**

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

### Detail Components

Each entity has a detail view that:
- Displays basic data
- Lists related entities (e.g. user's groups)
- Offers add/remove operations
- Contains edit and delete buttons

**Example: UserDetail.svelte**

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
      toast.success('Group added');
    }
  }
</script>

<div class="user-detail">
  <h2>{user?.name}</h2>
  <p>{user?.email}</p>

  <h3>Groups</h3>
  <ul>
    {#each groups as group}
      <li>{group.name}</li>
    {/each}
  </ul>
</div>
```

### Table Column Definitions

Each list has a `*Columns.ts` file that defines the table columns:

```typescript
// userListColumns.ts
import type { ColumnDef } from '@tanstack/table-core';
import type { UserListItem } from '$lib/server/database/repositories';

export const userListColumns: ColumnDef<UserListItem>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => row.original.name
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => row.original.email
  },
  {
    accessorKey: 'isActive',
    header: 'Active',
    cell: ({ row }) => (row.original.isActive ? 'Yes' : 'No')
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
  }
];
```

## Multilingual Fields

Groups, roles, permissions and resources have multilingual names and descriptions (JSONB):

```typescript
// Create group with English name
await createGroup({
  name: 'Administrators',
  description: 'System administrators group',
  locale: 'en'
});

// In database:
{
  name: { "hu": "Adminisztrátorok", "en": "Administrators" },
  description: { "hu": "Rendszergazdák csoportja", "en": "System administrators group" }
}
```

**Display:**

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

## Permission Checking

The menu automatically filters items based on the user's permissions:

```typescript
// AppShell automatically checks the requiredPermission field
const shell = createAppShell({
  appName: 'users',
  menuData: menuData as RawMenuItem[]
});

// If the user doesn't have the permission, the menu item won't appear
```

## Pagination and Filtering

Every list component supports pagination and filtering:

```typescript
// Validate pagination parameters
const { page, limit, offset } = validatePaginationParams(input.page, input.pageSize);

// Filter parameters
const filterParams = {
  isActive: input.isActive,        // Active users only
  providerId: input.providerId,    // Auth provider filter
  search: input.search             // Text search
};

// Query
const [rows, totalCount] = await Promise.all([
  userRepository.findManyPaginated({ limit, offset, ...filterParams }),
  userRepository.countAll(filterParams)
]);
```

## Translations

Users app translations are in the `users` namespace:

```sql
-- translations_user.sql
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'menu.users', 'Users'),
('en', 'users', 'menu.groups', 'Groups'),
('en', 'users', 'menu.roles', 'Roles'),
('en', 'users', 'menu.permissions', 'Permissions'),
('en', 'users', 'menu.resources', 'Resources'),
('en', 'users', 'list.empty', 'No users'),
('en', 'users', 'detail.title', 'User details'),
-- ... more translations
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value;
```

## Testing

**Repository tests:**

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

## Best Practices

1. **Always check permissions** — on the server side too
2. **Use multilingual fields** — name and description in JSONB format
3. **Paginate all lists** — don't load all records at once
4. **Validate all inputs** — with Valibot schemas
5. **Use transactions** — for multiple related operations
6. **Handle errors** — try-catch in every server action
7. **Toast notifications** — user feedback for every operation

## Common Issues

**Problem:** Menu item doesn't appear

**Solution:** Check that the user has the `requiredPermission` permission.

---

**Problem:** Multilingual field doesn't display correctly

**Solution:** Check that the field is JSONB type and contains the current locale.

---

**Problem:** Pagination doesn't work

**Solution:** Use the `validatePaginationParams` function to validate parameters.

## Further Reading

- [Database](/en/database) — Using repositories
- [Server Actions](/en/server-actions) — Command/query pattern
- [Validation](/en/data-validation) — Valibot schemas
- [Internationalization](/en/i18n) — Handling JSONB fields
