import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListAiChecksTool(server: McpServer, runtime: ProductRuntime<"bqe">) {
  server.registerTool(
    "bqe_list_ai_checks",
    {
      description:
        "[LEGACY] List all AI Checks for the authenticated organization in Phrase Quality Evaluator. AI Checks are reusable quality requirements written in natural language. Only available for early-access program users — in V3, rules are configured via Content Groups in the Phrase platform UI and cannot be managed through the API. (GET /v1/aiChecks)",
      annotations: { title: "[BQE] List AI Checks (Legacy)", readOnlyHint: true },
      inputSchema: {
        sort: z.enum(["uid", "name"]).optional().describe("Field to sort by. Defaults to name."),
        order: z.enum(["asc", "desc"]).optional().describe("Sort order. Defaults to asc."),
      },
    },
    async ({ sort, order }) => {
      const result = await runtime.client.get("/v1/aiChecks", { sort, order });
      return asTextContent(result);
    },
  );
}
