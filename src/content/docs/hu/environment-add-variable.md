---
title: Új változó hozzáadása
description: Lépésről lépésre útmutató új környezeti változó hozzáadásához
---

Ha új környezeti változót adsz hozzá az ElyOS projekthez, **3 helyen kell frissítened** a kódot.

## Checklist

- [ ] `.env.schema` — Varlock annotációkkal
- [ ] `schema.ts` — 4 helyen (EXPECTED_KEYS, REQUIRED_KEYS, validateSchema, validEnvArbitrary)
- [ ] `.env.example` — példa érték

## Példa: REDIS_URL hozzáadása

Tegyük fel, hogy hozzáadsz egy Redis kapcsolatot az alkalmazáshoz.

### 1. Frissítsd a `.env.schema` fájlt

**Fájl:** `apps/web/.env.schema`

```dotenv
# Redis
# @type=string
# @description=Redis connection URL
# @optional
REDIS_URL=
```

**Annotációk:**
- `@type=string` — szöveges érték (vagy `@type=url` ha URL validációt szeretnél)
- `@description` — leírás a változóról
- `@optional` — nem kötelező (vagy `@required` ha kötelező)

### 2. Frissítsd a `schema.ts` fájlt

**Fájl:** `apps/web/src/lib/secrets/schema.ts`

#### a) EXPECTED_ENV_KEYS tömb

```typescript
export const EXPECTED_ENV_KEYS = [
  // ... meglévő változók
  'REDIS_URL'  // ← Hozzáadni
] as const;
```

#### b) REQUIRED_KEYS tömb (ha kötelező)

```typescript
export const REQUIRED_KEYS = [
  // ... meglévő változók
  'REDIS_URL'  // ← Csak ha kötelező
] as const;
```

#### c) validateSchema függvény (ha speciális validáció kell)

Ha URL validációt szeretnél:

```typescript
// URL típusú mezők validációja
const urlFields = ['APP_URL', 'ORIGIN', 'BETTER_AUTH_URL', 'REDIS_URL'] as const;
for (const key of urlFields) {
  const value = env[key];
  if (value !== undefined && value !== null && value !== '') {
    if (!isValidUrl(value)) {
      errors.push(`Típusvalidáció sikertelen: ${key} — elvárt: url, kapott: "${value}"`);
    }
  }
}
```

#### d) validEnvArbitrary függvény (tesztekhez)

```typescript
export function validEnvArbitrary() {
  return fc.record({
    // ... meglévő változók
    REDIS_URL: fc.option(
      fc.string({ minLength: 1, maxLength: 128 }),
      { nil: undefined }
    ),
  });
}
```

### 3. Frissítsd a `.env.example` fájlt

**Fájl:** `.env.example` (projekt root)

```bash
# Redis
REDIS_URL=redis://localhost:6379
```

## Különböző típusok példái

### String változó

```dotenv
# .env.schema
# @type=string
APP_NAME=ElyOS
```

```typescript
// schema.ts - validEnvArbitrary
APP_NAME: fc.option(
  fc.string({ minLength: 1, maxLength: 64 }),
  { nil: undefined }
),
```

### Number változó

```dotenv
# .env.schema
# @type=number
# @type=number(min=1, max=100)
MAX_CONNECTIONS=50
```

```typescript
// schema.ts - validateSchema
const numericRangeFields = [
  { key: 'MAX_CONNECTIONS', min: 1, max: 100 }
];

// schema.ts - validEnvArbitrary
MAX_CONNECTIONS: fc.option(
  fc.integer({ min: 1, max: 100 }).map(String),
  { nil: undefined }
),
```

### Boolean változó

```dotenv
# .env.schema
# @type=boolean
FEATURE_ENABLED=true
```

```typescript
// schema.ts - validateSchema
const booleanFields = [
  'FEATURE_ENABLED'
] as const;

for (const key of booleanFields) {
  const value = env[key];
  if (value && !isValidBoolean(value)) {
    errors.push(`Típusvalidáció sikertelen: ${key}...`);
  }
}

// schema.ts - validEnvArbitrary
FEATURE_ENABLED: fc.option(
  fc.constantFrom('true', 'false'),
  { nil: undefined }
),
```

### Enum változó

```dotenv
# .env.schema
# @type=enum(redis,memcached,none)
CACHE_DRIVER=redis
```

```typescript
// schema.ts - validateSchema
const cacheDriver = env['CACHE_DRIVER'];
if (cacheDriver && !['redis', 'memcached', 'none'].includes(String(cacheDriver))) {
  errors.push(`Típusvalidáció sikertelen: CACHE_DRIVER — elvárt: enum(redis, memcached, none), kapott: "${cacheDriver}"`);
}

// schema.ts - validEnvArbitrary
CACHE_DRIVER: fc.option(
  fc.constantFrom('redis', 'memcached', 'none'),
  { nil: undefined }
),
```

### Port változó

```dotenv
# .env.schema
# @type=port
REDIS_PORT=6379
```

```typescript
// schema.ts - validateSchema
const portFields = ['ELYOS_PORT', 'SMTP_PORT', 'REDIS_PORT'] as const;

// schema.ts - validEnvArbitrary
REDIS_PORT: fc.option(
  fc.integer({ min: 1, max: 65535 }).map(String),
  { nil: undefined }
),
```

## Feltételes kötelezőség

Ha egy változó csak akkor kötelező, ha egy másik változó értéke megfelel egy feltételnek:

```dotenv
# .env.schema
# @type=enum(redis,memcached,none)
CACHE_DRIVER=redis

# Csak akkor kötelező, ha CACHE_DRIVER=redis
# @required=eq($CACHE_DRIVER, redis)
REDIS_URL=

# @type=port @required=eq($CACHE_DRIVER, redis)
REDIS_PORT=6379
```

A Varlock automatikusan kezeli a feltételes kötelezőséget, de a `schema.ts`-ben is implementálhatod, ha szeretnéd.

## Használat az alkalmazásban

Miután hozzáadtad a változót, használhatod az alkalmazásban:

```typescript
import { env } from '$lib/env';

// Típusbiztos hozzáférés
const redisUrl = env.REDIS_URL;  // string | undefined

if (redisUrl) {
  // Redis kapcsolat létrehozása
}
```

## Tesztelés

Futtasd a teszteket, hogy ellenőrizd, minden működik-e:

```bash
# Unit tesztek
bun test

# Property-based tesztek
bun test:pbt
```

## Következő lépések

- [Varlock séma formátum →](/hu/environment-schema) — annotációk részletesen
- [Runtime validáció →](/hu/environment-runtime) — schema.ts működése
- [Infisical integráció →](/hu/environment-infisical) — secrets hozzáadása
