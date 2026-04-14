---
title: Email szolgáltatás
description: Email küldés alkalmazásokból – email template-ek, context.email API, template regisztrációs életciklus
---

:::note[v0.1.7 óta]
Az Email szolgáltatás a Rocona core `0.1.7` verziójától érhető el.
:::

## Áttekintés

Az alkalmazások a core `EmailManager` rendszeren keresztül küldhetnek emailt a [szerver függvényekben](/hu/plugins-server-functions/) elérhető `context.email` szolgáltatás segítségével. Ez lehetővé teszi, hogy a pluginok template-es emaileket küldjenek (pl. üdvözlő üzenet, jóváhagyási értesítés) anélkül, hogy közvetlen hozzáférésük lenne a platform sémához vagy az `EmailManager` osztályhoz.

A funkció két részből áll:

1. **Deklaratív email template regisztráció** — az `email-templates/` mappában lévő JSON fájlok automatikusan regisztrálódnak telepítéskor
2. **Email küldés `context.email`-en keresztül** — a szerver függvények a `context.email.send()` hívással küldenek emailt a regisztrált template-ek használatával

Szükséges jogosultság: `notifications` a `manifest.json`-ban.

## Gyors kezdés

### 1. Add hozzá a `notifications` jogosultságot

```json title="manifest.json" {5}
{
  "id": "my-app",
  "permissions": ["database", "remote_functions", "notifications"]
}
```

### 2. Hozz létre egy email template-et

```json title="email-templates/welcome.json"
{
  "name": "Üdvözlő email",
  "locales": {
    "hu": {
      "subject": "Üdvözöljük a rendszerben!",
      "html": "<h1>Kedves {{name}}!</h1><p>Fiókja létrejött.</p>",
      "text": "Kedves {{name}}! Fiókja létrejött."
    },
    "en": {
      "subject": "Welcome to the system!",
      "html": "<h1>Hello {{name}}!</h1><p>Your account has been created.</p>",
      "text": "Hello {{name}}! Your account has been created."
    }
  },
  "requiredData": ["name", "email"],
  "optionalData": ["position"]
}
```

### 3. Küldj emailt egy szerver függvényből

```typescript title="server/functions.ts"
export async function createUser(params, context) {
  // ... felhasználó létrehozás logika ...

  // Üdvözlő email küldése
  const result = await context.email.send({
    to: params.email,
    template: 'welcome',       // Csak a template neve — prefix nem kell
    data: { name: params.name, email: params.email },
    locale: 'hu'
  });

  if (!result.success) {
    console.warn('Email küldés sikertelen:', result.error);
  }

  return { success: true };
}
```

## A `context.email` API

Az `email` tulajdonság a szerver függvények `context` objektumán érhető el, ha az alkalmazás rendelkezik `notifications` jogosultsággal.

### `context.email.send(params)`

Template-es emailt küld a core `EmailManager`-en keresztül.

| Paraméter | Típus | Kötelező | Leírás |
|---|---|---|---|
| `to` | `string \| string[]` | Igen | Címzett email cím(ek) |
| `template` | `string` | Igen | Template név (app ID prefix nélkül) |
| `data` | `Record<string, unknown>` | Igen | Template változók |
| `locale` | `string` | Nem | Locale kód (alapértelmezett: `'hu'`) |

**Visszatérési érték:** `Promise<{ success: boolean; messageId?: string; error?: string }>`

```typescript
const result = await context.email.send({
  to: 'user@example.com',
  template: 'order_confirmation',
  data: { orderId: 1234, total: '99 €' },
  locale: 'hu'
});
```

### Automatikus template név prefixelés

A `template` paraméter automatikusan prefixelődik az alkalmazás ID-val. Csak a template nevét kell megadnod, ahogy az `email-templates/` mappában definiáltad:

| Amit írsz | Ami feloldódik |
|---|---|
| `'welcome'` | `'my-app:welcome'` |
| `'order_confirmation'` | `'my-app:order_confirmation'` |

Tehát soha nem kell ismerned vagy használnod a teljes prefixelt nevet a kódodban.

### Jogosultság ellenőrzés

Ha az alkalmazás nem rendelkezik `notifications` jogosultsággal, a `context.email` értéke `undefined`. Mindig ellenőrizd használat előtt:

```typescript
if (context.email) {
  await context.email.send({ /* ... */ });
}
```

Vagy kezeld elegánsan:

```typescript
export async function sendNotification(params, context) {
  if (!context.email) {
    throw new Error('Az email szolgáltatás nem elérhető — ellenőrizd a notifications jogosultságot');
  }
  // ...
}
```

## Email template formátum

A template-ek JSON fájlok az alkalmazás `email-templates/` könyvtárában.

### Fájlstruktúra

```
my-app/
├── email-templates/
│   ├── welcome.json
│   ├── order_confirmation.json
│   └── password_reset.json
├── manifest.json
└── ...
```

### JSON séma

```json
{
  "name": "Ember által olvasható template név",
  "locales": {
    "hu": {
      "subject": "Email tárgya {{variable}} támogatással",
      "html": "<h1>HTML törzs {{variable}} támogatással</h1>",
      "text": "Szöveges törzs {{variable}} támogatással"
    },
    "en": {
      "subject": "Email subject with {{variable}} support",
      "html": "<h1>HTML body with {{variable}} support</h1>",
      "text": "Plain text body with {{variable}} support"
    }
  },
  "requiredData": ["variable"],
  "optionalData": ["optionalVariable"]
}
```

| Mező | Típus | Leírás |
|---|---|---|
| `name` | `string` | A template megjelenítendő neve |
| `locales` | `Record<string, LocaleData>` | Locale-specifikus tartalom (subject, html, text) |
| `requiredData` | `string[]` | Kötelező template változók |
| `optionalData` | `string[]` | Opcionális template változók |

Minden locale bejegyzés tartalmazza:

| Mező | Típus | Leírás |
|---|---|---|
| `subject` | `string` | Email tárgy sor (`{{variable}}` szintaxis támogatással) |
| `html` | `string` | HTML email törzs |
| `text` | `string` | Szöveges (plain text) fallback törzs |

### Template változók

Használd a `{{variableName}}` szintaxist a subject, html és text mezőkben. A változók a küldéskor a `data` paraméterben megadott értékekkel helyettesítődnek.

## Template regisztrációs életciklus

### Telepítés

Amikor egy plugin telepítésre kerül, a core `PluginInstaller` automatikusan:

1. Beolvassa az összes `.json` fájlt az `email-templates/` könyvtárból
2. Minden fájlhoz és minden locale-hoz külön sort hoz létre a `platform.email_templates` táblában
3. A `type` oszlop értéke: `{appId}:{fájlnév}` (pl. `my-app:welcome`)
4. Upsert-et használ (ON CONFLICT DO UPDATE) — újratelepítéskor a meglévő template-ek frissülnek

:::tip
Az `email-templates/` könyvtár opcionális. Ha nem létezik, a telepítő egyszerűen kihagyja ezt a lépést.
:::

### Eltávolítás

Amikor egy plugin eltávolításra kerül, az összes `{appId}:%` prefixű email template rekord törlődik a `platform.email_templates` táblából.

### Frissítési folyamat

Újratelepítéskor vagy frissítéskor az összes template újra regisztrálódik upsert-tel. A módosult template-ek frissülnek, az újak hozzáadódnak, de az `email-templates/` mappából eltávolított template-ek **nem** törlődnek automatikusan — a teljes plugin eltávolításig az adatbázisban maradnak.

## Hibakezelés

Az email küldési hibák nem dobnak kivételt. Ehelyett a `context.email.send()` egy hiba objektumot ad vissza:

```typescript
const result = await context.email.send({
  to: 'user@example.com',
  template: 'welcome',
  data: { name: 'János' }
});

if (!result.success) {
  // Naplózd a hibát, mutass toast-ot, vagy hagyd figyelmen kívül
  console.error('Email hiba:', result.error);
  // A hívó függvény dönti el a hibakezelést
}
```

:::caution
Az email hibák általában **nem** szabad, hogy visszagörgessék a fő műveletet. Például ha egy dolgozó létrehozása sikeres, de az üdvözlő email sikertelen, a dolgozó rekordnak meg kell maradnia. Kezeld az email hibákat nem-kritikusként.
:::

## Teljes példa

```typescript title="server/functions.ts"
export async function createEmployeeWithUser(params, context) {
  const { db, email } = context;
  const { name, emailAddress, position, department } = params;

  // 1. Felhasználó és dolgozó létrehozása tranzakcióban
  const employee = await db.execute(`
    -- ... insert logika ...
  `);

  // 2. Üdvözlő email küldése (nem blokkoló, nem kritikus)
  if (email) {
    const emailResult = await email.send({
      to: emailAddress,
      template: 'employee_welcome',
      data: { name, email: emailAddress, position, department },
      locale: 'hu'
    });

    if (!emailResult.success) {
      console.warn(`Üdvözlő email sikertelen (${emailAddress}): ${emailResult.error}`);
    }
  }

  return { employee: employee.rows[0] };
}
```
