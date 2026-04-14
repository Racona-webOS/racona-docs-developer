---
title: Notification System
description: Real-time notifications with Socket.IO in Racona
---

The Racona notification system allows applications to send real-time notifications to users. The system uses Socket.IO for real-time communication and supports multilingual content.

## Overview

The notification system consists of three main components:

1. **Backend (Socket.IO + Database)** — Storing notifications and real-time delivery
2. **Frontend Store** — Global state management and WebSocket connection
3. **UI Components** — Taskbar bell icon, notification center, toast messages

### Main Features

- ✅ Real-time notifications via Socket.IO
- ✅ Automatic fallback to REST API polling
- ✅ Multilingual content support (i18n)
- ✅ 5 notification types (info, success, warning, error, critical)
- ✅ Toast notifications with automatic display
- ✅ Critical notifications in modal dialog
- ✅ Open app by clicking notification
- ✅ Browser notification support
- ✅ Unread notification counter
- ✅ Notification management (read, delete)

## Fault-tolerant Architecture

The system operates in a **fault-tolerant** manner:

- **Primary:** Socket.IO WebSocket connection for real-time notifications
- **Fallback:** REST API polling every 30 seconds if WebSocket is unavailable
- **Guaranteed operation:** Notifications are always available, even in case of Socket.IO failure

```
┌─────────────────────────────────────────────────────────────┐
│                          User                               │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼─────┐          ┌─────▼──────┐
    │ Taskbar  │          │   Toast    │
    │   Bell   │          │Notification│
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
    │(Primary) │        │ (Fallback) │
    └────┬─────┘        └─────┬──────┘
         │                    │
         └──────────┬─────────┘
                    │
         ┌──────────▼──────────┐
         │  Socket.IO Server   │
         │    + Repository     │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │   PostgreSQL DB     │
         │  (notifications)    │
         └─────────────────────┘
```

### Operating Modes

#### 1. Normal Mode (Socket.IO Active)

- New notifications appear immediately via WebSocket
- No polling needed
- Minimal network traffic

#### 2. Fallback Mode (Socket.IO Inactive)

- Automatic polling every 30 seconds
- Fetches new notifications via REST API
- Guarantees notifications appear even during connection issues

#### 3. Hybrid Mode (Development)

- Socket.IO may not run in dev mode
- `reload()` method for manual refresh
- API endpoints always available

## Quick Start

### 1. Sending a Notification

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

### 2. Notification with App Opening

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

### 3. Broadcast Notification

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

## Database Schema

```typescript
export const notifications = schema.table('notifications', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull(),
  appName: text('app_name'),              // null = system notification
  title: jsonb('title').notNull(),        // { hu: string, en: string, ... }
  message: jsonb('message').notNull(),    // { hu: string, en: string, ... }
  details: jsonb('details'),              // Optional detailed message
  type: text('type').notNull().default('info'), // info, success, warning, error, critical
  isRead: boolean('is_read').notNull().default(false),
  data: jsonb('data'),                    // Extra data for the notification
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp('read_at', { withTimezone: true })
});
```

### Field Descriptions

- **userId** — Which user the notification is for
- **appName** — Which app sent it (null = system notification). If specified, clicking the notification opens the app.
- **title** — Notification title (multilingual JSON object)
- **message** — Notification message (multilingual JSON object)
- **details** — Optional detailed description (multilingual JSON object)
- **type** — Notification type: `info`, `success`, `warning`, `error`, `critical`
- **isRead** — Whether it has been read
- **data** — Extra data in JSON format (e.g., `{ section: 'groups', groupId: '456' }`)

## Notification Types

| Type | Usage | Display |
|------|-------|---------|
| **info** | General information | Blue icon, toast |
| **success** | Successful operations | Green icon, toast |
| **warning** | Warnings | Yellow icon, toast |
| **error** | Errors | Red icon, toast |
| **critical** | Critical warnings | Red icon, modal dialog |

**Important:** `critical` type notifications immediately appear in a modal dialog and interrupt the user's work until acknowledged.

## Built-in Applications

### Notifications Application

Manage notifications in a tabular view:
- Notification list with filtering and sorting
- View notification details
- Mark as read and delete

### Notification Demo Application

Testing application for the notification system:
- Send a notification to yourself
- Select type and language
- Broadcast testing
- API examples

## Documentation Sections

- [Sending Notifications →](/en/notifications-sending) — Detailed guide for sending notifications
- [NotificationStore →](/en/notifications-store) — Store API and usage
- [UI Components →](/en/notifications-ui) — NotificationCenter, Toast, Critical Dialog
- [API and Socket.IO →](/en/notifications-api) — REST API endpoints and Socket.IO events
- [Troubleshooting →](/en/notifications-troubleshooting) — Fallback operation and problem solving

## Next Steps

- [Socket.IO documentation ↗](https://socket.io/docs/)
- [svelte-sonner documentation ↗](https://svelte-sonner.vercel.app/)
- [State management →](/en/state-management)
- [Built-in applications →](/en/builtin-apps)
