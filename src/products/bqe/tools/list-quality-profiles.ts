import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListQualityProfilesTool(server: McpServer, runtime: ProductRuntime<"bqe">) {
  server.registerTool(
    "bqe_list_quality_profiles",
    {
      description:
        "[LEGACY] List Quality Profiles for the authenticated organization in Phrase Quality Evaluator. A Quality Profile groups up to 3 AI Checks for reuse during evaluation. Only available for early-access program users — in V3, quality configuration is managed via Content Groups in the Phrase platform UI. Use bqe_get_quality_profile_v3 to read V3 profiles. (GET /v1/qualityProfiles)",
      annotations: { title: "[BQE] List Quality Profiles (Legacy)", readOnlyHint: true },
      inputSchema: {
        sort: z
          .enum(["name", "uid", "createdDate", "lastModifiedDate", "createdByUid"])
          .optional()
          .describe("Field to sort by. Defaults to name."),
        order: z.enum(["asc", "desc"]).optional().describe("Sort order. Defaults to asc."),
        createdByUid: z
          .string()
          .optional()
          .describe("Filter by the UID of the user who created the profile."),
        name: z.string().optional().describe("Filter by name (case-insensitive, partial match)."),
      },
    },
    async ({ sort, order, createdByUid, name }) => {
      const result = await runtime.client.get("/v1/qualityProfiles", {
        sort,
        order,
        createdByUid,
        name,
      });
      return asTextContent(result);
    },
  );
}
