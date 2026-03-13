---
title: Ikonok
description: Lucide ikonkészlet használata az ElyOS-ben
---

Az ElyOS a **Lucide Svelte** ikonkészletet használja, amely ~1400 gyönyörű, konzisztens ikont tartalmaz.

## Alapvető használat

```svelte
<script>
  import User from 'lucide-svelte/icons/user';
  import Settings from 'lucide-svelte/icons/settings';
  import Trash2 from 'lucide-svelte/icons/trash-2';
</script>

<User />
<Settings />
<Trash2 />
```

## Méret beállítása

```svelte
<User size={16} />  <!-- Kicsi -->
<User size={24} />  <!-- Közepes (default) -->
<User size={32} />  <!-- Nagy -->
<User size={48} />  <!-- Extra nagy -->
```

## Szín beállítása

```svelte
<!-- Tailwind osztályokkal -->
<User class="text-primary" />
<User class="text-destructive" />
<User class="text-muted-foreground" />

<!-- Inline style-lal -->
<User style="color: #3b82f6;" />
```

## Stroke width

```svelte
<User strokeWidth={1} />    <!-- Vékony -->
<User strokeWidth={1.5} />  <!-- Közepes (default) -->
<User strokeWidth={2} />    <!-- Vastag -->
<User strokeWidth={2.5} />  <!-- Extra vastag -->
```

## Gyakori ikonok

### Felhasználók és profilok

```svelte
<script>
  import User from 'lucide-svelte/icons/user';
  import Users from 'lucide-svelte/icons/users';
  import UserPlus from 'lucide-svelte/icons/user-plus';
  import UserMinus from 'lucide-svelte/icons/user-minus';
  import UserCheck from 'lucide-svelte/icons/user-check';
  import UserX from 'lucide-svelte/icons/user-x';
</script>
```

### Műveletek

```svelte
<script>
  import Plus from 'lucide-svelte/icons/plus';
  import PlusCircle from 'lucide-svelte/icons/plus-circle';
  import Minus from 'lucide-svelte/icons/minus';
  import Edit from 'lucide-svelte/icons/edit';
  import Pencil from 'lucide-svelte/icons/pencil';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import Save from 'lucide-svelte/icons/save';
  import Copy from 'lucide-svelte/icons/copy';
</script>
```

### Navigáció

```svelte
<script>
  import ChevronLeft from 'lucide-svelte/icons/chevron-left';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';
  import ChevronDown from 'lucide-svelte/icons/chevron-down';
  import ChevronUp from 'lucide-svelte/icons/chevron-up';
  import ArrowLeft from 'lucide-svelte/icons/arrow-left';
  import ArrowRight from 'lucide-svelte/icons/arrow-right';
  import Menu from 'lucide-svelte/icons/menu';
  import X from 'lucide-svelte/icons/x';
</script>
```

### Állapotok

```svelte
<script>
  import Check from 'lucide-svelte/icons/check';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import X from 'lucide-svelte/icons/x';
  import XCircle from 'lucide-svelte/icons/x-circle';
  import AlertCircle from 'lucide-svelte/icons/alert-circle';
  import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
  import Info from 'lucide-svelte/icons/info';
  import HelpCircle from 'lucide-svelte/icons/help-circle';
</script>
```

### Beállítások és eszközök

```svelte
<script>
  import Settings from 'lucide-svelte/icons/settings';
  import Settings2 from 'lucide-svelte/icons/settings-2';
  import Sliders from 'lucide-svelte/icons/sliders';
  import Filter from 'lucide-svelte/icons/filter';
  import Search from 'lucide-svelte/icons/search';
  import Download from 'lucide-svelte/icons/download';
  import Upload from 'lucide-svelte/icons/upload';
</script>
```

### Fájlok és mappák

```svelte
<script>
  import File from 'lucide-svelte/icons/file';
  import FileText from 'lucide-svelte/icons/file-text';
  import Folder from 'lucide-svelte/icons/folder';
  import FolderOpen from 'lucide-svelte/icons/folder-open';
  import Image from 'lucide-svelte/icons/image';
  import Paperclip from 'lucide-svelte/icons/paperclip';
</script>
```

### Kommunikáció

```svelte
<script>
  import Mail from 'lucide-svelte/icons/mail';
  import MessageSquare from 'lucide-svelte/icons/message-square';
  import Bell from 'lucide-svelte/icons/bell';
  import BellOff from 'lucide-svelte/icons/bell-off';
  import Phone from 'lucide-svelte/icons/phone';
  import Send from 'lucide-svelte/icons/send';
</script>
```

### Egyéb

```svelte
<script>
  import Home from 'lucide-svelte/icons/home';
  import Calendar from 'lucide-svelte/icons/calendar';
  import Clock from 'lucide-svelte/icons/clock';
  import Eye from 'lucide-svelte/icons/eye';
  import EyeOff from 'lucide-svelte/icons/eye-off';
  import Lock from 'lucide-svelte/icons/lock';
  import Unlock from 'lucide-svelte/icons/unlock';
  import Shield from 'lucide-svelte/icons/shield';
  import Star from 'lucide-svelte/icons/star';
  import Heart from 'lucide-svelte/icons/heart';
  import EllipsisVertical from 'lucide-svelte/icons/ellipsis-vertical';
</script>
```

## Használat komponensekben

### Button-nel

```svelte
<script>
  import { Button } from '$lib/components/ui/button';
  import Plus from 'lucide-svelte/icons/plus';
  import Trash2 from 'lucide-svelte/icons/trash-2';
</script>

<Button>
  <Plus size={16} class="mr-2" />
  Új létrehozása
</Button>

<Button variant="destructive">
  <Trash2 size={16} class="mr-2" />
  Törlés
</Button>
```

### Input-tal

```svelte
<script>
  import { Input } from '$lib/components/ui/input';
  import Search from 'lucide-svelte/icons/search';
</script>

<div class="relative">
  <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
  <Input placeholder="Keresés..." class="pl-9" />
</div>
```

### Badge-dzsel

```svelte
<script>
  import { Badge } from '$lib/components/ui/badge';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import XCircle from 'lucide-svelte/icons/x-circle';
</script>

<Badge>
  <CheckCircle size={14} class="mr-1" />
  Aktív
</Badge>

<Badge variant="destructive">
  <XCircle size={14} class="mr-1" />
  Inaktív
</Badge>
```

## Animációk

### Forgás

```svelte
<script>
  import Loader2 from 'lucide-svelte/icons/loader-2';
</script>

<Loader2 class="animate-spin" />
```

### Pulse

```svelte
<script>
  import Bell from 'lucide-svelte/icons/bell';
</script>

<Bell class="animate-pulse text-destructive" />
```

## Ikon keresés

Az összes elérhető ikon megtalálható a Lucide hivatalos weboldalán:

**[lucide.dev/icons](https://lucide.dev/icons/)**

A keresőben begépelheted az ikon nevét angolul (pl. "user", "settings", "trash").

## Best practice-ek

1. **Konzisztens méret** — Használj egységes méreteket (16px gombokban, 24px címekben)
2. **Stroke width** — Tartsd az alapértelmezett 1.5-öt, csak indokolt esetben változtasd
3. **Szín** — Használj Tailwind színosztályokat az inline style helyett
4. **Spacing** — Adj margót az ikon és szöveg között (`mr-2`, `ml-2`)
5. **Accessibility** — Adj `aria-label`-t az ikon-only gombokhoz
6. **Import** — Csak a használt ikonokat importáld (tree-shaking)
7. **Elnevezés** — Használd a Lucide hivatalos neveit (pl. `trash-2`, nem `trash2`)
8. **Kontextus** — Válassz szemantikus ikonokat (piros X törléshez, zöld pipa sikerhez)

## Kapcsolódó

- [Alapvető komponensek →](./basic) — Button, Badge
- [DataTable →](./datatable) — Ikonok táblázatokban
- [Lucide hivatalos oldal](https://lucide.dev/) — Teljes ikonlista
