import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";
import { segmentSchema } from "#products/bqe/tools/segment-schema";

export function registerEvaluateSegmentsV3Tool(server: McpServer, runtime: ProductRuntime<"bqe">) {
  server.registerTool(
    "bqe_evaluate_segments_v3",
    {
      description:
        "Evaluate the quality of translation segments using Phrase Quality Evaluator V3. Uses a Content Group ID to determine which AI Check rules to apply. Requires ADMIN or OWNER IDM role. (POST /v3/evaluation)",
      annotations: { title: "[BQE] Evaluate Segments", destructiveHint: true },
      inputSchema: {
        contentGroupId: z
          .string()
          .min(1)
          .describe("ID of the Content Group whose AI Check rules are used for evaluation."),
        segments: z
          .array(segmentSchema)
          .min(1)
          .max(200)
          .describe("Segments to evaluate. Between 1 and 200 items."),
        sourceLocaleCode: z
          .string()
          .min(1)
          .describe("Locale code of the source language (e.g. en_us)."),
        targetLocaleCode: z
          .string()
          .min(1)
          .describe("Locale code of the target language (e.g. de_de)."),
      },
    },
    async ({ contentGroupId, segments, sourceLocaleCode, targetLocaleCode }) => {
      const result = await runtime.client.postJson("/v3/evaluation", {
        contentGroupId,
        segments,
        sourceLocaleCode,
        targetLocaleCode,
      });
      return asTextContent(result);
    },
  );
}
