---
title: Kiegészítő csomagok
description: A Rocona ökoszisztéma npm és JSR csomagjainak áttekintése – SDK, CLI
---

A Rocona fejlesztői eszközei önálló csomagként is elérhetők, így nem szükséges a teljes monorepo-t klónozni az alkalmazásfejlesztéshez.

## @racona/sdk

A WebOS SDK TypeScript típusdefiníciókat és fejlesztői Mock SDK-t tartalmaz. Alkalmazásfejlesztéshez szükséges — a `window.webOS` globális objektum típusait és a standalone fejlesztői módhoz szükséges mock implementációt biztosítja.

Elérhető:
- **npm:** `@racona/sdk`
- **JSR:** `@racona/sdk`

```bash
bun add @racona/sdk
```

Részletes dokumentáció: [SDK API referencia](/hu/plugins-sdk/)

---

## @racona/cli

Interaktív CLI eszköz új Racona alkalmazás projekt létrehozásához. Végigvezet a projekt beállításain és legenerálja a kiindulási struktúrát a választott template alapján.

```bash
bunx @racona/cli
```

Elérhető template-ek: `blank`, `basic`, `advanced`, `datatable`, `sidebar`

Részletes dokumentáció: [Első alkalmazás létrehozása](/hu/plugins-getting-started/)
