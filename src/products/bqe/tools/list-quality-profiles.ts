import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerListQualityProfilesTool(server: McpServer, runtime: ProductRuntime<"bqe">) {
  server.registerTool(
    "bqe_list_quality_profiles",
    {
      description:
        "List Quality Profiles for the authenticated organization in Phrase Quality Evaluator. A Quality Profile groups up to 3 AI Checks for reuse during evaluation. (GET /v1/qualityProfiles)",
      annotations: { title: "[BQE] List Quality Profiles", readOnlyHint: true },
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
