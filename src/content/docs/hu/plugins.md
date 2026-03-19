---
title: Plugin rendszer
description: Áttekintés az ElyOS plugin rendszeréről – hogyan működnek a pluginok, mik a különbségek a beépített alkalmazásokhoz képest
---

## Mi az a plugin?

Az ElyOS kétféle alkalmazást ismer:

| Típus | Hol él | Ki fejleszti | Hozzáférés |
|---|---|---|---|
| **Beépített app** | `apps/web/src/apps/[app-name]/` | ElyOS core csapat | Teljes belső API |
| **Plugin** | Önálló projekt, `.elyospkg` csomag | Külső fejlesztők | Csak a WebOS SDK-n keresztül |

A pluginok Web Component-ként töltődnek be az ElyOS-be. A rendszer dinamikusan importálja az IIFE bundle-t (IIFE = Immediately Invoked Function Expression — egy önmagát azonnal végrehajtó, izolált JavaScript csomag, amely nem szennyezi a globális névteret), inicializálja a WebOS SDK-t, majd megjeleníti a komponenst egy ablakban.

## Hogyan töltődik be egy plugin?

1. A felhasználó megnyitja a plugint a Start Menüből vagy a Taskbarból
2. A `PluginLoader` ellenőrzi a plugin státuszát és a jogosultságokat
3. A `WebOSSDK` inicializálódik a plugin ID-jával, a felhasználó adataival és a jogosultságokkal
4. Az IIFE bundle dinamikusan importálódik (`dist/index.iife.js`) — ez egy önálló, izolált JavaScript fájl, amely nem ütközik más pluginok kódjával
5. Ha van `menu.json`, az AppLayout wrapper jelenik meg oldalsáv navigációval
6. Ha nincs `menu.json`, a plugin Web Component-ként töltődik be közvetlenül

## Plugin vs beépített app

Ha **saját alkalmazást** szeretnél az ElyOS-be integrálni és hozzáférsz a monorepo-hoz, a beépített app a megfelelő választás — teljes SvelteKit hozzáféréssel, Drizzle ORM-mel, server action-ökkel.

Ha **külső fejlesztőként** szeretnél alkalmazást készíteni, vagy a plugint más ElyOS példányokra is telepíteni szeretnéd, a plugin rendszert kell használni.

## Következő lépések

- [Első plugin létrehozása](/hu/plugins-getting-started/) — CLI tool, projekt struktúra, első build
- [Fejlesztői workflow](/hu/plugins-development/) — standalone dev mód, Mock SDK, hot reload
- [SDK API referencia](/hu/plugins-sdk/) — összes elérhető service részletesen
- [manifest.json referencia](/hu/plugins-manifest/) — minden mező dokumentálva
- [Szerver függvények](/hu/plugins-server-functions/) — backend logika pluginokhoz
- [Build és csomagolás](/hu/plugins-build/) — `.elyospkg` formátum, feltöltés
- [Biztonság és jogosultságok](/hu/plugins-security/) — tiltott minták, fehérlista, permissions
