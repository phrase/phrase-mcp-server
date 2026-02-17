import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HttpError } from "#lib/http.js";
import { asTextContent } from "#lib/mcp.js";
import type { ProductRuntime } from "#products/types.js";
import { paginationControlsSchema, querySchema } from "#products/tms/tools/query.js";

function shouldFallbackToV1(error: unknown): boolean {
  return error instanceof HttpError && (error.status === 400 || error.status === 404);
}

function isRetryableQueryError(error: unknown): boolean {
  return error instanceof HttpError && error.status === 400;
}

export function registerListJobsTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_list_jobs",
    {
      description:
        "List jobs for a Phrase TMS project. Tries GET /api2/v2/projects/{projectUid}/jobs and falls back to /api2/v1/projects/{projectUid}/jobs for compatibility. Read-only operation with optional auto-pagination.",
      inputSchema: {
        project_uid: z.string().min(1).describe("TMS project UID (not numeric internal ID)."),
        query: querySchema,
        ...paginationControlsSchema,
      },
    },
    async ({ project_uid, query, paginate, page_size, max_pages, max_items }) => {
      const v2Path = `/v2/projects/${encodeURIComponent(project_uid)}/jobs`;
      const v1Path = `/v1/projects/${encodeURIComponent(project_uid)}/jobs`;
      const client = runtime.client;
      const errors: string[] = [];

      if (!paginate) {
        for (const path of [v2Path, v1Path]) {
          try {
            const jobs = await client.get(path, query);
            return asTextContent(jobs);
          } catch (error) {
            errors.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
            if (!shouldFallbackToV1(error)) {
              throw error;
            }
            if (isRetryableQueryError(error) && query && Object.keys(query).length > 0) {
              try {
                const jobs = await client.get(path);
                return asTextContent(jobs);
              } catch (secondary) {
                errors.push(
                  `${path} (without query): ${secondary instanceof Error ? secondary.message : String(secondary)}`,
                );
              }
            }
          }
        }
        throw new Error(`tms_list_jobs failed for all attempts. ${errors.join(" | ")}`);
      }

      const paginateAttempts: Array<{
        path: string;
        pageParam: "pageNumber" | "page";
        sizeParam: "pageSize" | "perPage";
      }> = [
        { path: v2Path, pageParam: "pageNumber", sizeParam: "pageSize" },
        { path: v2Path, pageParam: "page", sizeParam: "perPage" },
        { path: v1Path, pageParam: "pageNumber", sizeParam: "pageSize" },
        { path: v1Path, pageParam: "page", sizeParam: "perPage" },
      ];

      for (const attempt of paginateAttempts) {
        try {
          const jobs = await client.paginateGet(attempt.path, {
            query,
            pageParam: attempt.pageParam,
            sizeParam: attempt.sizeParam,
            pageSize: page_size,
            maxPages: max_pages,
            maxItems: max_items,
          });
          return asTextContent(jobs);
        } catch (error) {
          errors.push(
            `${attempt.path} (${attempt.pageParam}/${attempt.sizeParam}): ${error instanceof Error ? error.message : String(error)}`,
          );
          if (!(error instanceof HttpError) || (error.status !== 400 && error.status !== 404)) {
            throw error;
          }
        }
      }

      throw new Error(`tms_list_jobs failed for all attempts. ${errors.join(" | ")}`);
    },
  );
}
