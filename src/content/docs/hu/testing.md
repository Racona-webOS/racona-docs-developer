---
title: Tesztelés
description: Tesztelési stratégia és eszközök a Rocona projektben
---

A Rocona három tesztelési réteget használ a kód minőségének biztosítására.

## Tesztelési rétegek

| Eszköz              | Típus                    | Futtatás              | Dokumentáció |
| ------------------- | ------------------------ | --------------------- | ------------ |
| **Vitest**          | Egységtesztek            | `bun test`            | [Vitest →](/hu/testing-vitest) |
| **fast-check**      | Property-based tesztek   | `bun test:pbt`        | [Property-based →](/hu/testing-pbt) |
| **Playwright**      | E2E tesztek              | `bunx playwright test`| [E2E →](/hu/testing-e2e) |

**Fontos:** A teszteket az `apps/web` könyvtárból kell futtatni.

## Mikor melyiket használd?

### Vitest (Unit tesztek)

**Mire való:** Egyedi függvények, osztályok, komponensek tesztelése izoláltan.

**Példák:**
- Utility függvények (formázás, validáció, számítások)
- Store-ok állapotkezelése
- Server action logika
- Adatbázis repository függvények

**Előnyök:**
- Gyors futás
- Egyszerű debugolás
- Pontos hibajelzés

[Részletek →](/hu/testing-vitest)

---

### fast-check (Property-based tesztek)

**Mire való:** Invariánsok ellenőrzése véletlenszerű inputokkal.

**Példák:**
- Matematikai tulajdonságok (kommutatív, asszociatív)
- Adatstruktúra invariánsok
- Validációs logika
- Pagination számítások

**Előnyök:**
- Sok edge case automatikus tesztelése
- Rejtett bugok felfedezése
- Specifikáció dokumentálása

[Részletek →](/hu/testing-pbt)

---

### Playwright (E2E tesztek)

**Mire való:** Teljes felhasználói folyamatok tesztelése böngészőben.

**Példák:**
- Bejelentkezési folyamat
- Alkalmazás megnyitása és használata
- Űrlap kitöltés és mentés
- Navigáció és routing

**Előnyök:**
- Valós felhasználói élmény tesztelése
- Böngésző kompatibilitás
- Vizuális regressziók észlelése

[Részletek →](/hu/testing-e2e)

---

## Tesztelési piramis

```
       /\
      /  \     E2E (Playwright)
     /    \    - Kevés, lassú, törékeny
    /------\
   /        \  Property-based (fast-check)
  /          \ - Közepes mennyiség, invariánsok
 /------------\
/              \ Unit (Vitest)
\______________/ - Sok, gyors, stabil
```

## Gyors parancsok

```bash
# Unit tesztek
cd apps/web && bun test

# Property-based tesztek
cd apps/web && bun test:pbt

# E2E tesztek
cd apps/web && bunx playwright test

# Watch mód (fejlesztés közben)
cd apps/web && bunx vitest
```

**Részletes parancsok:** [Scripts referencia →](/hu/scripts)

## Tesztelési konvenciók

- **Fájlnév:** `[fájlnév].test.ts` vagy `[fájlnév].spec.ts`
- **Elhelyezés:** A tesztelt fájl mellé
- **Describe blokk:** A tesztelt egység neve
- **It blokk:** Konkrét viselkedés leírása magyarul
- **Minta:** Arrange-Act-Assert
- **Lefedettség:** Minden publikus függvényhez legalább egy teszt
- **Edge case-ek:** Üres input, null, határértékek tesztelése

## Faker – teszt adatok

Véletlenszerű, de valósághű teszt adatok generálása:

```typescript
import { faker } from '@faker-js/faker';

const testUser = {
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: faker.internet.password({ length: 12 })
};
```

## Következő lépések

- [Vitest unit tesztek →](/hu/testing-vitest)
- [Property-based tesztek →](/hu/testing-pbt)
- [E2E tesztek Playwright-tal →](/hu/testing-e2e)
