import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateAnalysesByProvidersTool(
  server: McpServer,
  runtime: ProductRuntime<"tms">,
) {
  server.registerTool(
    "tms_create_analyses_by_providers",
    {
      description:
        "Create analyses for a set of TMS jobs, grouped by assigned provider. Accepts 1–100 job UIDs. Returns async analysis objects. (POST /api2/v1/analyses/byProviders)",
      annotations: { title: "[TMS] Create Analyses by Providers", destructiveHint: true },
      inputSchema: {
        jobs: z
          .array(z.object({ uid: z.string().min(1) }))
          .min(1)
          .max(100)
          .describe("Job UIDs to analyse (1–100, must belong to the same project)."),
        name: z.string().max(255).optional().describe("Name for the analysis."),
        type: z
          .enum(["PreAnalyse", "PostAnalyse", "Compare"])
          .optional()
          .describe("Analysis type. Default: PreAnalyse."),
        callbackUrl: z.string().optional().describe("Webhook URL called when analysis completes."),
        countSourceUnits: z.boolean().optional().describe("Default: true."),
        includeConfirmedSegments: z.boolean().optional().describe("Default: true."),
        includeFuzzyRepetitions: z.boolean().optional().describe("Default: true."),
        includeLockedSegments: z.boolean().optional().describe("Default: true."),
        includeNumbers: z.boolean().optional().describe("Default: true."),
        includeTransMemory: z.boolean().optional().describe("Default: true. PreAnalyse only."),
        includeMachineTranslationMatches: z
          .boolean()
          .optional()
          .describe("Default: false. PreAnalyse only."),
        includeNonTranslatables: z
          .boolean()
          .optional()
          .describe("Default: false. PreAnalyse only."),
        machineTranslatePostEditing: z
          .boolean()
          .optional()
          .describe("Default: false. PostAnalyse only."),
        nonTranslatablePostEditing: z
          .boolean()
          .optional()
          .describe("Default: false. PostAnalyse only."),
        compareWorkflowLevel: z
          .number()
          .int()
          .min(1)
          .max(15)
          .optional()
          .describe("Required when type=Compare."),
        netRateScheme: z
          .object({ uid: z.string().min(1) })
          .optional()
          .describe("Net rate scheme to apply."),
      },
    },
    async (params) => {
      const { jobs, ...rest } = params;
      const payload: Record<string, unknown> = { jobs };
      for (const [k, v] of Object.entries(rest)) {
        if (v !== undefined) payload[k] = v;
      }
      const result = await runtime.client.postJson("/v1/analyses/byProviders", payload);
      return asTextContent(result);
    },
  );
}
