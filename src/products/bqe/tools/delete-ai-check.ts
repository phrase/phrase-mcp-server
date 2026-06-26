import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerDeleteAiCheckTool(server: McpServer, runtime: ProductRuntime<"bqe">) {
  server.registerTool(
    "bqe_delete_ai_check",
    {
      description:
        "[LEGACY] Delete an AI Check from Phrase Quality Evaluator. Also removes it from any Quality Profiles that reference it. Only available for early-access program users — in V3, rules are configured via Content Groups in the Phrase platform UI and cannot be managed through the API. (DELETE /v1/aiChecks/{uid})",
      annotations: { title: "[BQE] Delete AI Check (Legacy)", destructiveHint: true },
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
