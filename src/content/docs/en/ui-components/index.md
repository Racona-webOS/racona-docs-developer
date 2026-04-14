---
title: UI Components
description: Overview of Racona UI components
---

Racona provides a rich UI component library based on **shadcn-svelte** components, **Lucide** icons, **Tailwind CSS 4** styles, and custom components. These components ensure a consistent look and behavior throughout the system.

## Technology Stack

- **shadcn-svelte** — Headless UI components (based on bits-ui)
- **Lucide Svelte** — Icon set (~1400 icons)
- **Tailwind CSS 4** — Utility-first CSS framework (Vite plugin)
- **Tanstack Table** — Data table logic
- **svelte-sonner** — Toast notifications

## Component Categories

### Basic Components

The fundamental UI building blocks you can use in any app.

[Detailed documentation →](./basic)

- **Button** — Buttons with various variants
- **Input** — Text input fields
- **Select** — Dropdown menus
- **Checkbox** — Checkboxes
- **Switch** — Toggle switches
- **Label** — Labels
- **Badge** — Status labels
- **Separator** — Divider lines

### Dialog Components

Modal windows and dialog panels for simple and complex use cases.

[Detailed documentation →](./dialogs)

- **ConfirmDialog** — Confirmation dialog (delete, etc.)
- **CustomDialog** — Custom content dialog
- **AlertDialog** — Alert dialog
- **Drawer** — Side panel

### Notifications

Toast messages and notification system.

[Detailed documentation →](./notifications)

- **Toast** — Transient notifications (svelte-sonner)
- **NotificationStore** — Notification system
- **NotificationList** — Notification list

### DataTable

Server-side data table component with sorting, filtering and pagination.

[Detailed documentation →](./datatable)

- **DataTable** — Main table component
- **Actions Column** — Action column (primary + dropdown)
- **Column Header** — Sortable column header
- **Faceted Filter** — Filter component

### Layout Components

Components for structuring content.

[Detailed documentation →](./layout)

- **Card** — Card component
- **Tabs** — Tab component
- **Separator** — Divider lines

### Navigation

Navigation components and menus.

[Detailed documentation →](./navigation)

- **Dropdown Menu** — Dropdown menu
- **Context Menu** — Right-click menu
- **Command** — Command palette
- **Popover** — Popup panel (Combobox pattern)

### Icons

Lucide icon set usage.

[Detailed documentation →](./icons)

- Icon importing
- Common icons
- Size and style customization

### Tailwind CSS

Utility classes and styling conventions.

[Detailed documentation →](./tailwind)

- Common utility classes
- Color palette
- Responsive design
- Dark mode

## Quick Start

### Component Import

```svelte
<script>
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Dialog from '$lib/components/ui/dialog';
</script>
```

### Icon Usage

```svelte
<script>
  import User from 'lucide-svelte/icons/user';
  import Settings from 'lucide-svelte/icons/settings';
</script>

<User size={24} />
<Settings size={16} class="text-primary" />
```

### Toast Message

```svelte
<script>
  import { toast } from 'svelte-sonner';
</script>

<button onclick={() => toast.success('Saved successfully!')}>
  Save
</button>
```

## Best Practices

1. **Use shadcn components** — Don't build your own buttons, inputs
2. **Toast messages** — Give feedback after every operation
3. **ConfirmDialog for deletion** — Always ask for confirmation on dangerous operations
4. **DataTable server-side** — Use server-side pagination for large datasets
5. **Icons consistently** — Only use Lucide icons
6. **Tailwind utilities** — Prefer them over custom CSS
7. **Responsive design** — Use responsive classes (`sm:`, `md:`, `lg:`)
8. **Accessibility** — Use `Label` component with every input
9. **Loading state** — Display loading state
10. **Semantic colors** — `destructive` for deletion, `primary` for primary action

## Next Steps

Choose a component category from the left menu for detailed documentation and code examples.

## External Documentation

- [shadcn-svelte](https://www.shadcn-svelte.com/) — Component library
- [Lucide icons](https://lucide.dev/icons/) — Full icon list
- [Tailwind CSS](https://tailwindcss.com/docs) — CSS framework
- [Tanstack Table](https://tanstack.com/table/latest) — Table logic
- [svelte-sonner](https://svelte-sonner.vercel.app/) — Toast component
