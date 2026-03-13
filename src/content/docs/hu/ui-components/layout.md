---
title: Layout komponensek
description: Tartalom strukturálásához használt komponensek
---

A layout komponensek segítenek a tartalom vizuális strukturálásában és csoportosításában.

## Card

A Card komponens tartalmi egységek vizuális csoportosítására szolgál.

### Importálás

```svelte
<script>
  import * as Card from '$lib/components/ui/card';
</script>
```

### Alapvető használat

```svelte
<Card.Root>
  <Card.Header>
    <Card.Title>Kártya címe</Card.Title>
    <Card.Description>Kártya leírása</Card.Description>
  </Card.Header>
  <Card.Content>
    <p>A kártya tartalma ide kerül.</p>
  </Card.Content>
  <Card.Footer>
    <Button>Művelet</Button>
  </Card.Footer>
</Card.Root>
```

### Komponens részek

- **Card.Root** — Fő konténer
- **Card.Header** — Fejléc rész (opcionális)
- **Card.Title** — Cím
- **Card.Description** — Leírás
- **Card.Content** — Fő tartalom
- **Card.Footer** — Lábléc (opcionális, gyakran gombokkal)

### Példa: Üres állapot

```svelte
<Card.Root class="border-dashed">
  <Card.Content class="flex flex-col items-center justify-center py-16 text-center">
    <div class="bg-primary/10 mb-6 flex size-20 items-center justify-center rounded-full">
      <Store class="text-primary size-10" />
    </div>

    <h3 class="mb-2 text-xl font-semibold">Hamarosan elérhető</h3>
    <p class="text-muted-foreground mb-6 max-w-md">
      Ez a funkció jelenleg fejlesztés alatt áll.
    </p>

    <Button>Értesítés kérése</Button>
  </Card.Content>
</Card.Root>
```

### Példa: Információs kártya

```svelte
<Card.Root>
  <Card.Header>
    <Card.Title>Felhasználói profil</Card.Title>
    <Card.Description>Személyes adatok kezelése</Card.Description>
  </Card.Header>
  <Card.Content class="space-y-4">
    <div>
      <Label for="name">Név</Label>
      <Input id="name" value="Kovács János" />
    </div>
    <div>
      <Label for="email">Email</Label>
      <Input id="email" type="email" value="kovacs@example.com" />
    </div>
  </Card.Content>
  <Card.Footer class="flex justify-end gap-2">
    <Button variant="outline">Mégse</Button>
    <Button>Mentés</Button>
  </Card.Footer>
</Card.Root>
```

### Stílusozás

A Card komponens támogatja a Tailwind osztályokat:

```svelte
<!-- Szaggatott szegély -->
<Card.Root class="border-dashed">

<!-- Árnyék nélkül -->
<Card.Root class="shadow-none">

<!-- Háttérszín -->
<Card.Root class="bg-muted">

<!-- Hover effekt -->
<Card.Root class="hover:shadow-lg transition-shadow">
```

## Tabs

A Tabs komponens több tartalom közötti váltásra szolgál fülekkel.

### Importálás

```svelte
<script>
  import * as Tabs from '$lib/components/ui/tabs';
</script>
```

### Alapvető használat

```svelte
<script>
  let activeTab = $state('members');
</script>

<Tabs.Root bind:value={activeTab}>
  <Tabs.List>
    <Tabs.Trigger value="members">Tagok</Tabs.Trigger>
    <Tabs.Trigger value="permissions">Jogosultságok</Tabs.Trigger>
    <Tabs.Trigger value="apps">Alkalmazások</Tabs.Trigger>
  </Tabs.List>

  <Tabs.Content value="members">
    <p>Tagok listája...</p>
  </Tabs.Content>

  <Tabs.Content value="permissions">
    <p>Jogosultságok listája...</p>
  </Tabs.Content>

  <Tabs.Content value="apps">
    <p>Alkalmazások listája...</p>
  </Tabs.Content>
</Tabs.Root>
```

### Komponens részek

- **Tabs.Root** — Fő konténer, `value` prop-pal az aktív fül vezérlése
- **Tabs.List** — Fül gombok konténere
- **Tabs.Trigger** — Fül gomb, `value` prop-pal azonosítva
- **Tabs.Content** — Fül tartalma, `value` prop-pal azonosítva

### Példa: DataTable-lel

```svelte
<script>
  let activeTab = $state('members');
  let users = $state([]);
  let permissions = $state([]);
  let apps = $state([]);
</script>

<Tabs.Root bind:value={activeTab}>
  <Tabs.List>
    <Tabs.Trigger value="members">
      {t('users.groups.detail.members')}
    </Tabs.Trigger>
    <Tabs.Trigger value="permissions">
      {t('users.groups.detail.permissions')}
    </Tabs.Trigger>
    <Tabs.Trigger value="apps">
      {t('users.groups.detail.apps')}
    </Tabs.Trigger>
  </Tabs.List>

  <Tabs.Content value="members">
    <DataTable
      columns={userColumns}
      data={users}
      pagination={userPaginationInfo}
      loading={userLoading}
      striped
      initialSortBy="name"
      initialSortOrder="asc"
      initialPageSize={10}
      onStateChange={handleUserStateChange}
    />
  </Tabs.Content>

  <Tabs.Content value="permissions">
    <DataTable
      columns={permColumns}
      data={permissions}
      pagination={permPaginationInfo}
      loading={permLoading}
      striped
      initialSortBy="name"
      initialSortOrder="asc"
      initialPageSize={10}
      onStateChange={handlePermStateChange}
    />
  </Tabs.Content>

  <Tabs.Content value="apps">
    <DataTable
      columns={appColumns}
      data={apps}
      pagination={appPaginationInfo}
      loading={appLoading}
      striped
      initialSortBy="name"
      initialSortOrder="asc"
      initialPageSize={10}
      onStateChange={handleAppStateChange}
    />
  </Tabs.Content>
</Tabs.Root>
```

### Programozott fül váltás

```svelte
<script>
  let activeTab = $state('tab1');

  function goToNextTab() {
    if (activeTab === 'tab1') activeTab = 'tab2';
    else if (activeTab === 'tab2') activeTab = 'tab3';
  }
</script>

<Tabs.Root bind:value={activeTab}>
  <Tabs.List>
    <Tabs.Trigger value="tab1">1. lépés</Tabs.Trigger>
    <Tabs.Trigger value="tab2">2. lépés</Tabs.Trigger>
    <Tabs.Trigger value="tab3">3. lépés</Tabs.Trigger>
  </Tabs.List>

  <Tabs.Content value="tab1">
    <p>Első lépés tartalma</p>
    <Button onclick={goToNextTab}>Következő</Button>
  </Tabs.Content>

  <Tabs.Content value="tab2">
    <p>Második lépés tartalma</p>
    <Button onclick={goToNextTab}>Következő</Button>
  </Tabs.Content>

  <Tabs.Content value="tab3">
    <p>Harmadik lépés tartalma</p>
    <Button>Befejezés</Button>
  </Tabs.Content>
</Tabs.Root>
```

## Separator

A Separator komponens vizuális elválasztó vonal tartalmak között.

### Importálás

```svelte
<script>
  import { Separator } from '$lib/components/ui/separator';
</script>
```

### Vízszintes elválasztó

```svelte
<div>
  <h3>Első szekció</h3>
  <p>Tartalom...</p>
</div>

<Separator class="my-4" />

<div>
  <h3>Második szekció</h3>
  <p>Tartalom...</p>
</div>
```

### Függőleges elválasztó

```svelte
<div class="flex items-center gap-4">
  <Button>Mentés</Button>
  <Separator orientation="vertical" class="h-6" />
  <Button variant="outline">Mégse</Button>
</div>
```

### Példa: Menü elválasztó

```svelte
<div class="space-y-1">
  <Button variant="ghost" class="w-full justify-start">
    <User class="mr-2 size-4" />
    Profil
  </Button>
  <Button variant="ghost" class="w-full justify-start">
    <Settings class="mr-2 size-4" />
    Beállítások
  </Button>

  <Separator class="my-2" />

  <Button variant="ghost" class="w-full justify-start text-destructive">
    <LogOut class="mr-2 size-4" />
    Kijelentkezés
  </Button>
</div>
```

## Best practice-ek

1. **Card használat** — Csoportosítsd a kapcsolódó tartalmakat Card-okba
2. **Card.Footer** — Művelet gombokat helyezz a Footer-be
3. **Tabs DataTable-lel** — Nagy adathalmazoknál használj Tabs-ot a tartalom szervezésére
4. **Separator spacing** — Használj megfelelő margin osztályokat (`my-4`, `my-6`)
5. **Függőleges Separator** — Állítsd be a magasságot (`h-6`, `h-8`)
6. **Card stílusozás** — Használj `border-dashed`-t üres állapotokhoz
7. **Tabs kezdőérték** — Mindig adj meg kezdő `value`-t a Tabs.Root-nak
8. **Card.Description** — Használj leírást a kontextus megadásához
9. **Responsive Card** — Használj responsive osztályokat (`sm:`, `md:`, `lg:`)
10. **Separator szín** — A Separator automatikusan használja a téma színeket

## Kapcsolódó komponensek

- [Alapvető komponensek](./basic) — Button, Input, Label
- [Dialog komponensek](./dialogs) — Modal ablakok
- [DataTable](./datatable) — Adattáblák Tabs-ban
- [Tailwind CSS](./tailwind) — Stílusozási utility-k
