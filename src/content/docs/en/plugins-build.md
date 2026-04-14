---
title: Build and Packaging
description: App build process, .elyospkg format and upload
---

## Build Process

There are two main build steps during app development: standalone dev mode and production build.

### Standalone Dev Mode

```bash
bun run dev
```

Starts a Vite dev server (`http://localhost:5174`) that mounts `App.svelte` directly via the `index.html` → `src/main.ts` entry point. Used together with the Mock SDK, it provides a full development experience in the browser with hot reload.

This mode does **not** run the IIFE bundle — the app runs here as a normal Svelte app, not as a Web Component.

### Production Build (for loading into Racona)

```bash
bun run build
```

Compiles the app to IIFE format in the `dist/` folder. Vite uses the `src/app.ts` entry point, which exports the app as a Web Component. This bundle is loaded by Racona.

Build output:

```
dist/
└── index.iife.js    # IIFE bundle — loaded by Racona
```

### Static Dev Server (for testing in Racona)

```bash
bun run dev:server
```

Starts the `dev-server.ts` Bun HTTP server at `http://localhost:5174`. The server serves files from the `dist/` folder and the project root with CORS headers — Racona fetches the `manifest.json` and IIFE bundle from here.

:::note
Always run `bun run build` before `dev:server` to ensure `dist/index.iife.js` is up to date.
:::

### Building an App with menu.json

If the app contains a `menu.json` (AppLayout mode), all page components must be built separately in addition to the main component. The `build-all.js` script automates this:

```bash
bun run build:all
```

This script:
1. Builds the main app (`BUILD_MODE=main`)
2. Iterates through the `src/components/` folder
3. Builds each `.svelte` file separately (`BUILD_MODE=components`)

```js
// build-all.js (excerpt)
execSync('BUILD_MODE=main vite build', { stdio: 'inherit' });

for (const file of svelteFiles) {
  execSync(`BUILD_MODE=components COMPONENT_FILE=${file} vite build`, {
    stdio: 'inherit'
  });
}
```

In `vite.config.js`, the `BUILD_MODE` env variable determines which entry point to build.

---

## Packaging (.elyospkg)

After building, the app must be packaged into a single `.elyospkg` file:

```bash
bun run package
```

This runs the `build-package.js` script in the project root, which:
1. Reads `manifest.json` for the `id` and `version` fields
2. Collects the `dist/`, `locales/`, `assets/` folders and `manifest.json`
3. Compresses them into a ZIP archive
4. Saves it with the `.elyospkg` extension in the project root

The package name is composed from the `id` and `version` fields in `manifest.json`:

```
{app-id}-{version}.elyospkg
```

For example: `hello-world-1.0.0.elyospkg`

:::note
Always run `bun run build` before `bun run package`. The script uses the `zip` system command (available by default on macOS and Linux).

The generated file extension comes from the `APP_PACKAGE_EXTENSION` environment variable (default: `elyospkg`). If your Racona server is configured with a different extension, set the variable before packaging:

```bash
APP_PACKAGE_EXTENSION=wospkg bun run package
```
:::

### Package Contents

```
hello-world-1.0.0.elyospkg  (ZIP archive)
├── manifest.json
├── dist/
│   └── index.iife.js
├── locales/
│   ├── hu.json
│   └── en.json
├── assets/
│   └── icon.svg
├── migrations/          # optional — only if migrations/ folder exists
│   └── 001_init.sql
└── server/              # optional — only if server/ folder exists
    └── functions.js
```

The `build-package.js` automatically only packages folders/files that actually exist — missing `migrations/` or `server/` folders don't cause errors.

---

## Upload

### Via App Manager UI (recommended)

1. Open Racona in the browser
2. Click Start menu → App Manager
3. Click the "Upload App" button
4. Select the `.elyospkg` file
5. Confirm the installation

:::note
The App Manager is only accessible with admin privileges.
:::

### Via API

The `/api/apps/upload` endpoint uses **session cookie-based authentication** (`better-auth`) — Bearer tokens are not supported. This means the API can only be called from a logged-in browser, or an HTTP client that includes the session cookie.

Upload with `curl` (using a session cookie copied from the browser):

```bash
curl -X POST https://your-elyos-instance.com/api/apps/upload \
  -H "Cookie: better-auth.session_token=<session_token>" \
  -F "file=@hello-world-1.0.0.elyospkg"
```

The session token can be copied from browser DevTools → Application → Cookies → `better-auth.session_token` (while logged in).

:::caution
The session token is short-lived and user-bound. There is currently no dedicated API token support for automated CI/CD pipelines — use the App Manager UI in such cases.
:::

### Updates

When updating an existing app, increment the version number in `manifest.json` and upload the new package. Racona automatically recognizes it as an update.

---

## Full Build Workflow

```bash
# 1. Standalone development (Vite dev server, Mock SDK, hot reload)
bun run dev

# 2. Testing in Racona
bun run build       # Create IIFE bundle
bun run dev:server  # Start static server (http://localhost:5174)
# Racona: App Manager → Dev Apps → Load → http://localhost:5174

# 3. Production packaging
bun run build
bun run package     # Create .elyospkg file

# 4. Upload (recommended via App Manager UI)
# Or with curl, using session cookie:
curl -X POST .../api/apps/upload \
  -H "Cookie: better-auth.session_token=<token>" \
  -F "file=@my-app-1.0.0.elyospkg"
```
