# Google Drive Connector Behavior

This document explains how `phrase-mcp-server` wraps the Phrase Connectors Google Drive connector in v1, with the Bruno collection in `/Users/tomasdoischer/Documents/Code/connector2/connectors/googledrive2/bruno` as the reference model.

The important distinction is:

- Bruno shows the native connector contract.
- `phrase-mcp-server` exposes a narrower MCP wrapper around that contract.
- Most request fields are passed through unchanged, but a few are validated, defaulted, or rewritten for convenience.

## Scope

Connectors v1 supports only `google-drive`.

Supported MCP tools:

- `connectors_list_connectors`
- `connectors_list_content`
- `connectors_download_raw`
- `connectors_upload_raw`

Not supported in v1:

- inline Google Drive credentials
- Connectors file-storage uploads
- non-Google-Drive connectors
- XLIFF and async Connectors endpoints

## Native connector vs MCP wrapper

The Bruno collection sends requests directly to the Google Drive connector. Those requests typically look like this:

```json
{
  "credentials": {
    "accessToken": "...",
    "refreshToken": "..."
  },
  "configuration": {},
  "path": {
    "pathType": "ROOT"
  },
  "locale": "en"
}
```

The MCP wrapper does not allow inline credentials. Instead, it requires a stored Phrase connector reference:

```json
{
  "connector": "google-drive",
  "request": {
    "connectorUuid": "8d6655d6-1be2-46af-89c0-7615866d2523",
    "configuration": {},
    "path": {
      "pathType": "ROOT"
    }
  }
}
```

The wrapper then forwards the request to:

- `POST /google-drive/v1/sync/list-files`
- `POST /google-drive/v1/sync/download-raw-file`
- `POST /google-drive/v1/sync/upload-raw-file`

## Required request fields

For every Google Drive operation, the wrapper requires:

- `request.connectorUuid`: the stored Phrase connector instance to use
- `request.configuration`: must be an object

`request.configuration` is currently opaque in the wrapper. The code does not inspect its contents, but it still requires the field because the upstream connector contract expects it. In current Bruno examples it is always `{}`.

The wrapper also defaults:

- `request.locale` to `en` when omitted

## Path model

The path object is the central part of the contract. The wrapper mostly preserves it as-is, so callers need to understand the native Google Drive connector model.

### `ROOT`

Use `ROOT` to enter the connector navigation tree.

Bruno reference:

- `01-list/01-list-connector-navigation-root.bru`

Example:

```json
{
  "path": {
    "pathType": "ROOT"
  }
}
```

Semantics:

- list-only
- returns high-level entries such as My Drive and Shared drives
- if `connectors_list_content` omits `request.path`, the wrapper injects this shape automatically

### `SHARED_DRIVES_ROOT`

Use `SHARED_DRIVES_ROOT` to enumerate shared drives.

Bruno reference:

- `01-list/03-list-shared-drives-root.bru`

Example:

```json
{
  "path": {
    "pathType": "SHARED_DRIVES_ROOT"
  }
}
```

Semantics:

- list-only
- returns available shared drives
- the returned shared drive id is then used as both `drive.driveId` and `folderId` in later shared-drive folder paths

### `FOLDER`

Use `FOLDER` to list the contents of a concrete folder.

Bruno references:

- `01-list/02-list-my-drive-root.bru`
- `01-list/04-list-shared-drive-root-folder.bru`

My Drive root example:

```json
{
  "path": {
    "pathType": "FOLDER",
    "drive": {
      "driveType": "MY_DRIVE"
    },
    "parentChain": [],
    "folderId": "root",
    "name": "My Drive"
  }
}
```

Shared drive root example:

```json
{
  "path": {
    "pathType": "FOLDER",
    "drive": {
      "driveType": "SHARED_DRIVE",
      "driveId": "shared-drive-1"
    },
    "parentChain": [],
    "folderId": "shared-drive-1",
    "name": "Shared Drive Name"
  }
}
```

Semantics:

- valid for list requests
- represents a browsable container
- `folderId` identifies the folder to enumerate
- `parentChain` describes the ancestors above that folder
- for top-level listing inside a drive, `parentChain` is usually empty

### `FILE`

Use `FILE` for concrete file operations.

Bruno references:

- `02-download/01-download-my-drive-file.bru`
- `02-download/02-download-shared-drive-file.bru`
- `03-upload/01-upload-my-drive-file.bru`
- `03-upload/02-upload-shared-drive-file.bru`

Download example:

```json
{
  "path": {
    "pathType": "FILE",
    "drive": {
      "driveType": "MY_DRIVE"
    },
    "parentChain": [
      {
        "id": "root",
        "name": "My Drive"
      }
    ],
    "fileId": "file-1",
    "name": "source.txt"
  }
}
```

Upload target example:

```json
{
  "path": {
    "pathType": "FILE",
    "drive": {
      "driveType": "MY_DRIVE"
    },
    "parentChain": [
      {
        "id": "root",
        "name": "My Drive"
      }
    ],
    "name": "source.txt"
  }
}
```

Semantics:

- required for download
- the native connector also uses `FILE` as the upload target shape
- `fileId` is required for downloads
- `fileId` is omitted when creating or overwriting by upload target path
- `parentChain` identifies the parent folder ancestry of the file

### Invalid combinations

The Bruno collection explicitly verifies that list requests with `pathType: "FILE"` are rejected:

- `01-list/90-list-file-rejected.bru`

That is useful when deciding which path shape to send:

- list -> `ROOT`, `SHARED_DRIVES_ROOT`, or `FOLDER`
- download -> `FILE`
- upload -> effectively `FILE`

## Drive object

The `drive` object determines where the resource lives.

### My Drive

```json
{
  "drive": {
    "driveType": "MY_DRIVE"
  }
}
```

### Shared drive

```json
{
  "drive": {
    "driveType": "SHARED_DRIVE",
    "driveId": "shared-drive-1"
  }
}
```

In shared-drive flows, Bruno first discovers the shared drive id from `SHARED_DRIVES_ROOT`, then reuses it as:

- `drive.driveId`
- `folderId` for the shared drive root folder
- the root entry in `parentChain` for shared-drive file operations

## `parentChain`

`parentChain` is not a local filesystem path string. It is structured ancestry metadata.

Each entry is an object like:

```json
{
  "id": "root",
  "name": "My Drive"
}
```

What it means:

- ordered ancestry of parent folders
- used by the connector to reason about location and updates
- for root folder listing, often `[]`
- for file download or upload, usually contains at least the direct parent container

The wrapper does not try to derive arbitrary parent chains. It only performs one convenience conversion for uploads, described below.

## Upload behavior in the MCP wrapper

Bruno’s native connector flow registers an upload using a `FILE` path and then either uses file storage or a stream completion flow.

The MCP wrapper intentionally does something narrower:

1. Read bytes from local `file_path`.
2. Validate `request.connectorUuid`, `request.configuration`, and `request.path`.
3. Reject `request.storageId`.
4. Default `request.locale` to `en` if needed.
5. Infer the upload filename from `file_path` when `request.name` is missing.
6. Replace `request.size` with the actual local file size.
7. Register a stream upload with `X-Upload-Mode: STREAM`.
8. Upload bytes directly to the returned `uploadUrl` using the returned `streamToken`.

### Upload path normalization

The wrapper accepts either:

- a native `FILE` upload target
- a convenience `FOLDER` target

If the caller supplies a `FOLDER` path, the wrapper rewrites it into a `FILE` path before calling the connector.

Example input:

```json
{
  "path": {
    "pathType": "FOLDER",
    "folderId": "root",
    "drive": {
      "driveType": "MY_DRIVE"
    },
    "parentChain": []
  }
}
```

With `file_path: "./demo.txt"`, the wrapper sends:

```json
{
  "name": "demo.txt",
  "size": 8,
  "path": {
    "pathType": "FILE",
    "drive": {
      "driveType": "MY_DRIVE"
    },
    "parentChain": [
      {
        "id": "root",
        "name": "My Drive"
      }
    ],
    "name": "demo.txt"
  }
}
```

Important details:

- `folderId` becomes the last entry in `parentChain` if it was not already present
- when uploading to My Drive root with `folderId: "root"`, the wrapper labels that parent as `My Drive`
- if the caller already supplied a native `FILE` path, the wrapper does not rewrite it

## Download behavior in the MCP wrapper

Bruno’s native connector can return file storage references. The MCP wrapper instead requests an object response and returns the bytes inline.

Wrapper flow:

1. Require `request.path`.
2. Forward the request to `/google-drive/v1/sync/download-raw-file` with `X-ResponseType: OBJECT`.
3. Return:
   - `content_type`
   - `content_disposition`
   - `file_name`
   - `size_bytes`
   - `bytes_base64`
   - `saved_to` when `output_path` was provided

That is why Bruno’s download examples and the MCP tool return different shapes even though they address the same connector capability.

## List behavior in the MCP wrapper

`connectors_list_content` is the thinnest wrapper:

- validates the connector name
- requires `request.connectorUuid`
- requires `request.configuration`, even when it is just `{}`
- defaults `request.path` to `{ "pathType": "ROOT" }` if omitted
- defaults `request.locale` to `en` if omitted
- forwards everything else unchanged

This means callers can still send Bruno-aligned list paths such as:

- `ROOT`
- `SHARED_DRIVES_ROOT`
- `FOLDER` for My Drive root
- `FOLDER` for shared drive root

## Configuration behavior

Today the wrapper treats `request.configuration` as:

- required
- object-shaped
- opaque
- pass-through

That means:

- use `{}` unless you have a documented upstream need for more fields
- do not omit it, even if it feels empty
- do not expect the wrapper to translate or validate configuration subfields

## Credential behavior

The Bruno collection uses inline credentials because it talks directly to the connector runtime.

The MCP wrapper explicitly rejects that shape:

- `googleDrive2Credentials`
- inline access tokens
- inline refresh tokens

Instead, callers must use a stored Phrase connector via `request.connectorUuid`.

## Practical recipes

### List connector navigation root

```json
{
  "connector": "google-drive",
  "request": {
    "connectorUuid": "connector-uuid",
    "configuration": {}
  }
}
```

The wrapper injects `path: { "pathType": "ROOT" }`.

### List My Drive root

```json
{
  "connector": "google-drive",
  "request": {
    "connectorUuid": "connector-uuid",
    "configuration": {},
    "path": {
      "pathType": "FOLDER",
      "drive": {
        "driveType": "MY_DRIVE"
      },
      "parentChain": [],
      "folderId": "root",
      "name": "My Drive"
    }
  }
}
```

### List shared drives

```json
{
  "connector": "google-drive",
  "request": {
    "connectorUuid": "connector-uuid",
    "configuration": {},
    "path": {
      "pathType": "SHARED_DRIVES_ROOT"
    }
  }
}
```

### Download a file

```json
{
  "connector": "google-drive",
  "request": {
    "connectorUuid": "connector-uuid",
    "configuration": {},
    "path": {
      "pathType": "FILE",
      "drive": {
        "driveType": "MY_DRIVE"
      },
      "parentChain": [
        {
          "id": "root",
          "name": "My Drive"
        }
      ],
      "fileId": "file-1",
      "name": "source.txt"
    }
  },
  "output_path": "./downloads/source.txt"
}
```

### Upload a local file into My Drive root

This is the convenience form:

```json
{
  "connector": "google-drive",
  "file_path": "./source.txt",
  "request": {
    "connectorUuid": "connector-uuid",
    "configuration": {},
    "path": {
      "pathType": "FOLDER",
      "folderId": "root",
      "drive": {
        "driveType": "MY_DRIVE"
      },
      "parentChain": []
    }
  }
}
```

The wrapper rewrites it to a native `FILE` upload target and streams bytes directly.

The native Google Drive connector expects uploads to target a `FILE` path, not a folder endpoint. The MCP wrapper accepts a `FOLDER` path only as a convenience shim and rewrites it into a `FILE` target using `request.name` or the basename of `file_path`.

The MCP tool still returns `upload_mode: "STREAM"` because that is the upstream transport used under the hood. The actual MCP contract remains a single tool call: register upload, stream bytes, and return one result.

## Code references

Relevant implementation files:

- `src/products/connectors/tools/common.ts`
- `src/products/connectors/tools/list-content.ts`
- `src/products/connectors/tools/download-raw.ts`
- `src/products/connectors/tools/upload-raw.ts`
- `src/products/connectors/tools.test.ts`
