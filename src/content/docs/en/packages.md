---
title: Packages
description: Overview of Racona ecosystem npm and JSR packages – SDK, CLI
---

Racona developer tools are available as standalone packages, so you don't need to clone the full monorepo to build applications.

## @racona/sdk

The WebOS SDK provides TypeScript type definitions and a developer Mock SDK. Required for application development — it provides types for the `window.webOS` global object and the mock implementation needed for standalone development mode.

Available on:
- **npm:** `@racona/sdk`
- **JSR:** `@racona/sdk`

```bash
bun add @racona/sdk
```

Full documentation: [SDK API Reference](/en/plugins-sdk/)

---

## @racona/cli

An interactive CLI tool for scaffolding new Racona application projects. It walks you through project configuration and generates the initial structure based on your chosen template.

```bash
bunx @racona/cli
```

Available templates: `blank`, `basic`, `advanced`, `datatable`, `sidebar`

Full documentation: [Getting Started](/en/plugins-getting-started/)
