---
title: Scheduled Jobs
description: Plugin jobs that run on a schedule – scheduledJobs in the manifest, server/jobs.ts handlers, system context, idempotency, timezones, testing and limits
---

## Overview

An app can run server-side code on a schedule, without user interaction: send a daily reminder, close expired items, build a summary. Jobs are declared in the `scheduledJobs` field of `manifest.json`, and their code lives in `server/jobs.ts` (or `.js`).

Required permission: `scheduler` in `manifest.json`.

The scheduler runs inside the Racona application process; no separate cron or worker is needed. It keeps its state in the database: a due time gets at most one run even with several application instances, and a job has at most one run at a time.

:::note
This feature needs a Racona core that includes the scheduler. The handler types are exported from `@racona/sdk/server` (types only, no runtime code).
:::

## Quick Start

For a new project the CLI generates all of this: `bunx @racona/cli my-app --features scheduler` (see [@racona/cli](/en/packages-cli/)).

### 1. Permission and job in the manifest

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

### 2. The handler in `server/jobs.ts`

```typescript title="server/jobs.ts"
import type { ScheduledJobHandler } from '@racona/sdk/server';

export const sendDueReminders: ScheduledJobHandler = async (params, ctx) => {
  ctx.logger.info(`Started: ${params.trigger}, due: ${params.scheduledFor}`);
  // ... process the due items, see: Idempotency and catching up
  return { summary: 'Done' };
};
```

The `handler` field is the name of the exported function. After installation or an update, the job shows up in the Plugin Manager and runs at its next due time.

## The `scheduledJobs` Field

| Field | Required | Description |
|---|---|---|
| `id` | yes | Job ID within the plugin: kebab-case (`a-z`, `0-9`, `-`), 3–50 characters, unique |
| `handler` | yes | Name of the exported function in `server/jobs.ts` (a valid JS identifier, at most 100 characters) |
| `schedule` | yes | 5-field cron expression (`minute hour day month weekday`). At least 5 minutes must pass between two runs |
| `timezone` | no | IANA timezone the cron expression is evaluated in. Default: the server's `SCHEDULER_DEFAULT_TIMEZONE` (`Europe/Budapest`) |
| `description` | no | A string or `{ "hu": "…", "en": "…" }` — shown in the Plugin Manager |
| `timeoutSeconds` | no | Run timeout in seconds (10–3600). Default: `SCHEDULER_JOB_TIMEOUT_SECONDS` (600) |
| `catchUp` | no | What to do with a missed run: `"once"` (default) — run it once; `"skip"` — skip it. See [Scheduling and catch-up](#scheduling-and-catch-up) |

A plugin can declare at most 20 jobs. The installer rejects the package if `scheduledJobs` is present without the `scheduler` permission, if a cron expression or timezone is invalid, if a job would run more often than every 5 minutes, or if the package contains neither `server/jobs.js` nor `server/jobs.ts`.

### Cron examples

| Expression | Meaning |
|---|---|
| `0 7 * * *` | Every day at 07:00 |
| `30 6 * * 1-5` | Weekdays at 06:30 |
| `0 */4 * * *` | Every four hours, on the hour |
| `*/15 * * * *` | Every 15 minutes |
| `0 3 1 * *` | On the 1st of every month at 03:00 |

## The Handler

Handlers live in `server/jobs.ts` (or `server/jobs.js`); if both exist, `.js` wins. The core loads it from the plugin root and Bun runs the TypeScript source directly, no compile step needed (see [Build & Packaging](/en/plugins-build/)).

```typescript
type ScheduledJobHandler = (
  params: ScheduledJobParams,
  context: ScheduledJobContext
) => Promise<ScheduledJobResult | void>;
```

:::caution[Keep handlers out of `functions.ts`]
The remote endpoint (`sdk.remote.call()`) only loads `server/functions.ts`, not `server/jobs.ts`, so users cannot call code that runs with system rights. On top of that, the core rejects a remote call whose function name matches a registered job handler. Put shared logic in a separate module and import it from both places.
:::

### `params`

| Field | Type | Description |
|---|---|---|
| `jobId` | `string` | The job's `id` from the manifest |
| `runId` | `number` | ID of this run in the run history |
| `scheduledFor` | `string` | ISO timestamp: the due time this run is for. For a manual run, the time it was started |
| `trigger` | `'schedule' \| 'manual'` | Started by the scheduler or by the "Run now" button |

### The `context` object (system context)

| Field | Type | Description |
|---|---|---|
| `pluginId` | `string` | The plugin ID |
| `userId` | `null` | **There is no calling user** |
| `trigger` | `'schedule' \| 'manual'` | Same as `params.trigger` |
| `triggeredBy` | `number \| null` | For a manual run, the ID of the user who started it, otherwise `null` |
| `db` | `object` | The same pg Pool compatible connection as in [server functions](/en/plugins-server-functions/#database-access): `query(sql, params)` and `connect()`. Not limited to a schema |
| `permissions` | `[]` | Always empty — there is no user to have permissions |
| `pluginPermissions` | `string[]` | The permissions in the plugin manifest |
| `email` | `object \| undefined` | [Email service](/en/plugins-email/), only with the `notifications` permission |
| `notifications` | `object \| undefined` | Sends notifications to named users (`userId` / `userIds`), only with the `notifications` permission |
| `logger` | `{ info, warn, error }` | Lines go to the run history |
| `signal` | `AbortSignal` | Aborted when the job times out |

:::danger[`userId: null` — server functions cannot be reused as they are]
Anything in server functions that relies on the caller (`context.userId`, `context.permissions.includes('admin')`, the plugin's own role checks) does not work here, or works incorrectly. A permission check that filters to the user's own data when `admin` is missing will throw or return nothing in the system context.

Split the code: internal functions do the work without permission checks; the `functions.ts` exports check permissions and then call them; `jobs.ts` calls the internal functions directly. If a shared helper depends on the caller, handle `userId === null` explicitly (for example, throw), instead of silently falling back to some default.
:::

### Return value

The handler may return a `{ summary?, data? }` object, stored in the run history:

- `summary` — short text shown in the Plugin Manager list (at most 1000 characters)
- `data` — any JSON data with the details of the run (at most 16 KB; for larger data only the `summary` is kept)

If the handler throws, the run is marked "Failed" and the error message is stored in the run history. The message is meant for administrators and is not filtered, so do not put sensitive data in it.

## Scheduling and Catch-up

- **Precision.** By default the scheduler checks for due jobs every 30 seconds (`SCHEDULER_TICK_SECONDS`), so a 07:00 run starts a few seconds later. At most 2 jobs run at the same time per instance (`SCHEDULER_MAX_CONCURRENT`); the rest wait for the next round.
- **One due time — at most one run.** A due time gets only one scheduled run, even with several application instances. A job can have only one run at a time: while the previous one is running, "Run now" does not start another.
- **`catchUp: "once"`** (default). If the server was down, or the plugin was inactive, when the job became due, it is caught up once on start-up (or on reactivation) — only once, even if several due times were missed. In that case `params.scheduledFor` is the **first** missed due time.
- **`catchUp: "skip"`.** If the run would start later than the grace period (`SCHEDULER_MISSED_GRACE_SECONDS`, 5 minutes by default), it is skipped (logged with the "Skipped" status) and the job runs at its next due time. Use it when a late run makes no sense (e.g. a morning summary in the afternoon).
- **Interrupted run.** If the server stops during a run, the run is marked "Failed" on restart (with an "Interrupted" error). The core does not re-run it; the job runs at its next due time.
- **The job does not run** if an administrator disabled it, if the plugin is not active, or if the plugin lacks the `scheduler` permission.

## Idempotency and Catching Up

Write the handler so that it **processes everything that is due and not done yet**, rather than assuming it runs exactly once, at exactly 07:00. A run can be late, skipped (`skip`), caught up (`once`), interrupted, and an administrator can start it again by hand on the same day.

In practice this means three things:

1. **"What is due", not "what is due today".** Filter with `<=` up to today, so the items of missed days are processed too.
2. **Mark what is done.** A column (e.g. `reminded_at`) records what has been handled; the query only picks unmarked rows. A repeated run then does no work twice.
3. **Claim atomically.** Before processing, claim the row with an `UPDATE … WHERE … IS NULL RETURNING`. If two runs still overlap (e.g. a timed-out run is still working), only one of them gets the row.

```typescript title="server/jobs.ts"
import type { ScheduledJobHandler } from '@racona/sdk/server';

const SCHEMA = 'app__my_app';
/** Same as the manifest `timezone` field */
const TIME_ZONE = 'Europe/Budapest';

/** Today (YYYY-MM-DD) in the job's timezone */
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

  // Every due row that has not been reminded yet — including those of missed days
  const { rows } = await ctx.db.query<{ id: number; owner_id: number; title: string }>(
    `SELECT id, owner_id, title FROM ${SCHEMA}.tasks
      WHERE due_date <= $1::date AND reminded_at IS NULL AND NOT done
      ORDER BY id`,
    [today]
  );

  let sent = 0;
  for (const task of rows) {
    if (ctx.signal.aborted) {
      ctx.logger.warn(`Timeout: ${rows.length - sent} rows left for the next run`);
      break;
    }

    // Claim: skip the row if another run has already handled it
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
    summary: `${sent} reminders sent`,
    data: { today, due: rows.length, sent, trigger: params.trigger }
  };
};
```

:::tip[Mark before or after?]
The example marks the row **before** sending: if sending throws, that reminder is lost, but a duplicate reminder never goes out (at most once). If it matters more that nothing is missed, mark **after** a successful send — then a run repeated after a failure may send it again (at least once). Pick whichever does less harm for the job.
:::

Compute the day to process from the time of the run (`new Date()`), not from `params.scheduledFor`: a catch-up run's `scheduledFor` is the first missed due time, so a `<=` filter would only reach rows up to that day. `scheduledFor` is useful for logging and for noticing that a run started late.

## Timezones

- The scheduler evaluates the cron expression in the job's `timezone`, so `0 7 * * *` means 07:00 local time, in both summer and winter time.
- In the handler, compute "today" in the same timezone (see `todayIn` above). Around midnight, the server's timezone and the UTC date of `new Date().toISOString()` can differ from the local date.
- In the database, convert `timestamptz` values to a day in the query: `(created_at AT TIME ZONE 'Europe/Budapest')::date`.
- Because of the clock changes, avoid times between 02:00 and 03:00 if the job must run exactly once every day.

## Timeout

If the handler does not finish within `timeoutSeconds`, the run is marked "Timed out" and `context.signal` is aborted. **The core does not stop the handler**: if it ignores the signal, it keeps running in the background, and the job stays locked (for at most the timeout + 60 seconds), so it does not start again until then.

- In long loops, check `ctx.signal.aborted` regularly and stop when it is true.
- Pass the signal to `fetch`: `fetch(url, { signal: ctx.signal })`.
- With many rows, work in batches; whatever a timeout leaves behind is picked up by the next run (see [Idempotency](#idempotency-and-catching-up)).

## Logs and Errors

- Lines written with `ctx.logger` go to the run history (at most 200 lines per run, at most 1000 characters per line), and to the server console with a `[Scheduler] <pluginId>/<jobId>:` prefix.
- The core keeps the run history for `SCHEDULER_RUN_RETENTION_DAYS` days (default: 30).
- If **3 consecutive** runs of a job fail or time out, the core sends one notification to system administrators and to users with the `plugin.scheduler.manage` permission. The next successful run resets the counter.

## Administration

The **Scheduled Jobs** page of the Plugin Manager and a section on the plugin detail page list the jobs (with the `plugin.scheduler.manage` permission):

- next and last run, last status,
- enable/disable — the setting is kept across plugin updates,
- **Run now** — a manual run (`trigger: 'manual'`, `triggeredBy` is the user who started it); the next scheduled time does not change,
- run history with the log lines, the result and the error message.

**On update**, the core syncs the jobs with the manifest: new jobs are created, removed ones are deleted (together with their run history). If a job's `schedule` or `timezone` changes, its next run time is recalculated. **On uninstall**, all of the plugin's jobs and their run history are deleted.

## Testing

### Locally, on the dev server

The `dev-server.ts` generated by the CLI (`--features scheduler`) provides a `POST /api/jobs/:jobId/run` endpoint. It finds the handler in `server/jobs.ts` through the manifest and calls it with a stub system context similar to the core's: `userId: null`, `permissions: []`, `trigger: 'manual'`, the `db`, `email` and `notifications` services of the remote endpoint, a console `logger`, and a `signal` that aborts after `timeoutSeconds`.

```bash
bun dev:server

curl -X POST http://localhost:5175/api/jobs/daily-reminders/run

# Simulated "today": the handler receives it as params.today
curl -X POST 'http://localhost:5175/api/jobs/daily-reminders/run?today=2026-01-31'
```

The response contains the handler's result and the log lines:

```json
{
  "success": true,
  "result": { "summary": "2 reminders sent", "data": { "today": "2026-01-31", "due": 2, "sent": 2 } },
  "logs": [],
  "durationMs": 14
}
```

`params.today` exists only on the dev server; the core never passes it. If you use it, read it like this in the handler: `(params as ScheduledJobParams & { today?: string }).today ?? todayIn(TIME_ZONE)`.

With simulated days you can try out catching up and idempotency: run the same day twice (the second run should do nothing), then jump ahead several days (the missed rows should be processed in one run).

### In a unit test

A handler is a plain function, so you can call it directly with a stub context:

```typescript
import { expect, test } from 'vitest';
import type { ScheduledJobContext, ScheduledJobParams } from '@racona/sdk/server';
import { sendDueReminders } from '../server/jobs';

test('the second run does not send again', async () => {
  const ctx: ScheduledJobContext = {
    pluginId: 'my-app',
    userId: null,
    trigger: 'manual',
    triggeredBy: null,
    db: testDb, // test database or stub
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

### In a live Racona

After installation, use the **Run now** button on the Plugin Manager → Scheduled Jobs page to start the job immediately, and check the result and the log lines in the run history.

## Limits

| Limit | Value |
|---|---|
| Jobs per plugin | at most 20 |
| Shortest time between two runs | 5 minutes |
| Timeout (`timeoutSeconds`) | 10–3600 s, default 600 s |
| Start precision | `SCHEDULER_TICK_SECONDS` (default 30 s) |
| Concurrent runs per instance | `SCHEDULER_MAX_CONCURRENT` (default 2) |
| Log lines per run | 200 lines, 1000 characters each |
| Result (`data`) size | 16 KB JSON |
| `summary` length | 1000 characters |
| Run history retention | `SCHEDULER_RUN_RETENTION_DAYS` (default 30 days) |

The handler runs in the core process without a sandbox, just like server functions. Email sending has no rate limit: with many recipients, batching is the handler's job.

The server-side settings (`SCHEDULER_*`) are described in the [Variables reference](/en/configuration/#scheduler).

## Related

- [Server Functions](/en/plugins-server-functions/) — the `db` connection and the context of remote functions
- [Email Service](/en/plugins-email/) — `context.email` and email templates
- [manifest.json](/en/plugins-manifest/) — the other manifest fields
- [Build & Packaging](/en/plugins-build/) — the `server/` folder in the package
