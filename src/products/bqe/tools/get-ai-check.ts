import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetAiCheckTool(server: McpServer, runtime: ProductRuntime<"bqe">) {
  server.registerTool(
    "bqe_get_ai_check",
    {
      description:
        "Fetch a single AI Check by its UID from Phrase Quality Evaluator. Returns name and qualityRequirements. (GET /v1/aiChecks/{uid})",
      annotations: { title: "[BQE] Get AI Check", readOnlyHint: true },
      inputSchema: {
        uid: z.string().min(1).describe("AI Check UID. Obtain from bqe_list_ai_checks."),
      },
    },
    async ({ uid }) => {
      const result = await runtime.client.get(`/v1/aiChecks/${encodeURIComponent(uid)}`);
      return asTextContent(result);
    },
  );
}
