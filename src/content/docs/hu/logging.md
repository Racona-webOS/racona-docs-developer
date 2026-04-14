---
title: Naplózás
description: Szerver oldali logger használata, naplózási szintek, célok konfigurálása és a Log alkalmazás
next:
  link: /hu/notifications/
  label: Értesítések
---

## Áttekintés

A Rocona saját naplózási rendszert használ, amely több célra (konzol, fájl, adatbázis) tud egyszerre írni. A naplók a beépített **Log** alkalmazásban tekinthetők meg.

## Logger importálása

```typescript
import { logger } from '$lib/server/logging';
```

## Naplózási szintek

```typescript
logger.debug('Részletes debug információ', { extra: 'adat' });
logger.info('Általános információ');
logger.warn('Figyelmeztetés', { context: 'valami' });
logger.error('Hiba történt', { error: err });
logger.fatal('Kritikus hiba', { error: err });
```

## Strukturált naplózás

A logger strukturált adatokat fogad el második paraméterként:

```typescript
logger.info('Felhasználó bejelentkezett', {
  userId: user.id,
  email: user.email,
  ip: event.getClientAddress()
});

logger.error('Adatbázis hiba', {
  operation: 'findUser',
  userId: id,
  error: error.message
});
```

## Naplózás szerver akcióban

```typescript
import { command, getRequestEvent } from '$app/server';
import { logger } from '$lib/server/logging';

export const myAction = command(schema, async (input) => {
  const { locals } = getRequestEvent();

  logger.info('Akció végrehajtva', {
    action: 'myAction',
    userId: locals.user?.id,
    input
  });

  try {
    // ... logika
    return { success: true };
  } catch (error) {
    logger.error('Akció sikertelen', {
      action: 'myAction',
      error: error instanceof Error ? error.message : String(error)
    });
    return { success: false, error: 'Belső hiba' };
  }
});
```

## Konfigurálás

A naplózás a `.env` fájlban konfigurálható:

| Változó       | Alapértelmezett | Leírás                                                                |
| ------------- | --------------- | --------------------------------------------------------------------- |
| `LOG_TARGETS` | `console`       | Vesszővel elválasztott célok: `console`, `file`, `database`           |
| `LOG_LEVEL`   | `error`         | Minimális szint: `debug`, `info`, `warn`, `error`, `fatal`            |
| `LOG_DIR`     | `./logs`        | Naplófájlok könyvtára (ha `file` cél aktív)                           |

### Fejlesztői konfiguráció

```bash
LOG_TARGETS=console
LOG_LEVEL=debug
```

### Éles konfiguráció

```bash
LOG_TARGETS=console,database
LOG_LEVEL=info
```

## Log alkalmazás

A beépített **Log** alkalmazás (`src/apps/log/`) megjeleníti az adatbázisba mentett naplókat. Csak admin jogosultsággal érhető el.

A naplók az `error_logs` táblában tárolódnak, ha a `database` cél aktív.

## Kliens oldali hibák naplózása

A kliens oldali JavaScript hibák automatikusan naplózódnak a `/api/log` végponton keresztül. Ez a `hooks.client.ts`-ben van beállítva.
