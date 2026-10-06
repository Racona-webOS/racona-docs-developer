---
title: Plugin File Storage
description: Storing files from a plugin – context.files, signed upload and download links, sdk.files.upload, claiming, limits and cleanup
---

## Overview

A plugin can store files (contracts, certificates, scanned documents) in the core file storage. The files are written to disk, only their metadata goes to the database. The plugin keeps the file ID in its own table.

Required permission: `file_access` in `manifest.json`.

The plugin decides who may upload or download a file. The browser never gets a permanent file URL: a remote function checks the caller's rights and then asks the core for a short-lived link that only works for that user.

:::note
This feature needs a Racona core with plugin file storage. The server types are exported from `@racona/sdk/server`, `sdk.files` is part of the runtime SDK from `0.7.0`.
:::

## How it works

```
Browser                         Your remote function              Core
───────                         ────────────────────              ────
1. remote.call('prepareUpload') → check rights
                                  files.createUploadUrl() ──────→ signs a link
                                ← { uploadUrl }
2. sdk.files.upload(uploadUrl, file) ───────────────────────────→ stores the file
                                ← { fileId }                       (unclaimed)
3. remote.call('attachFile', { fileId })
                                → files.claim(fileId) ──────────→ claimed
                                  INSERT the fileId into your table

4. remote.call('getFileUrl')    → check rights
                                  files.createDownloadUrl() ────→ signs a link
                                ← { url }
5. window.open(url) ────────────────────────────────────────────→ streams the file
```

Uploads that are never claimed are deleted after 24 hours, so an abandoned upload does not leave files behind.

## Quick Start

### 1. Permission

```json title="manifest.json"
{
  "permissions": ["database", "remote_functions", "file_access"]
}
```

### 2. Server functions

```ts title="server/functions.ts"
import type { RemoteFunctionContext } from '@racona/sdk/server';

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];

export async function prepareUpload(params: { invoiceId: number }, context: RemoteFunctionContext) {
	await requireInvoiceAccess(context, params.invoiceId); // your own rights check
	const { uploadUrl } = await context.files!.createUploadUrl({
		allowedMimeTypes: ALLOWED,
		maxBytes: 10 * 1024 * 1024,
		ref: `invoice:${params.invoiceId}`
	});
	return { uploadUrl };
}

export async function attachFile(
	params: { invoiceId: number; fileId: string },
	context: RemoteFunctionContext
) {
	await requireInvoiceAccess(context, params.invoiceId);
	const file = await context.files!.claim(params.fileId, { ref: `invoice:${params.invoiceId}` });
	try {
		await context.db.query(
			`INSERT INTO app__my_app.invoice_files (invoice_id, file_id, name, mime_type, size)
			 VALUES ($1, $2, $3, $4, $5)`,
			[params.invoiceId, file.id, file.originalName, file.mimeType, file.size]
		);
	} catch (err) {
		await context.files!.delete(file.id); // do not leave an orphan file
		throw err;
	}
	return { id: file.id, name: file.originalName };
}

export async function getFileUrl(params: { fileId: string }, context: RemoteFunctionContext) {
	const { rows } = await context.db.query(
		'SELECT invoice_id FROM app__my_app.invoice_files WHERE file_id = $1',
		[params.fileId]
	);
	if (rows.length === 0) throw new Error('File not found');
	await requireInvoiceAccess(context, rows[0].invoice_id as number);
	return context.files!.createDownloadUrl(params.fileId, { disposition: 'inline' });
}
```

### 3. Client

```ts
const sdk = window.webOS!;

async function upload(invoiceId: number, file: File) {
	const { uploadUrl } = await sdk.remote.call<{ uploadUrl: string }>('prepareUpload', { invoiceId });
	const { fileId } = await sdk.files.upload(uploadUrl, file, {
		onProgress: ({ loaded, total }) => (progress = Math.round((loaded / total) * 100))
	});
	return sdk.remote.call('attachFile', { invoiceId, fileId });
}

async function open(fileId: string) {
	const { url } = await sdk.remote.call<{ url: string }>('getFileUrl', { fileId });
	window.open(url, '_blank', 'noopener');
}
```

## `context.files`

Available in remote functions and scheduled jobs when the plugin has the `file_access` permission. Every method only sees the plugin's own files: a file ID of another plugin behaves like a missing file.

| Method | Description |
|---|---|
| `createUploadUrl({ allowedMimeTypes, maxBytes?, ref?, ttlSeconds? })` | Signed upload link for the calling user. Valid for 5 minutes by default, at most 15. Not available in scheduled jobs. |
| `claim(fileId, { ref? })` | Attaches an uploaded file to your data. Only the uploader can claim it (in a scheduled job anyone). Claiming again is allowed. |
| `createDownloadUrl(fileId, { disposition?, ttlSeconds? })` | Signed download link for the calling user. Valid for 60 seconds by default, at most 10 minutes. `inline` opens PDFs and images in the browser, `attachment` (default) downloads. Not available in scheduled jobs. |
| `get(fileId)` | Metadata (`PluginFileInfo`) or `null`. |
| `read(fileId)` | The content as a buffer (the whole file in memory), e.g. to build a ZIP or attach to an email. |
| `save({ data, fileName, allowedMimeTypes?, maxBytes?, ref? })` | Stores a file created on the server (e.g. an export). It is claimed right away. |
| `delete(fileId)` | Deletes the file and its metadata. Deleting a missing file is not an error. |

`PluginFileInfo`: `id`, `originalName`, `mimeType`, `size`, `sha256`, `ref`, `createdBy`, `createdAt`, `claimedAt`.

`ref` is your own label (max. 255 characters), e.g. `employee-document:42`. It helps an administrator identify files after the plugin was uninstalled. Do not put personal data in it.

### Errors

The methods throw an error with a `code` you can translate:

| Code | When |
|---|---|
| `FILE_NOT_FOUND` | The file does not exist or belongs to another plugin |
| `PERMISSION_DENIED` | Claiming another user's upload; a link requested in a scheduled job |
| `INVALID_INPUT` | Unsupported MIME type in `allowedMimeTypes`, invalid `maxBytes`, `ref` or `ttlSeconds` |
| `INVALID_MIME` | The content is not one of the allowed types (`save`) |
| `FILE_TOO_LARGE` | Larger than `maxBytes` or the core limit (`save`) |

## `sdk.files.upload(uploadUrl, file, options?)`

Sends the file as the raw request body (no base64), so 10 MB files are fine. `options.onProgress` reports progress, `options.signal` aborts. It only accepts the plugin's own upload links.

The result is `{ fileId, originalName, mimeType, size }`. When the server rejects the file the error has `code` and `status`:

| `code` | Status | Meaning |
|---|---|---|
| `FILE_TOO_LARGE` | 413 | Larger than the link allows |
| `INVALID_MIME` | 415 | The content is not an allowed type |
| `INVALID_TOKEN` | 403 | The link expired or belongs to another user |
| `PERMISSION_DENIED` | 403 | The plugin has no `file_access` permission (or is inactive) |
| `NETWORK_ERROR`, `ABORTED` | 0 | Connection lost, or aborted with the signal |

In standalone development `MockFileService` simulates the upload with a random file ID; configure it with `MockSDKConfig.files.upload`.

## File types and limits

- **Supported types:** PDF, JPEG, PNG, WEBP, DOCX, XLSX, ODT, ODS. The type is detected from the file content; the file name and the browser's type do not count. A text file renamed to `.pdf` is rejected.
- **Size:** 10 MiB per file by default (`PLUGIN_FILE_MAX_BYTES` in the core). `maxBytes` can only lower it. The core's `BODY_SIZE_LIMIT` must be at least as large.
- **Storage:** `uploads/plugin-files/{pluginId}/{year}/{month}/{fileId}` on the server. The original name is only metadata; it is used for display and in the download header.
- **Download headers:** `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`, the original name in `Content-Disposition` (accents included).

## Lifecycle

- **Unclaimed uploads** are deleted after 24 hours by the core job `core.plugin-files-cleanup` (daily at 04:15).
- **Deleting your record** does not delete the file: call `context.files.delete(fileId)` yourself.
- **Uninstalling the plugin** keeps the files and their metadata (`platform.plugin_files`), even though the plugin schema is dropped. An administrator can identify them by `plugin_id` and `ref`.
- **Backups:** the files are on disk, not in the database. The `uploads` folder has to be part of the backup.

## Security checklist

- Check the caller's rights in **every** function that creates a link, claims or deletes a file. The core only checks that the link is signed, unexpired and used by the same user.
- Look up the file ID in your own table before creating a download link; do not trust a file ID sent by the client on its own.
- Restrict `allowedMimeTypes` to what the feature needs.
- Delete the file when the database insert after `claim` fails.
