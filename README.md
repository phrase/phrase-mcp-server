# Phrase MCP Server

Use Phrase APIs from any MCP client (Claude, Cursor, etc.) with ready-to-use tools for Phrase Strings and Phrase TMS.

## Who This Is For

- Localization managers automating routine project and job operations
- Engineers building AI workflows around Phrase
- Teams that want one MCP server for both Strings and TMS

### Available Tools

#### Strings (`strings_*`)

```text
strings_add_job_keys
strings_add_job_locale
strings_complete_job
strings_complete_job_locale
strings_compare_branch
strings_create_branch
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
strings_delete_branch
strings_delete_glossary_term
strings_delete_key
strings_delete_locale
strings_delete_project
strings_get_branch
strings_get_branch_comparison
strings_get_glossary
strings_get_glossary_term
strings_get_locale
strings_get_job
strings_get_job_comment
strings_get_job_locale
strings_get_job_template
strings_get_job_template_locale
strings_get_key
strings_get_locale_download
strings_get_project
strings_get_translation
strings_get_upload
strings_list_account_jobs
strings_list_branches
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
strings_merge_branch
strings_sync_branch
strings_remove_job_keys
strings_remove_job_locale
strings_reopen_job
strings_reopen_job_locale
strings_review_job_locale
strings_start_job
strings_unlock_job
strings_update_branch
strings_update_glossary
strings_update_glossary_term
strings_update_glossary_term_translation
strings_update_job
strings_update_job_locale
strings_update_key
strings_update_locale
strings_update_project
strings_update_translation
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
tms_get_project
tms_get_project_template
tms_get_termbase
tms_list_jobs
tms_list_pending_requests
tms_list_project_templates
tms_list_projects
tms_list_termbases
tms_search_job_termbases
tms_search_jobs
tms_search_termbase_terms
tms_set_job_status
tms_set_project_status
tms_update_job
tms_update_project
tms_upload_termbase
```

## Examples

The following examples build on each other as a complete end-to-end workflow: discover your projects, kick off a new translation with Phrase TMS, retrieve the result, and upload a localization file via Phrase Strings.

### 1. List all projects

**User prompt:** "List all my Phrase projects"

**Expected behavior:**
- Calls `tms_list_projects` and `strings_list_projects` in parallel
- Returns all projects from both Phrase TMS and Phrase Strings

**Expected output:**

```
Phrase TMS projects (3):
- My Marketing Campaign (ID: ...) — en → de, fr — Status: COMPLETED
- Product Documentation Q1 (ID: ...) — en → es — Status: NEW
- Mobile App Strings (ID: ...) — en → ja, zh — Status: IN_PROGRESS

Phrase Strings projects (2):
- Web App (ID: ...) — Account: Acme Corp
- Help Center (ID: ...) — Account: Acme Corp
```

### 2. Create a TMS project from a template and send a file for translation

**User prompt:** "Create a new TMS project from the tech documentation template and send the README for translation"

**Expected behavior:**
- Calls `tms_list_project_templates` to resolve the template by name
- Calls `tms_create_project_from_template_shorthand` to create the project
- Calls `tms_create_job_from_file` to upload the file and create a translation job

**Expected output:**

```
Created TMS project "README Translation" (ID: ...)
  Template: tech documentation
  Source: en → Target: es
  Status: NEW

Uploaded README.md as a translation job:
  Job UID: ...
  Target language: es
  Status: NEW
```

### 3. Check translation status and download the completed file

**User prompt:** "Check if the README translation job is done and download the translated file"

**Expected behavior:**
- Calls `tms_get_job` to check the current job status
- Calls `tms_download_target_file_async` to trigger async file generation
- Polls `tms_get_async_request` until the export is complete
- Calls `tms_download_target_file_by_async_request` to retrieve and save the file

**Expected output:**

```
Job "README.md"
  Project: README Translation
  Source: en → Target: es
  Status: DELIVERED
  Words: 535

Triggering async export... done
Downloading translated file... done

Saved to: README.es.md
```

### 4. Create a Strings project and upload a localization file

**User prompt:** "Create a new Strings project and upload docs/examples/en.json (Format: simple_json) for localization"

**Expected behavior:**
- Calls `strings_create_project` to create the project
- Calls `strings_create_locale` to add the source locale
- Calls `strings_create_upload` to upload the file and import translation keys
- Calls `strings_get_upload` to confirm the upload succeeded

**Expected output:**

```
Created Strings project "My App Config" (ID: ...)
  Account: Acme Corp

Added locale: English (en) — main locale

Uploading en.json (format: simple_json)... done
  Upload state: success
  Translation keys created: 14
  Translations created: 14
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
args = ["-y", "@phrase/phrase-mcp-server"]

[mcp_servers.phrase.env]
PHRASE_STRINGS_TOKEN = "your_token" # Required for Strings tools, optional for TMS-only usage
PHRASE_TMS_TOKEN = "your_token" # Required for TMS tools, optional for Strings-only usage
PHRASE_ENABLED_PRODUCTS = "strings,tms" # Optional, defaults to all products
PHRASE_REGION = "eu"
```

#### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "phrase": {
      "command": "npx",
      "args": ["-y", "@phrase/phrase-mcp-server"],
      "env": {
        "PHRASE_STRINGS_TOKEN": "your_token",
        "PHRASE_TMS_TOKEN": "your_token",
        "PHRASE_ENABLED_PRODUCTS": "strings,tms",
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

## Configuration Reference

### Product selection

- `PHRASE_ENABLED_PRODUCTS`: comma-separated subset of `strings,tms`
- `PHRASE_DISABLED_PRODUCTS`: products removed from the enabled set
- Default behavior: all products enabled

### Region selection

- Global:
  - `PHRASE_REGION`: `eu` or `us` (default `eu`)

### Authentication

The server uses [Phrase Platform API tokens](https://developers.phrase.com/en/api/platform/authentication). You need to create API tokens in your Phrase account and provide them as environment variables to the MCP server.

- Per product (`STRINGS`, `TMS`, etc.):
  - `PHRASE_<PRODUCT>_TOKEN`

### Security recommendations

- Use a dedicated service user token for automation
- Prefer least-privilege project manager permissions over admin-level roles

## Privacy Policy

This server connects to Phrase APIs on your behalf using the credentials you provide. No data is collected or stored by this server itself. See the [Phrase Privacy Policy](https://phrase.com/privacy) for details on how Phrase handles your data.

## Developer Documentation

For maintainer-facing docs, see:

- [Developer docs index](docs/developer/README.md)
- [Running published vs local builds](docs/developer/running.md)
- [Releasing](docs/developer/releasing.md)

## Support

For support, please [open an issue on GitHub](https://github.com/phrase/phrase-mcp-server/issues) or [submit a request](https://support.phrase.com/hc/requests/new) via Phrase Help Center.
