import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerExportRepoSyncTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_export_repo_sync",
    {
      description:
        "Export translations from Phrase Strings to a repository provider according to the .phrase.yml file. Export is asynchronous and may take several seconds.",
      annotations: { title: "[Strings] Export Repo Sync", destructiveHint: true },
      inputSchema: {
        account_id: z.string().min(1).describe("Account ID"),
        id: z.string().min(1).describe("Repo Sync ID"),
        pr_branch: z.string().optional().describe("Source branch to open a pull request from"),
        branch: z.string().optional().describe("Strings branch to export from"),
      },
    },
    async ({ account_id, id, pr_branch, branch }) => {
      const result = await runtime.client.repoSyncsApi.repoSyncExport({
        accountId: account_id,
        id,
        repoSyncExportParameters: { prBranch: pr_branch, branch },
      });
      return asTextContent(result);
    },
  );
}
