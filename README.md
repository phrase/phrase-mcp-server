# Phrase MCP Server

MCP server exposing tools for Phrase products over stdio.

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

## Strings Action Coverage (v1)

Based on the Phrase Strings OpenAPI surface (`phrase/strings-openapi`), this matrix lists all API resource groups and whether they are exposed by explicit MCP tools.

Coverage values:
- `Full`: all actions in that resource group are exposed.
- `Partial`: some actions are exposed.
- `None`: resource group is not exposed in v1.

| OpenAPI resource (API class) | Coverage | MCP tools |
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