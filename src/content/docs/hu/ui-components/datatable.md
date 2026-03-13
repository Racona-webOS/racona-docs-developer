---
title: DataTable
description: Szerver oldali adattábla komponens rendezéssel, szűréssel és lapozással
---

A DataTable egy teljes funkcionalitású adattábla komponens, amely szerver oldali lapozást, rendezést és szűrést támogat. A **Tanstack Table** könyvtárra épül.

## Alapvető használat

```svelte
<script lang="ts">
  import { DataTable, createActionsColumn } from '$lib/components/ui/data-table';
  import type { ColumnDef } from '@tanstack/table-core';

  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
  }

  let users = $state<User[]>([]);
  let loading = $state(false);
  let pagination = $state({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0
  });

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Név',
      meta: { title: 'Név' }
    },
    {
      accessorKey: 'email',
      header: 'Email',
      meta: { title: 'Email' }
    },
    {
      accessorKey: 'role',
      header: 'Szerepkör',
      meta: { title: 'Szerepkör' }
    }
  ];

  async function loadData(state: any) {
    loading = true;
    const response = await fetch(
      `/api/users?page=${state.page}&pageSize=${state.pageSize}&sortBy=${state.sortBy}&sortOrder=${state.sortOrder}`
    );
    const data = await response.json();
    users = data.users;
    pagination = data.pagination;
    loading = false;
  }

  $effect(() => {
    loadData({ page: 1, pageSize: 20, sortBy: '', sortOrder: 'desc' });
  });
</script>

<DataTable
  {columns}
  data={users}
  {pagination}
  {loading}
  onStateChange={loadData}
/>
```

## Oszlop definíciók

### Egyszerű oszlop

```typescript
{
  accessorKey: 'name',
  header: 'Név',
  meta: { title: 'Név' } // Oszlop láthatóság menühöz
}
```

### Rendezés letiltása

```typescript
{
  accessorKey: 'actions',
  header: 'Műveletek',
  enableSorting: false,
  enableHiding: false
}
```

### Egyedi cell renderelés

```typescript
{
  accessorKey: 'status',
  header: 'Státusz',
  cell: ({ row }) => {
    const status = row.getValue('status');
    return renderComponent(Badge, {
      variant: status === 'active' ? 'default' : 'secondary',
      children: status === 'active' ? 'Aktív' : 'Inaktív'
    });
  }
}
```

## Műveleti oszlop (Actions Column)

A `createActionsColumn` függvény automatikusan kezeli az elsődleges és másodlagos műveleteket.

### Egyetlen művelet

```typescript
createActionsColumn<User>([
  {
    label: 'Megnyitás',
    onClick: (user) => openUser(user)
  }
])
```

**Eredmény:** Egyszerű gomb jelenik meg.

### Több művelet - elsődleges + dropdown

```typescript
createActionsColumn<User>([
  {
    label: 'Szerkesztés',
    primary: true, // Ez lesz a fő gomb (bal oldal)
    onClick: (user) => editUser(user)
  },
  {
    label: 'Aktiválás',
    onClick: (user) => toggleActive(user)
  },
  {
    label: 'Törlés',
    variant: 'destructive', // Piros szöveg
    separator: true, // Elválasztó vonal előtte
    onClick: (user) => deleteUser(user)
  }
])
```

**Eredmény:**
- **Bal oldal:** "Szerkesztés" gomb (elsődleges művelet)
- **Jobb oldal:** 3 függőleges pont gomb → dropdown menü (Aktiválás, Törlés)

### Dinamikus műveletek

```typescript
createActionsColumn<User>((user) => {
  const actions = [
    {
      label: 'Szerkesztés',
      primary: true,
      onClick: () => editUser(user)
    }
  ];

  // Feltételes műveletek
  if (user.isActive) {
    actions.push({
      label: 'Deaktiválás',
      onClick: () => deactivateUser(user)
    });
  } else {
    actions.push({
      label: 'Aktiválás',
      onClick: () => activateUser(user)
    });
  }

  // Törlés mindig utolsó
  actions.push({
    label: 'Törlés',
    variant: 'destructive',
    separator: true,
    onClick: () => confirmDelete(user)
  });

  return actions;
})
```

### RowAction típus

```typescript
interface RowAction<TData> {
  label: string;              // Művelet neve
  icon?: string;              // Lucide ikon neve (opcionális)
  onClick: (row: TData) => void; // Callback
  variant?: 'default' | 'destructive'; // Vizuális variáns
  separator?: boolean;        // Elválasztó vonal előtte
  primary?: boolean;          // Elsődleges művelet (fő gomb)
}
```

## Toolbar használat

A toolbar snippet lehetővé teszi egyedi vezérlők hozzáadását a táblázat felett.

```svelte
<script>
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import Plus from 'lucide-svelte/icons/plus';

  let searchQuery = $state('');
</script>

<DataTable
  {columns}
  data={users}
  {pagination}
  {loading}
  onStateChange={loadData}
>
  {#snippet toolbar({ table, handleSort })}
    <Input
      placeholder="Keresés név vagy email alapján..."
      value={searchQuery}
      oninput={(e) => {
        searchQuery = e.currentTarget.value;
        // Trigger search
      }}
      class="max-w-sm"
    />
    <Button onclick={() => openCreateDialog()}>
      <Plus size={16} class="mr-2" />
      Új létrehozása
    </Button>
  {/snippet}
</DataTable>
```

## Szűrők

### Faceted Filter

```svelte
<script>
  import { DataTableFacetedFilter } from '$lib/components/ui/data-table';

  const roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Felhasználó', value: 'user' },
    { label: 'Vendég', value: 'guest' }
  ];

  let selectedRoles = $state<string[]>([]);
</script>

<DataTable {columns} data={users} {pagination} {loading} onStateChange={loadData}>
  {#snippet toolbar({ table })}
    <DataTableFacetedFilter
      {table}
      column="role"
      title="Szerepkör"
      options={roleOptions}
      bind:selected={selectedRoles}
    />
  {/snippet}
</DataTable>
```

## Props

| Prop | Típus | Leírás |
|------|-------|--------|
| `columns` | `ColumnDef<TData>[]` | Oszlop definíciók |
| `data` | `TData[]` | Adatok tömbje |
| `pagination` | `PaginationInfo` | Lapozási információk |
| `loading` | `boolean` | Betöltési állapot |
| `striped` | `boolean` | Csíkozott sorok (default: false) |
| `pageSizes` | `number[]` | Választható lapméret opciók (default: [10, 20, 50, 100]) |
| `initialSortBy` | `string` | Kezdeti rendezési oszlop |
| `initialSortOrder` | `'asc' \| 'desc'` | Kezdeti rendezési irány (default: 'desc') |
| `initialPageSize` | `number` | Kezdeti lapméret (default: 20) |
| `onStateChange` | `(state) => void` | Állapotváltozás callback |
| `toolbar` | `Snippet` | Egyedi toolbar snippet |

### PaginationInfo típus

```typescript
interface PaginationInfo {
  page: number;        // Aktuális oldal (1-től kezdődik)
  pageSize: number;    // Sorok száma oldalanként
  totalCount: number;  // Összes sor száma
  totalPages: number;  // Összes oldal száma
}
```

### DataTableState típus

```typescript
interface DataTableState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}
```

## Teljes példa

```svelte
<script lang="ts">
  import { DataTable, createActionsColumn } from '$lib/components/ui/data-table';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { ConfirmDialog, CustomDialog } from '$lib/components/ui';
  import { toast } from 'svelte-sonner';
  import type { ColumnDef } from '@tanstack/table-core';
  import Plus from 'lucide-svelte/icons/plus';

  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  }

  let users = $state<User[]>([]);
  let loading = $state(false);
  let pagination = $state({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0
  });

  let searchQuery = $state('');
  let deleteDialogOpen = $state(false);
  let editDialogOpen = $state(false);
  let createDialogOpen = $state(false);
  let selectedUser = $state<User | null>(null);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Név',
      meta: { title: 'Név' }
    },
    {
      accessorKey: 'email',
      header: 'Email',
      meta: { title: 'Email' }
    },
    {
      accessorKey: 'role',
      header: 'Szerepkör',
      meta: { title: 'Szerepkör' }
    },
    {
      accessorKey: 'isActive',
      header: 'Státusz',
      meta: { title: 'Státusz' },
      cell: ({ row }) => {
        const isActive = row.getValue('isActive');
        return renderComponent(Badge, {
          variant: isActive ? 'default' : 'secondary',
          children: isActive ? 'Aktív' : 'Inaktív'
        });
      }
    },
    createActionsColumn<User>((user) => [
      {
        label: 'Szerkesztés',
        primary: true,
        onClick: () => openEditDialog(user)
      },
      {
        label: user.isActive ? 'Deaktiválás' : 'Aktiválás',
        onClick: () => toggleActive(user)
      },
      {
        label: 'Törlés',
        variant: 'destructive',
        separator: true,
        onClick: () => openDeleteDialog(user)
      }
    ])
  ];

  async function loadData(state: any) {
    loading = true;
    try {
      const params = new URLSearchParams({
        page: state.page.toString(),
        pageSize: state.pageSize.toString(),
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        search: searchQuery
      });

      const response = await fetch(`/api/users?${params}`);
      const data = await response.json();

      users = data.users;
      pagination = data.pagination;
    } catch (error) {
      toast.error('Hiba történt az adatok betöltése során');
    } finally {
      loading = false;
    }
  }

  function openEditDialog(user: User) {
    selectedUser = { ...user };
    editDialogOpen = true;
  }

  function openDeleteDialog(user: User) {
    selectedUser = user;
    deleteDialogOpen = true;
  }

  async function handleDelete() {
    try {
      await fetch(`/api/users/${selectedUser!.id}`, { method: 'DELETE' });
      toast.success('Felhasználó törölve');
      loadData({ page: pagination.page, pageSize: pagination.pageSize, sortBy: '', sortOrder: 'desc' });
    } catch (error) {
      toast.error('Hiba történt a törlés során');
    }
  }

  async function toggleActive(user: User) {
    try {
      await fetch(`/api/users/${user.id}/toggle-active`, { method: 'POST' });
      toast.success(user.isActive ? 'Felhasználó deaktiválva' : 'Felhasználó aktiválva');
      loadData({ page: pagination.page, pageSize: pagination.pageSize, sortBy: '', sortOrder: 'desc' });
    } catch (error) {
      toast.error('Hiba történt');
    }
  }

  $effect(() => {
    loadData({ page: 1, pageSize: 20, sortBy: '', sortOrder: 'desc' });
  });
</script>

<DataTable
  {columns}
  data={users}
  {pagination}
  {loading}
  striped
  onStateChange={loadData}
>
  {#snippet toolbar()}
    <Input
      placeholder="Keresés..."
      value={searchQuery}
      oninput={(e) => {
        searchQuery = e.currentTarget.value;
        loadData({ page: 1, pageSize: pagination.pageSize, sortBy: '', sortOrder: 'desc' });
      }}
      class="max-w-sm"
    />
    <Button onclick={() => createDialogOpen = true}>
      <Plus size={16} class="mr-2" />
      Új felhasználó
    </Button>
  {/snippet}
</DataTable>

<ConfirmDialog
  bind:open={deleteDialogOpen}
  title="Felhasználó törlése"
  description="Biztosan törölni szeretnéd {selectedUser?.name} felhasználót?"
  confirmText="Törlés"
  confirmVariant="destructive"
  onConfirm={handleDelete}
  onCancel={() => deleteDialogOpen = false}
/>
```

## Best practice-ek

1. **Szerver oldali lapozás** — Nagy adathalmazoknál mindig szerver oldali lapozást használj
2. **Loading állapot** — Mindig jelenítsd meg a betöltési állapotot
3. **Elsődleges művelet** — A leggyakoribb művelet legyen `primary: true`
4. **Törlés megerősítés** — Mindig használj ConfirmDialog-ot törléshez
5. **Toast visszajelzés** — Minden művelet után adj visszajelzést
6. **Oszlop láthatóság** — Add meg a `meta.title`-t minden oszlophoz
7. **Rendezés** — Csak értelmes oszlopoknál engedélyezd
8. **Striped sorok** — Használd nagy táblázatoknál a jobb olvashatóságért
9. **Responsive** — Rejtsd el a kevésbé fontos oszlopokat mobil nézetben
10. **Error handling** — Kezeld le a betöltési hibákat

## Kapcsolódó

- [Dialog komponensek →](./dialogs) — Megerősítő ablakok
- [Toast értesítések →](./notifications) — Visszajelzések
- [Alapvető komponensek →](./basic) — Button, Input
