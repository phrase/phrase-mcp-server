import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerDeleteAiCheckTool(server: McpServer, runtime: ProductRuntime<"bqe">) {
  server.registerTool(
    "bqe_delete_ai_check",
    {
      description:
        "Delete an AI Check from Phrase Quality Evaluator. Also removes it from any Quality Profiles that reference it. (DELETE /v1/aiChecks/{uid})",
      annotations: { title: "[BQE] Delete AI Check", destructiveHint: true },
      inputSchema: {
        uid: z.string().min(1).describe("AI Check UID."),
      },
    },
    async ({ uid }) => {
      const result = await runtime.client.del(`/v1/aiChecks/${encodeURIComponent(uid)}`);
      return asTextContent(result);
    },
  );
}
