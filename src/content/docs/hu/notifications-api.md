---
title: API és Socket.IO
description: REST API végpontok és Socket.IO események
---

Az értesítési rendszer REST API végpontokat és Socket.IO eseményeket használ a kommunikációhoz.

## REST API Végpontok

Az API végpontok **fallback megoldásként** szolgálnak, ha a Socket.IO nem elérhető. A NotificationStore automatikusan polling-ot indít 30 másodpercenként, ha a WebSocket kapcsolat megszakad.

### Automatikus Fallback Működése

```typescript
// notificationStore.svelte.ts
// Poll for new notifications only if WebSocket is disconnected
setInterval(() => {
  if (browser && !this.state.isConnected) {
    console.log('[NotificationStore] WebSocket disconnected, polling for notifications');
    this.loadNotifications();
  }
}, 30000);
```

**Fontos:** Az API végpontokat nem kell manuálisan hívni normál használat során. A store automatikusan kezeli a fallback-et.

### GET /api/notifications

Összes értesítés lekérése az aktuális felhasználónak.

**Használat:** Automatikus polling fallback módban, vagy manuális `reload()` hívás.

**Response:**

```json
{
  "notifications": [
    {
      "id": 1,
      "userId": 123,
      "appName": "users",
      "title": { "hu": "Új csoport", "en": "New group" },
      "message": { "hu": "Csoport létrehozva", "en": "Group created" },
      "details": null,
      "type": "success",
      "isRead": false,
      "data": { "section": "groups", "groupId": "456" },
      "createdAt": "2024-01-15T10:30:00Z",
      "readAt": null
    }
  ]
}
```

### POST /api/notifications

Új értesítés küldése.

**Request:**

```json
{
  "userId": 123,
  "appName": "users",
  "title": { "hu": "Új csoport", "en": "New group" },
  "message": { "hu": "Csoport létrehozva", "en": "Group created" },
  "type": "success",
  "data": { "section": "groups", "groupId": "456" }
}
```

**Response:**

```json
{
  "success": true
}
```

### POST /api/notifications/[id]/read

Értesítés olvasottnak jelölése.

**Response:**

```json
{
  "success": true
}
```

### POST /api/notifications/[id]/delete

Értesítés törlése.

**Response:**

```json
{
  "success": true
}
```

### POST /api/notifications/read-all

Összes értesítés olvasottnak jelölése.

**Response:**

```json
{
  "success": true
}
```

### POST /api/notifications/delete-all

Összes értesítés törlése.

**Response:**

```json
{
  "success": true
}
```

## Socket.IO Események

### Kliens → Szerver

#### register

Felhasználó regisztrálása Socket.IO-n.

```typescript
socket.emit('register', userId);
```

**Automatikusan megtörténik:** A NotificationStore automatikusan regisztrálja a felhasználót kapcsolódáskor.

#### notification:mark-read

Értesítés olvasottnak jelölése.

```typescript
socket.emit('notification:mark-read', notificationId);
```

**Automatikusan megtörténik:** A `markAsRead()` metódus automatikusan emitálja, ha Socket.IO elérhető.

#### notification:mark-all-read

Összes értesítés olvasottnak jelölése.

```typescript
socket.emit('notification:mark-all-read', userId);
```

### Szerver → Kliens

#### notification:new

Új értesítés érkezett.

```typescript
socket.on('notification:new', (notification: Notification) => {
  // Értesítés feldolgozása
  console.log('Új értesítés:', notification);
});
```

**Automatikusan kezelve:** A NotificationStore automatikusan kezeli ezt az eseményt.

#### notification:unread-count

Olvasatlan értesítések száma frissült.

```typescript
socket.on('notification:unread-count', (count: number) => {
  // Számláló frissítése
  console.log('Olvasatlan értesítések:', count);
});
```

**Automatikusan kezelve:** A NotificationStore automatikusan frissíti az `unreadCount` állapotot.

## Socket.IO Szerver Implementáció

### Inicializálás

```typescript
// lib/server/socket/index.ts
export function initializeSocketIO(serverOrIo: HTTPServer | SocketIOServer) {
  if (io) {
    logger.warn('[Socket.IO] Already initialized');
    return io;
  }

  if (serverOrIo instanceof SocketIOServer) {
    // Production: a server.js már létrehozta a Socket.IO példányt
    io = serverOrIo;
  } else {
    // Development: Vite dev szerveren hozzuk létre
    io = new SocketIOServer(serverOrIo, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      path: '/socket.io/',
      pingTimeout: 60000,
      pingInterval: 25000,
      connectTimeout: 45000,
      upgradeTimeout: 10000,
      transports: ['websocket', 'polling']
    });
  }

  // Event handlers...
}
```

### Értesítés Küldése

```typescript
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  let socketIO: SocketIOServer | null = null;

  try {
    socketIO = getSocketIO();
  } catch (error) {
    console.warn('[sendNotification] Socket.IO not initialized, will save to database only');
  }

  // Determine target users
  let targetUserIds: number[] = [];

  if (payload.broadcast) {
    const allUsers = await db.select({ id: users.id }).from(users);
    targetUserIds = allUsers.map((u) => u.id);
  } else if (payload.userId) {
    targetUserIds = [payload.userId];
  } else if (payload.userIds) {
    targetUserIds = payload.userIds;
  }

  // Save notifications to database and emit to users
  for (const userId of targetUserIds) {
    const notification: NewNotification = {
      userId,
      appName: payload.appName || null,
      title: normalizeContent(payload.title) as any,
      message: normalizeContent(payload.message) as any,
      details: payload.details ? (normalizeContent(payload.details) as any) : null,
      type: payload.type || 'info',
      data: payload.data || null
    };

    const saved = await notificationRepository.create(notification);

    // Emit to user's room (only if Socket.IO is available)
    if (socketIO) {
      socketIO.to(`user:${userId}`).emit('notification:new', saved);

      // Update unread count
      const unreadCount = await notificationRepository.getUnreadCount(userId);
      socketIO.to(`user:${userId}`).emit('notification:unread-count', unreadCount);
    }
  }
}
```

## Notification Repository

Az adatbázis műveletek a `notificationRepository`-n keresztül történnek:

```typescript
// lib/server/database/repositories/notificationRepository.ts
export const notificationRepository = {
  async create(notification: NewNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  },

  async getByUserId(userId: number, limit = 50): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  },

  async getUnreadCount(userId: number): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.length;
  },

  async markAsRead(id: number): Promise<Notification | undefined> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  },

  async markAllAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  },

  async delete(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  },

  async deleteAllByUserId(userId: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.userId, userId));
  }
};
```

## Következő Lépések

- [Hibaelhárítás →](/hu/notifications-troubleshooting)
- [NotificationStore →](/hu/notifications-store)
- [Értesítési Rendszer Áttekintés →](/hu/notifications)
