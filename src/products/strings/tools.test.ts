import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { stringsModule } from "#products/strings/index";
import type { ProductRuntime } from "#products/types";

type RegisteredTool = {
  inputSchema: Record<string, z.ZodTypeAny>;
  handler: (input: Record<string, unknown>) => Promise<{ content: Array<{ text: string }> }>;
};

type ClientCall = {
  methodPath: string;
  args: unknown[];
};

const EXPECTED_METHOD_BY_TOOL: Record<string, string> = {
  strings_add_job_keys: "jobsApi.jobKeysCreate",
  strings_add_job_locale: "jobLocalesApi.jobLocalesCreate",
  strings_complete_job: "jobsApi.jobComplete",
  strings_complete_job_locale: "jobLocalesApi.jobLocaleComplete",
  strings_create_glossary: "glossariesApi.glossaryCreate",
  strings_create_glossary_term: "glossaryTermsApi.glossaryTermCreate",
  strings_create_glossary_term_translation:
    "glossaryTermTranslationsApi.glossaryTermTranslationCreate",
  strings_create_branch: "branchesApi.branchCreate",
  strings_create_key: "keysApi.keyCreate",
  strings_create_job: "jobsApi.jobCreate",
  strings_create_translation: "translationsApi.translationCreate",
  strings_create_job_comment: "jobCommentsApi.jobCommentCreate",
  strings_create_job_template: "jobTemplatesApi.jobTemplateCreate",
  strings_create_job_template_locale: "jobTemplateLocalesApi.jobTemplateLocalesCreate",
  strings_create_locale: "localesApi.localeCreate",
  strings_create_locale_download: "localeDownloadsApi.localeDownloadCreate",
  strings_create_project: "projectsApi.projectCreate",
  strings_create_upload: "uploadsApi.uploadCreate",
  strings_delete_branch: "branchesApi.branchDelete",
  strings_delete_glossary_term: "glossaryTermsApi.glossaryTermDelete",
  strings_delete_key: "keysApi.keyDelete",
  strings_delete_locale: "localesApi.localeDelete",
  strings_delete_project: "projectsApi.projectDelete",
  strings_get_branch: "branchesApi.branchShow",
  strings_get_glossary: "glossariesApi.glossaryShow",
  strings_get_locale: "localesApi.localeShow",
  strings_get_glossary_term: "glossaryTermsApi.glossaryTermShow",
  strings_get_job: "jobsApi.jobShow",
  strings_get_job_comment: "jobCommentsApi.jobCommentShow",
  strings_get_job_locale: "jobLocalesApi.jobLocaleShow",
  strings_get_job_template: "jobTemplatesApi.jobTemplatesShow",
  strings_get_job_template_locale: "jobTemplateLocalesApi.jobTemplateLocaleShow",
  strings_get_locale_download: "localeDownloadsApi.localeDownloadShow",
  strings_get_project: "projectsApi.projectShow",
  strings_get_key: "keysApi.keyShow",
  strings_get_translation: "translationsApi.translationShow",
  strings_get_upload: "uploadsApi.uploadShow",
  strings_list_account_jobs: "jobsApi.jobsByAccount",
  strings_list_formats: "formatsApi.formatsList",
  strings_list_glossaries: "glossariesApi.glossariesList",
  strings_list_glossary_terms: "glossaryTermsApi.glossaryTermsList",
  strings_list_job_comments: "jobCommentsApi.jobCommentsList",
  strings_list_job_locales: "jobLocalesApi.jobLocalesList",
  strings_list_job_template_locales: "jobTemplateLocalesApi.jobTemplateLocalesList",
  strings_list_job_templates: "jobTemplatesApi.jobTemplatesList",
  strings_list_jobs: "jobsApi.jobsList",
  strings_list_branches: "branchesApi.branchesList",
  strings_list_keys: "keysApi.keysList",
  strings_list_locales: "localesApi.localesList",
  strings_list_projects: "projectsApi.projectsList",
  strings_list_translations: "translationsApi.translationsByLocale",
  strings_list_uploads: "uploadsApi.uploadsList",
  strings_lock_job: "jobsApi.jobLock",
  strings_remove_job_keys: "jobsApi.jobKeysDelete",
  strings_remove_job_locale: "jobLocalesApi.jobLocaleDelete",
  strings_reopen_job: "jobsApi.jobReopen",
  strings_reopen_job_locale: "jobLocalesApi.jobLocaleReopen",
  strings_review_job_locale: "jobLocalesApi.jobLocaleCompleteReview",
  strings_start_job: "jobsApi.jobStart",
  strings_merge_branch: "branchesApi.branchMerge",
  strings_compare_branch: "branchesApi.branchComparisonCreate",
  strings_get_branch_comparison: "branchesApi.branchCompare",
  strings_sync_branch: "branchesApi.branchSync",
  strings_unlock_job: "jobsApi.jobUnlock",
  strings_update_branch: "branchesApi.branchUpdate",
  strings_update_glossary: "glossariesApi.glossaryUpdate",
  strings_update_glossary_term: "glossaryTermsApi.glossaryTermUpdate",
  strings_update_locale: "localesApi.localeUpdate",
  strings_update_project: "projectsApi.projectUpdate",
  strings_update_glossary_term_translation:
    "glossaryTermTranslationsApi.glossaryTermTranslationUpdate",
  strings_update_job: "jobsApi.jobUpdate",
  strings_update_job_locale: "jobLocalesApi.jobLocaleUpdate",
  strings_update_key: "keysApi.keyUpdate",
  strings_update_translation: "translationsApi.translationUpdate",
};

function createRecordingServer(registrations: Map<string, RegisteredTool>): McpServer {
  return {
    registerTool: (...args: unknown[]) => {
      const [name, options, handler] = args as [
        string,
        { inputSchema: Record<string, z.ZodTypeAny> },
        RegisteredTool["handler"],
      ];
      registrations.set(name, {
        inputSchema: options.inputSchema,
        handler,
      });
    },
    registerPrompt: () => undefined,
  } as unknown as McpServer;
}

function createClientProxy(
  calls: ClientCall[],
  responseBuilder?: (methodPath: string, args: unknown[]) => Promise<unknown>,
): ProductRuntime<"strings">["client"] {
  const createNode = (path: string[]): unknown =>
    new Proxy(() => undefined, {
      get(_target, prop: string | symbol) {
        if (typeof prop === "symbol") {
          return undefined;
        }
        if (prop === "then" && path.length === 0) {
          return undefined;
        }
        return createNode([...path, prop]);
      },
      apply(_target, _thisArg, args: unknown[]) {
        const methodPath = path.join(".");
        calls.push({ methodPath, args });
        if (responseBuilder) {
          return responseBuilder(methodPath, args);
        }
        return Promise.resolve({
          methodPath,
          payload: args[0] ?? null,
        });
      },
    });

  return createNode([]) as ProductRuntime<"strings">["client"];
}

function sampleValueForSchema(key: string, schema: z.ZodTypeAny, uploadFilePath: string): unknown {
  if (schema instanceof z.ZodOptional) {
    return sampleValueForSchema(key, schema.unwrap(), uploadFilePath);
  }
  if (schema instanceof z.ZodNullable) {
    return sampleValueForSchema(key, schema.unwrap(), uploadFilePath);
  }
  if (schema instanceof z.ZodString) {
    return key.endsWith("_path") ? uploadFilePath : `${key}-value`;
  }
  if (schema instanceof z.ZodNumber) {
    return 1;
  }
  if (schema instanceof z.ZodBoolean) {
    return true;
  }
  if (schema instanceof z.ZodArray) {
    return [sampleValueForSchema(`${key}_item`, schema.element, uploadFilePath)];
  }
  if (schema instanceof z.ZodRecord) {
    return { sample: "value" };
  }
  if (schema instanceof z.ZodEnum) {
    return schema.options[0];
  }
  if (schema instanceof z.ZodNativeEnum) {
    return Object.values(schema.enum)[0];
  }
  if (schema instanceof z.ZodLiteral) {
    return schema.value;
  }
  if (schema instanceof z.ZodUnion) {
    return sampleValueForSchema(key, schema.options[0], uploadFilePath);
  }
  return `${key}-value`;
}

function buildRequiredInput(
  inputSchema: Record<string, z.ZodTypeAny>,
  uploadFilePath: string,
): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(inputSchema)) {
    if (schema.isOptional()) {
      continue;
    }
    input[key] = sampleValueForSchema(key, schema, uploadFilePath);
  }
  return input;
}

describe("strings tools", () => {
  let uploadFilePath = "";
  let tempDir = "";
  let calls: ClientCall[] = [];
  let registrations = new Map<string, RegisteredTool>();

  const registerWithClient = (client: ProductRuntime<"strings">["client"]) => {
    registrations = new Map<string, RegisteredTool>();
    const runtime: ProductRuntime<"strings"> = {
      key: "strings",
      client,
    };
    stringsModule.register(createRecordingServer(registrations), runtime);
  };

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "strings-tools-test-"));
    uploadFilePath = join(tempDir, "upload.json");
    await writeFile(uploadFilePath, JSON.stringify({ hello: "world" }), "utf8");
  });

  afterAll(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    calls = [];
    registerWithClient(createClientProxy(calls));
  });

  it("registers every strings tool", () => {
    expect(registrations.size).toBe(Object.keys(EXPECTED_METHOD_BY_TOOL).length);
    expect(new Set(registrations.keys())).toEqual(new Set(Object.keys(EXPECTED_METHOD_BY_TOOL)));
  });

  for (const toolName of Object.keys(EXPECTED_METHOD_BY_TOOL).sort()) {
    it(`${toolName} calls expected client method`, async () => {
      const registration = registrations.get(toolName);
      expect(registration).toBeDefined();
      if (!registration) {
        return;
      }

      const input = buildRequiredInput(registration.inputSchema, uploadFilePath);
      const response = await registration.handler(input);

      expect(calls).toHaveLength(1);
      expect(calls[0]?.methodPath).toBe(EXPECTED_METHOD_BY_TOOL[toolName]);
      if (toolName === "strings_create_upload") {
        const payload = calls[0]?.args[0] as { file?: unknown };
        expect(payload.file).toBeInstanceOf(Blob);
      }

      const parsed = JSON.parse(response.content[0].text) as { methodPath: string };
      expect(parsed.methodPath).toBe(EXPECTED_METHOD_BY_TOOL[toolName]);
    });
  }

  for (const toolName of Object.keys(EXPECTED_METHOD_BY_TOOL).sort()) {
    it(`${toolName} formats API response errors`, async () => {
      calls = [];
      registerWithClient(
        createClientProxy(calls, async (methodPath) => {
          if (methodPath === EXPECTED_METHOD_BY_TOOL[toolName]) {
            return Promise.reject(
              new Response(JSON.stringify({ message: `${toolName} api failure` }), {
                status: 503,
                statusText: "Service Unavailable",
                headers: { "Content-Type": "application/json" },
              }),
            );
          }
          return { methodPath };
        }),
      );

      const registration = registrations.get(toolName);
      expect(registration).toBeDefined();
      if (!registration) {
        return;
      }

      const input = buildRequiredInput(registration.inputSchema, uploadFilePath);
      await expect(registration.handler(input)).rejects.toThrow(
        `Phrase Strings request failed (503 Service Unavailable): ${toolName} api failure`,
      );
    });
  }
});
