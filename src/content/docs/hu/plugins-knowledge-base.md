---
title: AI asszisztens tudásbázis
description: Saját dokumentáció a pluginhoz – az AI asszisztens a plugin knowledge-base/ mappájából is válaszol
---

## Áttekintés

A plugin a csomagjában saját dokumentációt hozhat az AI asszisztensnek. Telepítés után az asszisztens a core dokumentáció mellett ebből is válaszol, és a válasz végén fel tudja ajánlani a plugin megfelelő menüpontjának megnyitását.

Nem kell hozzá jogosultság vagy manifest mező: elég, ha a csomagban van egy `knowledge-base/` mappa.

## Mappaszerkezet

```
my-app/
├── manifest.json
├── menu.json
├── locales/
└── knowledge-base/
    ├── hu/
    │   ├── _overview.md
    │   └── leave-requests.md
    └── en/
        └── _overview.md
```

- A nyelvi mappák neve `hu` és `en`. Ha egy nyelven nincs elég találat, az asszisztens a másik nyelv dokumentációját is használja, és a felhasználó nyelvére fordítja. Elég tehát egy nyelven megírni.
- Csak `.md` és `.mdx` fájl lehet benne, összesen legfeljebb 2 MB. Más fájlnál a telepítés hibát ad.
- Az almappák szabadon használhatók.

A CLI által generált `build-package.js` (`bun run package`) a `knowledge-base/` mappát is a csomagba teszi. Régebbi pluginnál vedd fel a csomagolt mappák közé:

```js title="build-package.js"
if (existsSync(join(ROOT, 'knowledge-base'))) entries.push('knowledge-base');
```

## Egy dokumentum

```md title="knowledge-base/hu/leave-requests.md"
---
title: Szabadság igénylése
tags: [szabadság, kérelem, jóváhagyás]
aliases: [szabadságkérelem, szabi]
---

# Szabadság igénylése

## Rövid összefoglaló
A szabadságkérelmet a Szabadságkérelmek menüpontban adhatod le...
```

- A `title` a dokumentum címe; ha nincs, az első `#` címsor.
- A `tags` és az `aliases` szavai erősebb súllyal számítanak a keresésben. Ide kerüljenek azok a szavak, amelyekkel a felhasználók kérdezni fognak, akkor is, ha a szövegben nem szerepelnek.
- A keresés kulcsszavas, ezért a felhasználó szavaival írj: „szabadság igénylése”, ne csak „távollét-kezelés”.
- Rövid, önálló szakaszokat írj. A dokumentum kb. 1000 karakteres darabokra bomlik, és a kérdéshez a legjobb néhány darab kerül a modell elé.
- Lépésenkénti útmutatónál add meg a menüpont nevét úgy, ahogy a felületen látszik.

## Hozzáférés

Az asszisztens csak azoknak a felhasználóknak válaszol a plugin dokumentációjából, akik a plugint elérik: ugyanaz dönti el, mint az alkalmazáslistát (szerepkör, csoport, nyilvános app). Letiltott pluginé nem jelenik meg.

A pluginon belüli jogosultságok (pl. `requiredCapability` a menüben) nem szűrik a dokumentációt: aki a plugint eléri, a teljes dokumentációjából kaphat választ. Ez csak leírás, adatot nem ad ki; ha egy funkció csak bizonyos szerepkörnek érhető el, írd bele a dokumentumba.

## Megnyitás a válaszból

Az asszisztens rendszerpromptja felsorolja az elérhető, tudásbázissal rendelkező pluginokat a `menu.json` menüpontjaival együtt (azonosító = `href` a `#` nélkül, felirat a `locales/` fájlokból). Így a válasz végén megjelenő gomb közvetlenül a megfelelő menüpontot nyitja meg, pl. `[APP:my-app:settings/leave]`.

## Életciklus

- **Telepítés és frissítés:** a tudásbázis azonnal újratöltődik a csomagból.
- **Eltávolítás:** a plugin dokumentációja kikerül a keresésből.
- **Admin felület:** a Beállítások → Tudásbázis panel pluginonként mutatja a dokumentumok számát; az „Összes újraindexelése” a pluginokat is újratölti.
