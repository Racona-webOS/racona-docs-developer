---
title: Sending Notifications
description: How to send notifications in Racona
---

This page explains in detail how to send notifications in Racona from both client and server side.

## Client Side (Recommended)

The `sendNotification` function is the simplest way to send notifications from apps.

```typescript
import { sendNotification } from '$lib/services/client/notificationService';

await sendNotification({
  userId: 123,
  title: 'Saved successfully',
  message: 'The data has been successfully saved',
  type: 'success'
});
```

### Multilingual Notification

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

### Notification with App Opening

If you provide the `appName` field, clicking the notification will open the app:

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
    section: 'groups',  // Which sidebar menu item to activate
    groupId: '456'
  }
});
```

### Broadcast to All Users

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

### To Multiple Users

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

## Server Side

You can also send notifications from server actions or API endpoints:

```typescript
import { sendNotification } from '$lib/server/socket';

export const createGroup = command(createGroupSchema, async (input) => {
  // ... create group ...

  // Send notification
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

## Notification Types

### info (Default)

General informational notifications.

```typescript
await sendNotification({
  userId: 123,
  title: { hu: 'Emlékeztető', en: 'Reminder' },
  message: { hu: 'Ne felejtsd el a meetinget 15:00-kor', en: 'Don\'t forget the meeting at 3 PM' },
  type: 'info'
});
```

**Appearance:** Blue icon, toast notification

### success

Feedback for successful operations.

```typescript
await sendNotification({
  userId: 123,
  title: { hu: 'Sikeres feltöltés', en: 'Upload successful' },
  message: { hu: 'A fájl sikeresen feltöltésre került', en: 'The file has been uploaded successfully' },
  type: 'success'
});
```

**Appearance:** Green icon, toast notification

### warning

Warnings that are not critical.

```typescript
await sendNotification({
  userId: 123,
  title: { hu: 'Figyelmeztetés', en: 'Warning' },
  message: { hu: 'A tárhelyed 80%-ban megtelt', en: 'Your storage is 80% full' },
  type: 'warning'
});
```

**Appearance:** Yellow icon, toast notification

### error

Errors that require user action.

```typescript
await sendNotification({
  userId: 123,
  title: { hu: 'Hiba történt', en: 'Error occurred' },
  message: { hu: 'A fájl feltöltése sikertelen volt', en: 'File upload failed' },
  type: 'error'
});
```

**Appearance:** Red icon, toast notification

### critical

Critical notifications that appear immediately in a modal dialog.

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

**Appearance:** Red icon, modal dialog (interrupts the user's work)

**Important:** `critical` type notifications:
- Appear immediately in a modal dialog
- Interrupt the user's work
- Must be acknowledged (OK button)
- Are automatically marked as read after acknowledgment

## Best Practices

### 1. Always use multilingual content

```typescript
// ✅ Good
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

// ❌ Avoid (only works for backward compatibility)
await sendNotification({
  userId: 123,
  title: 'Successful save',
  message: 'The data has been successfully saved',
  type: 'success'
});
```

### 2. Use appName when the notification relates to an app

```typescript
// ✅ Good - clicking the notification opens the app
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

// ❌ Avoid - clicking the notification does nothing
await sendNotification({
  userId: 123,
  title: { hu: 'Új csoport', en: 'New group' },
  message: { hu: 'Csoport létrehozva', en: 'Group created' },
  type: 'success'
});
```

### 3. Use the data field for app-specific information

```typescript
await sendNotification({
  userId: 123,
  appName: 'users',
  title: { hu: 'Új csoport', en: 'New group' },
  message: { hu: 'Csoport létrehozva', en: 'Group created' },
  type: 'success',
  data: {
    section: 'groups',      // Which sidebar menu item
    groupId: '456',         // Which item
    action: 'view'          // What action
  }
});
```

### 4. Use the appropriate type

- **info** — General information
- **success** — Successful operations
- **warning** — Warnings
- **error** — Errors
- **critical** — Critical warnings (use sparingly)

### 5. Provide a details field for detailed information

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

## Next Steps

- [NotificationStore →](/en/notifications-store)
- [UI Components →](/en/notifications-ui)
- [Notification System Overview →](/en/notifications)
