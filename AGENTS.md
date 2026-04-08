# Agent Guidelines

Guidance for AI agents (Claude, Copilot, etc.) contributing to this repository.

## Commit Messages and PR Titles

All commit messages and PR titles must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). This is enforced by CI on pull requests.

**Format:** `<type>: <description>`

Common types:
- `feat` — new feature or capability
- `fix` — bug fix
- `docs` — documentation changes only
- `chore` — maintenance, dependencies, config
- `refactor` — code change that neither fixes a bug nor adds a feature
- `test` — adding or updating tests

**Examples:**
```
feat: add readOnlyHint/destructiveHint annotations to all tools
fix: change download-target-file-async annotation to readOnlyHint
docs: add working examples section to README
chore: update Dependabot configuration
```

The PR title must also follow this format — the Semantic PR check will fail otherwise.

## Tool Annotations

Every tool registered with `server.registerTool` must declare an `annotations` field in its config object. This is required for MCP directory submission.

### Rule

- `readOnlyHint: true` — the tool does not modify operational user data. Use for:
  - `get_*` / `get-*` — fetch a single resource
  - `list_*` / `list-*` — list resources
  - `search_*` / `search-*` — search/query
  - Async polling helpers (`get_async_request`, `get_async_limits`, `list_pending_requests`)
  - Async download triggers and file retrieval (`download_target_file_async`, `download_target_file_by_async_request`, `create_locale_download`) — these initiate or retrieve exports but do not modify user data
  - Branch comparison (`compare_branch`, `get_branch_comparison`) — read-only diff computation

- `destructiveHint: true` — the tool creates, modifies, or deletes operational user data. Use for:
  - `create_*` / `create-*` — create resources (projects, jobs, keys, locales, etc.)
  - `update_*` / `update-*` — modify existing resources
  - `delete_*` — delete resources
  - `add_*` / `remove_*` — add or remove items from collections
  - `set_*` / `set-*` — set status or state on a resource
  - `merge_*` / `sync_*` — merge or sync branches (modifies translation data)
  - Workflow state transitions (`complete_*`, `start_*`, `reopen_*`, `lock_*`, `unlock_*`, `review_*`)

### Format

Place `annotations` directly after `description` in the config object:

```typescript
server.registerTool(
  "strings_get_job",
  {
    description: "Get a single job in a Phrase Strings project.",
    annotations: { readOnlyHint: true },
    inputSchema: { ... },
  },
  async (params) => { ... },
);
```

### Key distinction

The deciding factor is whether the tool changes **operational user data** (translations, keys, projects, jobs, locales, glossaries, branches). Creating a transient server-side async job as part of a download flow does **not** count as modifying user data.
