import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ProductRuntime } from "#products/types";
import {
  hasPlaceholder,
  loadPhraseConfig,
  substitutePlaceholders,
} from "#products/strings/tools/phrase_config";

interface PullResult {
  file: string;
  locale: string;
  status: "success" | "error";
  error?: string;
}

async function pollLocaleDownload(
  runtime: ProductRuntime<"strings">,
  projectId: string,
  localeId: string,
  downloadId: string,
  maxAttempts = 30,
  delayMs = 1000,
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const download = await runtime.client.localeDownloadsApi.localeDownloadShow({
      projectId,
      localeId,
      id: downloadId,
    });

    if (download.status === "success" || download.status === "completed") {
      const url = (download.result as { url?: string } | undefined)?.url;
      if (!url) throw new Error("Download completed but no URL returned");
      return url;
    }

    if (download.status === "error") {
      throw new Error(`Download failed: ${JSON.stringify(download)}`);
    }

    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("Download timed out after polling");
}

export function registerPullTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_pull",
    {
      description:
        "Download locale files from Phrase Strings based on the pull targets in .phrase.yml / phrase.yml. Iterates all configured targets, substitutes placeholders, and writes files to disk.",
      inputSchema: {
        config_path: z
          .string()
          .optional()
          .describe(
            "Path to the Phrase config file. Defaults to .phrase.yml / phrase.yml in the current directory.",
          ),
      },
    },
    async ({ config_path }) => {
      const { config, configDir } = await loadPhraseConfig(config_path);
      const { phrase } = config;
      const projectId = phrase.project_id;
      const topLevelFormat = phrase.file_format;
      const targets = phrase.pull?.targets ?? [];

      if (!projectId) throw new Error("phrase.project_id is not set in config");
      if (targets.length === 0) throw new Error("No pull.targets defined in config");

      // Cache branch project IDs: downloading from a branch requires the branch's own project ID.
      // The Phrase API does not support "base project ID + branch param" for locale downloads.
      const branchProjectIdCache = new Map<string, string>();
      const getEffectiveProjectId = async (branch?: string): Promise<string> => {
        if (!branch) return projectId;
        if (!branchProjectIdCache.has(branch)) {
          const branchInfo = await runtime.client.branchesApi.branchShow({ projectId, name: branch });
          branchProjectIdCache.set(branch, (branchInfo as { branchProjectId?: string }).branchProjectId ?? projectId);
        }
        return branchProjectIdCache.get(branch)!;
      };

      // Cache locale lists per branch
      const localesCache = new Map<string, Awaited<ReturnType<typeof runtime.client.localesApi.localesList>>>();
      const getLocales = async (effectiveProjectId: string) => {
        if (!localesCache.has(effectiveProjectId)) {
          localesCache.set(effectiveProjectId, await runtime.client.localesApi.localesList({ projectId: effectiveProjectId }));
        }
        return localesCache.get(effectiveProjectId)!;
      };

      const results: PullResult[] = [];

      for (const target of targets) {
        const fileFormat = target.params?.file_format ?? topLevelFormat;
        const branch = target.params?.branch;
        const tags = target.params?.tags;
        const localeIdParam = target.params?.locale_id;

        if (!fileFormat) {
          results.push({
            file: target.file,
            locale: localeIdParam ?? "unknown",
            status: "error",
            error: "No file_format specified in target or top-level config",
          });
          continue;
        }

        // Resolve the effective project ID (branch project when branch is specified)
        const effectiveProjectId = await getEffectiveProjectId(branch);
        const locales = await getLocales(effectiveProjectId);
        const localesToDownload =
          localeIdParam && !hasPlaceholder(localeIdParam)
            ? locales.filter((l) => l.id === localeIdParam || l.name === localeIdParam)
            : locales;

        for (const locale of localesToDownload) {
          const resolvedFile = resolve(
            configDir,
            substitutePlaceholders(target.file, { name: locale.name ?? "", code: locale.code ?? "" }),
          );

          try {
            const download = await runtime.client.localeDownloadsApi.localeDownloadCreate({
              projectId: effectiveProjectId,
              localeId: locale.id ?? "",
              localeDownloadCreateParameters: {
                fileFormat,
                tags,
              },
            });

            const url = await pollLocaleDownload(
              runtime,
              effectiveProjectId,
              locale.id ?? "",
              download.id ?? "",
            );

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status} downloading file`);
            const content = Buffer.from(await response.arrayBuffer());

            await mkdir(dirname(resolve(resolvedFile)), { recursive: true });
            await writeFile(resolvedFile, content);

            results.push({ file: resolvedFile, locale: locale.name ?? locale.id ?? "", status: "success" });
          } catch (err) {
            results.push({
              file: resolvedFile,
              locale: locale.name ?? locale.id ?? "",
              status: "error",
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
      }

      const succeeded = results.filter((r) => r.status === "success").length;
      const failed = results.filter((r) => r.status === "error").length;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { summary: { total: results.length, succeeded, failed }, results },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
