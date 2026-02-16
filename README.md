# Phrase MCP Server

MCP server exposing tools for Phrase products over stdio.

## Features

- Product-based tool registration with env toggles
- Product-level client override support (each product module can define its own API client)
- Tools split into separate files for easier extension
- Strings tools (using `phrase-js` client by default):
  - `strings_list_projects`
  - `strings_list_locales`
  - `strings_list_keys`
  - `strings_list_translations`
- TMS tools (using unified access token exchange):
  - `tms_list_projects`
  - `tms_get_project`
  - `tms_create_project`
  - `tms_update_project`
  - `tms_set_project_status`
  - `tms_list_project_templates`
  - `tms_get_project_template`
  - `tms_create_project_from_template`
  - `tms_create_project_from_template_shorthand`
  - `tms_list_jobs`
  - `tms_get_job`
  - `tms_search_jobs`
  - `tms_create_job_from_file`
  - `tms_download_target_file_async`
  - `tms_download_target_file_by_async_request`
  - `tms_list_pending_requests`
  - `tms_get_async_request`
  - `tms_get_async_limits`

## Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- A Phrase token with access to your projects

## Setup

```bash
npm install
cp .env.example .env
```

Set env vars in `.env`.

### Product Enable/Disable

- `PHRASE_ENABLED_PRODUCTS`: comma-separated list of `strings,tms,orchestrator,analytics`
- `PHRASE_DISABLED_PRODUCTS`: comma-separated products to remove from enabled set
- Default behavior: all products are enabled

Examples:

```bash
PHRASE_ENABLED_PRODUCTS=strings,tms
```

```bash
PHRASE_DISABLED_PRODUCTS=analytics,orchestrator
```

### Product Configuration

For each product, set:

- `PHRASE_<PRODUCT>_BASE_URL`
- `PHRASE_<PRODUCT>_TOKEN`
- Optional: `PHRASE_<PRODUCT>_AUTH_HEADER` (default `Authorization`)
- Optional: `PHRASE_<PRODUCT>_AUTH_PREFIX` (default `Bearer`, Strings default `token`)

Strings compatibility shortcuts are supported:

- `PHRASE_STRINGS_TOKEN` (required for Strings)
- `PHRASE_BASE_URL` (same as `PHRASE_STRINGS_BASE_URL`, default `https://api.phrase.com/v2`)

TMS unified auth shortcuts are supported:

- `PHRASE_API_TOKEN` (used as alias for `PHRASE_TMS_TOKEN`)
- `PHRASE_REGION` (`eu` or `us`, default `eu`) for token exchange at `https://{region}.phrase.com/idm/oauth/token`

### TMS Notes

- List endpoints support optional auto-pagination with:
  - `paginate` (boolean)
  - `page_size` (default `50`)
  - `max_pages` (default `25`)
  - `max_items` (default `3000`)
- `tms_create_project_from_template_shorthand` resolves template by UID, numeric ID, exact name, or partial name.
- `tms_create_job_from_file` uploads a local file from `file_path`; provide `target_langs` (recommended) or `memsource.targetLangs` for TMS job creation.
- Target file download is a 2-step flow: first `tms_download_target_file_async`, then `tms_download_target_file_by_async_request`.
- `tms_download_target_file_by_async_request` supports optional `output_path` to decode and write the file to disk.

### TMS Security Recommendation

- Use a dedicated service user token for TMS automation.
- Use a `Project manager` role with least-privilege PM rights instead of `Administrator`.
- Explicitly disable destructive permissions (for example delete/archive project capabilities) unless strictly required.
- Do not use personal user tokens for automation.

## Run

For local development:

```bash
npm run dev
```

For production:

```bash
npm run build
npm start
```

## MCP Client Configuration Example

Example for a local MCP client config:

```json
{
  "mcpServers": {
    "phrase": {
      "command": "node",
      "args": ["/absolute/path/to/phrase-mcp-server/dist/index.js"],
      "env": {
        "PHRASE_STRINGS_TOKEN": "your_phrase_strings_token",
        "PHRASE_ENABLED_PRODUCTS": "strings"
      }
    }
  }
}
```

If your client supports dotenv automatically, you can also launch through:

```bash
npm run dev
```
