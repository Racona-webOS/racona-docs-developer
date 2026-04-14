---
title: UI Komponensek
description: Racona UI komponensek áttekintése
---

A Rocona egy gazdag UI komponens könyvtárat biztosít, amely **shadcn-svelte** alapú komponenseket, **Lucide** ikonokat, **Tailwind CSS 4** stílusokat és egyedi komponenseket tartalmaz. Ezek a komponensek biztosítják az egységes megjelenést és működést az egész rendszerben.

## Technológiai stack

- **shadcn-svelte** — Headless UI komponensek (bits-ui alapon)
- **Lucide Svelte** — Ikonkészlet (~1400 ikon)
- **Tailwind CSS 4** — Utility-first CSS framework (Vite plugin)
- **Tanstack Table** — Adattábla logika
- **svelte-sonner** — Toast értesítések

## Komponens kategóriák

### Alapvető komponensek

Az alapvető UI építőelemek, amelyeket minden alkalmazásban használhatsz.

[Részletes dokumentáció →](./basic)

- **Button** — Gombok különböző variánsokkal
- **Input** — Szöveges beviteli mezők
- **Select** — Legördülő menük
- **Checkbox** — Jelölőnégyzetek
- **Switch** — Kapcsolók
- **Label** — Címkék
- **Badge** — Státusz címkék
- **Separator** — Elválasztó vonalak

### Dialog komponensek

Modal ablakok és párbeszédpanelek egyszerű és összetett használatra.

[Részletes dokumentáció →](./dialogs)

- **ConfirmDialog** — Megerősítő ablak (törlés, stb.)
- **CustomDialog** — Egyedi tartalmú dialog
- **AlertDialog** — Figyelmeztetés ablak
- **Drawer** — Oldalsó panel

### Értesítések

Toast üzenetek és értesítési rendszer.

[Részletes dokumentáció →](./notifications)

- **Toast** — Átmeneti értesítések (svelte-sonner)
- **NotificationStore** — Értesítési rendszer
- **NotificationList** — Értesítések listája

### DataTable

Szerver oldali adattábla komponens rendezéssel, szűréssel és lapozással.

[Részletes dokumentáció →](./datatable)

- **DataTable** — Fő táblázat komponens
- **Actions Column** — Műveleti oszlop (elsődleges + dropdown)
- **Column Header** — Rendezhető oszlopfejléc
- **Faceted Filter** — Szűrő komponens

### Layout komponensek

Tartalom strukturálásához használt komponensek.

[Részletes dokumentáció →](./layout)

- **Card** — Kártya komponens
- **Tabs** — Fül komponens
- **Separator** — Elválasztó vonalak

### Navigáció

Navigációs komponensek és menük.

[Részletes dokumentáció →](./navigation)

- **Dropdown Menu** — Legördülő menü
- **Context Menu** — Jobb klikk menü
- **Command** — Parancs paletta
- **Popover** — Felugró panel (Combobox pattern)

### Ikonok

Lucide ikonkészlet használata.

[Részletes dokumentáció →](./icons)

- Ikon importálás
- Gyakori ikonok
- Méret és stílus testreszabás

### Tailwind CSS

Utility osztályok és stílusozási konvenciók.

[Részletes dokumentáció →](./tailwind)

- Gyakori utility osztályok
- Színpaletta
- Responsive design
- Dark mode

## Gyors kezdés

### Komponens importálás

```svelte
<script>
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Dialog from '$lib/components/ui/dialog';
</script>
```

### Ikon használat

```svelte
<script>
  import User from 'lucide-svelte/icons/user';
  import Settings from 'lucide-svelte/icons/settings';
</script>

<User size={24} />
<Settings size={16} class="text-primary" />
```

### Toast üzenet

```svelte
<script>
  import { toast } from 'svelte-sonner';
</script>

<button onclick={() => toast.success('Sikeres mentés!')}>
  Mentés
</button>
```

## Best practice-ek

1. **Használj shadcn komponenseket** — Ne építs saját gombokat, inputokat
2. **Toast üzenetek** — Minden művelet után adj visszajelzést
3. **ConfirmDialog törléshez** — Mindig kérj megerősítést veszélyes műveleteknél
4. **DataTable szerver oldali** — Nagy adathalmazoknál szerver oldali lapozás
5. **Ikonok konzisztensen** — Csak Lucide ikonokat használj
6. **Tailwind utility-k** — Részesítsd előnyben az egyedi CSS-sel szemben
7. **Responsive design** — Használj responsive osztályokat (`sm:`, `md:`, `lg:`)
8. **Accessibility** — Használj `Label` komponenst minden input mellett
9. **Loading állapot** — Jelenítsd meg a betöltési állapotot
10. **Színek szemantikusan** — `destructive` törléshez, `primary` elsődleges művelethez

## Következő lépések

Válassz egy komponens kategóriát a bal oldali menüből a részletes dokumentációért és kód példákért.

## Külső dokumentáció

- [shadcn-svelte](https://www.shadcn-svelte.com/) — Komponens könyvtár
- [Lucide ikonok](https://lucide.dev/icons/) — Teljes ikonlista
- [Tailwind CSS](https://tailwindcss.com/docs) — CSS framework
- [Tanstack Table](https://tanstack.com/table/latest) — Táblázat logika
- [svelte-sonner](https://svelte-sonner.vercel.app/) — Toast komponens
