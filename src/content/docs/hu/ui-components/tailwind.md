---
title: Tailwind CSS
description: Tailwind CSS 4 használata a Rocona-ben
---

A Rocona **Tailwind CSS 4**-et használ a Vite pluginon keresztül. Nincs `tailwind.config` fájl, a konfiguráció a CSS-ben történik.

## Gyakori utility osztályok

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
<div class="p-4">        <!-- 1rem minden oldalon -->
<div class="px-4 py-2">  <!-- 1rem vízszintesen, 0.5rem függőlegesen -->
<div class="pt-8 pb-4">  <!-- 2rem fent, 1rem lent -->

<!-- Margin -->
<div class="m-4">        <!-- 1rem minden oldalon -->
<div class="mx-auto">    <!-- Középre igazítás -->
<div class="mt-4 mb-2">  <!-- 1rem fent, 0.5rem lent -->

<!-- Space between -->
<div class="space-y-4">  <!-- 1rem függőleges távolság gyerekek között -->
<div class="space-x-2">  <!-- 0.5rem vízszintes távolság gyerekek között -->

<!-- Gap -->
<div class="gap-4">      <!-- 1rem távolság flex/grid gyerekek között -->
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

A Rocona szemantikus színeket használ:

```svelte
<!-- Background -->
<div class="bg-background">      <!-- Fő háttér -->
<div class="bg-primary">         <!-- Elsődleges szín -->
<div class="bg-secondary">       <!-- Másodlagos szín -->
<div class="bg-destructive">     <!-- Veszélyes művelet -->
<div class="bg-muted">           <!-- Tompított háttér -->
<div class="bg-accent">          <!-- Kiemelés -->

<!-- Text -->
<p class="text-foreground">      <!-- Fő szövegszín -->
<p class="text-primary">         <!-- Elsődleges szöveg -->
<p class="text-muted-foreground"><!-- Tompított szöveg -->
<p class="text-destructive">     <!-- Veszélyes szöveg -->

<!-- Border -->
<div class="border-border">      <!-- Alapértelmezett szegély -->
<div class="border-primary">     <!-- Elsődleges szegély -->
<div class="border-destructive"> <!-- Veszélyes szegély -->
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
<div class="border">     <!-- 1px minden oldalon -->
<div class="border-2">   <!-- 2px minden oldalon -->
<div class="border-t">   <!-- 1px fent -->
<div class="border-b">   <!-- 1px lent -->

<!-- Border radius -->
<div class="rounded">    <!-- 0.25rem -->
<div class="rounded-md"> <!-- 0.375rem -->
<div class="rounded-lg"> <!-- 0.5rem -->
<div class="rounded-full"><!-- 9999px (kör) -->

<!-- Border color -->
<div class="border-border">
<div class="border-primary">
```

### Shadow

```svelte
<div class="shadow-sm">  <!-- Kicsi árnyék -->
<div class="shadow">     <!-- Közepes árnyék -->
<div class="shadow-md">  <!-- Nagy árnyék -->
<div class="shadow-lg">  <!-- Extra nagy árnyék -->
```

### Responsive design

```svelte
<!-- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px) -->

<!-- Mobil: rejtett, Desktop: látható -->
<div class="hidden lg:block">

<!-- Mobil: 1 oszlop, Tablet: 2 oszlop, Desktop: 3 oszlop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

<!-- Mobil: teljes szélesség, Desktop: fél szélesség -->
<div class="w-full lg:w-1/2">

<!-- Mobil: kicsi padding, Desktop: nagy padding -->
<div class="p-4 lg:p-8">
```

### Hover és Focus

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

### Dark mode

```svelte
<!-- Automatikus dark mode támogatás -->
<div class="bg-white dark:bg-gray-900">
<p class="text-gray-900 dark:text-gray-100">
```

## Gyakori minták

### Card

```svelte
<div class="rounded-lg border bg-card p-6 shadow-sm">
  <h3 class="text-lg font-semibold">Cím</h3>
  <p class="text-sm text-muted-foreground">Leírás</p>
</div>
```

### Input csoport

```svelte
<div class="space-y-2">
  <label class="text-sm font-medium">Email</label>
  <input class="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-primary" />
</div>
```

### Button csoport

```svelte
<div class="flex items-center gap-2">
  <button class="rounded-md bg-primary px-4 py-2 text-white">Mentés</button>
  <button class="rounded-md border px-4 py-2">Mégse</button>
</div>
```

### Centered container

```svelte
<div class="flex min-h-screen items-center justify-center">
  <div class="w-full max-w-md space-y-4 p-6">
    <!-- Tartalom -->
  </div>
</div>
```

### Grid layout

```svelte
<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
  <div class="rounded-lg border p-4">Item 1</div>
  <div class="rounded-lg border p-4">Item 2</div>
  <div class="rounded-lg border p-4">Item 3</div>
</div>
```

## Színpaletta

### Primary (Elsődleges)

Fő brand szín, elsődleges műveletek.

```svelte
<div class="bg-primary text-primary-foreground">
<button class="text-primary">
```

### Secondary (Másodlagos)

Másodlagos műveletek, kevésbé hangsúlyos elemek.

```svelte
<div class="bg-secondary text-secondary-foreground">
```

### Destructive (Veszélyes)

Törlés, veszélyes műveletek.

```svelte
<button class="bg-destructive text-destructive-foreground">
<p class="text-destructive">
```

### Muted (Tompított)

Háttér elemek, kevésbé fontos információk.

```svelte
<div class="bg-muted text-muted-foreground">
```

### Accent (Kiemelés)

Kiemelések, hover állapotok.

```svelte
<div class="bg-accent text-accent-foreground">
```

### Border (Szegély)

Szegélyek, elválasztók.

```svelte
<div class="border-border">
```

## Custom CSS

Ha szükséges, egyedi CSS-t is írhatsz:

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

## Best practice-ek

1. **Utility-first** — Részesítsd előnyben a Tailwind osztályokat az egyedi CSS-sel szemben
2. **Responsive** — Mindig tervezz mobil nézetekre (`sm:`, `md:`, `lg:`)
3. **Szemantikus színek** — Használd a szemantikus színeket (`primary`, `destructive`)
4. **Spacing konzisztencia** — Használj egységes spacing értékeket (4, 8, 16, 24, 32)
5. **Dark mode** — Gondolj a dark mode támogatásra
6. **Komponens újrafelhasználás** — Ismétlődő osztályokat rakd komponensbe
7. **Accessibility** — Használj megfelelő kontrasztot és focus állapotokat
8. **Performance** — A Tailwind automatikusan eltávolítja a nem használt osztályokat

## Kapcsolódó

- [Alapvető komponensek →](./basic) — Tailwind használata komponensekben
- [Tailwind CSS dokumentáció](https://tailwindcss.com/docs) — Hivatalos dokumentáció
