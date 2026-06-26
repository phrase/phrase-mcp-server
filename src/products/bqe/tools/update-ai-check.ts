import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerUpdateAiCheckTool(server: McpServer, runtime: ProductRuntime<"bqe">) {
  server.registerTool(
    "bqe_update_ai_check",
    {
      description:
        "[LEGACY] Update an existing AI Check in Phrase Quality Evaluator. Replaces both name and qualityRequirements. Only available for early-access program users — in V3, rules are configured via Content Groups in the Phrase platform UI and cannot be managed through the API. (PUT /v1/aiChecks/{uid})",
      annotations: { title: "[BQE] Update AI Check (Legacy)", destructiveHint: true },
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
