---
title: NotificationStore
description: Globális Svelte store az értesítések kezeléséhez
---

A NotificationStore egy globális Svelte 5 store, amely kezeli az értesítések állapotát és a Socket.IO kapcsolatot. Automatikusan fallback-el REST API polling-ra, ha a WebSocket nem elérhető.

## Automatikus Fallback

A store intelligensen kezeli a kapcsolati problémákat:

1. **Socket.IO kapcsolódás sikeres** → Valós idejű értesítések WebSocket-en
2. **Socket.IO kapcsolódás sikertelen** → Automatikus polling 30 másodpercenként
3. **Socket.IO kapcsolat megszakad** → Automatikus átváltás polling-ra
4. **Socket.IO újrakapcsolódik** → Automatikus visszaváltás WebSocket-re

```typescript
// Automatikus inicializálás
const notificationStore = getNotificationStore();
await notificationStore.connect(userId);

// A store automatikusan:
// 1. Megpróbál Socket.IO-val kapcsolódni
// 2. Ha sikertelen, elindítja a polling-ot
// 3. Betölti az értesítéseket REST API-n keresztül
// 4. 30 másodpercenként frissít, ha nincs WebSocket kapcsolat
```

## Használat

### Store Lekérése

```typescript
import { getNotificationStore } from '$lib/stores/notificationStore.svelte';

const notificationStore = getNotificationStore();
```

### Reaktív Állapot

```typescript
// Értesítések listája
const notifications = $derived(notificationStore.notifications);

// Olvasatlan értesítések száma
const unreadCount = $derived(notificationStore.unreadCount);

// Socket.IO kapcsolat állapota
const isConnected = $derived(notificationStore.isConnected);

// Aktuális kritikus értesítés (ha van)
const currentCritical = $derived(notificationStore.currentCritical);

// Van-e olvasatlan kritikus értesítés
const hasUnreadCritical = $derived(notificationStore.hasUnreadCritical);
```

### Svelte Komponensben

```svelte
<script>
  import { getNotificationStore } from '$lib/stores/notificationStore.svelte';

  const notificationStore = getNotificationStore();

  const notifications = $derived(notificationStore.notifications);
  const unreadCount = $derived(notificationStore.unreadCount);
</script>

<div>
  <p>Olvasatlan értesítések: {unreadCount}</p>

  {#each notifications as notification}
    <div>
      <h3>{notification.title}</h3>
      <p>{notification.message}</p>
    </div>
  {/each}
</div>
```

## API Metódusok

### connect(userId)

Socket.IO kapcsolat inicializálása és értesítések betöltése.

```typescript
await notificationStore.connect(123);
```

**Automatikusan megtörténik:** A `hooks.client.ts` automatikusan meghívja bejelentkezéskor.

### disconnect()

Socket.IO kapcsolat bontása.

```typescript
notificationStore.disconnect();
```

### loadNotifications(showToast?)

Értesítések betöltése REST API-n keresztül.

```typescript
await notificationStore.loadNotifications();

// Toast megjelenítéssel (dev módban)
await notificationStore.loadNotifications(true);
```

**Automatikusan megtörténik:**
- Inicializáláskor
- 30 másodpercenként, ha Socket.IO nem elérhető

### reload()

Értesítések újratöltése toast megjelenítéssel (hasznos dev módban).

```typescript
await notificationStore.reload();
```

### markAsRead(notificationId)

Értesítés olvasottnak jelölése.

```typescript
await notificationStore.markAsRead(123);
```

**Hatás:**
- Lokális állapot frissítése
- REST API hívás
- Socket.IO emit (ha elérhető)

### markAllAsRead()

Összes értesítés olvasottnak jelölése.

```typescript
await notificationStore.markAllAsRead();
```

### deleteNotification(notificationId)

Értesítés törlése.

```typescript
await notificationStore.deleteNotification(123);
```

### deleteAllNotifications()

Összes értesítés törlése.

```typescript
await notificationStore.deleteAllNotifications();
```

### sendNotification(payload)

Új értesítés küldése.

```typescript
await notificationStore.sendNotification({
  userId: 123,
  title: { hu: 'Teszt', en: 'Test' },
  message: { hu: 'Teszt üzenet', en: 'Test message' },
  type: 'info'
});
```

**Megjegyzés:** Inkább használd a `sendNotification` függvényt a `notificationService`-ből.

### getAppNotifications(appName)

Egy adott app értesítéseinek lekérése.

```typescript
const userNotifications = notificationStore.getAppNotifications('users');
```

### getAppUnreadCount(appName)

Egy adott app olvasatlan értesítéseinek száma.

```typescript
const unreadCount = notificationStore.getAppUnreadCount('users');
```

### acknowledgeCritical()

Aktuális kritikus értesítés elismerése (eltávolítás a sorból).

```typescript
notificationStore.acknowledgeCritical();
```

**Automatikusan megtörténik:** A `CriticalNotificationDialog` komponens meghívja az OK gomb kattintásakor.

## Állapot Tulajdonságok

### notifications

Értesítések tömbje, időrendben csökkenő sorrendben.

```typescript
const notifications: Notification[] = notificationStore.notifications;
```

### unreadCount

Olvasatlan értesítések száma.

```typescript
const unreadCount: number = notificationStore.unreadCount;
```

### isConnected

Socket.IO kapcsolat állapota.

```typescript
const isConnected: boolean = notificationStore.isConnected;
```

### currentCritical

Aktuális kritikus értesítés (első a sorban).

```typescript
const currentCritical: Notification | null = notificationStore.currentCritical;
```

### hasUnreadCritical

Van-e olvasatlan kritikus értesítés.

```typescript
const hasUnreadCritical: boolean = notificationStore.hasUnreadCritical;
```

## Inicializálás

A store automatikusan inicializálódik a `hooks.client.ts`-ben:

```typescript
// hooks.client.ts
import { getNotificationStore } from '$lib/stores/notificationStore.svelte';

export async function handleSession({ data }) {
  if (data.user?.id) {
    const notificationStore = getNotificationStore();
    await notificationStore.connect(parseInt(data.user.id));
  }
}
```

## Belső Működés

### Socket.IO Események Kezelése

```typescript
// Új értesítés érkezett
socket.on('notification:new', (notification: Notification) => {
  // Hozzáadás a listához
  this.state.notifications = [notification, ...this.state.notifications];
  this.state.unreadCount++;

  // Toast megjelenítése (kivéve critical)
  this.showToastNotification(notification);

  // Browser értesítés
  this.showBrowserNotification(notification);
});

// Olvasatlan számláló frissítése
socket.on('notification:unread-count', (count: number) => {
  this.state.unreadCount = count;
});
```

### Automatikus Polling

```typescript
// 30 másodpercenként polling, ha Socket.IO nem elérhető
setInterval(() => {
  if (browser && !this.state.isConnected) {
    console.log('[NotificationStore] WebSocket disconnected, polling for notifications');
    this.loadNotifications();
  }
}, 30000);
```

### Toast Megjelenítés

```typescript
private showToastNotification(notification: Notification) {
  // Critical értesítések a dialog-ba kerülnek
  if (notification.type === 'critical') {
    this._criticalQueue = [...this._criticalQueue, notification];
    return;
  }

  // Toast megjelenítése
  import('svelte-sonner').then(({ toast }) => {
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

## Példák

### Értesítések Megjelenítése Listában

```svelte
<script>
  import { getNotificationStore } from '$lib/stores/notificationStore.svelte';

  const notificationStore = getNotificationStore();
  const notifications = $derived(notificationStore.notifications);

  async function handleMarkAsRead(id: number) {
    await notificationStore.markAsRead(id);
  }

  async function handleDelete(id: number) {
    await notificationStore.deleteNotification(id);
  }
</script>

<div>
  {#each notifications as notification}
    <div class:unread={!notification.isRead}>
      <h3>{notification.title}</h3>
      <p>{notification.message}</p>
      <p>{new Date(notification.createdAt).toLocaleString()}</p>

      {#if !notification.isRead}
        <button onclick={() => handleMarkAsRead(notification.id)}>
          Olvasottnak jelölés
        </button>
      {/if}

      <button onclick={() => handleDelete(notification.id)}>
        Törlés
      </button>
    </div>
  {/each}
</div>
```

### Olvasatlan Számláló Badge

```svelte
<script>
  import { getNotificationStore } from '$lib/stores/notificationStore.svelte';

  const notificationStore = getNotificationStore();
  const unreadCount = $derived(notificationStore.unreadCount);
</script>

<button>
  Értesítések
  {#if unreadCount > 0}
    <span class="badge">{unreadCount}</span>
  {/if}
</button>
```

### App-Specifikus Értesítések

```svelte
<script>
  import { getNotificationStore } from '$lib/stores/notificationStore.svelte';

  const notificationStore = getNotificationStore();
  const appNotifications = $derived(notificationStore.getAppNotifications('users'));
  const appUnreadCount = $derived(notificationStore.getAppUnreadCount('users'));
</script>

<div>
  <h2>Users App Értesítések ({appUnreadCount} olvasatlan)</h2>

  {#each appNotifications as notification}
    <div>{notification.message}</div>
  {/each}
</div>
```

### Kapcsolat Állapot Megjelenítése

```svelte
<script>
  import { getNotificationStore } from '$lib/stores/notificationStore.svelte';

  const notificationStore = getNotificationStore();
  const isConnected = $derived(notificationStore.isConnected);
</script>

<div class="status">
  {#if isConnected}
    <span class="online">● Online (WebSocket)</span>
  {:else}
    <span class="offline">● Offline (Polling)</span>
  {/if}
</div>
```

## Következő Lépések

- [UI Komponensek →](/hu/notifications-ui)
- [API és Socket.IO →](/hu/notifications-api)
- [Hibaelhárítás →](/hu/notifications-troubleshooting)
- [Értesítési Rendszer Áttekintés →](/hu/notifications)
