---
title: Hozzájárulás
description: Útmutató a Rocona projekthez való hozzájáruláshoz
---

Köszönjük, hogy érdeklődsz a Rocona fejlesztése iránt! Ez az útmutató segít az indulásban, bemutatja a konvencióinkat, és végigvezet az első hozzájárulás beküldésén.

## Magatartási kódex

### Vállalásunk

Elkötelezettek vagyunk amellett, hogy mindenki számára befogadó, barátságos és zaklatásmentes élményt nyújtsunk, kortól, testalkattól, fogyatékosságtól, etnikai hovatartozástól, nemi identitástól és kifejezésmódtól, tapasztalati szinttől, nemzetiségtől, megjelenéstől, fajtól, vallástól, valamint szexuális identitástól és orientációtól függetlenül.

### Elvárt viselkedés

- Légy tisztelettudó és figyelmes minden interakció során
- Fogadd szívesen az újonnan érkezőket, és segítsd őket az indulásban
- Fogadd el az építő jellegű kritikát nyitottan
- Arra összpontosíts, ami a közösség és a projekt számára a legjobb
- Mutass empátiát a közösség többi tagja iránt

### Elfogadhatatlan viselkedés

- Zaklatás, trollkodás vagy személyes támadások
- Mások személyes adatainak közzététele hozzájárulás nélkül
- Diszkriminatív nyelvezet vagy képanyag
- Bármilyen viselkedés, amely szakmai környezetben nem lenne elfogadható

### Érvényesítés

A projekt karbantartói eltávolíthatják, szerkeszthetik vagy elutasíthatják azokat a hozzászólásokat, commitokat, kódokat, issue-kat és egyéb hozzájárulásokat, amelyek megsértik ezt a Magatartási kódexet. Ismétlődő vagy súlyos szabálysértés esetén ideiglenes vagy végleges kitiltás következhet.

A szabálysértéseket privát issue megnyitásával vagy a karbantartók közvetlen megkeresésével lehet jelenteni.

## Előfeltételek

Mielőtt elkezdenéd a fejlesztést, győződj meg róla, hogy telepítve vannak a szükséges eszközök (Bun, Node.js, Docker, Git).

**Részletes leírás:** [Első lépések →](/hu/getting-started)

## Fejlesztői környezet beállítása

A fejlesztői környezet beállításához kövesd az alábbi lépéseket:

1. **Fork és klónozás** — Forkold a repót GitHub-on, majd klónozd le
2. **Függőségek telepítése** — `bun install`
3. **Környezeti változók** — Másold át a `.env.example` fájlt `.env`-re és töltsd ki
4. **Adatbázis indítása** — `bun docker:db` és `bun db:init`
5. **Fejlesztői szerver** — `bun app:dev`

**Részletes leírás:** [Első lépések →](/hu/getting-started)

**Hasznos parancsok:** [Scripts referencia →](/hu/scripts)

## Projektstruktúra

A projekt monorepo struktúrát követ Bun workspaces-szel. A fő alkalmazás a `apps/web` könyvtárban található, a megosztott csomagok pedig a `packages/` alatt.

**Részletes leírás:** [Architektúra →](/hu/architecture)

## Kódstílus és konvenciók

### Nyelv

A kódbázis belső megjegyzésekhez, változónevekhez és dokumentációhoz **magyar** nyelvet használ. Meglévő fájlok módosításakor kövesd az adott fájlban már jelen lévő nyelvi konvenciót.

### TypeScript

- **Strict mód** engedélyezve — kerüld az `any` használatát, ahol lehetséges
- Exportált függvényeknél használj explicit visszatérési típust
- Objektum alakzatokhoz az `interface`-t részesítsd előnyben a `type`-pal szemben
- Belső importokhoz használd a `$lib/...` útvonal aliasokat

### Svelte 5

A Rocona **Svelte 5-öt rune-okkal** használ. Főbb minták:

- Reaktivitáshoz használd a `$state`, `$derived` és `$effect` rune-okat (ne a régi `$:` szintaxist)
- Osztályalapú store-ok `$state` tulajdonságokkal, `createX()` / `setX()` / `getX()` függvényeken keresztül exportálva
- A store fájlok `.svelte.ts` kiterjesztést használnak

### Formázás és linting

**Prettier**-t és **ESLint**-et használunk. A Prettier konfiguráció (`.prettierrc`):

- Tabulátor a behúzáshoz
- Szimpla idézőjelek
- Nincs záró vessző
- 100 karakter sorszélesség

Commitolás előtt mindig futtasd:

```bash
bun format            # Automatikus formázás
bun lint              # Problémák ellenőrzése
```

### CSS

- **Tailwind CSS 4** a Vite pluginon keresztül (nincs `tailwind.config` fájl)
- Részesítsd előnyben a Tailwind utility osztályokat az egyedi CSS-sel szemben
- Svelte-ben feltételes osztályokhoz használd a `class:` direktívát

### Szerver akciók

A szerver oldali logika a `*.remote.ts` fájlokban a következő mintát követi:

- `command(schema, handler)` mutációkhoz
- `query(handler)` olvasásokhoz
- Mindig validáld a bemenetet **Valibot** sémákkal
- Visszatérési érték: `{ success: boolean, error?: string, ...data }`

**Részletes leírás:** [Server Actions →](/hu/server-actions)

### Adatbázis

- A sémák a `packages/database/src/schemas/` könyvtárban találhatók
- Minden adatbázis-művelethez **Drizzle ORM**-et használj
- Sémaváltozások után futtasd a `bun db:generate` parancsot a migrációk létrehozásához

**Részletes leírás:** [Adatbázis →](/hu/database)

### Tesztelés

- **Vitest** egységtesztekhez
- **fast-check** tulajdonságalapú tesztekhez
- **Playwright** végponttól végpontig (e2e) tesztekhez
- Tesztek futtatása az `apps/web` könyvtárból: `bun test`

**Részletes leírás:** [Tesztelés →](/hu/testing)

## Commit üzenetek

A **[Conventional Commits](https://www.conventionalcommits.org/)** specifikációt követjük.

### Formátum

```
<típus>(<hatókör>): <leírás>

[opcionális törzs]

[opcionális lábléc(ek)]
```

### Típusok

| Típus      | Leírás                                                               |
| ---------- | -------------------------------------------------------------------- |
| `feat`     | Új funkció                                                           |
| `fix`      | Hibajavítás                                                          |
| `docs`     | Csak dokumentációs változtatások                                     |
| `style`    | Formázás, hiányzó pontosvesszők stb. (nem kódváltozás)               |
| `refactor` | Kódváltozás, ami sem hibát nem javít, sem funkciót nem ad hozzá      |
| `perf`     | Teljesítményjavítás                                                  |
| `test`     | Tesztek hozzáadása vagy frissítése                                   |
| `build`    | Build rendszer vagy függőségek változtatása                          |
| `ci`       | CI/CD konfiguráció változtatása                                      |
| `chore`    | Egyéb változtatások, amelyek nem módosítják a src vagy test fájlokat |

### Hatókör

Használd a csomag vagy terület nevét hatókörként:

- `core` — fő SvelteKit alkalmazás (`apps/web`)
- `sdk` — SDK csomag (`packages/sdk`)
- `cli` — CLI eszköz (`packages/@racona/cli`)
- `db` — adatbázis csomag (`packages/database`)
- `docker` — Docker konfiguráció
- `docs` — dokumentáció

### Példák

```
feat(core): add keyboard shortcuts to window manager
fix(sdk): resolve mock data service localStorage race condition
docs(cli): update template selection instructions
refactor(db): simplify user schema relations
test(core): add property-based tests for taskbar sorting
ci: add arm64 platform to Docker build
```

### Törő változások

Törő változásoknál adj hozzá `!`-t a típus/hatókör után, és használj `BREAKING CHANGE:` láblécet:

```
feat(sdk)!: rename DataService.query to DataService.sql

BREAKING CHANGE: DataService.query() has been renamed to DataService.sql()
to better reflect its purpose. Update all plugin code accordingly.
```

## Branching stratégia

- `main` — stabil, éles környezetbe kész kód
- `develop` — integrációs branch a következő kiadáshoz
- `feat/<név>` — funkció branchek (`develop`-ból ágaznak ki)
- `fix/<név>` — hibajavító branchek (`develop`-ból vagy `main`-ből hotfix esetén)

```bash
# Funkció branch létrehozása
git checkout develop
git pull upstream develop
git checkout -b feat/my-feature

# Hibajavító branch létrehozása
git checkout develop
git pull upstream develop
git checkout -b fix/my-bugfix
```

## Pull Request folyamat

### Beküldés előtt

1. **Szinkronizálás az upstream-mel:**

   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

2. **Összes ellenőrzés futtatása:**

   ```bash
   bun format
   bun lint
   bun app:check
   bun test              # az apps/web könyvtárból
   ```

3. **Maradj fókuszban** — egy PR egy funkcióhoz vagy javításhoz. Kerüld az egymáshoz nem kapcsolódó változtatások keverését.

### PR beküldése

1. Pushold a branchedet a saját forkodba
2. Nyiss egy Pull Requestet a `develop` branch felé
3. Töltsd ki a PR sablont a következőkkel:
   - A változtatás egyértelmű leírása és indoklása
   - Kapcsolódó issue szám(ok) (pl. `Closes #42`)
   - Képernyőképek vagy felvételek UI változtatásoknál
   - Törő változások vagy migrációs lépések, ha vannak

### Áttekintési folyamat

- Legalább **egy karbantartó jóváhagyása** szükséges a mergelés előtt
- A CI ellenőrzéseknek (lint, típusellenőrzés, tesztek, build) sikeresen le kell futniuk
- A reviewerek kérhetnek módosításokat — kezeld a visszajelzéseket és pushold a frissítéseket ugyanarra a branchre
- Jóváhagyás után a karbantartó **squash and merge** módszerrel mergeli

### PR tippek

- Írj leíró címet a conventional commit formátumban
- Tartsd a PR-eket kicsinek és áttekinthetőnek (lehetőleg 400 sor diff alatt)
- Adj hozzá inline megjegyzéseket a saját PR-edhez a nem nyilvánvaló döntések magyarázatához
- Válaszolj a review visszajelzésekre időben

## Hibajelentés

### Hibabejelentések

Hiba bejelentésekor add meg a következőket:

- **Leírás** — mi történt, és mi volt az elvárt viselkedés
- **Reprodukálási lépések** — minimális lépések a hiba kiváltásához
- **Környezet** — operációs rendszer, böngésző, Bun verzió, Node.js verzió
- **Képernyőképek vagy naplók** — ha releváns
- **Racona verzió** — commit hash vagy kiadási tag

### Funkciókérések

Funkció kérésekor add meg a következőket:

- **Probléma** — milyen problémát old meg?
- **Javasolt megoldás** — hogyan kellene működnie?
- **Megvizsgált alternatívák** — milyen más megközelítéseket fontoltál meg?
- **További kontextus** — mockupok, példák vagy hivatkozások

### Címkék

A karbantartók a következő címkékkel kategorizálják az issue-kat:

- `bug` — megerősített hiba
- `enhancement` — funkciókérés
- `good first issue` — kezdőknek megfelelő
- `help wanted` — közösségi hozzájárulás szívesen fogadva
- `documentation` — dokumentáció fejlesztése szükséges
- `wontfix` — nem tervezett

## Fejlesztési tippek

### Beépített alkalmazásokkal való munka

Minden alkalmazásnak a `src/apps/[app-name]/` könyvtárban saját belépési pontja (`index.svelte`), ikonja és opcionális szerver akciói vannak.

**Részletes leírás:** [Beépített alkalmazások →](/hu/builtin-apps)

### Hot Reload

A fejlesztői szerver támogatja a hot module replacement-et. A `.svelte`, `.ts` és `.css` fájlok változásai azonnal megjelennek teljes oldal újratöltés nélkül.

### Adatbázis változtatások

1. Módosítsd a sémákat a `packages/database/src/schemas/` könyvtárban
2. Futtasd a `bun db:generate` parancsot a migráció létrehozásához
3. Futtasd a `bun db:migrate` parancsot az alkalmazáshoz
4. Teszteld a `bun db:studio` segítségével az adatbázis vizsgálatához

**Részletes leírás:** [Adatbázis →](/hu/database)

### Specifikus tesztek futtatása

```bash
# Összes teszt futtatása
cd apps/web && bun test

# Egy adott tesztfájl futtatása
cd apps/web && bunx vitest run src/lib/utils/myUtil.test.ts

# Csak tulajdonságalapú tesztek futtatása
cd apps/web && bun test:pbt
```

**Részletes leírás:** [Tesztelés →](/hu/testing)

## Segítségkérés

Ha bármilyen kérdésed van, vagy elakadtál:

- **Issues** — keress a meglévő issue-k között, vagy nyiss egy újat
- **Discussions** — használd a GitHub Discussions-t kérdésekhez és ötletekhez
- **Dokumentáció** — nézd meg ezt a dokumentációs oldalt az útmutatókért
- **Hibaelhárítás** — gyakori problémák megoldásai: [Hibaelhárítás →](/hu/troubleshooting)

Köszönjük, hogy hozzájárulsz a Rocona-hoz! Minden hozzájárulás számít, legyen bármilyen kicsi. 🎉

## Támogatás

Több éves tapasztalattal rendelkező szoftverfejlesztő vagyok Magyarországról, és a Rocona-t szabadidőmben fejlesztem (egyelőre egyedül) – egy AI-jal közösen, akit szintén etetni kell. 🤑

Ha hasznosnak találod, vagy csak tetszik, amit csinálok, egy kávé árával is sokat segíthetsz abban, hogy folytathassam.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/H2H11XIQDF)
