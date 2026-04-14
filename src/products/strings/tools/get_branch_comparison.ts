import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 120_000;

function isResponseLike(value: unknown): value is { status: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).status === "number"
  );
}

function isInProgress(error: unknown): boolean {
  if (isResponseLike(error)) {
    return error.status === 409;
  }
  if (typeof error === "object" && error !== null) {
    const nested = (error as Record<string, unknown>).response;
    return isResponseLike(nested) && nested.status === 409;
  }
  return false;
}

export function registerGetBranchComparisonTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_get_branch_comparison",
    {
      description:
        "Fetch the comparison result between a branch and the main branch of a Phrase Strings project. Polls until the comparison is ready (up to 2 minutes). Use after strings_compare_branch.",
      annotations: { title: "[Strings] Get Branch Comparison", readOnlyHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        name: z.string().min(1).describe("Name of the branch to get comparison for"),
      },
    },
    async ({ project_id, name }) => {
      const deadline = Date.now() + POLL_TIMEOUT_MS;

      while (true) {
        try {
          const result = await runtime.client.branchesApi.branchCompare({
            projectId: project_id,
            name,
          });
          return asTextContent(result);
        } catch (error) {
          if (isInProgress(error) && Date.now() + POLL_INTERVAL_MS < deadline) {
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
            continue;
          }
          throw error;
        }
      }
    },
  );
}
