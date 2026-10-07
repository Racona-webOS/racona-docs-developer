---
title: Plugin súgó
description: Felhasználói útmutató a pluginhoz – a Súgó alkalmazás a plugin help/ mappáját is megjeleníti
---

## Áttekintés

A plugin a csomagjában felhasználói útmutatót hozhat, amit a Racona Súgó alkalmazása jelenít meg:

- A Súgó tartalomjegyzékében az Alkalmazások után a plugin neve alatt jelennek meg az oldalai.
- A plugin ablakának címsorában megjelenik a súgó gomb (**?**), ami a plugin súgójának főoldalát nyitja meg.

Nem kell hozzá jogosultság vagy manifest mező: elég, ha a csomagban van egy `help/` mappa.

:::tip[Súgó vagy tudásbázis?]
A `help/` a felhasználónak szól: olvasható, képekkel illusztrált útmutató. A [`knowledge-base/`](/hu/plugins-knowledge-base/) az AI asszisztensnek szól: rövid, kulcsszavas szakaszok. A kettő lehet ugyanaz a szöveg, de a mappák külön csomagolódnak.
:::

## Mappaszerkezet

```
my-app/
├── manifest.json
└── help/
    ├── hu/
    │   ├── index.md          # főoldal: a súgó gomb ezt nyitja meg
    │   ├── projects.md
    │   └── settings/
    │       └── notifications.md
    ├── en/
    │   └── index.md
    └── assets/
        └── projects-list.webp
```

- **Főoldal:** `help/<nyelv>/index.md`. Ha nincs, a súgó gomb a sorrendben első oldalt nyitja meg.
- **Nyelvek:** a nyelvi mappák neve a nyelv kódja (`hu`, `en`). A Súgó a felület nyelvét használja, ha a plugin hoz hozzá tartalmat. Ha nem, a magyar, végül bármelyik meglévő nyelv jelenik meg. Elég tehát egy nyelven megírni.
- **Almappák:** szabadon használhatók; a menüben a plugin oldalai egy listában, a `sidebar.order` szerint jelennek meg.
- **Fájlok:** csak `.md` oldalak és képek (`png`, `jpg`, `jpeg`, `gif`, `webp`, `svg`), összesen legfeljebb 10 MB. Más fájlnál a telepítés hibát ad.
- **Egyetlen oldal:** ha a plugin csak egy oldalt hoz, a menüben nem csoport, hanem egy menüpont jelenik meg a plugin nevével.

A CLI által generált `build-package.js` (`bun run package`) a `help/` mappát is a csomagba teszi. Régebbi pluginnál vedd fel a csomagolt mappák közé:

```js title="build-package.js"
if (existsSync(join(ROOT, 'help'))) entries.push('help');
```

## Egy oldal

```md title="help/hu/projects.md"
---
title: Projektek
description: Projektek létrehozása és kezelése
sidebar:
  order: 2
---

A projekteket a **Projektek** menüpontban kezelheted.

![Projektek listája](../assets/projects-list.webp)
_A projektek listája szűrőkkel_

## Új projekt

1. Kattints az **Új projekt** gombra
2. ...

Az értesítések beállításáról a [Értesítések](./settings/notifications.md) oldalon olvashatsz.
```

- A `title` a menüpont és az oldal címe, a `description` alcímként jelenik meg, a `sidebar.order` a sorrendet adja (az `index.md` alapértelmezetten az első).
- Az oldal címét ne ismételd meg `#` címsorral, a szöveg `##` szinttel kezdődjön.
- A kép utáni dőlt sor képaláírásként jelenik meg.

## Hivatkozások és képek

| Mire | Hogyan | Példa |
| --- | --- | --- |
| A plugin másik oldalára | relatív útvonal, `.md`-vel vagy nélküle | `./projects.md`, `../index.md` |
| Egy címsorra | `#` + a címsor kisbetűs, kötőjeles alakja | `./projects.md#új-projekt` |
| A beépített Racona súgóra | `/hu/user/...` útvonal | `/hu/user/ui-components/data-tables/` |
| Külső oldalra | teljes URL, új böngészőlapon nyílik | `https://example.com` |
| Képre | a markdown fájlhoz relatív útvonal a `help/` mappán belül | `../assets/projects-list.webp` |

A fel nem oldható hivatkozás sima szövegként jelenik meg.

## Hozzáférés

A plugin súgóját csak azok látják, akik a plugint elérik: ugyanaz dönti el, mint az alkalmazáslistát (szerepkör, csoport, nyilvános app). Letiltott plugin súgója nem jelenik meg, a fájljait a szerver sem adja ki.

A pluginon belüli jogosultságok (pl. `requiredCapability` a menüben) nem szűrik a súgót: aki a plugint eléri, a teljes súgóját láthatja. Ha egy funkció csak bizonyos szerepkörnek érhető el, írd bele az oldalba.

## Életciklus

- **Telepítés, frissítés, eltávolítás:** a Súgó tartalomjegyzéke a Plugin kezelőből végzett műveletek után frissül, és minden Súgó ablak megnyitásakor újratöltődik.
- **Fejlesztői mód:** a Dev Plugins fülön betöltött plugin súgója még nem jelenik meg; a súgót a telepített csomaggal lehet kipróbálni.
