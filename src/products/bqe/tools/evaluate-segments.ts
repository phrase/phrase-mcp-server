import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

const segmentSchema = z.object({
  id: z.string().optional().describe("Optional identifier for the segment."),
  source: z.string().describe("Source text that was translated."),
  target: z.string().describe("Translated text to evaluate."),
});

export function registerEvaluateSegmentsTool(server: McpServer, runtime: ProductRuntime<"bqe">) {
  server.registerTool(
    "bqe_evaluate_segments",
    {
      description:
        "Evaluate the quality of translation segments using Phrase Quality Evaluator. Provide either qualityProfileUid OR aiCheckUids (not both). Requires ADMIN or OWNER IDM role. (POST /v2/evaluation)",
      annotations: { title: "[BQE] Evaluate Segments", destructiveHint: true },
      inputSchema: {
        qualityProfileUid: z
          .string()
          .optional()
          .describe(
            "UID of the Quality Profile to use for evaluation. Cannot be combined with aiCheckUids.",
          ),
        aiCheckUids: z
          .array(z.string().min(1))
          .max(3)
          .optional()
          .describe(
            "List of AI Check UIDs to evaluate against. Cannot be combined with qualityProfileUid. Maximum 3 items.",
          ),
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
    async ({ qualityProfileUid, aiCheckUids, segments, sourceLocaleCode, targetLocaleCode }) => {
      const body: Record<string, unknown> = {
        segments,
        sourceLocaleCode,
        targetLocaleCode,
      };
      if (qualityProfileUid !== undefined) {
        body.qualityProfileUid = qualityProfileUid;
      }
      if (aiCheckUids !== undefined) {
        body.aiCheckUids = aiCheckUids;
      }
      const result = await runtime.client.postJson("/v2/evaluation", body);
      return asTextContent(result);
    },
  );
}
