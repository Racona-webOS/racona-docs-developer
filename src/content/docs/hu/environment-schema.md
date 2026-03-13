---
title: Varlock séma formátum
description: A .env.schema fájl formátuma, annotációk, típusok és függvények
prev:
  link: /hu/environment/
  label: Környezeti változók
---

Az `.env.schema` fájl egy speciális formátumú `.env` fájl, amely Varlock annotációkat tartalmaz. Ez az egyetlen igazságforrás a környezeti változók típusaihoz és validációs szabályaihoz.

**Fájl:** `apps/web/.env.schema`

## Példa séma

```dotenv
# @import(../../.env.local, allowMissing=true)
# @currentEnv=$NODE_ENV
# @defaultRequired=false @defaultSensitive=false
# @generateTypes(lang=ts, path=src/env.d.ts)
# ---

# @required @type=enum(development,production,test)
NODE_ENV=development

# @type=number
BODY_SIZE_LIMIT=10485760

# @type=port
ELYOS_PORT=3000

# @required @type=url
ORIGIN=

# @type=url
APP_URL=fallback(ref('ORIGIN'),'')

# @required @sensitive
POSTGRES_USER=

# @required @sensitive
POSTGRES_PASSWORD=

# @required
POSTGRES_HOST=localhost

# @required @type=url @sensitive
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
```

## Globális annotációk

A fájl elején, a `# ---` sor előtt:

- **`@import(path, allowMissing=true)`** — másik env fájl importálása
- **`@currentEnv=$NODE_ENV`** — aktuális környezet meghatározása
- **`@defaultRequired=false`** — alapértelmezetten nem kötelező a változók
- **`@defaultSensitive=false`** — alapértelmezetten nem érzékeny a változók
- **`@generateTypes(lang=ts, path=...)`** — TypeScript típusgenerálás

## Változó annotációk

### Típusok

| Annotáció | Leírás | Példa |
|-----------|--------|-------|
| `@type=string` | Szöveges érték (alapértelmezett) | `APP_NAME=ElyOS` |
| `@type=number` | Numerikus érték | `BODY_SIZE_LIMIT=10485760` |
| `@type=number(min=1,max=100)` | Numerikus érték tartománnyal | `DEMO_RESET_HOUR=3` |
| `@type=port` | Port szám (1–65535) | `ELYOS_PORT=3000` |
| `@type=url` | URL formátum | `ORIGIN=http://localhost:3000` |
| `@type=email(normalize=true)` | Email cím normalizálással | `SMTP_FROM_EMAIL=noreply@elyos.hu` |
| `@type=enum(a,b,c)` | Felsorolás típus | `NODE_ENV=development` |
| `@type=boolean` | Logikai érték | `DEV_MODE=true` |

### Kötelezőség

- **`@required`** — kötelező változó, hiánya leállítja az alkalmazást
- **`@required=eq($VAR, value)`** — feltételes kötelezőség

**Példa feltételes kötelezőségre:**

```dotenv
# @type=enum(smtp,resend,sendgrid,ses)
EMAIL_PROVIDER=smtp

# Csak akkor kötelező, ha EMAIL_PROVIDER=smtp
# @required=eq($EMAIL_PROVIDER, smtp)
SMTP_HOST=

# @type=port @required=eq($EMAIL_PROVIDER, smtp)
SMTP_PORT=587
```

### Érzékenység

- **`@sensitive`** — érzékeny adat, nem kerül naplóba

```dotenv
# @required @sensitive
BETTER_AUTH_SECRET=

# @required @type=url @sensitive
DATABASE_URL=
```

### Alapértelmezett érték

- **`@default=value`** — alapértelmezett érték, ha nincs megadva

```dotenv
# @type=port @default=3000
ELYOS_PORT=3000
```

## Függvények

### ref(varName)

Hivatkozás egy másik változóra:

```dotenv
APP_URL=fallback(ref('ORIGIN'),'')
SMTP_FROM_EMAIL=fallback(ref('SMTP_USERNAME'),'')
```

### fallback(value1, value2)

Első nem üres érték használata:

```dotenv
# Ha ORIGIN üres, akkor üres string
APP_URL=fallback(ref('ORIGIN'),'')

# Ha SMTP_USERNAME üres, akkor 'noreply@elyos.hu'
SMTP_FROM_EMAIL=fallback(ref('SMTP_USERNAME'),'noreply@elyos.hu')
```

### Interpoláció

Változók beágyazása `${VAR}` szintaxissal:

```dotenv
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
```

## Típusgenerálás

A `@generateTypes` annotáció hatására a Varlock automatikusan generál egy TypeScript típusfájlt:

```dotenv
# @generateTypes(lang=ts, path=src/env.d.ts)
```

**Generált fájl:** `apps/web/src/env.d.ts`

```typescript
export type CoercedEnvSchema = {
  NODE_ENV: "development" | "production" | "test";
  BODY_SIZE_LIMIT: number;
  ELYOS_PORT: number;
  ORIGIN: string;
  APP_URL?: string;
  DATABASE_URL: string;
  // ...
};

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvSchemaAsStrings {}
  }
}
```

Ez lehetővé teszi a típusbiztos hozzáférést:

```typescript
// ✅ Típusbiztos
const port = process.env.ELYOS_PORT;

// ❌ TypeScript hiba
const invalid = process.env.INVALID_VAR;
```

## Best practices

1. **Használj beszédes neveket** — `SMTP_HOST` jobb mint `SH`
2. **Csoportosítsd a változókat** — kommentekkel jelöld a kategóriákat
3. **Adj meg alapértelmezett értékeket** — fejlesztői környezethez
4. **Használj feltételes kötelezőséget** — csak a szükséges változók legyenek kötelezők
5. **Jelöld meg az érzékeny adatokat** — `@sensitive` annotációval

## Következő lépések

- [Runtime validáció →](/hu/environment-runtime) — schema.ts részletesen
- [Infisical integráció →](/hu/environment-infisical) — secrets management
- [Új változó hozzáadása →](/hu/environment-add-variable) — lépésről lépésre
