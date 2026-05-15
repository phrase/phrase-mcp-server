import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerGetAnalysisLanguagePartTool(
  server: McpServer,
  runtime: ProductRuntime<"tms">,
) {
  server.registerTool(
    "tms_get_analysis_language_part",
    {
      description:
        "Fetch a specific language part of an analysis in Phrase TMS. Returns word counts, match rates, and up to 100 associated jobs (use tms_list_analysis_jobs for more). (GET /api2/v1/analyses/{analyseUid}/analyseLanguageParts/{analyseLanguagePartId})",
      annotations: { title: "[TMS] Get Analysis Language Part", readOnlyHint: true },
      inputSchema: {
        analyse_uid: z.string().min(1).describe("Analysis UID."),
        analyse_language_part_id: z.number().int().describe("Analysis language part ID (integer)."),
      },
    },
    async ({ analyse_uid, analyse_language_part_id }) => {
      const result = await runtime.client.get(
        `/v1/analyses/${encodeURIComponent(analyse_uid)}/analyseLanguageParts/${analyse_language_part_id}`,
      );
      return asTextContent(result);
    },
  );
}
