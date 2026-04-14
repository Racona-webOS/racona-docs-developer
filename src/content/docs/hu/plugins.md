---
title: Alkalmazás rendszer
description: Áttekintés a Rocona alkalmazás rendszeréről – hogyan működnek az alkalmazások, mik a különbségek a beépített alkalmazásokhoz képest
---

## Mi az a alkalmazás?

A Rocona kétféle alkalmazást ismer:

| Típus | Hol él | Ki fejleszti | Hozzáférés |
|---|---|---|---|
| **Beépített alkalmazás** | `apps/web/src/apps/[app-name]/` | Racona core csapat | Teljes belső API |
| **Külső alkalmazás** | Önálló projekt, `.elyospkg` csomag | Külső fejlesztők | Csak a WebOS SDK-n keresztül |

A külső alkalmazások Web Component-ként töltődnek be a Rocona-be. A rendszer dinamikusan importálja az IIFE bundle-t (IIFE = Immediately Invoked Function Expression — egy önmagát azonnal végrehajtó, izolált JavaScript csomag, amely nem szennyezi a globális névteret), inicializálja a WebOS SDK-t, majd megjeleníti a komponenst egy ablakban.

## Hogyan töltődik be egy alkalmazás?

1. A felhasználó megnyitja az alkalmazást a Start Menüből vagy a Taskbarból
2. Az `AppLoader` ellenőrzi az alkalmazás státuszát és a jogosultságokat
3. A `WebOSSDK` inicializálódik az alkalmazás ID-jával, a felhasználó adataival és a jogosultságokkal
4. Az IIFE bundle dinamikusan importálódik (`dist/index.iife.js`) — ez egy önálló, izolált JavaScript fájl, amely nem ütközik más alkalmazások kódjával
5. Ha van `menu.json`, az AppLayout wrapper jelenik meg oldalsáv navigációval
6. Ha nincs `menu.json`, az alkalmazás Web Component-ként töltődik be közvetlenül

## Beépített alkalmazás vs külső alkalmazás

Ha **saját alkalmazást** szeretnél a Rocona-be integrálni és hozzáférsz a monorepo-hoz, a beépített alkalmazás a megfelelő választás — teljes SvelteKit hozzáféréssel, Drizzle ORM-mel, server action-ökkel.

Ha **külső fejlesztőként** szeretnél alkalmazást készíteni, vagy az alkalmazást más Racona példányokra is telepíteni szeretnéd, a külső alkalmazás rendszert kell használni.

## Következő lépések

- [Első alkalmazás létrehozása](/hu/apps-getting-started/) — CLI tool, projekt struktúra, első build
- [Fejlesztői workflow](/hu/apps-development/) — standalone dev mód, Mock SDK, hot reload
- [SDK API referencia](/hu/apps-sdk/) — összes elérhető service részletesen
- [manifest.json referencia](/hu/apps-manifest/) — minden mező dokumentálva
- [Szerver függvények](/hu/apps-server-functions/) — backend logika alkalmazásokhoz
- [Build és csomagolás](/hu/apps-build/) — `.elyospkg` formátum, feltöltés
- [Biztonság és jogosultságok](/hu/apps-security/) — tiltott minták, fehérlista, permissions
