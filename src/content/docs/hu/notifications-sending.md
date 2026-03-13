---
title: Értesítés Küldése
description: Hogyan küldj értesítéseket az ElyOS-ben
---

Ez az oldal részletesen bemutatja, hogyan küldhetsz értesítéseket az ElyOS-ben kliens és szerver oldalról.

## Kliens Oldal (Ajánlott)

A `sendNotification` függvény a legegyszerűbb módja az értesítések küldésének alkalmazásokból.

```typescript
import { sendNotification } from '$lib/services/client/notificationService';

await sendNotification({
  userId: 123,
  title: 'Sikeres mentés',
  message: 'Az adatok sikeresen mentésre kerültek',
  type: 'success'
});
```

### Többnyelvű Értesítés

```typescript
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

### Értesítés App Megnyitással

Ha megadod az `appName` mezőt, az értesítésre kattintva megnyílik az alkalmazás:

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
  details: {
    hu: 'A csoport 5 taggal rendelkezik és 3 jogosultsággal',
    en: 'The group has 5 members and 3 permissions'
  },
  type: 'success',
  data: {
    section: 'groups',  // Melyik sidebar menüpont legyen aktív
    groupId: '456'
  }
});
```

### Broadcast Minden Felhasználónak

```typescript
await sendNotification({
  broadcast: true,
  title: {
    hu: 'Rendszer karbantartás',
    en: 'System maintenance'
  },
  message: {
    hu: 'A rendszer 10 perc múlva leáll karbantartás miatt',
    en: 'The system will shut down in 10 minutes for maintenance'
  },
  type: 'warning'
});
```

### Több Felhasználónak

```typescript
await sendNotification({
  userIds: [123, 456, 789],
  title: {
    hu: 'Csapat értesítés',
    en: 'Team notification'
  },
  message: {
    hu: 'Új feladat lett hozzárendelve a csapathoz',
    en: 'A new task has been assigned to the team'
  },
  type: 'info'
});
```

## Szerver Oldal

Server action-ökből vagy API endpoint-okból is küldhetsz értesítéseket:

```typescript
import { sendNotification } from '$lib/server/socket';

export const createGroup = command(createGroupSchema, async (input) => {
  // ... csoport létrehozása ...

  // Értesítés küldése
  await sendNotification({
    userId: creatorId,
    appName: 'users',
    title: {
      hu: 'Csoport létrehozva',
      en: 'Group created'
    },
    message: {
      hu: `A "${input.name}" csoport sikeresen létrehozva`,
      en: `The "${input.name}" group has been successfully created`
    },
    type: 'success',
    data: {
      section: 'groups',
      groupId: newGroup.id
    }
  });

  return { success: true, group: newGroup };
});
```

## Értesítés Típusok

### info (Alapértelmezett)

Általános információs értesítések.

```typescript
await sendNotification({
  userId: 123,
  title: { hu: 'Emlékeztető', en: 'Reminder' },
  message: { hu: 'Ne felejtsd el a meetinget 15:00-kor', en: 'Don\'t forget the meeting at 3 PM' },
  type: 'info'
});
```

**Megjelenés:** Kék ikon, toast értesítés

### success

Sikeres műveletek visszajelzése.

```typescript
await sendNotification({
  userId: 123,
  title: { hu: 'Sikeres feltöltés', en: 'Upload successful' },
  message: { hu: 'A fájl sikeresen feltöltésre került', en: 'The file has been uploaded successfully' },
  type: 'success'
});
```

**Megjelenés:** Zöld ikon, toast értesítés

### warning

Figyelmeztetések, amelyek nem kritikusak.

```typescript
await sendNotification({
  userId: 123,
  title: { hu: 'Figyelmeztetés', en: 'Warning' },
  message: { hu: 'A tárhelyed 80%-ban megtelt', en: 'Your storage is 80% full' },
  type: 'warning'
});
```

**Megjelenés:** Sárga ikon, toast értesítés

### error

Hibák, amelyek felhasználói beavatkozást igényelnek.

```typescript
await sendNotification({
  userId: 123,
  title: { hu: 'Hiba történt', en: 'Error occurred' },
  message: { hu: 'A fájl feltöltése sikertelen volt', en: 'File upload failed' },
  type: 'error'
});
```

**Megjelenés:** Piros ikon, toast értesítés

### critical

Kritikus értesítések, amelyek azonnal megjelennek modal dialog-ban.

```typescript
await sendNotification({
  userId: 123,
  title: {
    hu: 'Kritikus biztonsági figyelmeztetés',
    en: 'Critical security warning'
  },
  message: {
    hu: 'A fiókod gyanús tevékenységet észlelt. Kérlek változtasd meg a jelszavad!',
    en: 'Suspicious activity detected on your account. Please change your password!'
  },
  type: 'critical'
});
```

**Megjelenés:** Piros ikon, modal dialog (megakasztja a felhasználó munkáját)

**Fontos:** A `critical` típusú értesítések:
- Azonnal megjelennek egy modal dialog-ban
- Megakasztják a felhasználó munkáját
- Kötelező elismerni őket (OK gomb)
- Automatikusan olvasottnak jelölődnek az elismerés után

## Legjobb Gyakorlatok

### 1. Mindig használj többnyelvű tartalmakat

```typescript
// ✅ Jó
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

// ❌ Kerülendő (csak backward compatibility miatt működik)
await sendNotification({
  userId: 123,
  title: 'Sikeres mentés',
  message: 'Az adatok sikeresen mentésre kerültek',
  type: 'success'
});
```

### 2. Használj appName-et, ha az értesítés egy apphoz kapcsolódik

```typescript
// ✅ Jó - értesítésre kattintva megnyílik az app
await sendNotification({
  userId: 123,
  appName: 'users',
  title: { hu: 'Új csoport', en: 'New group' },
  message: { hu: 'Csoport létrehozva', en: 'Group created' },
  type: 'success',
  data: {
    section: 'groups',
    groupId: '456'
  }
});

// ❌ Kerülendő - értesítésre kattintva nem történik semmi
await sendNotification({
  userId: 123,
  title: { hu: 'Új csoport', en: 'New group' },
  message: { hu: 'Csoport létrehozva', en: 'Group created' },
  type: 'success'
});
```

### 3. Használj data mezőt app-specifikus információkhoz

```typescript
await sendNotification({
  userId: 123,
  appName: 'users',
  title: { hu: 'Új csoport', en: 'New group' },
  message: { hu: 'Csoport létrehozva', en: 'Group created' },
  type: 'success',
  data: {
    section: 'groups',      // Melyik sidebar menüpont
    groupId: '456',         // Melyik elem
    action: 'view'          // Milyen művelet
  }
});
```

### 4. Használj megfelelő típust

- **info** — Általános információk
- **success** — Sikeres műveletek
- **warning** — Figyelmeztetések
- **error** — Hibák
- **critical** — Kritikus figyelmeztetések (ritkán használd!)

### 5. Adj meg details mezőt részletes információkhoz

```typescript
await sendNotification({
  userId: 123,
  title: { hu: 'Új csoport', en: 'New group' },
  message: { hu: 'Csoport létrehozva', en: 'Group created' },
  details: {
    hu: 'A csoport 5 taggal rendelkezik és 3 jogosultsággal. A csoport adminisztrátora: John Doe.',
    en: 'The group has 5 members and 3 permissions. Group administrator: John Doe.'
  },
  type: 'success'
});
```

## Következő Lépések

- [NotificationStore →](/hu/notifications-store)
- [UI Komponensek →](/hu/notifications-ui)
- [Értesítési Rendszer Áttekintés →](/hu/notifications)
