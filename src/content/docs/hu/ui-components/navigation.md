---
title: Navigációs komponensek
description: Navigációs komponensek és menük
---

A navigációs komponensek segítenek a felhasználóknak az alkalmazásban való navigálásban és műveletek elérésében.

## Dropdown Menu

A Dropdown Menu komponens egy legördülő menü, amely gomb kattintásra jelenik meg.

### Importálás

```svelte
<script>
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
</script>
```

### Alapvető használat

```svelte
<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button builders={[builder]} variant="outline">
      Menü megnyitása
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item>Profil</DropdownMenu.Item>
    <DropdownMenu.Item>Beállítások</DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item>Kijelentkezés</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

### Komponens részek

- **DropdownMenu.Root** — Fő konténer
- **DropdownMenu.Trigger** — Trigger gomb
- **DropdownMenu.Content** — Menü tartalom
- **DropdownMenu.Item** — Menüpont
- **DropdownMenu.Separator** — Elválasztó vonal
- **DropdownMenu.Label** — Címke
- **DropdownMenu.Group** — Menüpontok csoportja
- **DropdownMenu.Sub** — Almenü
- **DropdownMenu.CheckboxItem** — Checkbox menüpont
- **DropdownMenu.RadioGroup** — Radio gombok csoportja
- **DropdownMenu.RadioItem** — Radio menüpont

### Példa: Ikonokkal

```svelte
<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button builders={[builder]} variant="ghost" size="icon">
      <MoreVertical class="size-4" />
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item>
      <Edit class="mr-2 size-4" />
      Szerkesztés
    </DropdownMenu.Item>
    <DropdownMenu.Item>
      <Copy class="mr-2 size-4" />
      Másolás
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item class="text-destructive">
      <Trash2 class="mr-2 size-4" />
      Törlés
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

### Példa: Almenüvel

```svelte
<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button builders={[builder]}>Műveletek</Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item>Új elem</DropdownMenu.Item>

    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger>Exportálás</DropdownMenu.SubTrigger>
      <DropdownMenu.SubContent>
        <DropdownMenu.Item>PDF</DropdownMenu.Item>
        <DropdownMenu.Item>Excel</DropdownMenu.Item>
        <DropdownMenu.Item>CSV</DropdownMenu.Item>
      </DropdownMenu.SubContent>
    </DropdownMenu.Sub>

    <DropdownMenu.Separator />
    <DropdownMenu.Item>Bezárás</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

### Példa: Checkbox menüpontokkal

```svelte
<script>
  let showToolbar = $state(true);
  let showSidebar = $state(false);
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button builders={[builder]} variant="outline">Nézet</Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Label>Megjelenítés</DropdownMenu.Label>
    <DropdownMenu.Separator />
    <DropdownMenu.CheckboxItem bind:checked={showToolbar}>
      Eszköztár
    </DropdownMenu.CheckboxItem>
    <DropdownMenu.CheckboxItem bind:checked={showSidebar}>
      Oldalsáv
    </DropdownMenu.CheckboxItem>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

## Context Menu

A Context Menu komponens jobb klikk menü, amely egy elem fölött jelenik meg.

### Importálás

```svelte
<script>
  import * as ContextMenu from '$lib/components/ui/context-menu';
</script>
```

### Alapvető használat

```svelte
<ContextMenu.Root>
  <ContextMenu.Trigger>
    <div class="border rounded-lg p-8 text-center">
      Jobb klikk ide
    </div>
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item>Megnyitás</ContextMenu.Item>
    <ContextMenu.Item>Szerkesztés</ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.Item class="text-destructive">Törlés</ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>
```

### Példa: Fájl műveletek

```svelte
<ContextMenu.Root>
  <ContextMenu.Trigger>
    <div class="flex items-center gap-2 p-2 hover:bg-muted rounded">
      <FileText class="size-4" />
      <span>dokumentum.pdf</span>
    </div>
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item>
      <Eye class="mr-2 size-4" />
      Megnyitás
    </ContextMenu.Item>
    <ContextMenu.Item>
      <Download class="mr-2 size-4" />
      Letöltés
    </ContextMenu.Item>
    <ContextMenu.Item>
      <Share class="mr-2 size-4" />
      Megosztás
    </ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.Item>
      <Edit class="mr-2 size-4" />
      Átnevezés
    </ContextMenu.Item>
    <ContextMenu.Item class="text-destructive">
      <Trash2 class="mr-2 size-4" />
      Törlés
    </ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>
```

## Popover

A Popover komponens egy felugró panel, amely egy elem mellett jelenik meg.

### Importálás

```svelte
<script>
  import * as Popover from '$lib/components/ui/popover';
</script>
```

### Alapvető használat

```svelte
<Popover.Root>
  <Popover.Trigger asChild let:builder>
    <Button builders={[builder]} variant="outline">
      Információ
    </Button>
  </Popover.Trigger>
  <Popover.Content>
    <div class="space-y-2">
      <h4 class="font-medium">Popover cím</h4>
      <p class="text-sm text-muted-foreground">
        Ez egy popover tartalom.
      </p>
    </div>
  </Popover.Content>
</Popover.Root>
```

### Példa: Combobox (keresővel)

```svelte
<script>
  import { tick } from 'svelte';
  import { useId } from 'bits-ui';
  import * as Popover from '$lib/components/ui/popover';
  import * as Command from '$lib/components/ui/command';
  import { Button } from '$lib/components/ui/button';
  import Check from 'lucide-svelte/icons/check';
  import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
  import { cn } from '$lib/utils/utils';

  let open = $state(false);
  let selectedValue = $state('');
  const triggerId = useId();

  const items = [
    { value: '1', label: 'Első elem' },
    { value: '2', label: 'Második elem' },
    { value: '3', label: 'Harmadik elem' }
  ];

  function closeAndFocusTrigger() {
    open = false;
    tick().then(() => {
      document.getElementById(triggerId)?.focus();
    });
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger asChild let:builder>
    <Button
      builders={[builder]}
      variant="outline"
      role="combobox"
      aria-expanded={open}
      class="w-[200px] justify-between"
      id={triggerId}
    >
      {selectedValue
        ? items.find((i) => i.value === selectedValue)?.label
        : 'Válassz...'}
      <ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
    </Button>
  </Popover.Trigger>
  <Popover.Content class="w-[200px] p-0">
    <Command.Root>
      <Command.Input placeholder="Keresés..." />
      <Command.Empty>Nincs találat.</Command.Empty>
      <Command.Group>
        {#each items as item}
          <Command.Item
            value={item.value}
            onSelect={(currentValue) => {
              selectedValue = currentValue === selectedValue ? '' : currentValue;
              closeAndFocusTrigger();
            }}
          >
            <Check
              class={cn(
                'mr-2 size-4',
                selectedValue === item.value ? 'opacity-100' : 'opacity-0'
              )}
            />
            {item.label}
          </Command.Item>
        {/each}
      </Command.Group>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
```

### Példa: Form mezővel

```svelte
<Popover.Root>
  <Popover.Trigger asChild let:builder>
    <Button builders={[builder]} variant="outline">
      Szűrők
    </Button>
  </Popover.Trigger>
  <Popover.Content class="w-80">
    <div class="space-y-4">
      <div class="space-y-2">
        <h4 class="font-medium leading-none">Szűrési beállítások</h4>
        <p class="text-sm text-muted-foreground">
          Állítsd be a szűrési feltételeket.
        </p>
      </div>
      <div class="space-y-2">
        <Label for="name">Név</Label>
        <Input id="name" placeholder="Keresés név alapján..." />
      </div>
      <div class="space-y-2">
        <Label for="status">Státusz</Label>
        <Select>
          <option value="">Összes</option>
          <option value="active">Aktív</option>
          <option value="inactive">Inaktív</option>
        </Select>
      </div>
      <div class="flex justify-end gap-2">
        <Button variant="outline" size="sm">Törlés</Button>
        <Button size="sm">Alkalmaz</Button>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
```

## Command

A Command komponens egy parancs paletta keresővel és billentyűparancsokkal.

### Importálás

```svelte
<script>
  import * as Command from '$lib/components/ui/command';
</script>
```

### Alapvető használat

```svelte
<Command.Root>
  <Command.Input placeholder="Keresés..." />
  <Command.List>
    <Command.Empty>Nincs találat.</Command.Empty>
    <Command.Group heading="Műveletek">
      <Command.Item>Új fájl</Command.Item>
      <Command.Item>Új mappa</Command.Item>
      <Command.Item>Mentés</Command.Item>
    </Command.Group>
    <Command.Separator />
    <Command.Group heading="Navigáció">
      <Command.Item>Kezdőlap</Command.Item>
      <Command.Item>Beállítások</Command.Item>
    </Command.Group>
  </Command.List>
</Command.Root>
```

### Példa: Dialog-ban

```svelte
<script>
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Command from '$lib/components/ui/command';

  let open = $state(false);

  // Ctrl+K billentyűparancs
  $effect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        open = !open;
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="p-0">
    <Command.Root>
      <Command.Input placeholder="Parancs keresése..." />
      <Command.List>
        <Command.Empty>Nincs találat.</Command.Empty>
        <Command.Group heading="Műveletek">
          <Command.Item>
            <FileText class="mr-2 size-4" />
            Új dokumentum
          </Command.Item>
          <Command.Item>
            <Folder class="mr-2 size-4" />
            Új mappa
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Root>
  </Dialog.Content>
</Dialog.Root>

<p class="text-sm text-muted-foreground">
  Nyomj <kbd>Ctrl+K</kbd> a parancs paletta megnyitásához
</p>
```

## Best practice-ek

1. **Dropdown Menu ikonokkal** — Használj ikonokat a menüpontok mellett
2. **Destructive műveletek** — Használj `text-destructive` osztályt veszélyes műveletekhez
3. **Separator használat** — Csoportosítsd a kapcsolódó menüpontokat
4. **Context Menu** — Használj jobb klikk menüt fájl/elem műveletekhez
5. **Popover align** — Állítsd be az `align` prop-ot (`start`, `center`, `end`)
6. **Combobox pattern** — Használj Popover + Command kombinációt keresővel
7. **Command Dialog** — Használj Command-ot Dialog-ban parancs paletták készítéséhez
8. **Billentyűparancsok** — Adj hozzá billentyűparancsokat a Command-hoz
9. **Popover width** — Állítsd be a szélességet a tartalomnak megfelelően
10. **Dropdown trigger** — Használj `asChild` prop-ot egyedi trigger gombhoz

## Kapcsolódó komponensek

- [Alapvető komponensek](./basic) — Button, Input, Label
- [Dialog komponensek](./dialogs) — Modal ablakok
- [Ikonok](./icons) — Lucide ikonok használata
- [Tailwind CSS](./tailwind) — Stílusozási utility-k
