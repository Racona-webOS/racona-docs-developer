---
title: Icons
description: Using the Lucide icon set in Racona
---

Racona uses the **Lucide Svelte** icon set, which contains ~1400 beautiful, consistent icons.

## Basic Usage

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

## Setting Size

```svelte
<User size={16} />  <!-- Small -->
<User size={24} />  <!-- Medium (default) -->
<User size={32} />  <!-- Large -->
<User size={48} />  <!-- Extra large -->
```

## Setting Color

```svelte
<!-- With Tailwind classes -->
<User class="text-primary" />
<User class="text-destructive" />
<User class="text-muted-foreground" />

<!-- With inline style -->
<User style="color: #3b82f6;" />
```

## Stroke Width

```svelte
<User strokeWidth={1} />    <!-- Thin -->
<User strokeWidth={1.5} />  <!-- Medium (default) -->
<User strokeWidth={2} />    <!-- Thick -->
<User strokeWidth={2.5} />  <!-- Extra thick -->
```

## Common Icons

### Users and Profiles

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

### Actions

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

### Navigation

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

### States

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

### Settings and Tools

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

### Files and Folders

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

### Communication

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

### Other

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

## Usage in Components

### With Button

```svelte
<script>
  import { Button } from '$lib/components/ui/button';
  import Plus from 'lucide-svelte/icons/plus';
  import Trash2 from 'lucide-svelte/icons/trash-2';
</script>

<Button>
  <Plus size={16} class="mr-2" />
  Create new
</Button>

<Button variant="destructive">
  <Trash2 size={16} class="mr-2" />
  Delete
</Button>
```

### With Input

```svelte
<script>
  import { Input } from '$lib/components/ui/input';
  import Search from 'lucide-svelte/icons/search';
</script>

<div class="relative">
  <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
  <Input placeholder="Search..." class="pl-9" />
</div>
```

### With Badge

```svelte
<script>
  import { Badge } from '$lib/components/ui/badge';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import XCircle from 'lucide-svelte/icons/x-circle';
</script>

<Badge>
  <CheckCircle size={14} class="mr-1" />
  Active
</Badge>

<Badge variant="destructive">
  <XCircle size={14} class="mr-1" />
  Inactive
</Badge>
```

## Animations

### Spin

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

## Icon Search

All available icons can be found on the Lucide official website:

**[lucide.dev/icons](https://lucide.dev/icons/)**

You can type the icon name in English in the search box (e.g. "user", "settings", "trash").

## Best Practices

1. **Consistent size** — Use uniform sizes (16px in buttons, 24px in headings)
2. **Stroke width** — Keep the default 1.5, only change when justified
3. **Color** — Use Tailwind color classes instead of inline style
4. **Spacing** — Add margin between icon and text (`mr-2`, `ml-2`)
5. **Accessibility** — Add `aria-label` to icon-only buttons
6. **Import** — Only import the icons you use (tree-shaking)
7. **Naming** — Use Lucide official names (e.g. `trash-2`, not `trash2`)
8. **Context** — Choose semantic icons (red X for delete, green check for success)

## Related

- [Basic Components →](./basic) — Button, Badge
- [DataTable →](./datatable) — Icons in tables
- [Lucide official site](https://lucide.dev/) — Full icon list
