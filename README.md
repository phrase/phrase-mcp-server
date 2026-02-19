# Phrase MCP Server

MCP server exposing tools for Phrase products over stdio.


## Features

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


## Strings Action Coverage

| API resource | Coverage | MCP tools |
| --- | --- | --- |
| Accounts (`AccountsApi`) | None | - |
| Authorizations (`AuthorizationsApi`) | None | - |
| Automations (`AutomationsApi`) | None | - |
| Blacklisted keys (`BlacklistedKeysApi`) | None | - |
| Branches (`BranchesApi`) | None | - |
| Comment reactions (`CommentReactionsApi`) | None | - |
| Comment replies (`CommentRepliesApi`) | None | - |
| Comments (`CommentsApi`) | None | - |
| Custom metadata (`CustomMetadataApi`) | None | - |
| Distributions (`DistributionsApi`) | None | - |
| Documents (`DocumentsApi`) | None | - |
| Figma attachments (`FigmaAttachmentsApi`) | None | - |
| Formats (`FormatsApi`) | Full | `strings_list_formats` |
| Glossaries (`GlossariesApi`) | Partial | `strings_list_glossaries`, `strings_get_glossary`, `strings_create_glossary`, `strings_update_glossary` |
| Glossary term translations (`GlossaryTermTranslationsApi`) | Partial | `strings_create_glossary_term_translation`, `strings_update_glossary_term_translation` |
| Glossary terms (`GlossaryTermsApi`) | Partial | `strings_list_glossary_terms`, `strings_get_glossary_term`, `strings_create_glossary_term` |
| ICU (`ICUApi`) | None | - |
| Invitations (`InvitationsApi`) | None | - |
| Job annotations (`JobAnnotationsApi`) | None | - |
| Job comments (`JobCommentsApi`) | Partial | `strings_list_job_comments`, `strings_create_job_comment`, `strings_get_job_comment`, `strings_update_job_comment` |
| Job locales (`JobLocalesApi`) | Full | `strings_list_job_locales`, `strings_add_job_locale`, `strings_get_job_locale`, `strings_update_job_locale`, `strings_remove_job_locale`, `strings_complete_job_locale`, `strings_review_job_locale`, `strings_reopen_job_locale` |
| Job template locales (`JobTemplateLocalesApi`) | Partial | `strings_list_job_template_locales`, `strings_get_job_template_locale`, `strings_create_job_template_locale` |
| Job templates (`JobTemplatesApi`) | Partial | `strings_list_job_templates`, `strings_get_job_template`, `strings_create_job_template` |
| Jobs (`JobsApi`) | Partial | `strings_list_jobs`, `strings_list_account_jobs`, `strings_get_job`, `strings_create_job`, `strings_update_job`, `strings_start_job`, `strings_complete_job`, `strings_reopen_job`, `strings_lock_job`, `strings_unlock_job`, `strings_add_job_keys`, `strings_remove_job_keys` |
| Keys (`KeysApi`) | Partial | `strings_list_keys` |
| Keys figma attachments (`KeysFigmaAttachmentsApi`) | None | - |
| Linked keys (`LinkedKeysApi`) | None | - |
| Locale downloads (`LocaleDownloadsApi`) | None | - |
| Locales (`LocalesApi`) | Partial | `strings_list_locales` |
| Members (`MembersApi`) | None | - |
| Notification groups (`NotificationGroupsApi`) | None | - |
| Notifications (`NotificationsApi`) | None | - |
| Orders (`OrdersApi`) | None | - |
| Organization job template locales (`OrganizationJobTemplateLocalesApi`) | None | - |
| Organization job templates (`OrganizationJobTemplatesApi`) | None | - |
| Projects (`ProjectsApi`) | Partial | `strings_list_projects`, `strings_get_project`, `strings_create_project` |
| Quality performance score (`QualityPerformanceScoreApi`) | None | - |
| Release triggers (`ReleaseTriggersApi`) | None | - |
| Releases (`ReleasesApi`) | None | - |
| Repo sync events (`RepoSyncEventsApi`) | None | - |
| Repo syncs (`RepoSyncsApi`) | None | - |
| Reports (`ReportsApi`) | None | - |
| Screenshot markers (`ScreenshotMarkersApi`) | None | - |
| Screenshots (`ScreenshotsApi`) | None | - |
| Search (`SearchApi`) | None | - |
| Spaces (`SpacesApi`) | None | - |
| Style guides (`StyleGuidesApi`) | None | - |
| Tags (`TagsApi`) | None | - |
| Teams (`TeamsApi`) | None | - |
| Translations (`TranslationsApi`) | Partial | `strings_list_translations` |
| Uploads (`UploadsApi`) | None | - |
| Users (`UsersApi`) | None | - |
| Variables (`VariablesApi`) | None | - |
| Versions history (`VersionsHistoryApi`) | None | - |
| Webhook deliveries (`WebhookDeliveriesApi`) | None | - |
| Webhooks (`WebhooksApi`) | None | - |

Reference: https://github.com/phrase/strings-openapi

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
- Optional: `PHRASE_<PRODUCT>_REGION` (`eu` or `us`)
- Optional: `PHRASE_<PRODUCT>_AUTH_HEADER` (default `Authorization`)
- Optional: `PHRASE_<PRODUCT>_AUTH_PREFIX` (default `Bearer`, Strings default `token`)

Strings compatibility shortcuts are supported:

- `PHRASE_STRINGS_TOKEN` (required for Strings)
- `PHRASE_BASE_URL` (same as `PHRASE_STRINGS_BASE_URL`, default `https://api.phrase.com/v2`)

Region selection:

- `PHRASE_REGION` (`eu` or `us`, default `eu`) applies to all products unless overridden by `PHRASE_<PRODUCT>_REGION`.
- Region affects product default base URLs:
  - Strings: `https://api.phrase.com/v2` (EU), `https://api.us.app.phrase.com/v2` (US)
  - TMS: `https://cloud.memsource.com/web/api2` (EU), `https://us.cloud.memsource.com/web/api2` (US)
- Explicit `PHRASE_<PRODUCT>_BASE_URL` always takes precedence over region defaults.

TMS unified auth shortcuts are also supported:

- `PHRASE_API_TOKEN` (used as alias for `PHRASE_TMS_TOKEN`)
- Token exchange endpoint is `https://{region}.phrase.com/idm/oauth/token`

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

## Test

Run tests once:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
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
