import { readFile, readdir, stat } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ProductRuntime } from "#products/types";
import { loadPhraseConfig, patternToRegex } from "#products/strings/tools/phrase_config";

interface PushResult {
  file: string;
  locale: string;
  status: "success" | "error";
  keysCreated?: number;
  keysUpdated?: number;
  error?: string;
}

async function findFiles(dir: string, fileList: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await findFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function expandGlob(pattern: string, baseDir: string): Promise<string[]> {
  const resolvedPattern = resolve(baseDir, pattern.replace(/^\.\//, ""));
  const { regex } = patternToRegex(resolvedPattern);

  // Walk the deepest non-wildcard directory
  const firstWildcard = resolvedPattern.search(/[*<]/);
  const searchDir =
    firstWildcard === -1
      ? dirname(resolvedPattern)
      : dirname(resolvedPattern.slice(0, firstWildcard + 1));

  try {
    await stat(searchDir);
  } catch {
    return [];
  }

  const allFiles = await findFiles(searchDir);
  return allFiles.filter((f) => regex.test(f));
}

function createUploadFile(data: Buffer, filePath: string): Blob {
  const filename = basename(filePath) || "upload";
  const bytes = new Uint8Array(data);
  if (typeof File !== "undefined") {
    return new File([bytes], filename);
  }
  return Object.assign(new Blob([bytes]), { name: filename }) as Blob;
}

async function pollUpload(
  runtime: ProductRuntime<"strings">,
  projectId: string,
  uploadId: string,
  branch?: string,
  maxAttempts = 30,
  delayMs = 1000,
): Promise<{ keysCreated: number; keysUpdated: number }> {
  for (let i = 0; i < maxAttempts; i++) {
    const upload = await runtime.client.uploadsApi.uploadShow({
      projectId,
      id: uploadId,
      branch,
    });

    if (upload.state === "success" || upload.state === "imported") {
      return {
        keysCreated: (upload.summary?.keysCreated as number | undefined) ?? 0,
        keysUpdated: (upload.summary?.translationsUpdated as number | undefined) ?? 0,
      };
    }

    if (upload.state === "error") {
      throw new Error(`Upload failed: ${JSON.stringify(upload)}`);
    }

    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("Upload timed out after polling");
}

export function registerPushTool(server: McpServer, runtime: ProductRuntime<"strings">) {
  server.registerTool(
    "strings_push",
    {
      description:
        "Upload locale files to Phrase Strings based on the push sources in .phrase.yml / phrase.yml. Expands file patterns, derives locale from filename, and uploads each file.",
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
      const sources = phrase.push?.sources ?? [];

      if (!projectId) throw new Error("phrase.project_id is not set in config");
      if (sources.length === 0) throw new Error("No push.sources defined in config");

      // Fetch all locales once for locale name → ID resolution
      const locales = await runtime.client.localesApi.localesList({ projectId });
      const localeByName = new Map(locales.map((l) => [l.name, l]));
      const localeByCode = new Map(locales.map((l) => [l.code, l]));

      const results: PushResult[] = [];

      for (const source of sources) {
        const fileFormat = source.params?.file_format ?? topLevelFormat;
        const branch = source.params?.branch;
        const updateTranslations = source.params?.update_translations;
        const skipUnverification = source.params?.skip_unverification;
        const updateTranslationKeys = source.params?.update_translation_keys;
        const tags = source.params?.tags;

        if (!fileFormat) {
          results.push({
            file: source.file,
            locale: "unknown",
            status: "error",
            error: "No file_format specified in source or top-level config",
          });
          continue;
        }

        const resolvedPattern = resolve(configDir, source.file.replace(/^\.\//, ""));
        const { regex, groups } = patternToRegex(resolvedPattern);
        const matchedFiles = await expandGlob(source.file, configDir);

        if (matchedFiles.length === 0) {
          results.push({
            file: source.file,
            locale: "unknown",
            status: "error",
            error: `No files matched pattern: ${source.file}`,
          });
          continue;
        }

        for (const filePath of matchedFiles) {
          const match = regex.exec(filePath);
          let locale = locales[0]; // fallback

          if (match) {
            const localNameIdx = groups.indexOf("locale_name");
            const localeCodeIdx = groups.indexOf("locale_code");

            if (localNameIdx !== -1) {
              const name = match[localNameIdx + 1];
              locale = localeByName.get(name) ?? locale;
            } else if (localeCodeIdx !== -1) {
              const code = match[localeCodeIdx + 1];
              locale = localeByCode.get(code) ?? locale;
            }
          }

          // If source has a literal (non-placeholder) locale_id, use it
          if (source.params?.locale_id && !source.params.locale_id.includes("<")) {
            const found =
              localeByName.get(source.params.locale_id) ??
              locales.find((l) => l.id === source.params?.locale_id);
            if (found) locale = found;
          }

          try {
            const data = await readFile(filePath);
            const file = createUploadFile(data, filePath);

            const upload = await runtime.client.uploadsApi.uploadCreate({
              projectId,
              file,
              fileFormat,
              localeId: locale.id ?? "",
              branch,
              tags,
              updateTranslations,
              skipUnverification,
              updateTranslationKeys,
            });

            const { keysCreated, keysUpdated } = await pollUpload(
              runtime,
              projectId,
              upload.id ?? "",
              branch,
            );

            results.push({
              file: filePath,
              locale: locale.name ?? locale.id ?? "",
              status: "success",
              keysCreated,
              keysUpdated,
            });
          } catch (err) {
            results.push({
              file: filePath,
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
