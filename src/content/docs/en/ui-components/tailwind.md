---
title: Tailwind CSS
description: Using Tailwind CSS 4 in Racona
---

Racona uses **Tailwind CSS 4** via the Vite plugin. There is no `tailwind.config` file — configuration is done in CSS.

## Common Utility Classes

### Layout

```svelte
<!-- Flexbox -->
<div class="flex items-center justify-between gap-4">
<div class="flex flex-col space-y-2">
<div class="flex-1">

<!-- Grid -->
<div class="grid grid-cols-2 gap-4">
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

<!-- Container -->
<div class="container mx-auto px-4">
<div class="max-w-3xl mx-auto">
```

### Spacing

```svelte
<!-- Padding -->
<div class="p-4">        <!-- 1rem all sides -->
<div class="px-4 py-2">  <!-- 1rem horizontal, 0.5rem vertical -->
<div class="pt-8 pb-4">  <!-- 2rem top, 1rem bottom -->

<!-- Margin -->
<div class="m-4">        <!-- 1rem all sides -->
<div class="mx-auto">    <!-- Center horizontally -->
<div class="mt-4 mb-2">  <!-- 1rem top, 0.5rem bottom -->

<!-- Space between -->
<div class="space-y-4">  <!-- 1rem vertical gap between children -->
<div class="space-x-2">  <!-- 0.5rem horizontal gap between children -->

<!-- Gap -->
<div class="gap-4">      <!-- 1rem gap between flex/grid children -->
```

### Typography

```svelte
<!-- Font size -->
<p class="text-xs">      <!-- 0.75rem -->
<p class="text-sm">      <!-- 0.875rem -->
<p class="text-base">    <!-- 1rem -->
<p class="text-lg">      <!-- 1.125rem -->
<p class="text-xl">      <!-- 1.25rem -->
<p class="text-2xl">     <!-- 1.5rem -->

<!-- Font weight -->
<p class="font-normal">  <!-- 400 -->
<p class="font-medium">  <!-- 500 -->
<p class="font-semibold"><!-- 600 -->
<p class="font-bold">    <!-- 700 -->

<!-- Text align -->
<p class="text-left">
<p class="text-center">
<p class="text-right">

<!-- Text color -->
<p class="text-primary">
<p class="text-muted-foreground">
<p class="text-destructive">
```

### Colors

Racona uses semantic colors:

```svelte
<!-- Background -->
<div class="bg-background">      <!-- Main background -->
<div class="bg-primary">         <!-- Primary color -->
<div class="bg-secondary">       <!-- Secondary color -->
<div class="bg-destructive">     <!-- Dangerous action -->
<div class="bg-muted">           <!-- Muted background -->
<div class="bg-accent">          <!-- Accent -->

<!-- Text -->
<p class="text-foreground">      <!-- Main text color -->
<p class="text-primary">         <!-- Primary text -->
<p class="text-muted-foreground"><!-- Muted text -->
<p class="text-destructive">     <!-- Destructive text -->

<!-- Border -->
<div class="border-border">      <!-- Default border -->
<div class="border-primary">     <!-- Primary border -->
<div class="border-destructive"> <!-- Destructive border -->
```

### Sizing

```svelte
<!-- Width -->
<div class="w-full">     <!-- 100% -->
<div class="w-1/2">      <!-- 50% -->
<div class="w-64">       <!-- 16rem -->
<div class="w-auto">     <!-- auto -->
<div class="max-w-3xl">  <!-- max-width: 48rem -->

<!-- Height -->
<div class="h-screen">   <!-- 100vh -->
<div class="h-full">     <!-- 100% -->
<div class="h-64">       <!-- 16rem -->
<div class="min-h-screen"><!-- min-height: 100vh -->
```

### Borders

```svelte
<!-- Border width -->
<div class="border">     <!-- 1px all sides -->
<div class="border-2">   <!-- 2px all sides -->
<div class="border-t">   <!-- 1px top -->
<div class="border-b">   <!-- 1px bottom -->

<!-- Border radius -->
<div class="rounded">    <!-- 0.25rem -->
<div class="rounded-md"> <!-- 0.375rem -->
<div class="rounded-lg"> <!-- 0.5rem -->
<div class="rounded-full"><!-- 9999px (circle) -->

<!-- Border color -->
<div class="border-border">
<div class="border-primary">
```

### Shadow

```svelte
<div class="shadow-sm">  <!-- Small shadow -->
<div class="shadow">     <!-- Medium shadow -->
<div class="shadow-md">  <!-- Large shadow -->
<div class="shadow-lg">  <!-- Extra large shadow -->
```

### Responsive Design

```svelte
<!-- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px) -->

<!-- Mobile: hidden, Desktop: visible -->
<div class="hidden lg:block">

<!-- Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

<!-- Mobile: full width, Desktop: half width -->
<div class="w-full lg:w-1/2">

<!-- Mobile: small padding, Desktop: large padding -->
<div class="p-4 lg:p-8">
```

### Hover and Focus

```svelte
<!-- Hover -->
<button class="hover:bg-primary hover:text-white">

<!-- Focus -->
<input class="focus:ring-2 focus:ring-primary">

<!-- Active -->
<button class="active:scale-95">

<!-- Disabled -->
<button class="disabled:opacity-50 disabled:cursor-not-allowed">
```

### Transitions

```svelte
<!-- Transition -->
<div class="transition-all duration-200">
<div class="transition-colors duration-150">
<div class="transition-transform duration-300">

<!-- Ease -->
<div class="ease-in-out">
<div class="ease-out">
```

### Dark Mode

```svelte
<!-- Automatic dark mode support -->
<div class="bg-white dark:bg-gray-900">
<p class="text-gray-900 dark:text-gray-100">
```

## Common Patterns

### Card

```svelte
<div class="rounded-lg border bg-card p-6 shadow-sm">
  <h3 class="text-lg font-semibold">Title</h3>
  <p class="text-sm text-muted-foreground">Description</p>
</div>
```

### Input Group

```svelte
<div class="space-y-2">
  <label class="text-sm font-medium">Email</label>
  <input class="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-primary" />
</div>
```

### Button Group

```svelte
<div class="flex items-center gap-2">
  <button class="rounded-md bg-primary px-4 py-2 text-white">Save</button>
  <button class="rounded-md border px-4 py-2">Cancel</button>
</div>
```

### Centered Container

```svelte
<div class="flex min-h-screen items-center justify-center">
  <div class="w-full max-w-md space-y-4 p-6">
    <!-- Content -->
  </div>
</div>
```

### Grid Layout

```svelte
<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
  <div class="rounded-lg border p-4">Item 1</div>
  <div class="rounded-lg border p-4">Item 2</div>
  <div class="rounded-lg border p-4">Item 3</div>
</div>
```

## Color Palette

### Primary

Main brand color, primary actions.

```svelte
<div class="bg-primary text-primary-foreground">
<button class="text-primary">
```

### Secondary

Secondary actions, less prominent elements.

```svelte
<div class="bg-secondary text-secondary-foreground">
```

### Destructive

Deletion, dangerous actions.

```svelte
<button class="bg-destructive text-destructive-foreground">
<p class="text-destructive">
```

### Muted

Background elements, less important information.

```svelte
<div class="bg-muted text-muted-foreground">
```

### Accent

Highlights, hover states.

```svelte
<div class="bg-accent text-accent-foreground">
```

### Border

Borders, dividers.

```svelte
<div class="border-border">
```

## Custom CSS

If needed, you can also write custom CSS:

```svelte
<style>
  .custom-class {
    @apply rounded-lg border bg-card p-6;
  }

  .custom-hover:hover {
    @apply bg-primary text-white;
  }
</style>
```

## Best Practices

1. **Utility-first** — Prefer Tailwind classes over custom CSS
2. **Responsive** — Always design for mobile views (`sm:`, `md:`, `lg:`)
3. **Semantic colors** — Use semantic colors (`primary`, `destructive`)
4. **Spacing consistency** — Use consistent spacing values (4, 8, 16, 24, 32)
5. **Dark mode** — Consider dark mode support
6. **Component reuse** — Put repeated classes into components
7. **Accessibility** — Use appropriate contrast and focus states
8. **Performance** — Tailwind automatically removes unused classes

## Related

- [Basic Components →](./basic) — Tailwind usage in components
- [Tailwind CSS documentation](https://tailwindcss.com/docs) — Official documentation
