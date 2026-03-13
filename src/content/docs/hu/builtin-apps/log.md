---
title: Log alkalmazás
description: Rendszer és hibanaplók megjelenítése és szűrése
---

A Log alkalmazás lehetővé teszi a rendszer naplóinak megtekintését, szűrését és elemzését. Jelenleg a hibanaplók (error logs) megjelenítését támogatja, az aktivitási naplók (activity logs) fejlesztés alatt állnak.

## Áttekintés

A Log alkalmazás két fő részből áll:
- **Hibanaplók** (Error Log) - Rendszer hibák, figyelmeztetések és debug üzenetek
- **Aktivitási naplók** (Activity Log) - Felhasználói műveletek naplózása (fejlesztés alatt)

### Főbb funkciók

- Hibanaplók megjelenítése táblázatos formában
- Szűrés log szint szerint (debug, info, warn, error, fatal)
- Szűrés forrás (source) szerint
- Rendezés oszloponként
- Lapozás nagy adatmennyiség esetén
- Színkódolt log szintek
- Jogosultság alapú hozzáférés

## Fájl struktúra

```
apps/log/
├── index.svelte              # Fő layout (AppLayout + menü)
├── menu.json                 # Menü definíció (Error, Activity)
├── error-logs.remote.ts      # Server action hibanaplók lekéréséhez
└── components/
    ├── ErrorLog.svelte       # Hibanaplók táblázat szűrőkkel
    ├── ActivityLog.svelte    # Aktivitási naplók (placeholder)
    └── errorLogColumns.ts    # Táblázat oszlopdefiníciók
```

## Menü struktúra

A `menu.json` definiálja az alkalmazás menüpontjait:

```json
[
  {
    "labelKey": "menu.error",
    "href": "#error",
    "icon": "ShieldAlert",
    "component": "ErrorLog",
    "requiredPermission": "log.error.view"
  },
  {
    "labelKey": "menu.activity",
    "href": "#activity",
    "icon": "ShieldAlert",
    "component": "ActivityLog"
  }
]
```

**Jogosultságok:**
- `log.error.view` - Hibanaplók megtekintése (csak admin)
- Activity Log jelenleg nincs jogosultsághoz kötve

## Server Actions

### `error-logs.remote.ts`

#### `fetchErrorLogs` (command)

Hibanaplók lekérése szűrési és lapozási paraméterekkel.

```typescript
const result = await fetchErrorLogs({
  page: 1,
  pageSize: 20,
  level: ['error', 'fatal'],  // opcionális, string vagy string[]
  source: 'server',            // opcionális
  search: 'database',          // opcionális (jelenleg nem használt)
  sortBy: 'timestamp',         // opcionális, alapértelmezett: 'timestamp'
  sortOrder: 'desc'            // opcionális, 'asc' vagy 'desc'
});
```

**Validáció:**
- `page`: minimum 1, alapértelmezett: 1
- `pageSize`: 1-100 között, alapértelmezett: 20
- `level`: 'debug' | 'info' | 'warn' | 'error' | 'fatal' (egyedi vagy tömb)
- `source`: string
- `sortBy`: string
- `sortOrder`: 'asc' | 'desc'

**Visszatérési érték:**

```typescript
{
  success: true,
  data: LogEntry[],
  pagination: {
    page: number,
    pageSize: number,
    totalCount: number,
    totalPages: number
  }
}
```

**Működés:**
1. Validálja a bemeneti paramétereket
2. Meghívja a `logRepository.findMany()` metódust
3. Lekéri az összes találat számát (`logRepository.count()`)
4. Visszaadja az adatokat és a lapozási információkat

## Komponensek

### ErrorLog.svelte

Hibanaplók megjelenítése DataTable komponenssel, szűrőkkel és lapozással.

**Állapot:**

```typescript
let data = $state<LogEntry[]>([]);
let loading = $state(false);
let paginationInfo = $state<PaginationInfo>({
  page: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0
});
let levelFilter = $state<string[]>([]);
let sourceFilter = $state('');
let tableState = $state<DataTableState>({
  page: 1,
  pageSize: 20,
  sortBy: 'timestamp',
  sortOrder: 'desc'
});
```

**Szűrők:**

1. **Level filter** - Faceted filter komponens
   - Többszörös kiválasztás (debug, info, warn, error, fatal)
   - Színkódolt badge-ek

2. **Source filter** - Input mező
   - 300ms debounce
   - Részleges egyezés (ILIKE)

**Reaktivitás:**

```typescript
$effect(() => {
  tableState;
  levelFilter;
  sourceFilter;
  untrack(() => loadData());
});
```

Bármely szűrő vagy táblázat állapot változásakor automatikusan újratölti az adatokat.

**Toolbar snippet:**

```svelte
{#snippet toolbar({ table, handleSort })}
  <Input
    placeholder={t('log.error.filters.sourcePlaceholder')}
    value={sourceFilter}
    oninput={handleSourceInput}
    class="h-8 w-[150px] lg:w-[250px]"
  />
  <DataTableFacetedFilter
    title={t('log.error.columns.level')}
    options={levels}
    selectedValues={levelFilter}
    onValuesChange={handleLevelChange}
  />
  {#if isFiltered}
    <Button variant="ghost" onclick={handleReset} class="h-8 px-2 lg:px-3">
      {t('log.error.filters.reset')}
      <X class="ml-2 size-4" />
    </Button>
  {/if}
{/snippet}
```

### ActivityLog.svelte

Placeholder komponens az aktivitási naplókhoz (fejlesztés alatt).

```svelte
<h2>{t('log.activity.title')}</h2>
```

### errorLogColumns.ts

Táblázat oszlopdefiníciók a TanStack Table-hez.

**Oszlopok:**

1. **Level** - Log szint színkódolással
   - Rendezés támogatott
   - Színek: debug (szürke), info (kék), warn (sárga), error (piros), fatal (sötét piros, félkövér)

2. **Message** - Hibaüzenet
   - Rendezés nem támogatott
   - Max szélesség: 500px, truncate
   - Tooltip teljes üzenettel

3. **Source** - Forrás (pl. 'server', 'client', 'database')
   - Rendezés támogatott
   - Monospace font, badge stílussal

4. **Timestamp** - Időbélyeg
   - Rendezés támogatott
   - Lokalizált formátum (`toLocaleString()`)

**Példa oszlop definíció:**

```typescript
{
  accessorKey: 'level',
  enableHiding: true,
  header: ({ column }) =>
    renderComponent(DataTableColumnHeader, {
      get column() { return column; },
      get title() { return t('log.error.columns.level'); },
      onSort
    }),
  cell: ({ row }) => {
    const level = String(row.original.level);
    const colorMap: Record<string, string> = {
      debug: 'text-gray-500',
      info: 'text-blue-500',
      warn: 'text-yellow-500',
      error: 'text-red-500',
      fatal: 'text-red-700 font-bold'
    };
    const snippet = createRawSnippet(() => ({
      render: () =>
        `<span class="${colorMap[level] ?? ''} uppercase text-xs font-medium">${level}</span>`
    }));
    return renderSnippet(snippet, {});
  }
}
```

## Logging rendszer

### Logger osztály

A `logger.ts` fájl tartalmazza a központi Logger osztályt.

**Inicializálás:**

```typescript
const config = createLogConfig(
  env.LOG_TARGETS,  // 'console' | 'file' | 'database'
  env.LOG_LEVEL,    // 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  env.LOG_DIR       // Fájl naplók könyvtára
);
export const logger = new Logger(config);
```

**Használat:**

```typescript
import { logger } from '$lib/server/logging/logger';

// Debug üzenet
await logger.debug('Debug message', { source: 'myModule' });

// Info üzenet
await logger.info('User logged in', {
  source: 'auth',
  userId: '123',
  context: { email: 'user@example.com' }
});

// Figyelmeztetés
await logger.warn('Deprecated API used', { source: 'api' });

// Hiba
await logger.error('Database connection failed', {
  source: 'database',
  stack: error.stack,
  context: { connectionString: 'postgres://...' }
});

// Kritikus hiba
await logger.fatal('System crash', {
  source: 'server',
  stack: error.stack
});
```

**Log szintek prioritása:**

```typescript
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
};
```

Csak a beállított szint vagy magasabb prioritású üzenetek kerülnek naplózásra.

### Transports

A Logger három transport-ot támogat:

1. **ConsoleTransport** - Konzolra írás (fejlesztéshez)
2. **FileTransport** - Fájlba írás (production)
3. **DatabaseTransport** - Adatbázisba írás (UI megjelenítéshez)

**Konfiguráció:**

```typescript
// .env
LOG_TARGETS=console,database  # Vesszővel elválasztva
LOG_LEVEL=info                # Minimum log szint
LOG_DIR=./logs                # Fájl naplók könyvtára
```

### LogRepository

Az `logRepository.ts` kezeli az adatbázis műveleteket.

#### `findMany(filters: LogFilters)`

Hibanaplók lekérése szűrőkkel.

```typescript
const logs = await logRepository.findMany({
  level: ['error', 'fatal'],
  source: 'database',
  userId: '123',
  from: new Date('2024-01-01'),
  to: new Date('2024-12-31'),
  limit: 50,
  offset: 0,
  sortBy: 'timestamp',
  sortOrder: 'desc'
});
```

**Szűrők:**
- `level`: LogLevel vagy LogLevel[] (inArray vagy eq)
- `source`: string (ILIKE, részleges egyezés)
- `userId`: string (eq)
- `from`: Date (gte)
- `to`: Date (lte)
- `limit`: number (alapértelmezett: 100)
- `offset`: number (alapértelmezett: 0)
- `sortBy`: 'level' | 'source' | 'timestamp'
- `sortOrder`: 'asc' | 'desc'

#### `count(filters: LogFilters)`

Találatok számának lekérése (lapozáshoz).

```typescript
const totalCount = await logRepository.count({
  level: ['error', 'fatal'],
  source: 'database'
});
```

#### `countByLevel(timeRange?: TimeRange)`

Log bejegyzések száma szintenként.

```typescript
const counts = await logRepository.countByLevel({
  from: new Date('2024-01-01'),
  to: new Date('2024-12-31')
});
// { debug: 10, info: 50, warn: 20, error: 5, fatal: 1 }
```

## Típusok

### LogEntry

```typescript
interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  source: string;
  timestamp: string;
  stack?: string;
  context?: Record<string, unknown>;
  userId?: string;
  url?: string;
  method?: string;
  routeId?: string;
  userAgent?: string;
}
```

### LogLevel

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
```

### LogFilters

```typescript
interface LogFilters {
  level?: LogLevel | LogLevel[];
  source?: string;
  userId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

## Adatbázis séma

### `error_logs` tábla

```typescript
{
  id: serial('id').primaryKey(),
  level: varchar('level', { length: 10 }).notNull(),
  message: text('message').notNull(),
  source: varchar('source', { length: 100 }).notNull(),
  stack: text('stack'),
  context: jsonb('context'),
  userId: varchar('user_id', { length: 255 }),
  url: text('url'),
  method: varchar('method', { length: 10 }),
  routeId: varchar('route_id', { length: 255 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}
```

**Indexek:**
- `level` - Gyors szűrés log szint szerint
- `source` - Gyors szűrés forrás szerint
- `createdAt` - Gyors rendezés időbélyeg szerint
- `userId` - Felhasználó specifikus naplók

## Használati példák

### Hibanaplók megtekintése

```typescript
// Komponensben
import { fetchErrorLogs } from '$apps/log/error-logs.remote';

const result = await fetchErrorLogs({
  page: 1,
  pageSize: 20,
  level: ['error', 'fatal'],
  sortBy: 'timestamp',
  sortOrder: 'desc'
});

if (result.success) {
  console.log('Logs:', result.data);
  console.log('Total:', result.pagination.totalCount);
}
```

### Hiba naplózása

```typescript
// Server-side kódban
import { logger } from '$lib/server/logging/logger';

try {
  // Valamilyen művelet
  await riskyOperation();
} catch (error) {
  await logger.error('Operation failed', {
    source: 'myModule',
    stack: error.stack,
    context: {
      operation: 'riskyOperation',
      params: { /* ... */ }
    }
  });
  throw error;
}
```

### HTTP kérés naplózása

```typescript
// hooks.server.ts
import { logger } from '$lib/server/logging/logger';

export async function handle({ event, resolve }) {
  try {
    const response = await resolve(event);

    // Sikeres kérés naplózása
    await logger.info('HTTP request', {
      source: 'http',
      url: event.url.pathname,
      method: event.request.method,
      routeId: event.route.id,
      userId: event.locals.user?.id,
      context: {
        status: response.status
      }
    });

    return response;
  } catch (error) {
    // Hiba naplózása
    await logger.error('HTTP request failed', {
      source: 'http',
      url: event.url.pathname,
      method: event.request.method,
      routeId: event.route.id,
      userId: event.locals.user?.id,
      stack: error.stack,
      userAgent: event.request.headers.get('user-agent')
    });

    throw error;
  }
}
```

### Egyedi transport létrehozása

```typescript
// custom-transport.ts
import type { LogTransport, LogEntry } from '$lib/server/logging/types';

export class SlackTransport implements LogTransport {
  name = 'slack';

  async write(entry: LogEntry): Promise<void> {
    // Csak error és fatal szintű üzenetek
    if (entry.level !== 'error' && entry.level !== 'fatal') {
      return;
    }

    // Slack webhook hívás
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `[${entry.level.toUpperCase()}] ${entry.message}`,
        attachments: [{
          color: entry.level === 'fatal' ? 'danger' : 'warning',
          fields: [
            { title: 'Source', value: entry.source, short: true },
            { title: 'Timestamp', value: entry.timestamp, short: true }
          ]
        }]
      })
    });
  }
}
```

## Fordítások

A Log alkalmazás fordításai a `translations.log` namespace-ben találhatók:

```sql
-- packages/database/src/seeds/translations/log.ts
INSERT INTO translations (namespace, key, locale, value) VALUES
  ('log', 'title', 'hu', 'Naplók'),
  ('log', 'title', 'en', 'Logs'),
  ('log', 'menu.error', 'hu', 'Hibanaplók'),
  ('log', 'menu.error', 'en', 'Error Logs'),
  ('log', 'menu.activity', 'hu', 'Aktivitási naplók'),
  ('log', 'menu.activity', 'en', 'Activity Logs'),
  ('log', 'error.columns.level', 'hu', 'Szint'),
  ('log', 'error.columns.level', 'en', 'Level'),
  -- ...
```

## Best practice-ek

1. **Log szintek használata**: Használd a megfelelő log szintet (debug fejlesztéshez, info normál működéshez, warn figyelmeztetésekhez, error hibákhoz, fatal kritikus hibákhoz)

2. **Kontextus hozzáadása**: Mindig adj hozzá releváns kontextust (userId, url, method, stb.) a naplóbejegyzésekhez

3. **Stack trace**: Hibák esetén mindig add hozzá a stack trace-t a könnyebb hibakereséshez

4. **Érzékeny adatok**: Ne naplózz jelszavakat, API kulcsokat vagy más érzékeny adatokat

5. **Performance**: A naplózás aszinkron, de nagy mennyiségű naplózás lassíthatja a rendszert - használd megfelelően a log szinteket

6. **Adatbázis méret**: Rendszeresen tisztítsd az régi naplóbejegyzéseket (pl. 30 napnál régebbiek törlése)

7. **Forrás megadása**: Mindig add meg a forrást (source) a könnyebb szűréshez és hibakereséshez

8. **Transport konfiguráció**: Production környezetben használj database és file transport-ot, fejlesztésben console-t

## Hibaelhárítás

### Naplók nem jelennek meg

**Probléma**: A Log alkalmazásban nem látszanak a naplóbejegyzések.

**Megoldás**:
1. Ellenőrizd a `LOG_TARGETS` környezeti változót - tartalmazza-e a `database`-t
2. Ellenőrizd a `LOG_LEVEL` beállítást - lehet, hogy túl magas (pl. `error`, de `info` szintű üzeneteket keresel)
3. Nézd meg az `error_logs` táblát közvetlenül az adatbázisban
4. Ellenőrizd a jogosultságokat (`log.error.view`)

### Szűrés nem működik

**Probléma**: A szűrők nem szűrik az adatokat.

**Megoldás**:
1. Ellenőrizd a böngésző konzolt hibákért
2. Nézd meg a network tab-ot - meghívódik-e a `fetchErrorLogs` action
3. Ellenőrizd a `$effect` reaktivitást - minden szűrő változó szerepel-e benne

### Lapozás hibás

**Probléma**: A lapozás nem működik megfelelően.

**Megoldás**:
1. Ellenőrizd a `paginationInfo` állapotot
2. Nézd meg a `totalCount` értékét - helyes-e
3. Ellenőrizd a `validatePaginationParams` függvényt a server action-ben

### Performance problémák

**Probléma**: A Log alkalmazás lassan tölt be.

**Megoldás**:
1. Csökkentsd a `pageSize` értékét (alapértelmezett: 20)
2. Használj szűrőket a találatok számának csökkentéséhez
3. Ellenőrizd az adatbázis indexeket
4. Tisztítsd a régi naplóbejegyzéseket
