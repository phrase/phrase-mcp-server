import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateRepoSyncTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_create_repo_sync",
    {
      description: "Create a new Repo Sync for a Phrase Strings account.",
      annotations: { title: "[Strings] Create Repo Sync", destructiveHint: true },
      inputSchema: {
        account_id: z.string().min(1).describe("Account ID"),
        project_id: z.string().min(1).describe("ID of the Phrase Strings project to connect"),
        git_provider: z.enum(["github", "gitlab", "bitbucket"]).optional().describe("Git provider"),
        connection_type: z
          .enum(["token", "github_app", "self_hosted"])
          .describe(
            "Authentication method: 'token' (personal access token), 'github_app' (Phrase GitHub App), or 'self_hosted' (token-based for self-hosted instances)",
          ),
        repo_name: z
          .string()
          .min(1)
          .describe("Full repository name including owner, e.g. 'my-org/my-repo'"),
        base_branch: z.string().optional().describe("Default branch for imports and exports"),
        pr_branch: z
          .string()
          .optional()
          .describe(
            "Branch that translations are exported to before opening a pull request. If omitted, exports go directly to base_branch.",
          ),
        auto_import: z
          .boolean()
          .optional()
          .describe("Enable automatic import triggered by pushes to the repository"),
        access_token: z
          .string()
          .optional()
          .describe(
            "Personal access token for the Git provider. Required when connection_type is 'token' or 'self_hosted'.",
          ),
        custom_api_endpoint: z
          .string()
          .optional()
          .describe(
            "Custom API endpoint URL for self-hosted Git instances. Required when connection_type is 'self_hosted'.",
          ),
      },
    },
    async ({
      account_id,
      project_id,
      git_provider,
      connection_type,
      repo_name,
      base_branch,
      pr_branch,
      auto_import,
      access_token,
      custom_api_endpoint,
    }) => {
      const result = await runtime.client.repoSyncsApi.repoSyncCreate({
        accountId: account_id,
        repoSyncCreateParameters: {
          projectId: project_id,
          gitProvider: git_provider as "github" | "gitlab" | "bitbucket" | undefined,
          connectionType: connection_type as "token" | "github_app" | "self_hosted",
          repoName: repo_name,
          baseBranch: base_branch,
          prBranch: pr_branch,
          autoImport: auto_import,
          accessToken: access_token,
          customApiEndpoint: custom_api_endpoint,
        },
      });
      return asTextContent(result);
    },
  );
}
