import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";
import { tryDecodeFilename } from "#products/tms/tools/content-disposition";

export function registerDownloadAnalysisTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_download_analysis",
    {
      description:
        "Download an analysis file from Phrase TMS in CSV, CSV_EXTENDED, LOG, or JSON format and save it to a local path. (GET /api2/v1/analyses/{analyseUid}/download)",
      annotations: { title: "[TMS] Download Analysis", readOnlyHint: true },
      inputSchema: {
        analyse_uid: z.string().min(1).describe("Analysis UID."),
        format: z.enum(["CSV", "CSV_EXTENDED", "LOG", "JSON"]).describe("Export format."),
        output_path: z.string().min(1).describe("Local path to save the downloaded file."),
      },
    },
    async ({ analyse_uid, format, output_path }) => {
      const file = await runtime.client.getBinary(
        `/v1/analyses/${encodeURIComponent(analyse_uid)}/download`,
        { format },
      );

      const absoluteOutputPath = resolve(output_path);
      await mkdir(dirname(absoluteOutputPath), { recursive: true });
      await writeFile(absoluteOutputPath, Buffer.from(file.bytesBase64, "base64"));
      const fileName =
        tryDecodeFilename(file.contentDisposition) ?? `analysis.${format.toLowerCase()}`;

      return asTextContent({
        file_name: fileName,
        saved_to: absoluteOutputPath,
        size_bytes: file.sizeBytes,
      });
    },
  );
}
