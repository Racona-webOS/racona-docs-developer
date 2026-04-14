---
title: UI Components
description: Notification UI components in Racona
---

The notification system includes three main UI components to provide a complete user experience.

## NotificationCenter

The taskbar bell icon and notification center panel.

### Features

- Unread notification counter
- Critical notification indicator (yellow exclamation mark)
- Notification list in chronological order
- Click notification to open app
- Mark notification as read
- Delete notification
- Mark all notifications as read
- Delete all notifications
- Refresh notifications

### Usage

```svelte
<!-- Taskbar.svelte -->
<script>
  import NotificationCenter from '$lib/components/core/NotificationCenter.svelte';
</script>

<NotificationCenter />
```

### Appearance

- **Bell icon** — On the taskbar, right side
- **Counter badge** — Unread notification count in a red circle
- **Critical indicator** — Yellow exclamation mark for critical notifications
- **Panel** — Top right corner, 380px wide

## CriticalNotificationDialog

Modal dialog for critical notifications.

### Features

- Appears automatically for critical notifications
- Interrupts the user's work
- Must be acknowledged (OK button)
- Multilingual content support
- Automatic read marking after acknowledgment

### Usage

```svelte
<!-- Desktop.svelte -->
<script>
  import CriticalNotificationDialog from '$lib/components/core/CriticalNotificationDialog.svelte';
</script>

<CriticalNotificationDialog />
```

### Behavior

1. Critical notification arrives
2. NotificationStore adds it to `_criticalQueue`
3. Dialog appears automatically
4. User clicks the OK button
5. `acknowledgeCritical()` is called
6. Notification is automatically marked as read
7. Next critical notification appears (if any)

## Toast Notifications

Automatic toast notifications for new notifications (except critical type).

### Features

- Automatic display for new notifications
- Type-based coloring and icon
- "Open" button to open the notification center
- Automatically disappears after 5 seconds
- Multilingual content support

### Types and Colors

| Type | Color | Icon |
|------|-------|------|
| info | Blue | Info icon |
| success | Green | CheckCircle icon |
| warning | Yellow | AlertTriangle icon |
| error | Red | XCircle icon |

### Implementation

Toasts appear automatically in the NotificationStore:

```typescript
// notificationStore.svelte.ts
private showToastNotification(notification: Notification) {
  if (notification.type === 'critical') {
    // Critical notifications go to the dialog
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
        label: 'Open',
        onClick: () => this.openNotificationInApp(notification.id)
      }
    });
  });
}
```

### Toaster Component

The `Toaster` component is required in the layout to display toasts:

```svelte
<!-- +layout.svelte -->
<script>
  import { Toaster } from 'svelte-sonner';
</script>

<Toaster />

<slot />
```

## Browser Notifications

Native browser notification support.

### Features

- Automatic permission request
- Display notification at browser level
- Works even when the app is not in focus

### Implementation

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

## Notification Icons

Notifications use different icons based on type:

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

## Next Steps

- [API & Socket.IO →](/en/notifications-api)
- [NotificationStore →](/en/notifications-store)
- [Notification System Overview →](/en/notifications)
