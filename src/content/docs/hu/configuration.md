---
title: Változók referencia
description: Teljes környezeti változók referencia — összes elérhető konfiguráció táblázatokkal
---

Ez az oldal az **összes elérhető környezeti változó** teljes referenciája táblázatos formában.

**Részletes dokumentáció:**
- [Környezeti változók áttekintés →](/hu/environment) — Varlock, Infisical, architektúra
- [Varlock séma formátum →](/hu/environment-schema) — annotációk, típusok
- [Új változó hozzáadása →](/hu/environment-add-variable) — lépésről lépésre

---

## Env kezelés

A Rocona **Varlock**-ot használ a typesafe környezeti változók kezeléséhez. A Varlock az alkalmazás indításakor validálja az összes konfigurációs értéket, így a hibás konfiguráció azonnal kiderül.

### Bootstrap credentials

A `.env` fájlban csak a **bootstrap credentials** marad:

```dotenv
INFISICAL_CLIENT_ID=machine-identity-client-id
INFISICAL_CLIENT_SECRET=machine-identity-client-secret
```

Minden más secret (adatbázis URL, auth titok, SMTP jelszó stb.) az Infisical-ból érkezik runtime-ban.

**Részletek:** [Infisical integráció →](/hu/environment-infisical)

### Lokális fallback mód

Offline fejlesztéshez vagy Infisical nélküli használathoz:

```dotenv
VARLOCK_FALLBACK=local
NODE_ENV=development
DATABASE_URL=postgresql://elyos:elyos123@localhost:5432/elyos
BETTER_AUTH_SECRET=lokalis-titok
BETTER_AUTH_URL=http://localhost:3000
ORIGIN=http://localhost:5173
# ... összes többi változó
```

---

## Gyors kezdés

```bash
cp .env.example .env
```

**Varlock + Infisical esetén (ajánlott):**

```dotenv
INFISICAL_CLIENT_ID=machine-identity-client-id
INFISICAL_CLIENT_SECRET=machine-identity-client-secret
```

**Infisical nélkül (lokális fallback mód):**

```dotenv
VARLOCK_FALLBACK=local
NODE_ENV=development
DATABASE_URL=postgresql://elyos:elyos123@localhost:5432/elyos
BETTER_AUTH_SECRET=generalt-veletlen-titok
BETTER_AUTH_URL=http://localhost:3000
ORIGIN=http://localhost:5173
```

---

## Szerver konfiguráció

| Változó           | Kötelező | Alapértelmezett | Leírás                                                   |
| ----------------- | -------- | --------------- | -------------------------------------------------------- |
| `NODE_ENV`        | Igen     | —               | `development`, `production` vagy `test`                  |
| `BODY_SIZE_LIMIT` | Nem      | `10485760`      | Maximális kérés méret bájtban (10 MB)                    |
| `ELYOS_PORT`      | Nem      | `3000`          | Alkalmazás port (Docker host port leképezés)             |
| `APP_URL`         | Éles     | —               | Alap URL (pl. `https://elyos.example.com`)               |
| `ORIGIN`          | Igen     | —               | CSRF védelem — meg kell egyeznie az alkalmazás URL-jével |

## Adatbázis

| Változó             | Kötelező | Alapértelmezett | Leírás                                                               |
| ------------------- | -------- | --------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`      | Igen     | —               | PostgreSQL kapcsolati sztring: `postgresql://USER:PASS@HOST:PORT/DB` |
| `POSTGRES_USER`     | Igen     | —               | PostgreSQL felhasználónév                                            |
| `POSTGRES_PASSWORD` | Igen     | —               | PostgreSQL jelszó                                                    |
| `POSTGRES_HOST`     | Igen     | `localhost`     | PostgreSQL szerver címe                                              |
| `POSTGRES_DB`       | Igen     | —               | PostgreSQL adatbázis neve                                            |
| `POSTGRES_PORT`     | Igen     | `5432`          | PostgreSQL port                                                      |

> **Megjegyzés:** A `DATABASE_URL` automatikusan épül fel a `POSTGRES_*` változókból a sémában. Docker Compose használatakor a `POSTGRES_HOST` értéke `postgres` (a szolgáltatás neve).

## Alkalmazás arculat

| Változó          | Kötelező | Alapértelmezett | Leírás                                         |
| ---------------- | -------- | --------------- | ---------------------------------------------- |
| `APP_NAME`       | Nem      | `Racona`         | Megjelenített alkalmazásnév                    |
| `APP_LOGO_URL`   | Nem      | —               | Logó URL — abszolút vagy relatív               |
| `EMAIL_USE_LOGO` | Nem      | `false`         | Logó kép használata e-mailekben szöveg helyett |

## Autentikáció

| Változó                | Kötelező | Alapértelmezett | Leírás                                         |
| ---------------------- | -------- | --------------- | ---------------------------------------------- |
| `BETTER_AUTH_SECRET`   | Éles     | —               | Token aláíró titok (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL`      | Igen     | —               | Auth callback alap URL                         |
| `REGISTRATION_ENABLED` | Nem      | `true`          | Regisztráció engedélyezése                     |
| `SOCIAL_LOGIN_ENABLED` | Nem      | `true`          | Google bejelentkezés engedélyezése             |
| `GOOGLE_CLIENT_ID`     | Nem      | —               | Google OAuth kliens azonosító                  |
| `GOOGLE_CLIENT_SECRET` | Nem      | —               | Google OAuth kliens titok                      |

## E-mail

| Változó                | Kötelező | Alapértelmezett | Leírás                                             |
| ---------------------- | -------- | --------------- | -------------------------------------------------- |
| `EMAIL_PROVIDER`       | Nem      | `resend`        | `smtp`, `resend`, `sendgrid` vagy `ses`            |
| `EMAIL_TEST_MODE`      | Nem      | `false`         | E-mailek naplózása konzolra küldés helyett         |
| `EMAIL_OTP_EXPIRES_IN` | Nem      | `10`            | OTP lejárati idő percben (1–20)                    |

### SMTP

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=noreply@example.com
SMTP_PASSWORD=jelszó
```

### Resend

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@example.com
```

### SendGrid

```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@example.com
```

### AWS SES

```bash
EMAIL_PROVIDER=ses
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

## Többnyelvűség

| Változó             | Alapértelmezett | Leírás                                    |
| ------------------- | --------------- | ----------------------------------------- |
| `SUPPORTED_LOCALES` | `hu,en`         | Vesszővel elválasztott támogatott nyelvek |
| `DEFAULT_LOCALE`    | `hu`            | Alapértelmezett nyelv                     |

## Naplózás

| Változó       | Alapértelmezett | Leírás                                                |
| ------------- | --------------- | ----------------------------------------------------- |
| `LOG_TARGETS` | `console`       | `console`, `file`, `database` (vesszővel elválasztva) |
| `LOG_LEVEL`   | `error`         | `debug`, `info`, `warn`, `error`, `fatal`             |
| `LOG_DIR`     | `./logs`        | Naplófájlok könyvtára                                 |

## Kezdeti adminisztrátor

| Változó            | Kötelező | Alapértelmezett | Leírás                                                                                |
| ------------------ | -------- | --------------- | ------------------------------------------------------------------------------------- |
| `ADMIN_USER_EMAIL` | Igen     | —               | Az első adminisztrátor felhasználó e-mail címe (db:init / db:reset során használatos) |

## Fejlesztői mód

| Változó    | Alapértelmezett | Leírás                                            |
| ---------- | --------------- | ------------------------------------------------- |
| `DEV_MODE` | `false`         | Plugin betöltés engedélyezése localhost URL-ekről |

:::danger
Soha ne engedélyezd a `DEV_MODE=true` értéket éles környezetben. Tetszőleges kód futtatását teszi lehetővé localhost-ról.
:::

## Demo mód

| Változó                   | Alapértelmezett | Leírás                                                                                     |
| ------------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| `DEMO_MODE`               | `false`         | Demo mód engedélyezése (jelzi a felhasználóknak, hogy demo környezetben futnak)            |
| `DEMO_RESET_HOUR`         | `4`             | Óra (UTC, 0–23), amikor a demo adatbázis naponta visszaáll                                 |
| `DEMO_RESET_UPLOADS_KEEP` | —               | Vesszővel elválasztott feltöltési alkönyvtárak, amelyeket meg kell őrizni visszaállításkor |

## Plugin rendszer

| Változó                    | Alapértelmezett      | Leírás                                       |
| -------------------------- | -------------------- | -------------------------------------------- |
| `PLUGIN_PACKAGE_EXTENSION` | `elyospkg`           | Plugin csomag fájlkiterjesztés               |
| `PLUGIN_MAX_SIZE`          | `10485760`           | Maximális plugin méret bájtban (max: 100 MB) |
| `PLUGIN_STORAGE_DIR`       | `/var/webos/plugins` | Telepített plugin fájlok könyvtára           |

---

## Docker konfiguráció

```bash
# Teljes stack indítása
bun docker:up

# Csak adatbázis
bun docker:db

# Leállítás
bun docker:down

# Naplók
bun docker:logs
```

### Adatmegőrzés

A PostgreSQL adatok `elyos-data` nevű Docker kötetben tárolódnak. Teljes visszaállításhoz:

```bash
docker compose -f docker/docker-compose.yml down -v
```

---

## Éles telepítés ajánlott beállítások

```dotenv
NODE_ENV=production
DEV_MODE=false
PUBLIC_SITE_ENABLED=false
REQUIRE_EMAIL_VERIFICATION=true
BETTER_AUTH_SECRET=<erős-véletlenszerű-érték>
POSTGRES_PASSWORD=<erős-véletlenszerű-érték>
ADMIN_USER_EMAIL=admin@example.com
LOG_TARGETS=console,database
LOG_LEVEL=info
```
