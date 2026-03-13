---
title: Chat alkalmazás
description: Valós idejű üzenetküldő rendszer Socket.IO-val
---

A Chat alkalmazás egy valós idejű üzenetküldő rendszer, amely lehetővé teszi a felhasználók közötti közvetlen kommunikációt. Socket.IO alapú real-time kapcsolattal és REST API fallback-kel rendelkezik.

## Áttekintés

A Chat alkalmazás három fő részből áll:
- **Felhasználói lista** (jobb oldali sidebar) - online/offline státusszal
- **Beszélgetések listája** - olvasatlan üzenetek számával
- **Chat ablak** - üzenetek megjelenítése és küldése

### Főbb funkciók

- Valós idejű üzenetküldés Socket.IO-val
- Online/offline státusz követés
- Gépelés jelzés (typing indicator)
- Olvasatlan üzenetek számlálása
- Automatikus fallback REST API-ra (dev mode)
- Toast értesítések új üzenetekről
- Beszélgetések automatikus rendezése (legfrissebb felül)

## Fájl struktúra

```
apps/chat/
├── index.svelte              # Fő layout (sidebar + beszélgetések + chat ablak)
├── chat.remote.ts            # Server actions (üzenetek, beszélgetések)
├── components/
│   ├── UserList.svelte       # Felhasználói lista online/offline csoportosítással
│   ├── ConversationList.svelte  # Beszélgetések listája
│   └── ChatWindow.svelte     # Üzenetek megjelenítése és küldés
└── stores/
    └── chatStore.svelte.ts   # Chat állapotkezelés és Socket.IO kapcsolat
```

## Server Actions

### `chat.remote.ts`

A Chat alkalmazás 8 server action-t definiál:

#### 1. `getChatUsers` (query)

Visszaadja az összes felhasználót (kivéve a jelenlegi felhasználót) chat indításához.

```typescript
const result = await getChatUsers();
// { success: true, users: ChatUser[] }
```

#### 2. `getConversations` (query)

Lekéri a felhasználó összes beszélgetését az utolsó üzenettel és olvasatlan számmal.

```typescript
const result = await getConversations();
// { success: true, conversations: ConversationWithLastMessage[] }
```

#### 3. `getMessages` (command)

Lekéri egy beszélgetés üzeneteit lapozással.

```typescript
const result = await getMessages({
  conversationId: 1,
  limit: 50,      // opcionális, alapértelmezett: 50
  offset: 0       // opcionális, alapértelmezett: 0
});
// { success: true, messages: MessageWithSender[] }
```

**Validáció:**
- `conversationId`: minimum 1
- `limit`: 1-100 között
- `offset`: minimum 0
- Ellenőrzi, hogy a felhasználó tagja-e a beszélgetésnek

#### 4. `sendMessage` (command)

Új üzenet küldése egy felhasználónak.

```typescript
const result = await sendMessage({
  recipientId: 2,
  content: "Helló!"
});
// { success: true, message: MessageWithSender, conversationId: number }
```

**Validáció:**
- `recipientId`: minimum 1
- `content`: 1-5000 karakter között

**Működés:**
1. Lekéri vagy létrehozza a beszélgetést
2. Elmenti az üzenetet az adatbázisba
3. Visszaadja az üzenetet a küldő adataival

#### 5. `markMessagesAsRead` (command)

Beszélgetés üzeneteinek olvasottá jelölése.

```typescript
const result = await markMessagesAsRead({
  conversationId: 1
});
// { success: true }
```

#### 6. `getUnreadCount` (query)

Összes olvasatlan üzenet számának lekérése.

```typescript
const result = await getUnreadCount();
// { success: true, count: number }
```

#### 7. `getCurrentUserId` (query)

Jelenlegi felhasználó ID-jának lekérése.

```typescript
const result = await getCurrentUserId();
// { success: true, userId: number }
```

#### 8. `getOrCreateConversation` (command)

Beszélgetés lekérése vagy létrehozása egy felhasználóval.

```typescript
const result = await getOrCreateConversation({
  otherUserId: 2
});
// { success: true, conversationId: number }
```

## ChatStore

A `chatStore.svelte.ts` kezeli a chat állapotot és a Socket.IO kapcsolatot.

### Állapot

```typescript
interface ChatState {
  conversations: ConversationWithLastMessage[];
  activeConversationId: number | null;
  messages: MessageWithSender[];
  unreadCount: number;
  isConnected: boolean;              // Socket.IO kapcsolat állapota
  onlineUsers: Set<number>;          // Online felhasználók ID-i
  typingUsers: Map<number, boolean>; // Gépelő felhasználók beszélgetésenként
}
```

### Főbb metódusok

#### `connect(userId: number)`

Socket.IO kapcsolat inicializálása és event listener-ek beállítása.

```typescript
const chatStore = getChatStore();
await chatStore.connect(userId);
```

**Socket.IO események:**
- `chat:new-message` - Új üzenet érkezett
- `chat:user-online` - Felhasználó online lett
- `chat:user-offline` - Felhasználó offline lett
- `chat:online-users` - Online felhasználók listája
- `chat:user-typing` - Gépelés jelzés

**Fallback működés:**
- Ha Socket.IO nem elérhető, 10 másodpercenként poll-oz
- Dev mode-ban automatikusan polling-ot használ

#### `disconnect()`

Socket.IO kapcsolat bontása és polling leállítása.

```typescript
chatStore.disconnect();
```

#### `loadConversations()`

Beszélgetések újratöltése az API-ból.

```typescript
await chatStore.loadConversations();
```

#### `loadMessages(conversationId: number)`

Beszélgetés üzeneteinek betöltése és aktívvá tétele.

```typescript
await chatStore.loadMessages(1);
```

**Mellékhatások:**
- Beállítja az `activeConversationId`-t
- Automatikusan olvasottá jelöli az üzeneteket
- Frissíti az olvasatlan számot

#### `sendMessage(recipientId: number, content: string)`

Üzenet küldése Socket.IO-n keresztül.

```typescript
const result = await chatStore.sendMessage(2, "Helló!");
```

**Működés:**
1. Meghívja a `sendMessage` server action-t
2. Elküldi Socket.IO-n keresztül (`chat:send-message` event)
3. Hozzáadja az üzenetet a helyi állapothoz (ha aktív beszélgetés)
4. Frissíti a beszélgetések listáját

#### `markAsRead(conversationId: number)`

Üzenetek olvasottá jelölése.

```typescript
await chatStore.markAsRead(1);
```

#### `sendTypingIndicator(recipientId, conversationId, isTyping)`

Gépelés jelzés küldése Socket.IO-n keresztül.

```typescript
chatStore.sendTypingIndicator(2, 1, true);  // Gépelés kezdése
chatStore.sendTypingIndicator(2, 1, false); // Gépelés vége
```

#### `isUserOnline(userId: number): boolean`

Ellenőrzi, hogy egy felhasználó online-e.

```typescript
if (chatStore.isUserOnline(2)) {
  console.log('User is online');
}
```

#### `isUserTyping(conversationId: number): boolean`

Ellenőrzi, hogy valaki gépel-e egy beszélgetésben.

```typescript
if (chatStore.isUserTyping(1)) {
  console.log('Other user is typing...');
}
```

## Komponensek

### UserList.svelte

Felhasználói lista online/offline csoportosítással és keresővel.

**Funkciók:**
- Keresés név és felhasználónév alapján
- Online/offline csoportok összecsukhatók
- Státusz indikátor (zöld/szürke)
- Kattintásra beszélgetés indítása

**Használat:**

```svelte
<UserList />
```

### ConversationList.svelte

Beszélgetések listája az utolsó üzenettel és olvasatlan számmal.

**Funkciók:**
- Automatikus rendezés (legfrissebb felül)
- Olvasatlan üzenetek badge-e
- Aktív beszélgetés kiemelése
- Frissítés gomb
- Relatív időbélyeg (pl. "2 perce")

**Használat:**

```svelte
<ConversationList />
```

### ChatWindow.svelte

Üzenetek megjelenítése és küldése.

**Funkciók:**
- Üzenetek csoportosítása küldő szerint
- Avatar megjelenítés
- Gépelés jelzés animációval
- Enter billentyűvel küldés
- Automatikus görgetés új üzenethez
- Üres állapot kezelés

**Használat:**

```svelte
<ChatWindow currentUserId={userId} />
```

**Props:**
- `currentUserId`: Jelenlegi felhasználó ID-ja (üzenetek megkülönböztetéséhez)

## Socket.IO integráció

### Szerver oldal

A Socket.IO szerver a `server.js` fájlban van konfigurálva (Express + Socket.IO).

**Események (szerver → kliens):**
- `chat:new-message` - Új üzenet érkezett
- `chat:user-online` - Felhasználó online lett
- `chat:user-offline` - Felhasználó offline lett
- `chat:online-users` - Online felhasználók listája
- `chat:user-typing` - Gépelés jelzés

**Események (kliens → szerver):**
- `register` - Felhasználó regisztrálása (userId)
- `chat:send-message` - Üzenet küldése
- `chat:mark-read` - Üzenetek olvasottá jelölése
- `chat:typing` - Gépelés jelzés küldése

### Kliens oldal

A ChatStore automatikusan kezeli a Socket.IO kapcsolatot:

```typescript
// Kapcsolódás
const chatStore = getChatStore();
await chatStore.connect(userId);

// Automatikus újracsatlakozás
// - Végtelen újrapróbálkozás
// - 1-5 másodperc késleltetéssel
// - WebSocket + polling fallback
```

## Toast értesítések

Új üzenet érkezésekor (ha nem az aktív beszélgetésben):

```typescript
toast.info(senderName, {
  description: messagePreview,
  duration: 5000,
  action: {
    label: 'Megnyitás',
    onClick: () => openMessageInChat(conversationId)
  }
});
```

**Működés:**
1. Dinamikusan importálja a `svelte-sonner` toast-ot
2. Megjeleníti a küldő nevét és az üzenet előnézetét
3. "Megnyitás" gombbal megnyitja a beszélgetést

## Adatbázis séma

### `conversations` tábla

```typescript
{
  id: number;
  participant1Id: number;
  participant2Id: number;
  lastMessageAt: Date | null;
  createdAt: Date;
}
```

### `messages` tábla

```typescript
{
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  isRead: boolean;
  readAt: Date | null;
  sentAt: Date;
}
```

## ChatRepository

A `chatRepository.ts` kezeli az adatbázis műveleteket.

### Főbb metódusok

#### `getOrCreateConversation(userId1, userId2)`

Lekéri vagy létrehozza a beszélgetést két felhasználó között.

```typescript
const conversation = await chatRepository.getOrCreateConversation(1, 2);
```

**Működés:**
- Ellenőrzi mindkét irányban (participant1 ↔ participant2)
- Ha nem létezik, létrehozza

#### `getUserConversations(userId)`

Lekéri a felhasználó összes beszélgetését.

```typescript
const conversations = await chatRepository.getUserConversations(1);
```

**Visszaadja:**
- Beszélgetés adatok
- Másik felhasználó neve és képe
- Utolsó üzenet
- Olvasatlan üzenetek száma

#### `getConversationMessages(conversationId, limit, offset)`

Lekéri egy beszélgetés üzeneteit.

```typescript
const messages = await chatRepository.getConversationMessages(1, 50, 0);
```

**Működés:**
- Lapozható (limit + offset)
- Időrendi sorrendben (legrégebbi → legújabb)
- Küldő neve és képe csatolva

#### `sendMessage(conversationId, senderId, content)`

Új üzenet mentése.

```typescript
const message = await chatRepository.sendMessage(1, 2, "Helló!");
```

**Mellékhatások:**
- Frissíti a beszélgetés `lastMessageAt` mezőjét

#### `markMessagesAsRead(conversationId, userId)`

Beszélgetés üzeneteinek olvasottá jelölése.

```typescript
await chatRepository.markMessagesAsRead(1, 2);
```

**Működés:**
- Csak a másik felhasználó üzeneteit jelöli olvasottá
- Beállítja az `isRead` és `readAt` mezőket

#### `getUserUnreadCount(userId)`

Összes olvasatlan üzenet számának lekérése.

```typescript
const count = await chatRepository.getUserUnreadCount(1);
```

## Használati példák

### Chat alkalmazás indítása

```typescript
import { getChatStore } from '$apps/chat/stores/chatStore.svelte';
import { getCurrentUserId } from '$apps/chat/chat.remote';

// Felhasználó ID lekérése
const result = await getCurrentUserId();
if (result.success && result.userId) {
  // ChatStore inicializálása
  const chatStore = getChatStore();
  await chatStore.connect(result.userId);
}
```

### Új beszélgetés indítása

```typescript
import { getChatStore } from '$apps/chat/stores/chatStore.svelte';
import { getOrCreateConversation } from '$apps/chat/chat.remote';

const chatStore = getChatStore();

// Beszélgetés létrehozása
const result = await getOrCreateConversation({ otherUserId: 2 });

if (result.success && result.conversationId) {
  // Beszélgetések frissítése
  await chatStore.loadConversations();

  // Beszélgetés megnyitása
  await chatStore.loadMessages(result.conversationId);
}
```

### Üzenet küldése

```typescript
import { getChatStore } from '$apps/chat/stores/chatStore.svelte';

const chatStore = getChatStore();

// Üzenet küldése
const result = await chatStore.sendMessage(2, "Helló, hogy vagy?");

if (result.success) {
  console.log('Üzenet elküldve');
}
```

### Gépelés jelzés

```typescript
import { getChatStore } from '$apps/chat/stores/chatStore.svelte';

const chatStore = getChatStore();
let typingTimeout: ReturnType<typeof setTimeout> | null = null;

function handleInput(recipientId: number, conversationId: number) {
  // Gépelés kezdése
  chatStore.sendTypingIndicator(recipientId, conversationId, true);

  // Timeout törlése
  if (typingTimeout) clearTimeout(typingTimeout);

  // 3 másodperc után gépelés vége
  typingTimeout = setTimeout(() => {
    chatStore.sendTypingIndicator(recipientId, conversationId, false);
  }, 3000);
}
```

## Fordítások

A Chat alkalmazás fordításai a `translations.chat` namespace-ben találhatók:

```sql
-- packages/database/src/seeds/translations/chat.ts
INSERT INTO translations (namespace, key, locale, value) VALUES
  ('chat', 'title', 'hu', 'Chat'),
  ('chat', 'title', 'en', 'Chat'),
  ('chat', 'users', 'hu', 'Felhasználók'),
  ('chat', 'users', 'en', 'Users'),
  ('chat', 'conversations', 'hu', 'Beszélgetések'),
  ('chat', 'conversations', 'en', 'Conversations'),
  -- ...
```

**Használat komponensben:**

```svelte
<script>
  import { I18nProvider } from '$lib/i18n/components';
</script>

<I18nProvider namespaces={['chat', 'common']}>
  <!-- Chat komponensek -->
</I18nProvider>
```

## Best practice-ek

1. **Socket.IO kapcsolat kezelése**: Mindig hívd meg a `disconnect()` metódust, amikor az alkalmazás bezárul
2. **Gépelés jelzés**: Használj timeout-ot, hogy ne küldjön folyamatosan event-eket
3. **Üzenetek lapozása**: Implementálj "load more" funkciót nagy beszélgetéseknél
4. **Offline működés**: A fallback polling biztosítja, hogy dev mode-ban is működjön
5. **Toast értesítések**: Csak akkor jelenítsd meg, ha nem az aktív beszélgetésben érkezik az üzenet
6. **Olvasatlan számlálás**: Automatikusan frissül Socket.IO event-ekkel
7. **Avatar képek**: Használj `referrerpolicy="no-referrer"` és `crossorigin="anonymous"` attribútumokat
8. **Üzenetek csoportosítása**: Csak akkor jelenítsd meg az avatart, ha új küldő van

## Hibaelhárítás

### Socket.IO nem csatlakozik

**Probléma**: `isConnected` mindig `false` marad.

**Megoldás**:
1. Ellenőrizd, hogy a Socket.IO szerver fut-e (`server.js`)
2. Nézd meg a böngésző konzolt Socket.IO hibákért
3. Dev mode-ban a polling fallback automatikusan aktiválódik

### Üzenetek nem jelennek meg

**Probléma**: Új üzenet nem jelenik meg a chat ablakban.

**Megoldás**:
1. Ellenőrizd, hogy az aktív beszélgetés ID helyes-e
2. Nézd meg a `chat:new-message` event érkezik-e (DevTools Network tab)
3. Ellenőrizd a `currentUserId` prop-ot a `ChatWindow` komponensben

### Gépelés jelzés nem működik

**Probléma**: A typing indicator nem jelenik meg.

**Megoldás**:
1. Ellenőrizd, hogy Socket.IO csatlakozva van-e
2. Nézd meg a `chat:typing` event küldését és fogadását
3. Ellenőrizd a `typingUsers` Map-et a store-ban

### Online státusz nem frissül

**Probléma**: Felhasználók mindig offline-nak látszanak.

**Megoldás**:
1. Ellenőrizd a `chat:online-users` event fogadását
2. Nézd meg az `onlineUsers` Set-et a store-ban
3. Dev mode-ban a polling frissíti az online státuszt
