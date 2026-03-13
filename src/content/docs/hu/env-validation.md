---
title: Env séma validáció
description: Környezeti változók typesafe validációja Varlock-kal – séma formátum, típusok és hibaüzenetek
---

Az ElyOS **Varlock**-ot használ az összes környezeti változó typesafe validációjához. A Varlock az alkalmazás indításakor fut — a `node server.js` előtt — így a hibás konfiguráció azonnal kiderül.

**Részletes dokumentáció:**
- [Varlock hivatalos oldal](https://varlock.dev/) — teljes Varlock dokumentáció
- [Környezeti változók →](/hu/environment) — ElyOS specifikus használat

## Az Env_Schema fájl

Az összes env változó típusa és validációs szabálya az `apps/web/.env.schema` fájlban van definiálva. Ez az egyetlen igazságforrás — a Varlock ebből generálja a TypeScript típusokat is.

```dotenv
# apps/web/.env.schema
# @generateTypes(lang=ts, path=src/env.d.ts)
# @defaultRequired=false

# Bootstrap credentials (kötelező, helyi .env fájlból jön)
# @required @type=infisicalClientId
INFISICAL_CLIENT_ID=

# @required @type=infisicalClientSecret @sensitive
INFISICAL_CLIENT_SECRET=

# @required @type=enum(development, production, test)
NODE_ENV=development

# @required @type=url @sensitive
DATABASE_URL=

# @type=port
ELYOS_PORT=3000

# @sensitive @required
BETTER_AUTH_SECRET=

# @required @type=url
BETTER_AUTH_URL=
```

A `@generateTypes` dekorátor hatására a Varlock automatikusan generál egy `src/env.d.ts` TypeScript típusfájlt — ezt ne szerkeszd kézzel.

## Támogatott típusok és dekorátorok

| Dekorátor / típus                    | Leírás                                              |
| ------------------------------------ | --------------------------------------------------- |
| `@required`                          | Kötelező változó — hiánya leállítja az alkalmazást  |
| `@sensitive`                         | Érzékeny adat — nem kerül naplóba                   |
| `@type=string`                       | Szöveg típus                                        |
| `@type=number` / `@type=port`        | Szám / port típus                                   |
| `@type=boolean`                      | Boolean típus                                       |
| `@type=url`                          | URL validáció                                       |
| `@type=enum(a, b, c)`                | Felsorolt értékek                                   |
| `@type=string(startsWith=prefix_)`   | Prefix validáció (pl. `re_` Resend API kulcshoz)    |
| `@type=number(min=1, max=100)`       | Szám tartomány validáció                            |
| `@type=infisicalClientId`            | Infisical Machine Identity client ID                |
| `@type=infisicalClientSecret`        | Infisical Machine Identity client secret            |

## Feltételes kötelezőség

A Varlock támogatja a feltételes kötelezőséget, ahol egy változó csak akkor kötelező, ha egy másik változó értéke megfelel egy feltételnek:

```dotenv
# Email provider selection
# @type=enum(smtp,resend,sendgrid,ses)
EMAIL_PROVIDER=smtp

# SMTP variables — only required when EMAIL_PROVIDER=smtp
# @required=eq($EMAIL_PROVIDER, smtp)
SMTP_HOST=

# @type=port @required=eq($EMAIL_PROVIDER, smtp)
SMTP_PORT=587

# @sensitive @required=eq($EMAIL_PROVIDER, smtp)
SMTP_PASSWORD=

# Resend variables — only required when EMAIL_PROVIDER=resend
# @sensitive @required=eq($EMAIL_PROVIDER, resend)
RESEND_API_KEY=
```

## Interpoláció és függvények

A sémában használhatsz változó interpolációt és függvényeket:

```dotenv
# Interpoláció
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}

# Fallback értékek
APP_URL=fallback(ref('ORIGIN'),'')
SMTP_FROM_EMAIL=fallback(ref("SMTP_USERNAME"),'')
```

## Env értékek elérése az alkalmazásban

Az `src/lib/env.ts` re-exportálja a Varlock által már validált `process.env` értékeket typesafe módon:

```typescript
import { env } from '$lib/env';

// Typesafe, a Varlock már validálta indításkor
const dbUrl = env.DATABASE_URL;
const port = env.ELYOS_PORT;
```

## Hibaüzenetek

Ha a validáció sikertelen, a Varlock naplózza a konkrét hibát és leállítja az alkalmazást:

```
[Varlock] HIBA: Hiányzó bootstrap credential: INFISICAL_CLIENT_ID
[Varlock] HIBA: Hiányzó kötelező secret: DATABASE_URL
[Varlock] HIBA: Típusvalidáció sikertelen: SMTP_PORT — elvárt: number, kapott: "invalid"
[Varlock] HIBA: Érvénytelen enum érték: NODE_ENV — elvárt: development|production|test, kapott: "staging"
```

Sikeres indítás esetén:

```
[Varlock] 42 secret sikeresen betöltve (production/elyos-core)
[Varlock] Típusgenerálás kész: src/env.d.ts
```

## További információk

**Részletes dokumentáció:**
- [Környezeti változók →](/hu/environment) — teljes ElyOS környezeti változó kezelés
- [Varlock hivatalos oldal](https://varlock.dev/) — Varlock dokumentáció és API referencia
