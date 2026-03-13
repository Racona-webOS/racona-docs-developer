---
title: Dialog komponensek
description: Modal ablakok és párbeszédpanelek - ConfirmDialog, CustomDialog
---

A dialog komponensek modal ablakokat jelenítenek meg, amelyek fontos információkat mutatnak vagy megerősítést kérnek a felhasználótól.

## ConfirmDialog

Egyszerű megerősítő ablak kétgombos felülettel. Ideális törlési és egyéb visszavonhatatlan műveletek megerősítésére.

### Használat

```svelte
<script>
  import { ConfirmDialog } from '$lib/components/ui';
  import { Button } from '$lib/components/ui/button';

  let open = $state(false);

  function handleDelete() {
    // Törlési logika
    console.log('Törölve');
  }
</script>

<Button onclick={() => open = true}>Törlés</Button>

<ConfirmDialog
  bind:open
  title="Felhasználó törlése"
  description="Biztosan törölni szeretnéd ezt a felhasználót? Ez a művelet nem vonható vissza."
  confirmText="Törlés"
  cancelText="Mégse"
  confirmVariant="destructive"
  onConfirm={handleDelete}
  onCancel={() => console.log('Megszakítva')}
/>
```

### Props

| Prop | Típus | Kötelező | Leírás |
|------|-------|----------|--------|
| `open` | `boolean` | Igen | Dialog nyitott állapota (bindable) |
| `title` | `string` | Igen | Dialog címe |
| `description` | `string` | Igen | Leírás/kérdés szöveg |
| `confirmText` | `string` | Nem | Megerősítő gomb szövege (default: "Continue") |
| `cancelText` | `string` | Nem | Mégse gomb szövege (default: "Cancel") |
| `confirmVariant` | `string` | Nem | Gomb variáns (default: "default") |
| `onConfirm` | `() => void` | Igen | Megerősítés callback |
| `onCancel` | `() => void` | Igen | Mégse/bezárás callback |

### Variánsok

**Törlés megerősítés (destructive):**

```svelte
<ConfirmDialog
  bind:open
  title="Csoport törlése"
  description="Biztosan törölni szeretnéd ezt a csoportot? Minden tag elveszíti a csoporttagságát."
  confirmText="Törlés"
  cancelText="Mégse"
  confirmVariant="destructive"
  onConfirm={deleteGroup}
  onCancel={() => open = false}
/>
```

**Normál megerősítés (default):**

```svelte
<ConfirmDialog
  bind:open
  title="Beállítások mentése"
  description="Biztosan menteni szeretnéd a változtatásokat?"
  confirmText="Mentés"
  cancelText="Mégse"
  confirmVariant="default"
  onConfirm={saveSettings}
  onCancel={() => open = false}
/>
```

### Példák

**Törlés toast üzenettel:**

```svelte
<script>
  import { toast } from 'svelte-sonner';
  import { ConfirmDialog } from '$lib/components/ui';

  let deleteDialogOpen = $state(false);
  let userToDelete = $state(null);

  function openDeleteDialog(user) {
    userToDelete = user;
    deleteDialogOpen = true;
  }

  async function handleDelete() {
    try {
      await deleteUser(userToDelete.id);
      toast.success('Felhasználó törölve');
    } catch (error) {
      toast.error('Hiba történt a törlés során');
    }
  }
</script>

<ConfirmDialog
  bind:open={deleteDialogOpen}
  title="Felhasználó törlése"
  description="Biztosan törölni szeretnéd {userToDelete?.name} felhasználót?"
  confirmText="Törlés"
  confirmVariant="destructive"
  onConfirm={handleDelete}
  onCancel={() => deleteDialogOpen = false}
/>
```

---

## CustomDialog

Egyedi tartalmú dialog komponens összetettebb űrlapokhoz és tartalmakhoz. Snippet-eket használ a tartalom és gombok testreszabásához.

### Használat

```svelte
<script>
  import { CustomDialog } from '$lib/components/ui';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  let open = $state(false);
  let name = $state('');
  let email = $state('');

  function handleSave() {
    console.log('Mentés:', { name, email });
    open = false;
  }
</script>

<Button onclick={() => open = true}>Új felhasználó</Button>

<CustomDialog
  bind:open
  title="Új felhasználó létrehozása"
  description="Add meg az új felhasználó adatait"
  onClose={() => console.log('Bezárva')}
>
  {#snippet content()}
    <div class="space-y-4">
      <div>
        <Label for="name">Név *</Label>
        <Input id="name" bind:value={name} required />
      </div>
      <div>
        <Label for="email">Email *</Label>
        <Input id="email" type="email" bind:value={email} required />
      </div>
    </div>
  {/snippet}

  {#snippet actions()}
    <Button variant="outline" onclick={() => open = false}>
      Mégse
    </Button>
    <Button onclick={handleSave}>
      Létrehozás
    </Button>
  {/snippet}
</CustomDialog>
```

### Props

| Prop | Típus | Kötelező | Leírás |
|------|-------|----------|--------|
| `open` | `boolean` | Igen | Dialog nyitott állapota (bindable) |
| `title` | `string` | Igen | Dialog címe |
| `description` | `string` | Nem | Opcionális leírás a cím alatt |
| `content` | `Snippet` | Igen | Egyedi tartalom snippet |
| `actions` | `Snippet` | Igen | Funkciógombok snippet |
| `onClose` | `() => void` | Nem | Bezárás callback |

### Példák

**Szerkesztő űrlap:**

```svelte
<script>
  import { CustomDialog } from '$lib/components/ui';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { toast } from 'svelte-sonner';

  let editDialogOpen = $state(false);
  let user = $state({ name: '', email: '', role: '' });

  function openEditDialog(userData) {
    user = { ...userData };
    editDialogOpen = true;
  }

  async function handleUpdate() {
    try {
      await updateUser(user);
      toast.success('Felhasználó frissítve');
      editDialogOpen = false;
    } catch (error) {
      toast.error('Hiba történt a frissítés során');
    }
  }
</script>

<CustomDialog
  bind:open={editDialogOpen}
  title="Felhasználó szerkesztése"
  description="Módosítsd a felhasználó adatait"
>
  {#snippet content()}
    <div class="space-y-4">
      <div>
        <Label for="edit-name">Név</Label>
        <Input id="edit-name" bind:value={user.name} />
      </div>
      <div>
        <Label for="edit-email">Email</Label>
        <Input id="edit-email" type="email" bind:value={user.email} />
      </div>
      <div>
        <Label>Szerepkör</Label>
        <Select.Root bind:value={user.role}>
          <Select.Trigger>
            <Select.Value placeholder="Válassz szerepkört..." />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="admin">Admin</Select.Item>
            <Select.Item value="user">Felhasználó</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  {/snippet}

  {#snippet actions()}
    <Button variant="outline" onclick={() => editDialogOpen = false}>
      Mégse
    </Button>
    <Button onclick={handleUpdate}>
      Mentés
    </Button>
  {/snippet}
</CustomDialog>
```

**Többlépéses űrlap:**

```svelte
<script>
  import { CustomDialog } from '$lib/components/ui';
  import { Button } from '$lib/components/ui/button';

  let open = $state(false);
  let step = $state(1);

  function nextStep() {
    if (step < 3) step++;
  }

  function prevStep() {
    if (step > 1) step--;
  }

  function handleFinish() {
    console.log('Befejezve');
    open = false;
    step = 1;
  }
</script>

<CustomDialog
  bind:open
  title="Új projekt létrehozása"
  description="Lépés {step} / 3"
>
  {#snippet content()}
    {#if step === 1}
      <div>Első lépés tartalma</div>
    {:else if step === 2}
      <div>Második lépés tartalma</div>
    {:else}
      <div>Harmadik lépés tartalma</div>
    {/if}
  {/snippet}

  {#snippet actions()}
    {#if step > 1}
      <Button variant="outline" onclick={prevStep}>
        Vissza
      </Button>
    {/if}
    {#if step < 3}
      <Button onclick={nextStep}>
        Következő
      </Button>
    {:else}
      <Button onclick={handleFinish}>
        Befejezés
      </Button>
    {/if}
  {/snippet}
</CustomDialog>
```

---

## AlertDialog (natív)

Ha a ConfirmDialog és CustomDialog nem elegendő, használhatod a natív AlertDialog komponenst teljes kontrollal.

### Használat

```svelte
<script>
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';

  let open = $state(false);
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Trigger>
    <Button>Megnyitás</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Biztos vagy benne?</AlertDialog.Title>
      <AlertDialog.Description>
        Ez a művelet nem vonható vissza.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Mégse</AlertDialog.Cancel>
      <AlertDialog.Action>Folytatás</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
```

---

## Drawer

Oldalsó panel komponens mobil nézetekhez vagy gyors műveletekhez.

### Használat

```svelte
<script>
  import * as Drawer from '$lib/components/ui/drawer';
  import { Button } from '$lib/components/ui/button';

  let open = $state(false);
</script>

<Drawer.Root bind:open>
  <Drawer.Trigger>
    <Button>Megnyitás</Button>
  </Drawer.Trigger>
  <Drawer.Content>
    <Drawer.Header>
      <Drawer.Title>Drawer cím</Drawer.Title>
      <Drawer.Description>Drawer leírás</Drawer.Description>
    </Drawer.Header>
    <div class="p-4">
      Drawer tartalom
    </div>
    <Drawer.Footer>
      <Button onclick={() => open = false}>Bezárás</Button>
    </Drawer.Footer>
  </Drawer.Content>
</Drawer.Root>
```

---

## Best practice-ek

1. **ConfirmDialog törléshez** — Mindig használj megerősítő ablakot veszélyes műveleteknél
2. **CustomDialog összetett űrlapokhoz** — Használd snippet-eket a rugalmasságért
3. **Destructive variáns** — Csak törlési és visszavonhatatlan műveleteknél
4. **Toast visszajelzés** — Dialog bezárása után mindig adj toast üzenetet
5. **Validáció** — Ellenőrizd az űrlap mezőket mentés előtt
6. **Loading állapot** — Jelenítsd meg a betöltést a gombokon
7. **Escape bezárás** — A dialog automatikusan bezárul Escape-re
8. **Háttér kattintás** — A dialog bezárul, ha a háttérre kattintasz
9. **Címek és leírások** — Mindig adj egyértelmű címet és leírást
10. **Gomb sorrend** — Mégse bal oldalon, megerősítés jobb oldalon

## Kapcsolódó

- [Alapvető komponensek →](./basic) — Button, Input, Select
- [Toast értesítések →](./notifications) — Visszajelzések
- [DataTable →](./datatable) — Törlés megerősítés táblázatokban
