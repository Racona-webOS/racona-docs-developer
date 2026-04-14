---
title: Application System
description: Overview of the Racona application system – how applications work, differences from built-in apps
---

## What is an Application?

Racona recognizes two types of applications:

| Type | Location | Developed By | Access |
|---|---|---|---|
| **Built-in Application** | `apps/web/src/apps/[app-name]/` | Racona core team | Full internal API |
| **External Application** | Standalone project, `.elyospkg` package | External developers | Only via WebOS SDK |

External applications are loaded as Web Components into Racona. The system dynamically imports the IIFE bundle (IIFE = Immediately Invoked Function Expression — a self-executing, isolated JavaScript package that doesn't pollute the global namespace), initializes the WebOS SDK, then displays the component in a window.

## How is an Application Loaded?

1. User opens the application from the Start Menu or Taskbar
2. `AppLoader` checks application status and permissions
3. `WebOSSDK` is initialized with the application ID, user data, and permissions
4. IIFE bundle is dynamically imported (`dist/index.iife.js`) — a standalone, isolated JavaScript file that doesn't conflict with other applications
5. If there's a `menu.json`, the AppLayout wrapper appears with sidebar navigation
6. If there's no `menu.json`, the application is loaded as a Web Component directly

## Built-in Application vs External Application

If you want to integrate **your own application** into Racona and have access to the monorepo, a built-in application is the right choice — full SvelteKit access, Drizzle ORM, server actions.

If you're an **external developer** or want to distribute the application to other Racona instances, use the external application system.

## Next Steps

- [Creating Your First Application](/en/plugins-getting-started/) — CLI tool, project structure, first build
- [Development Workflow](/en/plugins-development/) — standalone dev mode, Mock SDK, hot reload
- [SDK API Reference](/en/plugins-sdk/) — all available services in detail
- [manifest.json Reference](/en/plugins-manifest/) — every field documented
- [Server Functions](/en/plugins-server-functions/) — backend logic for applications
- [Build and Packaging](/en/plugins-build/) — `.elyospkg` format, upload
- [Security and Permissions](/en/plugins-security/) — forbidden patterns, whitelist, permissions
