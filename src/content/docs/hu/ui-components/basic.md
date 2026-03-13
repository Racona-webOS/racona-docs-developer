---
title: Alapvető komponensek
description: Alapvető UI építőelemek - Button, Input, Select, Checkbox, Switch
---

Az alapvető UI komponensek az alkalmazások építőkövei. Ezek a shadcn-svelte könyvtárból származnak és egységes megjelenést biztosítanak.

## Button

Gomb komponens különböző variánsokkal és méretekkel.

### Használat

```svelte
<script>
  import { Button } from '$lib/components/ui/button';
</script>

<Button>Alapértelmezett</Button>
<Button variant="destructive">Törlés</Button>
<Button variant="outline">Körvonal</Button>
<Button variant="secondary">Másodlagos</Button>
<Button variant="ghost">Szellem</Button>
<Button variant="link">Link</Button>
```

### Méretek

```svelte
<Button size="sm">Kicsi</Button>
<Button size="default">Alapértelmezett</Button>
<Button size="lg">Nagy</Button>
<Button size="icon">
  <User size={16} />
</Button>
```

### Variánsok

| Variáns | Használat | Szín |
|---------|-----------|------|
| `default` | Elsődleges művelet | Kék |
| `destructive` | Veszélyes művelet (törlés) | Piros |
| `outline` | Másodlagos művelet | Körvonalazott |
| `secondary` | Harmadlagos művelet | Szürke |
| `ghost` | Minimális hangsúly | Háttér nélküli |
| `link` | Link stílusú | Aláhúzott |

### Props

| Prop | Típus | Leírás |
|------|-------|--------|
| `variant` | `string` | Gomb variáns (default: "default") |
| `size` | `string` | Gomb méret (default: "default") |
| `disabled` | `boolean` | Letiltott állapot |
| `onclick` | `() => void` | Kattintás esemény |

### Példák

**Törlés gomb:**

```svelte
<Button variant="destructive" onclick={handleDelete}>
  <Trash2 size={16} class="mr-2" />
  Törlés
</Button>
```

**Betöltés állapot:**

```svelte
<script>
  let loading = $state(false);
</script>

<Button disabled={loading} onclick={handleSave}>
  {#if loading}
    Mentés...
  {:else}
    Mentés
  {/if}
</Button>
```

---

## Input

Szöveges beviteli mező komponens.

### Használat

```svelte
<script>
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  let value = $state('');
</script>

<div class="space-y-2">
  <Label for="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="pelda@email.hu"
    bind:value
  />
</div>
```

### Típusok

```svelte
<Input type="text" placeholder="Szöveg" />
<Input type="email" placeholder="Email" />
<Input type="password" placeholder="Jelszó" />
<Input type="number" placeholder="Szám" />
<Input type="tel" placeholder="Telefon" />
<Input type="url" placeholder="URL" />
<Input type="date" />
```

### Props

| Prop | Típus | Leírás |
|------|-------|--------|
| `type` | `string` | Input típus (default: "text") |
| `placeholder` | `string` | Placeholder szöveg |
| `value` | `string` | Érték (bindable) |
| `disabled` | `boolean` | Letiltott állapot |
| `required` | `boolean` | Kötelező mező |

### Példák

**Validációval:**

```svelte
<script>
  let email = $state('');
  let error = $state('');

  function validate() {
    if (!email.includes('@')) {
      error = 'Érvénytelen email cím';
    } else {
      error = '';
    }
  }
</script>

<div class="space-y-2">
  <Label for="email">Email *</Label>
  <Input
    id="email"
    type="email"
    bind:value={email}
    oninput={validate}
    class={error ? 'border-destructive' : ''}
  />
  {#if error}
    <p class="text-sm text-destructive">{error}</p>
  {/if}
</div>
```

---

## Select

Legördülő menü komponens.

### Használat

```svelte
<script>
  import * as Select from '$lib/components/ui/select';
  import { Label } from '$lib/components/ui/label';

  let selected = $state('');
</script>

<div class="space-y-2">
  <Label>Szerepkör</Label>
  <Select.Root bind:value={selected}>
    <Select.Trigger>
      <Select.Value placeholder="Válassz szerepkört..." />
    </Select.Trigger>
    <Select.Content>
      <Select.Item value="admin">Admin</Select.Item>
      <Select.Item value="user">Felhasználó</Select.Item>
      <Select.Item value="guest">Vendég</Select.Item>
    </Select.Content>
  </Select.Root>
</div>
```

### Csoportosított opciók

```svelte
<Select.Root bind:value={selected}>
  <Select.Trigger>
    <Select.Value placeholder="Válassz..." />
  </Select.Trigger>
  <Select.Content>
    <Select.Group>
      <Select.Label>Adminisztrátorok</Select.Label>
      <Select.Item value="superadmin">Szuper Admin</Select.Item>
      <Select.Item value="admin">Admin</Select.Item>
    </Select.Group>
    <Select.Separator />
    <Select.Group>
      <Select.Label>Felhasználók</Select.Label>
      <Select.Item value="user">Felhasználó</Select.Item>
      <Select.Item value="guest">Vendég</Select.Item>
    </Select.Group>
  </Select.Content>
</Select.Root>
```

---

## Checkbox

Jelölőnégyzet komponens.

### Használat

```svelte
<script>
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Label } from '$lib/components/ui/label';

  let checked = $state(false);
</script>

<div class="flex items-center space-x-2">
  <Checkbox id="terms" bind:checked />
  <Label for="terms">Elfogadom a feltételeket</Label>
</div>
```

### Több checkbox

```svelte
<script>
  let permissions = $state({
    read: false,
    write: false,
    delete: false
  });
</script>

<div class="space-y-2">
  <div class="flex items-center space-x-2">
    <Checkbox id="read" bind:checked={permissions.read} />
    <Label for="read">Olvasás</Label>
  </div>
  <div class="flex items-center space-x-2">
    <Checkbox id="write" bind:checked={permissions.write} />
    <Label for="write">Írás</Label>
  </div>
  <div class="flex items-center space-x-2">
    <Checkbox id="delete" bind:checked={permissions.delete} />
    <Label for="delete">Törlés</Label>
  </div>
</div>
```

---

## Switch

Kapcsoló komponens be/ki állapothoz.

### Használat

```svelte
<script>
  import { Switch } from '$lib/components/ui/switch';
  import { Label } from '$lib/components/ui/label';

  let enabled = $state(false);
</script>

<div class="flex items-center space-x-2">
  <Switch id="notifications" bind:checked={enabled} />
  <Label for="notifications">Értesítések engedélyezése</Label>
</div>
```

### Letiltott állapot

```svelte
<div class="flex items-center space-x-2">
  <Switch id="feature" disabled />
  <Label for="feature" class="text-muted-foreground">
    Hamarosan elérhető
  </Label>
</div>
```

---

## Label

Címke komponens input mezőkhöz.

### Használat

```svelte
<script>
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
</script>

<div class="space-y-2">
  <Label for="username">Felhasználónév *</Label>
  <Input id="username" required />
</div>
```

### Kötelező mező jelzés

```svelte
<Label for="email">
  Email <span class="text-destructive">*</span>
</Label>
```

---

## Badge

Címke komponens státuszok és kategóriák jelzésére.

### Használat

```svelte
<script>
  import { Badge } from '$lib/components/ui/badge';
</script>

<Badge>Alapértelmezett</Badge>
<Badge variant="secondary">Másodlagos</Badge>
<Badge variant="destructive">Veszélyes</Badge>
<Badge variant="outline">Körvonal</Badge>
```

### Státusz jelzés

```svelte
<script>
  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return { variant: 'default', label: 'Aktív' };
      case 'inactive':
        return { variant: 'secondary', label: 'Inaktív' };
      case 'error':
        return { variant: 'destructive', label: 'Hiba' };
      default:
        return { variant: 'outline', label: 'Ismeretlen' };
    }
  }
</script>

{#each users as user}
  {@const badge = getStatusBadge(user.status)}
  <Badge variant={badge.variant}>{badge.label}</Badge>
{/each}
```

---

## Separator

Elválasztó vonal komponens.

### Használat

```svelte
<script>
  import { Separator } from '$lib/components/ui/separator';
</script>

<div class="space-y-4">
  <div>Első szekció</div>
  <Separator />
  <div>Második szekció</div>
</div>
```

### Függőleges elválasztó

```svelte
<div class="flex items-center space-x-4">
  <span>Elem 1</span>
  <Separator orientation="vertical" class="h-4" />
  <span>Elem 2</span>
</div>
```

---

## Best practice-ek

1. **Mindig használj Label-t** — Minden input mellett legyen címke
2. **Kötelező mezők jelzése** — Használj `*` jelet vagy "Kötelező" szöveget
3. **Placeholder szöveg** — Adj példát a várt formátumra
4. **Validáció** — Jelenítsd meg a hibákat az input alatt
5. **Letiltott állapot** — Használd a `disabled` prop-ot, ne CSS-t
6. **Gomb variánsok** — `destructive` csak törléshez, `default` elsődleges művelethez
7. **Badge színek** — Használj szemantikus színeket (piros = hiba, zöld = siker)
8. **Accessibility** — Használj `id` és `for` attribútumokat a Label-nél

## Kapcsolódó

- [Dialog komponensek →](./dialogs) — Modal ablakok
- [DataTable →](./datatable) — Adattáblák
- [Ikonok →](./icons) — Lucide ikonok
