import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerCreateScreenshotMarkerTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_create_screenshot_marker",
    {
      description:
        "Create a screenshot marker linking a translation key to a highlighted region on a screenshot in a Phrase Strings project.",
      annotations: { title: "[Strings] Create Screenshot Marker", destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        screenshot_id: z.string().min(1),
        key_id: z
          .string()
          .min(1)
          .describe("ID of the translation key to highlight on the screenshot. Must belong to the project."),
        presentation: z
          .string()
          .optional()
          .describe(
            'Marker position and dimensions as a JSON string, e.g. {"x":100,"y":200,"w":300,"h":50}. Coordinates are in pixels from the top-left corner of the screenshot.',
          ),
        branch: z.string().optional(),
      },
    },
    async ({ project_id, screenshot_id, key_id, presentation, branch }) => {
      const marker = await runtime.client.screenshotMarkersApi.screenshotMarkerCreate({
        projectId: project_id,
        screenshotId: screenshot_id,
        screenshotMarkerCreateParameters: {
          keyId: key_id,
          presentation,
          branch,
        },
      });
      return asTextContent(marker);
    },
  );
}
