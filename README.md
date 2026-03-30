# Phrase MCP Server

Use Phrase APIs from any MCP client (Claude, Cursor, etc.) with ready-to-use tools for Phrase Strings, Phrase TMS, and Connectors.

## Who This Is For

- Localization managers automating routine project and job operations
- Engineers building AI workflows around Phrase
- Teams that want one MCP server for both Strings and TMS
- Teams that want one MCP server for Strings, TMS, and Connectors workflows

### Available Tools

#### Strings (`strings_*`)

```text
strings_add_job_keys
strings_add_job_locale
strings_complete_job
strings_complete_job_locale
strings_create_glossary
strings_create_glossary_term
strings_create_glossary_term_translation
strings_create_job
strings_create_job_comment
strings_create_job_template
strings_create_job_template_locale
strings_create_key
strings_create_locale
strings_create_locale_download
strings_create_project
strings_create_translation
strings_create_upload
strings_get_glossary
strings_get_glossary_term
strings_get_job
strings_get_job_comment
strings_get_job_locale
strings_get_job_template
strings_get_job_template_locale
strings_get_locale_download
strings_get_project
strings_get_upload
strings_list_account_jobs
strings_list_formats
strings_list_glossaries
strings_list_glossary_terms
strings_list_job_comments
strings_list_job_locales
strings_list_job_template_locales
strings_list_job_templates
strings_list_jobs
strings_list_keys
strings_list_locales
strings_list_projects
strings_list_translations
strings_list_uploads
strings_lock_job
strings_remove_job_keys
strings_remove_job_locale
strings_reopen_job
strings_reopen_job_locale
strings_review_job_locale
strings_start_job
strings_unlock_job
strings_update_glossary
strings_update_glossary_term_translation
strings_update_job
strings_update_job_locale
```

#### TMS (`tms_*`)

```text
tms_create_job_from_file
tms_create_project
tms_create_project_from_template
tms_create_project_from_template_shorthand
tms_download_target_file_async
tms_download_target_file_by_async_request
tms_get_async_limits
tms_get_async_request
tms_get_job
tms_patch_job
tms_get_project
tms_get_project_template
tms_list_jobs
tms_list_pending_requests
tms_list_project_templates
tms_list_projects
tms_search_jobs
tms_set_job_status
tms_set_project_status
tms_update_job
tms_update_project
```

#### Connectors (`connectors_*`)

```text
connectors_download_raw
connectors_list_connectors
connectors_list_content
connectors_upload_raw
```

## Prerequisites

- Node.js 20+

## Quick Start

### Add to your MCP client

Use the published package with `npx` in your MCP client config.

#### Codex (`~/.codex/config.toml`)

```toml
[mcp_servers.phrase]
command = "npx"
args = ["-y", "phrase-mcp-server"]

[mcp_servers.phrase.env]
PHRASE_STRINGS_TOKEN = "your_token" # Required for Strings tools, optional for TMS-only usage
PHRASE_TMS_TOKEN = "your_token" # Required for TMS tools, optional for Strings-only usage
PHRASE_CONNECTORS_TOKEN = "your_token" # Required for Connectors tools
PHRASE_ENABLED_PRODUCTS = "strings,tms,connectors" # Optional, defaults to all products
PHRASE_REGION = "eu"
```

#### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "phrase": {
      "command": "npx",
      "args": ["-y", "phrase-mcp-server"],
      "env": {
        "PHRASE_STRINGS_TOKEN": "your_token",
        "PHRASE_TMS_TOKEN": "your_token",
        "PHRASE_CONNECTORS_TOKEN": "your_token",
        "PHRASE_ENABLED_PRODUCTS": "strings,tms,connectors",
        "PHRASE_REGION": "eu"
      }
    }
  }
}
```

Set at least one product token in your MCP client config:

- Minimum Strings setup:
  - `PHRASE_STRINGS_TOKEN=your_token`
  - `PHRASE_REGION=eu`
- Strings + TMS setup:
  - `PHRASE_STRINGS_TOKEN=your_token`
  - `PHRASE_TMS_TOKEN=your_token`
  - `PHRASE_REGION=eu`
- Connectors setup:
  - `PHRASE_CONNECTORS_TOKEN=your_token`
  - `PHRASE_REGION=eu`

## Configuration Reference

### Product selection

- `PHRASE_ENABLED_PRODUCTS`: comma-separated subset of `strings,tms,connectors`
- `PHRASE_DISABLED_PRODUCTS`: products removed from the enabled set
- Default behavior: all products enabled

### Region selection

- Global:
  - `PHRASE_REGION`: `eu` or `us` (default `eu`)

### Authentication

The server uses [Phrase Platform API tokens](https://developers.phrase.com/en/api/platform/authentication). You need to create API tokens in your Phrase account and provide them as environment variables to the MCP server.

- Per product (`STRINGS`, `TMS`, etc.):
  - `PHRASE_<PRODUCT>_TOKEN`

### Connectors notes

- Connectors v1 currently supports only `google-drive`.
- Connectors base URLs are built in and selected by `PHRASE_REGION`:
  - `eu` -> `https://eu.phrase.com/connectors`
  - `us` -> `https://us.phrase.com/connectors`
- Only stored Phrase connector credentials are supported in v1. Pass `request.connectorUuid`; inline `googleDrive2Credentials` are rejected.
- `request.configuration` is required and must be an object. Today it is forwarded as-is and is usually `{}`, but the wrapper still requires it because the upstream connector contract does.
- The `request.path` object is the main Google Drive contract. The wrapper only validates or normalizes a few cases and otherwise forwards the path unchanged.
- Google Drive list operations default to `{ "pathType": "ROOT" }` when `request.path` is omitted.
- Google Drive requests default `locale` to `en` when the caller does not provide one.
- Google Drive uploads use the connector's direct stream-upload flow from `file_path`; Connectors file storage is not used in v1.
- XLIFF and async endpoints are intentionally out of scope in v1.

Path model summary:

- `ROOT`: connector navigation root. Use it for the first list call; it exposes entries such as My Drive and Shared drives.
- `SHARED_DRIVES_ROOT`: shared-drive picker. Use it to enumerate available shared drives.
- `FOLDER`: concrete folder listing target. Use it for list calls inside My Drive or a shared drive.
- `FILE`: concrete file target. Use it for downloads and as the final target shape for uploads.

Drive model summary:

- My Drive paths use `"drive": { "driveType": "MY_DRIVE" }`.
- Shared drive paths use `"drive": { "driveType": "SHARED_DRIVE", "driveId": "..." }`.
- `parentChain` describes the ancestry of the file or folder within the drive. For list calls at the top of a drive it is usually `[]`. For file operations it points at the parent folders of the file.

MCP wrapper behavior:

- `connectors_list_content`:
  - defaults to `ROOT` when `request.path` is omitted
  - still requires `request.configuration`, which is usually `{}`
  - otherwise forwards the provided path unchanged
- `connectors_download_raw`:
  - requires an explicit `FILE` path
  - returns inline bytes plus optional `saved_to` instead of storing content in Connectors file storage
- `connectors_upload_raw`:
  - reads bytes from local `file_path`
  - rejects `request.storageId` because file storage uploads are out of scope in v1
  - fills `request.name` from the local filename when omitted
  - overwrites `request.size` with the actual file size
  - native Google Drive upload semantics expect a destination `FILE` path that includes the filename
  - accepts a `FOLDER` path as a convenience and rewrites it into a `FILE` path by appending the folder to `parentChain` and filling the filename from `request.name` or `file_path`
  - performs the upstream stream registration and `PUT` internally, even though MCP exposes it as one upload tool call

For a detailed Google Drive path and configuration guide, including Bruno-aligned examples and the exact MCP normalization rules, see [docs/developer/connectors-google-drive.md](docs/developer/connectors-google-drive.md).

Example root listing:

```json
{
  "connector": "google-drive",
  "request": {
    "connectorUuid": "8d6655d6-1be2-46af-89c0-7615866d2523",
    "configuration": {}
  }
}
```

Example upload from a local file:

```json
{
  "connector": "google-drive",
  "file_path": "./demo.txt",
  "request": {
    "connectorUuid": "8d6655d6-1be2-46af-89c0-7615866d2523",
    "configuration": {},
    "path": {
      "pathType": "FOLDER",
      "folderId": "root",
      "drive": { "driveType": "MY_DRIVE" },
      "parentChain": []
    }
  }
}
```

### Security recommendations

- Use a dedicated service user token for automation
- Prefer least-privilege project manager permissions over admin-level roles

## Developer Documentation

For maintainer-facing docs, see:

- [Developer docs index](docs/developer/README.md)
- [Running published vs local builds](docs/developer/running.md)
- [Releasing](docs/developer/releasing.md)
