---
title: UI Komponensek
description: Értesítési UI komponensek az ElyOS-ben
---

Az értesítési rendszer három fő UI komponenst tartalmaz a felhasználói élmény biztosításához.

## NotificationCenter

A taskbar harang ikonja és az értesítési központ panel.

### Funkciók

- Olvasatlan értesítések számlálója
- Kritikus értesítések jelzése (sárga felkiáltójel)
- Értesítések listája időrendben
- Értesítésre kattintva app megnyitása
- Értesítés olvasottnak jelölése
- Értesítés törlése
- Összes értesítés olvasottnak jelölése
- Összes értesítés törlése
- Értesítések frissítése

### Használat

```svelte
<!-- Taskbar.svelte -->
<script>
  import NotificationCenter from '$lib/components/core/NotificationCenter.svelte';
</script>

<NotificationCenter />
```

### Megjelenés

- **Harang ikon** — Taskbar-on, jobb oldalon
- **Számláló badge** — Piros körben az olvasatlan értesítések száma
- **Kritikus jelző** — Sárga felkiáltójel kritikus értesítéseknél
- **Panel** — Jobb felső sarokban, 380px széles

## CriticalNotificationDialog

Modal dialog kritikus értesítésekhez.

### Funkciók

- Automatikusan megjelenik kritikus értesítéseknél
- Megakasztja a felhasználó munkáját
- Kötelező elismerni (OK gomb)
- Többnyelvű tartalom támogatás
- Automatikus olvasottnak jelölés elismerés után

### Használat

```svelte
<!-- Desktop.svelte -->
<script>
  import CriticalNotificationDialog from '$lib/components/core/CriticalNotificationDialog.svelte';
</script>

<CriticalNotificationDialog />
```

### Működés

1. Kritikus értesítés érkezik
2. NotificationStore hozzáadja a `_criticalQueue`-hoz
3. Dialog automatikusan megjelenik
4. Felhasználó kattint az OK gombra
5. `acknowledgeCritical()` meghívódik
6. Értesítés automatikusan olvasottnak jelölődik
7. Következő kritikus értesítés megjelenik (ha van)

## Toast Értesítések

Automatikus toast értesítések új értesítéseknél (kivéve critical típus).

### Funkciók

- Automatikus megjelenítés új értesítéseknél
- Típus alapú színezés és ikon
- "Megnyitás" gomb az értesítési központ megnyitásához
- 5 másodperc után automatikus eltűnés
- Többnyelvű tartalom támogatás

### Típusok és Színek

| Típus | Szín | Ikon |
|-------|------|------|
| info | Kék | Info ikon |
| success | Zöld | CheckCircle ikon |
| warning | Sárga | AlertTriangle ikon |
| error | Piros | XCircle ikon |

### Implementáció

A toast-ok automatikusan megjelennek a NotificationStore-ban:

```typescript
// notificationStore.svelte.ts
private showToastNotification(notification: Notification) {
  if (notification.type === 'critical') {
    // Critical értesítések a dialog-ba kerülnek
    this._criticalQueue = [...this._criticalQueue, notification];
    return;
  }

  import('svelte-sonner').then(({ toast }) => {
    const title = getLocalizedText(notification.title);
    const message = getLocalizedText(notification.message);

    const toastFn = toast[notification.type] || toast.info;
    toastFn(title, {
      description: message,
      duration: 5000,
      action: {
        label: 'Megnyitás',
        onClick: () => this.openNotificationInApp(notification.id)
      }
    });
  });
}
```

### Toaster Komponens

A toast-ok megjelenítéséhez szükséges a `Toaster` komponens a layout-ban:

```svelte
<!-- +layout.svelte -->
<script>
  import { Toaster } from 'svelte-sonner';
</script>

<Toaster />

<slot />
```

## Browser Értesítések

Natív browser értesítések támogatása.

### Funkciók

- Automatikus engedély kérés
- Értesítés megjelenítése böngésző szinten
- Működik akkor is, ha az alkalmazás nincs fókuszban

### Implementáció

```typescript
// notificationStore.svelte.ts
private showBrowserNotification(notification: Notification) {
  if (!browser || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.svg',
      tag: `notification-${notification.id}`
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.svg',
          tag: `notification-${notification.id}`
        });
      }
    });
  }
}
```

## Értesítés Ikonok

Az értesítések típus alapján különböző ikonokat használnak:

```typescript
import {
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-svelte';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    case 'error':
    case 'critical':
      return XCircle;
    default:
      return Info;
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case 'success':
      return 'text-green-600 dark:text-green-400';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'error':
    case 'critical':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-blue-600 dark:text-blue-400';
  }
}
```

## Következő Lépések

- [API és Socket.IO →](/hu/notifications-api)
- [NotificationStore →](/hu/notifications-store)
- [Értesítési Rendszer Áttekintés →](/hu/notifications)
