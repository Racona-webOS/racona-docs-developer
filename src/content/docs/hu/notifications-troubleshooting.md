---
title: Hibaelhárítás
description: Értesítési rendszer hibaelhárítás és fallback működés
---

Ez az oldal segít a leggyakoribb problémák megoldásában és részletezi a fallback mechanizmus működését.

## Értesítések Nem Jelennek Meg

### 1. Ellenőrizd a Socket.IO Kapcsolatot

```typescript
const notificationStore = getNotificationStore();
console.log('Connected:', notificationStore.isConnected);
```

**Várható eredmény:**
- `true` — Socket.IO működik, valós idejű értesítések
- `false` — Fallback mód, 30s polling

### 2. Ellenőrizd a Konzolt

**Szerver konzol:**

```bash
[Socket.IO] Client connected: abc123
[Socket.IO] User registered: 123
[Socket.IO] Notification sent to user: 123
```

**Kliens konzol:**

```bash
[NotificationStore] Connected to Socket.IO
[NotificationStore] New notification received via WebSocket: {...}
[NotificationStore] About to show toast for notification: 1
```

### 3. Socket.IO Nem Működik

Ha a Socket.IO nem elérhető, a fallback automatikusan aktiválódik:

```bash
# Kliens konzol
[NotificationStore] Connection error: ...
[NotificationStore] WebSocket disconnected, polling for notifications
```

**Megoldás:** Nincs teendő, a rendszer automatikusan fallback módba vált.

### 4. Dev Módban Használd a Reload Funkciót

```typescript
await notificationStore.reload();
```

## Socket.IO vs REST API Fallback

| Szempont | Socket.IO (Elsődleges) | REST API (Fallback) |
|----------|------------------------|---------------------|
| **Késleltetés** | Azonnali (< 100ms) | 30 másodperc |
| **Hálózati forgalom** | Minimális | Közepes (polling) |
| **Megbízhatóság** | Magas | Nagyon magas |
| **Használat** | Automatikus | Automatikus fallback |
| **Aktiválás** | Kapcsolódáskor | Socket.IO hiba esetén |

## Fallback Mód Tesztelése

### 1. Socket.IO Leállítása

```bash
# Állítsd le a Socket.IO szervert
# A kliens automatikusan fallback módba vált
```

### 2. Konzol Üzenetek

```bash
[NotificationStore] Disconnected from Socket.IO
[NotificationStore] WebSocket disconnected, polling for notifications
```

### 3. Értesítés Küldése

```typescript
await sendNotification({
  userId: 123,
  title: { hu: 'Teszt', en: 'Test' },
  message: { hu: 'Fallback mód teszt', en: 'Fallback mode test' },
  type: 'info'
});

// Az értesítés 30 másodpercen belül megjelenik
```

## Toast Értesítések Nem Jelennek Meg

### 1. Ellenőrizd a Toaster Komponenst

```svelte
<!-- +layout.svelte -->
<script>
  import { Toaster } from 'svelte-sonner';
</script>

<Toaster />
```

**Megoldás:** Add hozzá a `Toaster` komponenst a layout-hoz.

### 2. Ellenőrizd az Értesítés Típusát

Critical típusú értesítések nem jelennek meg toast-ként, hanem modal dialog-ban.

```typescript
// ❌ Nem jelenik meg toast
await sendNotification({
  userId: 123,
  title: 'Kritikus',
  message: 'Ez modal dialog-ban jelenik meg',
  type: 'critical'
});

// ✅ Megjelenik toast
await sendNotification({
  userId: 123,
  title: 'Info',
  message: 'Ez toast-ban jelenik meg',
  type: 'info'
});
```

### 3. Ellenőrizd a Konzolt

```bash
[NotificationStore] About to show toast for notification: 1
[NotificationStore] Toast imported successfully
[NotificationStore] Showing toast: { title: '...', message: '...', type: 'info' }
```

## Dev Mód Specifikus Problémák

### Probléma: Socket.IO Nem Fut Dev Módban

**Tünet:** `isConnected` mindig `false`

**Megoldás:** A rendszer automatikusan fallback módba vált. Használd a `reload()` metódust manuális frissítéshez:

```typescript
const notificationStore = getNotificationStore();
await notificationStore.reload();
```

### Probléma: Toast Értesítések Nem Jelennek Meg Dev Módban

**Tünet:** Új értesítések nem jelennek meg automatikusan

**Megoldás:** A `reload()` metódus automatikusan megjeleníti a toast-ot az új értesítésekhez:

```typescript
// notification-demo app-ban
if (import.meta.env.DEV) {
  setTimeout(() => {
    notificationStore.reload();
  }, 500);
}
```

### Probléma: Értesítések Nem Frissülnek Automatikusan

**Tünet:** Új értesítések csak oldal frissítés után jelennek meg

**Ok:** Socket.IO nem fut, és a polling még nem indult el

**Megoldás:** Várj 30 másodpercet, vagy használd a `reload()` metódust:

```typescript
await notificationStore.reload();
```

## Értesítések Nem Törlődnek

### Ellenőrizd a Jogosultságokat

Csak saját értesítéseket lehet törölni. Ellenőrizd, hogy a `userId` egyezik-e a bejelentkezett felhasználóval.

```typescript
// ✅ Jó - saját értesítés törlése
await notificationStore.deleteNotification(myNotificationId);

// ❌ Hiba - más felhasználó értesítésének törlése
await notificationStore.deleteNotification(otherUserNotificationId);
```

### Ellenőrizd a Konzolt

```bash
# Sikeres törlés
[API] Notification deleted: 123

# Sikertelen törlés
[API] Error deleting notification: Unauthorized
```

## Browser Értesítések Nem Jelennek Meg

### 1. Ellenőrizd az Engedélyeket

```typescript
console.log('Notification permission:', Notification.permission);
```

**Lehetséges értékek:**
- `granted` — Engedélyezve
- `denied` — Letiltva
- `default` — Még nem kérte el

### 2. Kérj Engedélyt

```typescript
if (Notification.permission === 'default') {
  await Notification.requestPermission();
}
```

### 3. Ellenőrizd a Böngésző Támogatást

```typescript
if (!('Notification' in window)) {
  console.error('Browser does not support notifications');
}
```

## Kritikus Értesítések Nem Jelennek Meg

### Ellenőrizd a CriticalNotificationDialog Komponenst

```svelte
<!-- Desktop.svelte -->
<script>
  import CriticalNotificationDialog from '$lib/components/core/CriticalNotificationDialog.svelte';
</script>

<CriticalNotificationDialog />
```

**Megoldás:** Add hozzá a `CriticalNotificationDialog` komponenst a Desktop komponenshez.

### Ellenőrizd a Típust

```typescript
// ✅ Jó - critical típus
await sendNotification({
  userId: 123,
  title: 'Kritikus',
  message: 'Ez modal dialog-ban jelenik meg',
  type: 'critical'
});

// ❌ Rossz - error típus (toast-ban jelenik meg)
await sendNotification({
  userId: 123,
  title: 'Hiba',
  message: 'Ez toast-ban jelenik meg',
  type: 'error'
});
```

## Teljesítmény Problémák

### Túl Sok Értesítés

Ha túl sok értesítés van, a lista lassú lehet.

**Megoldás:** Használj pagination-t vagy töröld a régi értesítéseket:

```typescript
// Összes értesítés törlése
await notificationStore.deleteAllNotifications();

// Vagy csak a régiek törlése (server-side)
await notificationRepository.deleteOlderThan(30); // 30 napnál régebbiek
```

### Polling Túl Gyakori

Ha a polling túl gyakori, növeld az intervallumot:

```typescript
// notificationStore.svelte.ts
setInterval(() => {
  if (browser && !this.state.isConnected) {
    this.loadNotifications();
  }
}, 60000); // 60 másodperc helyett 30
```

## Hibakeresési Tippek

### 1. Konzol Üzenetek Engedélyezése

```typescript
// notificationStore.svelte.ts
console.log('[NotificationStore] Connected:', this.state.isConnected);
console.log('[NotificationStore] Notifications:', this.state.notifications);
console.log('[NotificationStore] Unread count:', this.state.unreadCount);
```

### 2. Network Tab Ellenőrzése

Nyisd meg a böngésző DevTools Network tab-ját és szűrj a következőkre:
- `socket.io` — WebSocket kapcsolat
- `/api/notifications` — REST API hívások

### 3. Redux DevTools

Használd a Svelte DevTools-t az állapot követésére:

```bash
# Telepítés
npm install -D @sveltejs/vite-plugin-svelte-inspector
```

### 4. Logging Szerver Oldalon

```typescript
// lib/server/socket/index.ts
logger.info('[Socket.IO] Notification sent to user:', userId);
logger.info('[Socket.IO] Unread count:', unreadCount);
```

## Gyakori Hibák és Megoldások

| Hiba | Ok | Megoldás |
|------|-----|----------|
| Értesítések nem jelennek meg | Socket.IO nem fut | Várj 30s (fallback) vagy `reload()` |
| Toast nem jelenik meg | Toaster komponens hiányzik | Add hozzá a layout-hoz |
| Critical dialog nem jelenik meg | CriticalNotificationDialog hiányzik | Add hozzá a Desktop-hoz |
| Értesítések nem törlődnek | Jogosultság hiba | Csak saját értesítéseket törölhetsz |
| Browser értesítések nem működnek | Engedély hiányzik | Kérj engedélyt a felhasználótól |

## Következő Lépések

- [NotificationStore →](/hu/notifications-store)
- [API és Socket.IO →](/hu/notifications-api)
- [Értesítési Rendszer Áttekintés →](/hu/notifications)
