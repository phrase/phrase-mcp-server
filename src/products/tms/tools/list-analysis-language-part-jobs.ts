import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListAnalysisLanguagePartJobsTool(
  server: McpServer,
  runtime: ProductRuntime<"tms">,
) {
  server.registerTool(
    "tms_list_analysis_language_part_jobs",
    {
      description:
        "List all jobs belonging to a specific language part of an analysis in Phrase TMS. Use this when the analysis language part has more than 100 jobs. (GET /api2/v1/analyses/{analyseUid}/analyseLanguageParts/{analyseLanguagePartId}/jobs)",
      annotations: { title: "[TMS] List Analysis Language Part Jobs", readOnlyHint: true },
      inputSchema: {
        analyse_uid: z.string().min(1).describe("Analysis UID."),
        analyse_language_part_id: z.number().int().describe("Analysis language part ID (integer)."),
      },
    },
    async ({ analyse_uid, analyse_language_part_id }) => {
      const result = await runtime.client.get(
        `/v1/analyses/${encodeURIComponent(analyse_uid)}/analyseLanguageParts/${analyse_language_part_id}/jobs`,
      );
      return asTextContent(result);
    },
  );
}
