import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateAiCheckTool(server: McpServer, runtime: ProductRuntime<"bqe">) {
  server.registerTool(
    "bqe_create_ai_check",
    {
      description:
        "[LEGACY] Create a new AI Check in Phrase Quality Evaluator. Requires ADMIN or OWNER IDM role. Only available for early-access program users — in V3, rules are configured via Content Groups in the Phrase platform UI and cannot be managed through the API. (POST /v1/aiChecks)",
      annotations: { title: "[BQE] Create AI Check (Legacy)", destructiveHint: true },
      inputSchema: {
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
    async ({ name, qualityRequirements }) => {
      const result = await runtime.client.postJson("/v1/aiChecks", {
        name,
        qualityRequirements,
      });
      return asTextContent(result);
    },
  );
}
