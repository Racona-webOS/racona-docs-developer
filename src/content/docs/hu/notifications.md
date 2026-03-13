---
title: Értesítési Rendszer
description: Valós idejű értesítések Socket.IO-val az ElyOS-ben
---

Az ElyOS értesítési rendszere lehetővé teszi alkalmazások számára, hogy valós időben küldjenek értesítéseket felhasználóknak. A rendszer Socket.IO-t használ a valós idejű kommunikációhoz, és támogatja a többnyelvű tartalmakat.

## Áttekintés

Az értesítési rendszer három fő komponensből áll:

1. **Backend (Socket.IO + Database)** — Értesítések tárolása és valós idejű küldés
2. **Frontend Store** — Globális állapotkezelés és WebSocket kapcsolat
3. **UI Komponensek** — Taskbar harang ikon, értesítési központ, toast üzenetek

### Főbb Funkciók

- ✅ Valós idejű értesítések Socket.IO-val
- ✅ Automatikus fallback REST API polling-ra
- ✅ Többnyelvű tartalom támogatás (i18n)
- ✅ 5 értesítés típus (info, success, warning, error, critical)
- ✅ Toast értesítések automatikus megjelenítéssel
- ✅ Kritikus értesítések modal dialog-ban
- ✅ Értesítésre kattintva app megnyitása
- ✅ Browser értesítések támogatása
- ✅ Olvasatlan értesítések számlálója
- ✅ Értesítések kezelése (olvasás, törlés)

## Hibatűrő Architektúra

A rendszer **hibatűrő (fault-tolerant)** módon működik:

- **Elsődleges:** Socket.IO WebSocket kapcsolat valós idejű értesítésekhez
- **Fallback:** REST API polling 30 másodpercenként, ha a WebSocket nem elérhető
- **Garantált működés:** Értesítések mindig elérhetők, még Socket.IO hiba esetén is

```
┌─────────────────────────────────────────────────────────────┐
│                        Felhasználó                          │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼─────┐          ┌─────▼──────┐
    │ Taskbar  │          │   Toast    │
    │  Harang  │          │ Értesítés  │
    └────┬─────┘          └─────┬──────┘
         │                      │
         └──────────┬───────────┘
                    │
         ┌──────────▼──────────┐
         │ NotificationStore   │
         │   (Svelte Store)    │
         └──────────┬──────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
    ┌────▼─────┐        ┌─────▼──────┐
    │ Socket.IO│        │  REST API  │
    │ WebSocket│        │  /api/...  │
    │(Elsődleges)       │ (Fallback) │
    └────┬─────┘        └─────┬──────┘
         │                    │
         └──────────┬─────────┘
                    │
         ┌──────────▼──────────┐
         │   Socket.IO Szerver │
         │    + Repository     │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │   PostgreSQL DB     │
         │  (notifications)    │
         └─────────────────────┘
```

### Működési Módok

#### 1. Normál Mód (Socket.IO Aktív)

- Új értesítések azonnal megjelennek WebSocket-en keresztül
- Nincs szükség polling-ra
- Minimális hálózati forgalom

#### 2. Fallback Mód (Socket.IO Inaktív)

- Automatikus polling 30 másodpercenként
- REST API-n keresztül lekéri az új értesítéseket
- Garantálja, hogy az értesítések megjelennek, még kapcsolati problémák esetén is

#### 3. Hibrid Mód (Fejlesztés)

- Socket.IO lehet, hogy nem fut dev módban
- `reload()` metódus manuális frissítéshez
- API endpoint-ok mindig elérhetők

## Gyors Kezdés

### 1. Értesítés Küldése

```typescript
import { sendNotification } from '$lib/services/client/notificationService';

await sendNotification({
  userId: 123,
  title: {
    hu: 'Sikeres mentés',
    en: 'Successful save'
  },
  message: {
    hu: 'Az adatok sikeresen mentésre kerültek',
    en: 'The data has been successfully saved'
  },
  type: 'success'
});
```

### 2. Értesítés App Megnyitással

```typescript
await sendNotification({
  userId: 123,
  appName: 'users',
  title: {
    hu: 'Új csoport létrehozva',
    en: 'New group created'
  },
  message: {
    hu: 'A "Fejlesztők" csoport sikeresen létrehozva',
    en: 'The "Developers" group has been successfully created'
  },
  type: 'success',
  data: {
    section: 'groups',
    groupId: '456'
  }
});
```

### 3. Broadcast Értesítés

```typescript
await sendNotification({
  broadcast: true,
  title: {
    hu: 'Rendszer karbantartás',
    en: 'System maintenance'
  },
  message: {
    hu: 'A rendszer 10 perc múlva leáll',
    en: 'The system will shut down in 10 minutes'
  },
  type: 'warning'
});
```

## Adatbázis Séma

```typescript
export const notifications = schema.table('notifications', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull(),
  appName: text('app_name'),              // null = rendszer értesítés
  title: jsonb('title').notNull(),        // { hu: string, en: string, ... }
  message: jsonb('message').notNull(),    // { hu: string, en: string, ... }
  details: jsonb('details'),              // Opcionális részletes üzenet
  type: text('type').notNull().default('info'), // info, success, warning, error, critical
  isRead: boolean('is_read').notNull().default(false),
  data: jsonb('data'),                    // Extra adat az értesítéshez
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp('read_at', { withTimezone: true })
});
```

### Mezők Magyarázata

- **userId** — Melyik felhasználónak szól az értesítés
- **appName** — Melyik app küldte (null = rendszer értesítés). Ha meg van adva, az értesítésre kattintva megnyílik az app.
- **title** — Értesítés címe (többnyelvű JSON objektum)
- **message** — Értesítés üzenete (többnyelvű JSON objektum)
- **details** — Opcionális részletes leírás (többnyelvű JSON objektum)
- **type** — Értesítés típusa: `info`, `success`, `warning`, `error`, `critical`
- **isRead** — Olvasva lett-e
- **data** — Extra adat JSON formátumban (pl. `{ section: 'groups', groupId: '456' }`)

## Értesítés Típusok

| Típus | Használat | Megjelenés |
|-------|-----------|------------|
| **info** | Általános információk | Kék ikon, toast |
| **success** | Sikeres műveletek | Zöld ikon, toast |
| **warning** | Figyelmeztetések | Sárga ikon, toast |
| **error** | Hibák | Piros ikon, toast |
| **critical** | Kritikus figyelmeztetések | Piros ikon, modal dialog |

**Fontos:** A `critical` típusú értesítések azonnal megjelennek modal dialog-ban és megakasztják a felhasználó munkáját, amíg el nem ismerik őket.

## Beépített Alkalmazások

### Notifications Alkalmazás

Értesítések kezelése táblázatos nézetben:
- Értesítések listája szűréssel és rendezéssel
- Értesítés részleteinek megtekintése
- Olvasottnak jelölés és törlés

### Notification Demo Alkalmazás

Tesztelési alkalmazás az értesítési rendszerhez:
- Értesítés küldése saját magadnak
- Típus és nyelv kiválasztása
- Broadcast tesztelés
- API példák

## Dokumentáció Szekciók

- [Értesítés Küldése →](/hu/notifications-sending) — Részletes útmutató értesítések küldéséhez
- [NotificationStore →](/hu/notifications-store) — Store API és használat
- [UI Komponensek →](/hu/notifications-ui) — NotificationCenter, Toast, Critical Dialog
- [API és Socket.IO →](/hu/notifications-api) — REST API végpontok és Socket.IO események
- [Hibaelhárítás →](/hu/notifications-troubleshooting) — Fallback működés és problémamegoldás

## Következő Lépések

- [Socket.IO dokumentáció ↗](https://socket.io/docs/)
- [svelte-sonner dokumentáció ↗](https://svelte-sonner.vercel.app/)
- [Állapotkezelés →](/hu/state-management)
- [Beépített alkalmazások →](/hu/builtin-apps)
