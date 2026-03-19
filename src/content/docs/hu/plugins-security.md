---
title: Biztonság
description: Alkalmazás biztonsági szabályok, tiltott kódminták és engedélyezett függőségek
---

## Áttekintés

Az ElyOS alkalmazás rendszer sandbox-olt környezetben futtatja az alkalmazásokat. A rendszer statikus kódelemzéssel ellenőrzi a feltöltött alkalmazásokat, és visszautasítja azokat, amelyek tiltott mintákat tartalmaznak.

---

## Tiltott kódminták

A következő kódminták biztonsági okokból nem engedélyezettek:

| Minta | Miért tiltott |
|---|---|
| `eval()` | Tetszőleges kód futtatása |
| `new Function(...)` | Tetszőleges kód futtatása |
| `innerHTML =` | XSS támadás lehetősége |
| `outerHTML =` | XSS támadás lehetősége |
| `document.write()` | DOM manipuláció, XSS |
| `dangerouslySetInnerHTML` | React-stílusú XSS |
| `fetch()` külső domain-re | Adatszivárgás |
| `XMLHttpRequest` külső domain-re | Adatszivárgás |
| `import()` külső URL-ről | Tetszőleges kód betöltése |
| Más plugin sémájának elérése | Adatizoláció megsértése |
| `platform.*` séma elérése | Rendszer adatok elérése |
| `auth.*` séma elérése | Autentikációs adatok elérése |

### Példák

```typescript
// ❌ TILTOTT
eval('console.log("hello")');
new Function('return 1 + 1')();
element.innerHTML = userInput;
document.write('<script>...</script>');
fetch('https://external-api.com/data');
import('https://cdn.example.com/lib.js');

// ✅ ENGEDÉLYEZETT
console.log('hello');
const result = 1 + 1;
element.textContent = userInput;  // textContent biztonságos
window.webOS.remote.call('myFunction');  // SDK-n keresztül
```

---

## Engedélyezett függőségek

A `manifest.json` `dependencies` mezőjében csak fehérlistán szereplő package-ek adhatók meg. Más függőség esetén a plugin feltöltése sikertelen lesz.

### Fehérlista

| Package | Verzió |
|---|---|
| `svelte` | `^5.x.x` |
| `lucide-svelte` | `^0.x.x` |
| `@elyos/*` | bármely verzió |

```json
// manifest.json — engedélyezett
{
  "dependencies": {
    "svelte": "^5.0.0",
    "lucide-svelte": "^0.263.1",
    "@elyos/my-package": "^1.0.0"
  }
}

// manifest.json — TILTOTT (feltöltés sikertelen)
{
  "dependencies": {
    "axios": "^1.0.0",
    "lodash": "^4.17.0"
  }
}
```

:::tip
Ha egy utility funkcióra van szükséged (pl. dátumformázás, deep clone), implementáld magad, vagy kérd, hogy az `@elyos/*` scope-ba kerüljön be.
:::

---

## Jogosultságok (permissions)

A plugin csak azokat az SDK funkciókat érheti el, amelyekhez a `manifest.json`-ban jogosultságot kért. A rendszer futásidőben ellenőrzi a jogosultságokat.

| Jogosultság | Leírás | Érintett SDK funkciók |
|---|---|---|
| `database` | Adatbázis olvasás/írás a plugin sémájában | `data.set()`, `data.get()`, `data.delete()`, `data.query()`, `data.transaction()` |
| `notifications` | Értesítések küldése felhasználóknak | `notifications.send()` |
| `remote_functions` | Szerver oldali függvények hívása | `remote.call()` |
| `file_access` | Fájl feltöltés/letöltés | (tervezett) |
| `user_data` | Felhasználói profil adatok olvasása | (tervezett) |

```json
// manifest.json
{
  "permissions": [
    "database",
    "notifications",
    "remote_functions"
  ]
}
```

:::caution
Csak azokat a jogosultságokat kérd, amelyekre ténylegesen szükséged van. A felesleges jogosultságok csökkentik a plugin megbízhatóságát és megnehezítik az admin jóváhagyást.
:::

---

## Adatizoláció

Minden plugin saját adatbázis sémát kap: `plugin_{plugin_id}`. A séma **csak akkor jön létre**, ha a plugin `manifest.json`-jában szerepel a `"database"` jogosultság — ha a plugin nem használ adatbázist, séma sem keletkezik.

A plugin csak ebben a sémában végezhet adatbázis műveleteket.

```typescript
// ✅ Saját séma — engedélyezett
const rows = await window.webOS.data.query(
  'SELECT * FROM my_table WHERE user_id = $1',
  [userId]
);
// A rendszer automatikusan a plugin_{id} sémában futtatja

// ❌ Más séma — TILTOTT, hiba dobódik
const rows = await window.webOS.data.query(
  'SELECT * FROM platform.users'
);
```

### Saját táblastruktúra (migrations/)

Ha a pluginnak saját táblákra van szüksége, a `migrations/` mappában SQL fájlokat helyezhetsz el. Részletek: [SDK — Data Service](/hu/plugins-sdk/#migrációk-migrations-mappa).

---

## Hibakezelés biztonsági szempontból

```typescript
try {
  const result = await window.webOS.remote.call('sensitiveFunction');
} catch (error) {
  // Hiba típusok:
  // PERMISSION_DENIED — hiányzó jogosultság
  // PLUGIN_INACTIVE   — plugin nincs aktiválva
  // REMOTE_CALL_TIMEOUT — időtúllépés

  // ✅ Felhasználóbarát hibaüzenet
  window.webOS.ui.toast('Művelet sikertelen', 'error');

  // ❌ Ne jelenítsd meg a nyers hibaüzenetet a felhasználónak
  // window.webOS.ui.toast(error.message, 'error');
}
```

---

## Biztonsági best practices

- Validáld a felhasználói inputot mielőtt adatbázisba írod
- Használj parameterezett lekérdezéseket (`$1`, `$2`, ...) SQL injection ellen
- Ne tárolj érzékeny adatokat (jelszó, token) a plugin adatbázisában
- Ne bízz meg a kliens oldali validálásban — a szerver függvényekben is validálj
- Minimális jogosultságok elvét kövesd (csak amit tényleg használsz)
