import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

function createScreenshotFile(data: Buffer, filename: string): Blob {
  const bytes = new Uint8Array(data);
  if (typeof File !== "undefined") {
    return new File([bytes], filename);
  }
  return Object.assign(new Blob([bytes]), { name: filename }) as Blob;
}

export function registerCreateScreenshotTool(
  server: McpServer,
  runtime: ProductRuntime<"strings">,
) {
  server.registerTool(
    "strings_create_screenshot",
    {
      description:
        "Create a new screenshot in a Phrase Strings project. Provide either file_path (host filesystem path, for local MCP server use) or file_content + file_name (base64-encoded image bytes, for Claude Desktop uploaded files). The image file is optional — you can create a screenshot with just a name and description.",
      annotations: { title: "[Strings] Create Screenshot", destructiveHint: true },
      inputSchema: {
        project_id: z.string().min(1),
        name: z.string().optional(),
        description: z.string().optional(),
        branch: z.string().optional(),
        file_path: z
          .string()
          .min(1)
          .optional()
          .describe(
            "Absolute or relative filesystem path to the screenshot image on the MCP server host. Mutually exclusive with file_content.",
          ),
        file_content: z
          .string()
          .min(1)
          .optional()
          .describe(
            "Base64-encoded image content. Use when the user uploaded a file in the conversation. Requires file_name. Mutually exclusive with file_path.",
          ),
        file_name: z
          .string()
          .min(1)
          .optional()
          .describe(
            "Filename for the screenshot image. Required when using file_content. Optional override when using file_path.",
          ),
      },
    },
    async ({ project_id, name, description, branch, file_path, file_content, file_name }) => {
      if (file_path && file_content) {
        throw new Error("file_path and file_content are mutually exclusive. Provide only one.");
      }

      let filename: Blob | undefined;

      if (file_content) {
        if (!file_name) {
          throw new Error("file_name is required when using file_content.");
        }
        const data = Buffer.from(file_content, "base64");
        filename = createScreenshotFile(data, file_name);
      } else if (file_path) {
        const data = await readFile(file_path);
        const resolvedName = file_name ?? (basename(file_path) || "screenshot");
        filename = createScreenshotFile(data, resolvedName);
      }

      const screenshot = await runtime.client.screenshotsApi.screenshotCreate({
        projectId: project_id,
        name,
        description,
        branch,
        filename,
      });
      return asTextContent(screenshot);
    },
  );
}
