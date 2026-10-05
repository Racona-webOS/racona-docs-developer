---
title: Ütemezett feladatok
description: Időzítetten futó plugin feladatok – scheduledJobs a manifestben, server/jobs.ts handlerek, rendszer-kontextus, idempotencia, időzóna, tesztelés és korlátok
---

## Áttekintés

Egy alkalmazás felhasználói interakció nélkül, időzítetten is futtathat szerver oldali kódot: napi emlékeztetőt küldhet, lejárt tételeket zárhat le, összesítőt készíthet. A feladatokat a `manifest.json` `scheduledJobs` mezője deklarálja, a kódjuk a `server/jobs.ts` (vagy `.js`) fájlban van.

Szükséges jogosultság: `scheduler` a `manifest.json`-ban.

Az ütemező a Racona alkalmazás folyamatán belül fut, külön cron vagy worker nem kell hozzá. Az állapotát az adatbázisban tartja: egy esedékes időpontra több alkalmazáspéldány mellett is legfeljebb egy futás jut, és egy feladatnak egyszerre legfeljebb egy futása lehet.

:::note
A funkcióhoz az ütemezőt tartalmazó Racona core kell. A handlerek típusait a `@racona/sdk/server` exportálja (csak típusok, futásidejű kód nincs benne).
:::

## Gyors kezdés

Új projektnél a CLI mindezt legenerálja: `bunx @racona/cli my-app --features scheduler` (lásd [@racona/cli](/hu/packages-cli/)).

### 1. Jogosultság és feladat a manifestben

```json title="manifest.json" {3,4-14}
{
  "id": "my-app",
  "permissions": ["database", "remote_functions", "scheduler"],
  "scheduledJobs": [
    {
      "id": "daily-reminders",
      "handler": "sendDueReminders",
      "schedule": "0 7 * * *",
      "timezone": "Europe/Budapest",
      "description": { "hu": "Napi emlékeztetők", "en": "Daily reminders" },
      "timeoutSeconds": 600,
      "catchUp": "once"
    }
  ]
}
```

### 2. A handler a `server/jobs.ts`-ben

```typescript title="server/jobs.ts"
import type { ScheduledJobHandler } from '@racona/sdk/server';

export const sendDueReminders: ScheduledJobHandler = async (params, ctx) => {
  ctx.logger.info(`Indítás: ${params.trigger}, esedékes: ${params.scheduledFor}`);
  // ... az esedékes tételek feldolgozása, lásd: Idempotencia és felzárkózás
  return { summary: 'Kész' };
};
```

A `handler` mező az exportált függvény neve. Telepítés és frissítés után a feladat megjelenik a Plugin kezelőben, és a következő esedékes időpontban lefut.

## A `scheduledJobs` mező

| Mező | Kötelező | Leírás |
|---|---|---|
| `id` | igen | A feladat azonosítója a pluginon belül: kebab-case (`a-z`, `0-9`, `-`), 3–50 karakter, egyedi |
| `handler` | igen | Az exportált függvény neve a `server/jobs.ts`-ben (érvényes JS azonosító, legfeljebb 100 karakter) |
| `schedule` | igen | 5 mezős cron kifejezés (`perc óra nap hónap hét_napja`). Két futás között legalább 5 percnek kell eltelnie |
| `timezone` | nem | IANA időzóna, amelyben a cron kifejezést értelmezni kell. Alapértelmezés: a szerver `SCHEDULER_DEFAULT_TIMEZONE` beállítása (`Europe/Budapest`) |
| `description` | nem | Szöveg vagy `{ "hu": "…", "en": "…" }` — a Plugin kezelőben jelenik meg |
| `timeoutSeconds` | nem | Futási időkorlát másodpercben (10–3600). Alapértelmezés: `SCHEDULER_JOB_TIMEOUT_SECONDS` (600) |
| `catchUp` | nem | Mi legyen a kimaradt futással: `"once"` (alapértelmezés) — egyszer pótolja; `"skip"` — kihagyja. Lásd [Ütemezés és pótlás](#ütemezés-és-pótlás) |

Egy plugin legfeljebb 20 feladatot deklarálhat. A telepítő elutasítja a csomagot, ha a `scheduledJobs` mellett nincs `scheduler` jogosultság, ha a cron kifejezés vagy az időzóna érvénytelen, ha egy feladat 5 percnél sűrűbben futna, vagy ha a csomagban nincs `server/jobs.js` vagy `server/jobs.ts`.

### Cron példák

| Kifejezés | Jelentés |
|---|---|
| `0 7 * * *` | Minden nap 07:00-kor |
| `30 6 * * 1-5` | Hétköznap 06:30-kor |
| `0 */4 * * *` | Négyóránként, egész órakor |
| `*/15 * * * *` | 15 percenként |
| `0 3 1 * *` | Minden hónap 1-jén 03:00-kor |

## A handler

A handlerek a `server/jobs.ts` (vagy `server/jobs.js`) fájlban vannak; ha mindkettő létezik, a `.js` az elsődleges. A core a plugin gyökeréből tölti be, a Bun natívan futtatja a TypeScript forrást, fordítani nem kell (lásd [Build és csomagolás](/hu/plugins-build/)).

```typescript
type ScheduledJobHandler = (
  params: ScheduledJobParams,
  context: ScheduledJobContext
) => Promise<ScheduledJobResult | void>;
```

:::caution[A handlerek ne a `functions.ts`-ben legyenek]
A remote végpont (`sdk.remote.call()`) csak a `server/functions.ts`-t tölti be, a `server/jobs.ts`-t nem — így a felhasználók nem hívhatják a rendszerjogon futó kódot. A core ezen felül elutasítja a remote hívást, ha a függvény neve egy regisztrált job handlerrel egyezik. A közös logikát tedd külön modulba, és azt importáld mindkét helyen.
:::

### `params`

| Mező | Típus | Leírás |
|---|---|---|
| `jobId` | `string` | A feladat `id`-ja a manifestből |
| `runId` | `number` | A futás azonosítója a futásnaplóban |
| `scheduledFor` | `string` | ISO időbélyeg: az esedékes időpont, amelyre a futás szól. Kézi futásnál az indítás ideje |
| `trigger` | `'schedule' \| 'manual'` | Az ütemező vagy a „Futtatás most” gomb indította |

### A `context` objektum (rendszer-kontextus)

| Mező | Típus | Leírás |
|---|---|---|
| `pluginId` | `string` | A plugin azonosítója |
| `userId` | `null` | **Nincs hívó felhasználó** |
| `trigger` | `'schedule' \| 'manual'` | Ugyanaz, mint a `params.trigger` |
| `triggeredBy` | `number \| null` | Kézi futásnál az indító felhasználó ID-ja, egyébként `null` |
| `db` | `object` | Ugyanaz a pg Pool kompatibilis kapcsolat, mint a [szerver függvényekben](/hu/plugins-server-functions/#adatbázis-hozzáférés): `query(sql, params)` és `connect()`. Nincs sémára korlátozva |
| `permissions` | `[]` | Mindig üres — nincs felhasználó, akinek jogosultsága lenne |
| `pluginPermissions` | `string[]` | A plugin manifest jogosultságai |
| `email` | `object \| undefined` | [Email szolgáltatás](/hu/plugins-email/), csak `notifications` jogosultsággal |
| `notifications` | `object \| undefined` | Értesítés küldése megnevezett felhasználóknak (`userId` / `userIds`), csak `notifications` jogosultsággal |
| `logger` | `{ info, warn, error }` | A sorok a futásnaplóba kerülnek |
| `signal` | `AbortSignal` | Időtúllépéskor abortál |

:::danger[`userId: null` — a szerver függvények nem hívhatók változatlanul]
Ami a szerver függvényekben a hívóra épül (`context.userId`, `context.permissions.includes('admin')`, a plugin saját szerepkör-ellenőrzései), az itt nem működik, vagy rosszul működik. Egy jogosultság-ellenőrzés, amely `admin` hiányában a felhasználó saját adatára szűr, rendszer-kontextusban hibát dob vagy üres eredményt ad.

Válaszd szét a kódot: a belső függvények jogosultság-ellenőrzés nélkül dolgoznak, a `functions.ts` exportjai ellenőriznek, majd ezeket hívják, a `jobs.ts` pedig közvetlenül a belső függvényeket hívja. Ha egy közös segéd a hívóra támaszkodik, kezelje külön a `userId === null` esetet (például dobjon hibát), ne essen vissza csendben valamilyen alapértelmezésre.
:::

### Visszatérési érték

A handler visszaadhat egy `{ summary?, data? }` objektumot, ez a futásnaplóba kerül:

- `summary` — rövid szöveg a Plugin kezelő listájában (legfeljebb 1000 karakter)
- `data` — tetszőleges JSON adat a futás részleteihez (legfeljebb 16 KB; nagyobb adatnál csak a `summary` marad meg)

Ha a handler hibát dob, a futás „Sikertelen” lesz, és a hibaüzenet a futásnaplóba kerül. Ez az üzenet a rendszergazdáknak szól, nem szűrődik, ezért ne tegyél bele érzékeny adatot.

## Ütemezés és pótlás

- **Pontosság.** Az ütemező alapértelmezetten 30 másodpercenként nézi meg az esedékes feladatokat (`SCHEDULER_TICK_SECONDS`), ezért egy 07:00-ás futás néhány másodperccel később indul. Példányonként egyszerre legfeljebb 2 feladat fut (`SCHEDULER_MAX_CONCURRENT`), a többi a következő körre vár.
- **Egy időpont — legfeljebb egy futás.** Egy esedékes időpontra akkor is csak egy ütemezett futás jut, ha több alkalmazáspéldány fut. Egy feladatnak egyszerre csak egy futása lehet: amíg az előző fut, a „Futtatás most” sem indít újat.
- **`catchUp: "once"`** (alapértelmezés). Ha a szerver állt, vagy a plugin inaktív volt, és közben esedékes lett a feladat, induláskor (illetve újraaktiváláskor) egyszer pótlódik — akkor is csak egyszer, ha közben több időpont is kimaradt. Ilyenkor a `params.scheduledFor` az **első** kimaradt időpont.
- **`catchUp: "skip"`.** Ha a futás a türelmi időnél (`SCHEDULER_MISSED_GRACE_SECONDS`, alapértelmezetten 5 perc) később indulna, kimarad („Kihagyva” állapottal kerül a naplóba), és a feladat a következő időpontban fut. Akkor használd, ha egy késői futásnak nincs értelme (pl. reggeli összesítő délután).
- **Megszakadt futás.** Ha a szerver futás közben áll le, a futás újraindításkor „Sikertelen” lesz („Interrupted” hibával). A core nem futtatja újra; a feladat a következő időpontban fut.
- **Nem fut** a feladat, ha az adminisztrátor kikapcsolta, ha a plugin nem aktív, vagy ha a pluginnak nincs `scheduler` jogosultsága.

## Idempotencia és felzárkózás

A handlert úgy írd meg, hogy **dolgozza fel mindazt, ami esedékes és még nincs kész**, és ne arra építsen, hogy pontosan egyszer, pontosan 07:00-kor fut. Egy futás késhet, kimaradhat (`skip`), pótlódhat (`once`), megszakadhat, és egy adminisztrátor kézzel is elindíthatja ugyanazon a napon még egyszer.

A gyakorlatban ez három dolgot jelent:

1. **„Ami esedékes”, nem „ami ma esedékes”.** Szűrj `<=` feltétellel a mai napra, így a kimaradt napok tételei is sorra kerülnek.
2. **Jelöld, ami kész.** Egy oszlop (pl. `reminded_at`) jelzi, mi készült már el; a lekérdezés csak a jelöletleneket veszi fel. Így egy ismételt futás nem dolgoz fel semmit kétszer.
3. **Foglalj atomikusan.** Feldolgozás előtt egy `UPDATE … WHERE … IS NULL RETURNING` foglalja le a tételt. Ha két futás mégis átfedne (pl. egy időtúllépett futás még dolgozik), egy tételt csak az egyik kap meg.

```typescript title="server/jobs.ts"
import type { ScheduledJobHandler } from '@racona/sdk/server';

const SCHEMA = 'app__my_app';
/** Ugyanaz, mint a manifest `timezone` mezője */
const TIME_ZONE = 'Europe/Budapest';

/** A mai nap (YYYY-MM-DD) a feladat időzónájában */
function todayIn(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

export const sendDueReminders: ScheduledJobHandler = async (params, ctx) => {
  const today = todayIn(TIME_ZONE);

  // Minden esedékes, még nem jelzett tétel — a kimaradt napoké is
  const { rows } = await ctx.db.query<{ id: number; owner_id: number; title: string }>(
    `SELECT id, owner_id, title FROM ${SCHEMA}.tasks
      WHERE due_date <= $1::date AND reminded_at IS NULL AND NOT done
      ORDER BY id`,
    [today]
  );

  let sent = 0;
  for (const task of rows) {
    if (ctx.signal.aborted) {
      ctx.logger.warn(`Időtúllépés: ${rows.length - sent} tétel a következő futásra marad`);
      break;
    }

    // Foglalás: ha egy másik futás már jelezte, kihagyjuk
    const claimed = await ctx.db.query(
      `UPDATE ${SCHEMA}.tasks SET reminded_at = now()
        WHERE id = $1 AND reminded_at IS NULL RETURNING id`,
      [task.id]
    );
    if (claimed.rowCount === 0) continue;

    await ctx.notifications?.send({
      userId: task.owner_id,
      title: { hu: 'Lejárt határidő', en: 'Overdue task' },
      message: { hu: task.title, en: task.title },
      type: 'warning'
    });
    sent++;
  }

  return {
    summary: `${sent} emlékeztető kiküldve`,
    data: { today, due: rows.length, sent, trigger: params.trigger }
  };
};
```

:::tip[Foglalás előtte vagy utána?]
A fenti példa a küldés **előtt** jelöl: ha a küldés hibát dob, az emlékeztető elmarad, de dupla emlékeztető sosem megy ki (legfeljebb egyszer). Ha fontosabb, hogy semmi ne maradjon el, jelölj a sikeres küldés **után** — ekkor egy hiba utáni ismételt futás újraküldheti (legalább egyszer). Válaszd azt, amelyik a feladatnál kisebb kárt okoz.
:::

A feldolgozandó napot a futás idejéből számold (`new Date()`), ne a `params.scheduledFor`-ból: egy pótló futás `scheduledFor`-ja az első kimaradt időpont, így a `<=` feltétel csak addig a napig érné el a tételeket. A `scheduledFor` naplózásra és annak jelzésére jó, hogy a futás késve indult.

## Időzóna

- A cron kifejezést a feladat `timezone` mezőjében megadott időzónában értelmezi az ütemező, a `0 7 * * *` tehát helyi idő szerinti 07:00, nyári és téli időszámításban egyaránt.
- A handlerben a „mai napot” ugyanabban az időzónában számold (lásd `todayIn` fent). A szerver időzónája és a `new Date().toISOString()` UTC szerinti dátuma éjfél körül eltérhet a helyitől.
- Az adatbázisban a `timestamptz` értékeket a lekérdezésben konvertáld napra: `(created_at AT TIME ZONE 'Europe/Budapest')::date`.
- Az óraátállítás miatt kerüld a 02:00 és 03:00 közötti időpontokat, ha a feladatnak minden nap pontosan egyszer kell lefutnia.

## Időkorlát

Ha a handler nem végez `timeoutSeconds` alatt, a futás „Időtúllépés” állapotú lesz, és a `context.signal` abortál. **A core nem állítja le a handlert**: ha az nem figyeli a jelet, a háttérben tovább fut, a feladat pedig zárolva marad (legfeljebb az időkorlát + 60 másodpercig), így addig újra sem indul.

- Hosszú ciklusokban rendszeresen ellenőrizd a `ctx.signal.aborted` értékét, és lépj ki, ha igaz.
- A `fetch`-nek add át a jelet: `fetch(url, { signal: ctx.signal })`.
- Sok tételnél dolgozz kötegekben; ami időtúllépés miatt kimarad, azt a következő futás felveszi (lásd [Idempotencia](#idempotencia-és-felzárkózás)).

## Napló és hibák

- A `ctx.logger` sorai a futásnaplóba kerülnek (futásonként legfeljebb 200 sor, soronként legfeljebb 1000 karakter), és a szerver konzoljára is kiíródnak `[Scheduler] <pluginId>/<jobId>:` előtaggal.
- A futásnaplót a core `SCHEDULER_RUN_RETENTION_DAYS` napig (alapértelmezés: 30) őrzi meg.
- Ha egy feladat **3 egymást követő** futása sikertelen vagy időtúllépett, a core egyszer értesítést küld a rendszergazdáknak és a `plugin.scheduler.manage` jogosultsággal rendelkezőknek. A következő sikeres futás nullázza a számlálót.

## Adminisztráció

A Plugin kezelő **Ütemezett feladatok** oldala és a plugin részletező oldalának szakasza mutatja a feladatokat (`plugin.scheduler.manage` jogosultsággal):

- következő és utolsó futás, utolsó állapot,
- ki/bekapcsolás — a beállítás plugin frissítés után is megmarad,
- **Futtatás most** — kézi futás (`trigger: 'manual'`, `triggeredBy` az indító); a következő ütemezett időpont nem változik,
- futásnapló a naplósorokkal, az eredménnyel és a hibaüzenettel.

**Frissítéskor** a core a manifest alapján szinkronizál: az új feladatok létrejönnek, az eltávolítottak (a futásnaplójukkal együtt) törlődnek. Ha egy feladat `schedule` vagy `timezone` mezője változik, a következő időpont újraszámolódik. **Eltávolításkor** a plugin összes feladata és futásnaplója törlődik.

## Tesztelés

### Lokálisan, a dev szerveren

A CLI által generált `dev-server.ts` (`--features scheduler`) `POST /api/jobs/:jobId/run` végpontot ad. A végpont a manifest alapján megkeresi a handlert a `server/jobs.ts`-ben, és a core-éhoz hasonló stub rendszer-kontextussal hívja meg: `userId: null`, `permissions: []`, `trigger: 'manual'`, a remote végpont `db`, `email` és `notifications` szolgáltatásai, konzolra író `logger`, és egy `signal`, amely a `timeoutSeconds` után abortál.

```bash
bun dev:server

curl -X POST http://localhost:5175/api/jobs/daily-reminders/run

# Szimulált „mai nap”: a handler params.today-ként kapja meg
curl -X POST 'http://localhost:5175/api/jobs/daily-reminders/run?today=2026-01-31'
```

A válasz a handler eredményét és a naplósorokat tartalmazza:

```json
{
  "success": true,
  "result": { "summary": "2 emlékeztető kiküldve", "data": { "today": "2026-01-31", "due": 2, "sent": 2 } },
  "logs": [],
  "durationMs": 14
}
```

A `params.today` csak a dev szerveren létezik, a core nem adja át. Ha használod, a handler így olvassa: `(params as ScheduledJobParams & { today?: string }).today ?? todayIn(TIME_ZONE)`.

A szimulált napokkal végigpróbálhatod a felzárkózást és az idempotenciát: futtasd ugyanarra a napra kétszer (a második ne csináljon semmit), majd ugorj előre több napot (a kimaradt tételek egy futásban kerüljenek sorra).

### Unit tesztben

A handler egyszerű függvény, csonk kontextussal közvetlenül hívható:

```typescript
import { expect, test } from 'vitest';
import type { ScheduledJobContext, ScheduledJobParams } from '@racona/sdk/server';
import { sendDueReminders } from '../server/jobs';

test('a második futás nem küld újra', async () => {
  const ctx: ScheduledJobContext = {
    pluginId: 'my-app',
    userId: null,
    trigger: 'manual',
    triggeredBy: null,
    db: testDb, // teszt adatbázis vagy csonk
    permissions: [],
    pluginPermissions: ['scheduler', 'notifications'],
    notifications: { send: async () => ({ success: true }) },
    logger: { info() {}, warn() {}, error() {} },
    signal: new AbortController().signal
  };
  const params: ScheduledJobParams = {
    jobId: 'daily-reminders',
    runId: 1,
    scheduledFor: new Date().toISOString(),
    trigger: 'manual'
  };

  await sendDueReminders(params, ctx);
  const second = await sendDueReminders(params, ctx);
  expect(second?.data?.sent).toBe(0);
});
```

### Élő Racona-ban

Telepítés után a Plugin kezelő → Ütemezett feladatok oldalon a **Futtatás most** gombbal azonnal elindíthatod a feladatot, és a futásnaplóban látod az eredményt és a naplósorokat.

## Korlátok

| Korlát | Érték |
|---|---|
| Feladatok száma pluginonként | legfeljebb 20 |
| Legrövidebb idő két futás között | 5 perc |
| Időkorlát (`timeoutSeconds`) | 10–3600 s, alapértelmezés 600 s |
| Indulási pontosság | `SCHEDULER_TICK_SECONDS` (alapértelmezés 30 s) |
| Egyidejű futások példányonként | `SCHEDULER_MAX_CONCURRENT` (alapértelmezés 2) |
| Naplósorok futásonként | 200 sor, soronként 1000 karakter |
| Eredmény (`data`) mérete | 16 KB JSON |
| `summary` hossza | 1000 karakter |
| Futásnapló megőrzése | `SCHEDULER_RUN_RETENTION_DAYS` (alapértelmezés 30 nap) |

A handler a core folyamatában, sandbox nélkül fut, mint a szerver függvények. Email küldésnél nincs sebességkorlát: sok címzettnél a handler felelőssége a kötegelés.

A szerver oldali beállítások (`SCHEDULER_*`) leírása: [Változók referencia](/hu/configuration/#ütemező).

## Kapcsolódó

- [Szerver függvények](/hu/plugins-server-functions/) — a `db` kapcsolat és a remote függvények kontextusa
- [Email szolgáltatás](/hu/plugins-email/) — `context.email` és email template-ek
- [manifest.json](/hu/plugins-manifest/) — a többi manifest mező
- [Build és csomagolás](/hu/plugins-build/) — a `server/` mappa a csomagban
