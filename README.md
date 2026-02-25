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
strings_create_glossary
strings_create_glossary_term
strings_create_glossary_term_translation
strings_create_job
strings_create_job_comment
strings_create_job_template
strings_create_job_template_locale
strings_create_locale_download
strings_create_project
strings_get_glossary
strings_get_glossary_term
strings_get_job
strings_get_job_comment
strings_get_job_locale
strings_get_job_template
strings_get_job_template_locale
strings_get_locale_download
strings_get_project
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
tms_get_project
tms_get_project_template
tms_list_jobs
tms_list_pending_requests
tms_list_project_templates
tms_list_projects
tms_search_jobs
tms_set_project_status
tms_update_project
```

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
ENABLED_PRODUCTS = "strings,tms" # Optional, defaults to all products
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
        "PHRASE_STRINGS_TOKEN": "your_token", # Required for Strings tools, optional for TMS-only usage
        "PHRASE_TMS_TOKEN": "your_token", # Required for TMS tools, optional for Strings-only usage
        "ENABLED_PRODUCTS": "strings,tms", # Optional, defaults to all products
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
- `PHRASE_DISABLED_PRODUCTS`: products removed from enabled set
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
