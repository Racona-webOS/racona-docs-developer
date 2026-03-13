---
title: Infisical integráció
description: Secrets management Infisical-lal — bootstrap credentials, működés és fallback mód
---

Az ElyOS **Infisical**-t használ központi secrets management-hez. Ez lehetővé teszi, hogy a secretek ne kerüljenek a verziókezelésbe, és központilag kezelhető legyen a hozzáférés.

## Mi az az Infisical?

Az Infisical egy nyílt forráskódú secrets manager, amely:

- **Központi secrets tárolás** — minden secret egy helyen
- **Környezetenként különböző értékek** — dev, staging, prod
- **Audit log** — ki, mikor, mit módosított
- **Hozzáférés-szabályozás** — role-based access control
- **Machine Identity** — API hozzáférés alkalmazásoknak

## Bootstrap credentials

Az alkalmazás indításához csak **2 környezeti változó** kell a lokális `.env` fájlban:

```bash
INFISICAL_CLIENT_ID=your-machine-identity-client-id
INFISICAL_CLIENT_SECRET=your-machine-identity-client-secret
```

Minden más secret az Infisical-ból kerül lekérésre automatikusan.

### Machine Identity létrehozása

1. Jelentkezz be az Infisical-ba
2. Menj a projekt beállításokhoz
3. Hozz létre egy új Machine Identity-t
4. Másold ki a `Client ID` és `Client Secret` értékeket
5. Add hozzá őket a `.env.local` fájlhoz

## Működés

A `src/lib/secrets/varlock.ts` fájl kezeli az Infisical integrációt:

### 1. Bootstrap credentials validáció

```typescript
if (!clientId || !clientSecret) {
  throw new Error('Hiányzó bootstrap credential');
}
```

### 2. Infisical kliens létrehozása

A kliens hitelesíti magát a bootstrap credentials-szel.

### 3. Secrets lekérése (retry logikával)

3 újrapróbálkozással, exponential backoff-fal (1s, 2s, 4s):

```typescript
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    return await infisical.fetchSecrets();
  } catch (error) {
    if (attempt < 3) {
      await sleep(Math.pow(2, attempt - 1) * 1000);
    }
  }
}
```

### 4. Runtime validáció

A lekért secretek validálása a `schema.ts` alapján:

```typescript
const validated = validateSchema(secrets);
```

### 5. Token automatikus megújítás

Ha a token lejár, automatikusan megújítja a bootstrap credentials-szel:

```typescript
if (tokenExpired && infisical.renewToken) {
  await infisical.renewToken(clientId, clientSecret);
}
```

## Indítási módok

### Produkció (Docker)

```dockerfile
CMD ["varlock", "run", "--", "bun", "run", "apps/web/server.js"]
```

A `varlock run` wrapper:
1. Betölti a bootstrap credentials-t a `.env` fájlból
2. Lekéri az összes secretet az Infisical-ból
3. Validálja őket
4. Betölti a `process.env`-be
5. Elindítja az alkalmazást

### Fejlesztés (Varlock + Infisical)

```bash
bun app:dev:varlock
```

Ugyanaz, mint a produkció, de Vite dev szerverrel.

### Fejlesztés (lokális .env)

```bash
bun app:dev
```

Nem használ Varlock-ot, közvetlenül a `.env.local` fájlból olvas.

## Fallback mód

Ha nincs Infisical hozzáférésed vagy offline dolgozol:

```bash
VARLOCK_FALLBACK=local
```

Ebben a módban a Varlock közvetlenül a `.env` fájlból olvassa az összes változót, Infisical nélkül.

**Használat:**

1. Másold át a `.env.example` fájlt `.env.local` néven
2. Töltsd ki az összes változót
3. Add hozzá: `VARLOCK_FALLBACK=local`
4. Indítsd el: `bun app:dev:varlock`

## Hibaüzenetek

### Hiányzó bootstrap credential

```
[Varlock] HIBA: Hiányzó bootstrap credential: INFISICAL_CLIENT_ID
```

**Megoldás:** Add hozzá az Infisical credentials-t a `.env.local` fájlhoz.

### Infisical nem elérhető

```
[Varlock] HIBA: Az Infisical szerver nem elérhető (3/3 újrapróbálkozás után)
```

**Megoldás:**
- Ellenőrizd az internet kapcsolatot
- Használd a fallback módot: `VARLOCK_FALLBACK=local`

### Érvénytelen credentials

```
[Varlock] HIBA: Hitelesítés sikertelen
```

**Megoldás:** Ellenőrizd, hogy a `INFISICAL_CLIENT_ID` és `INFISICAL_CLIENT_SECRET` helyesek-e.

## Sikeres indítás

```
[Varlock] 42 secret sikeresen betöltve (production/elyos-core)
```

Ez azt jelenti, hogy 42 környezeti változó került lekérésre az Infisical `production` környezetéből az `elyos-core` projektből.

## Előnyök

- **Secretek nem kerülnek a verziókezelésbe** — csak a bootstrap credentials
- **Központi secrets kezelés** — egy helyen minden környezetre
- **Audit log** — ki, mikor, mit módosított
- **Hozzáférés-szabályozás** — role-based access control
- **Környezetenként különböző értékek** — dev, staging, prod
- **Token automatikus megújítás** — nincs szükség újraindításra

## Következő lépések

- [Runtime validáció →](/hu/environment-runtime) — schema.ts részletesen
- [Új változó hozzáadása →](/hu/environment-add-variable) — lépésről lépésre
- [Varlock séma formátum →](/hu/environment-schema) — annotációk és típusok
