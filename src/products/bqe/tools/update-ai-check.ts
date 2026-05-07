import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerUpdateAiCheckTool(server: McpServer, runtime: ProductRuntime<"bqe">) {
  server.registerTool(
    "bqe_update_ai_check",
    {
      description:
        "Update an existing AI Check in Phrase Quality Evaluator. Replaces both name and qualityRequirements. (PUT /v1/aiChecks/{uid})",
      annotations: { title: "[BQE] Update AI Check", destructiveHint: true },
      inputSchema: {
        uid: z.string().min(1).describe("AI Check UID."),
        name: z.string().min(1).describe("Display name for the AI Check."),
        qualityRequirements: z
          .string()
          .min(1)
          .max(2000)
          .describe(
            "Natural language description of the quality requirements to check. Maximum 2000 characters.",
          ),
      },
    },
    async ({ uid, name, qualityRequirements }) => {
      const result = await runtime.client.putJson(`/v1/aiChecks/${encodeURIComponent(uid)}`, {
        name,
        qualityRequirements,
      });
      return asTextContent(result);
    },
  );
}
