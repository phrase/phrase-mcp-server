import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerImportRepoSyncTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_import_repo_sync",
    {
      description:
        "Import translations from a repository provider to Phrase Strings according to the .phrase.yml file. Import is asynchronous and may take several seconds.",
      annotations: { title: "[Strings] Import Repo Sync", destructiveHint: true },
      inputSchema: {
        account_id: z.string().min(1).describe("Account ID"),
        id: z.string().min(1).describe("Repo Sync ID"),
        repository_branch: z.string().optional().describe("Repository branch to import from"),
        branch: z.string().optional().describe("Strings branch to import to"),
      },
    },
    async ({ account_id, id, repository_branch, branch }) => {
      const result = await runtime.client.repoSyncsApi.repoSyncImport({
        accountId: account_id,
        id,
        repoSyncImportParameters: { repositoryBranch: repository_branch, branch },
      });
      return asTextContent(result);
    },
  );
}
