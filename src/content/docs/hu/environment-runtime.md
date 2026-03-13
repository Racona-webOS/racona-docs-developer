---
title: Runtime validáció
description: A schema.ts fájl szerepe és működése — runtime validáció, property-based testing
---

A `schema.ts` fájl a **futásidejű validációs logikát** tartalmazza. Míg a Varlock a `.env.schema` fájlból típusdefiníciókat generál, ez a fájl runtime-ban ellenőrzi a betöltött értékeket.

**Fájl:** `apps/web/src/lib/secrets/schema.ts`

## Miért kell runtime validáció?

A Varlock típusgenerálás **compile time** biztonságot ad, de az Infisical-ból vagy `.env` fájlból jövő adatok **nem típusbiztosak** — bármi lehet bennük.

| Aspektus | Varlock (`.env.schema`) | `schema.ts` |
|----------|------------------------|-------------|
| **Mikor fut** | Build time / indításkor | Runtime (Infisical betöltés után) |
| **Mit csinál** | TypeScript típusok generálása | Értékek validálása |
| **Hol használják** | `env.d.ts` generálás | `varlock.ts` → `loadSecretsWithFallback` |
| **Formátum** | Varlock annotációk | TypeScript kód |

## Fő funkciók

### 1. validateSchema(env)

Validálja az env objektumot az `.env.schema` szabályai alapján:

```typescript
export function validateSchema(env: Record<string, unknown>): Record<string, unknown> {
  const errors: string[] = [];

  // Kötelező mezők ellenőrzése
  for (const key of REQUIRED_KEYS) {
    if (!env[key]) {
      errors.push(`Hiányzó kötelező változó: ${key}`);
    }
  }

  // Típus validációk
  if (!['development', 'production', 'test'].includes(String(env.NODE_ENV))) {
    errors.push(`Típusvalidáció sikertelen: NODE_ENV...`);
  }

  if (errors.length > 0) {
    throw new Error(`[Varlock] Séma validáció sikertelen:\n${errors.join('\n')}`);
  }

  return env;
}
```

**Validációk:**
- Kötelező mezők jelenléte
- Típusok (URL, port, boolean, number, enum)
- Tartományok (pl. `DEMO_RESET_HOUR`: 0-23)
- Speciális formátumok (pl. `DATABASE_URL` kezdődjön `postgresql://`-vel)

### 2. Kulcs listák

```typescript
export const REQUIRED_KEYS = [
  'INFISICAL_CLIENT_ID',
  'INFISICAL_CLIENT_SECRET',
  'NODE_ENV',
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL'
] as const;

export const EXPECTED_ENV_KEYS = [
  // Minden változó, kötelező + opcionális
  'INFISICAL_CLIENT_ID',
  'INFISICAL_CLIENT_SECRET',
  'NODE_ENV',
  // ... összes többi
] as const;
```

### 3. Property-based testing

```typescript
export function validEnvArbitrary(): fc.Arbitrary<Record<string, unknown>>
```

**fast-check** arbitrary generátor, amely véletlenszerű, de érvényes env objektumokat hoz létre tesztekhez:

```typescript
// Tesztben:
fc.assert(
  fc.property(validEnvArbitrary(), (env) => {
    expect(() => validateSchema(env)).not.toThrow();
  })
);
```

## Használat a kódban

```typescript
// varlock.ts-ben:
import { validateSchema } from './schema.js';

async function loadSecretsWithFallback(options) {
  const secrets = await fetchWithRetry(infisical);
  const validated = validateSchema(secrets); // ← Itt fut
  return { secrets: validated, source: 'infisical' };
}
```

## Validációs példák

### URL validáció

```typescript
const urlFields = ['APP_URL', 'ORIGIN', 'BETTER_AUTH_URL'] as const;
for (const key of urlFields) {
  const value = env[key];
  if (value && !isValidUrl(value)) {
    errors.push(`Típusvalidáció sikertelen: ${key} — elvárt: url, kapott: "${value}"`);
  }
}
```

### Port validáció

```typescript
const portFields = ['ELYOS_PORT', 'SMTP_PORT', 'POSTGRES_PORT'] as const;
for (const key of portFields) {
  const value = env[key];
  if (value && !isValidPort(value)) {
    errors.push(`Típusvalidáció sikertelen: ${key} — elvárt: port (1–65535), kapott: "${value}"`);
  }
}
```

### Enum validáció

```typescript
const nodeEnv = env['NODE_ENV'];
if (!['development', 'production', 'test'].includes(String(nodeEnv))) {
  errors.push(`Típusvalidáció sikertelen: NODE_ENV — elvárt: enum(development, production, test), kapott: "${nodeEnv}"`);
}
```

### Tartomány validáció

```typescript
const numericRangeFields = [
  { key: 'EMAIL_OTP_EXPIRES_IN', min: 1, max: 20 },
  { key: 'DEMO_RESET_HOUR', min: 0, max: 23 },
  { key: 'VERIFICATION_ROLLOUT_PERCENTAGE', min: 0, max: 100 }
];

for (const { key, min, max } of numericRangeFields) {
  const value = env[key];
  if (value && !isValidNumber(value, min, max)) {
    errors.push(`Típusvalidáció sikertelen: ${key} — elvárt: number(min=${min}, max=${max}), kapott: "${value}"`);
  }
}
```

## Hibaüzenetek

```
[Varlock] Séma validáció sikertelen:
  Hiányzó kötelező változó: DATABASE_URL
  Típusvalidáció sikertelen: SMTP_PORT — elvárt: port (1–65535), kapott: "invalid"
  Típusvalidáció sikertelen: NODE_ENV — elvárt: enum(development, production, test), kapott: "staging"
```

## Következő lépések

- [Új változó hozzáadása →](/hu/environment-add-variable) — lépésről lépésre útmutató
- [Varlock séma formátum →](/hu/environment-schema) — annotációk és típusok
- [Infisical integráció →](/hu/environment-infisical) — secrets management
