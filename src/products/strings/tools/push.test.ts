import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Polly } from "@pollyjs/core";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { registerPushTool } from "#products/strings/tools/push";
import { createPolly, makeStringsRuntime } from "#products/strings/tools/polly-setup";
import type { ProductRuntime } from "#products/types";

// ---------------------------------------------------------------------------
// Project constants — mcp-pull-push-test project
// ---------------------------------------------------------------------------

const PROJECT_ID = "628d14d653d4a5844e8e92251b9b2e2a";

const EN_FILE_CONTENT = JSON.stringify({
  "welcome.title": "Welcome",
  "welcome.subtitle": "Your journey starts here",
  "nav.home": "Home",
});

const DE_FILE_CONTENT = JSON.stringify({
  "welcome.title": "Willkommen",
  "welcome.subtitle": "Deine Reise beginnt hier",
  "nav.home": "Startseite",
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ToolHandler = (input: Record<string, unknown>) => Promise<{ content: Array<{ text: string }> }>;

function captureHandler(register: (server: McpServer) => void): ToolHandler {
  let handler: ToolHandler | undefined;
  const server = {
    registerTool: (_name: string, _schema: unknown, h: ToolHandler) => { handler = h; },
    registerPrompt: () => undefined,
  } as unknown as McpServer;
  register(server);
  if (!handler) throw new Error("Tool handler was not registered");
  return handler;
}

function handler(runtime: ProductRuntime<"strings">): ToolHandler {
  return captureHandler((s) => registerPushTool(s, runtime));
}

async function setupLocaleFiles(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "en.json"), EN_FILE_CONTENT, "utf-8");
  await writeFile(join(dir, "de.json"), DE_FILE_CONTENT, "utf-8");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("strings_push", () => {
  let polly: Polly;
  let tempDir = "";

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "phrase-push-test-"));
  });

  afterAll(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  beforeEach((ctx) => {
    polly = createPolly(`strings_push/${ctx.task.name}`);
  });

  afterEach(async () => {
    await polly.stop();
  });

  async function writeConfig(name: string, content: string): Promise<string> {
    const configPath = join(tempDir, `${name}.yml`);
    await writeFile(configPath, content, "utf-8");
    return configPath;
  }

  // -------------------------------------------------------------------------

  it("uploads all files matching the glob pattern", async () => {
    const localesDir = join(tempDir, "push-all");
    await setupLocaleFiles(localesDir);

    const configPath = await writeConfig(
      "push-all",
      `phrase:
  project_id: ${PROJECT_ID}
  file_format: simple_json
  push:
    sources:
      - file: ${localesDir}/<locale_name>.json
        params:
          locale_id: <locale_name>
          update_translations: true
`,
    );

    const result = await handler(makeStringsRuntime())({ config_path: configPath });
    const summary = JSON.parse(result.content[0].text) as {
      summary: { total: number; succeeded: number; failed: number };
      results: Array<{ locale: string; status: string; keysCreated: number }>;
    };

    expect(summary.summary.succeeded).toBe(2);
    expect(summary.summary.failed).toBe(0);
    expect(summary.results.map((r) => r.locale)).toEqual(expect.arrayContaining(["en", "de"]));
  });

  it("derives locale from locale_name placeholder in file pattern", async () => {
    const localesDir = join(tempDir, "push-derive");
    await setupLocaleFiles(localesDir);

    const configPath = await writeConfig(
      "push-derive",
      `phrase:
  project_id: ${PROJECT_ID}
  file_format: simple_json
  push:
    sources:
      - file: ${localesDir}/<locale_name>.json
`,
    );

    const result = await handler(makeStringsRuntime())({ config_path: configPath });
    const summary = JSON.parse(result.content[0].text) as {
      summary: { succeeded: number };
      results: Array<{ locale: string }>;
    };

    expect(summary.summary.succeeded).toBe(2);
    expect(summary.results.map((r) => r.locale)).toEqual(expect.arrayContaining(["en", "de"]));
  });

  it("matches files in subdirectories using locale_name/filename.json pattern", async () => {
    const localesDir = join(tempDir, "push-subdir");
    await mkdir(join(localesDir, "en"), { recursive: true });
    await mkdir(join(localesDir, "de"), { recursive: true });
    await writeFile(join(localesDir, "en", "messages.json"), EN_FILE_CONTENT, "utf-8");
    await writeFile(join(localesDir, "de", "messages.json"), DE_FILE_CONTENT, "utf-8");

    const configPath = await writeConfig(
      "push-subdir",
      `phrase:
  project_id: ${PROJECT_ID}
  file_format: simple_json
  push:
    sources:
      - file: ${localesDir}/<locale_name>/messages.json
        params:
          locale_id: <locale_name>
          update_translations: true
`,
    );

    const result = await handler(makeStringsRuntime())({ config_path: configPath });
    const summary = JSON.parse(result.content[0].text) as {
      summary: { total: number; succeeded: number };
      results: Array<{ file: string }>;
    };

    expect(summary.summary.succeeded).toBe(2);
    expect(summary.results.some((r) => r.file.includes("/en/messages.json"))).toBe(true);
    expect(summary.results.some((r) => r.file.includes("/de/messages.json"))).toBe(true);
  });

  it("matches files in deeply nested directories using ** glob", async () => {
    const srcDir = join(tempDir, "push-globstar", "src", "locales", "web");
    await mkdir(srcDir, { recursive: true });
    await writeFile(join(srcDir, "en.json"), EN_FILE_CONTENT, "utf-8");
    await writeFile(join(srcDir, "de.json"), DE_FILE_CONTENT, "utf-8");

    const configPath = await writeConfig(
      "push-globstar",
      `phrase:
  project_id: ${PROJECT_ID}
  file_format: simple_json
  push:
    sources:
      - file: ${join(tempDir, "push-globstar")}/**/<locale_name>.json
        params:
          locale_id: <locale_name>
          update_translations: true
`,
    );

    const result = await handler(makeStringsRuntime())({ config_path: configPath });
    const summary = JSON.parse(result.content[0].text) as {
      summary: { succeeded: number };
    };
    expect(summary.summary.succeeded).toBe(2);
  });

  it("passes tags from source params to the upload API", async () => {
    const localesDir = join(tempDir, "push-tags");
    await setupLocaleFiles(localesDir);

    const configPath = await writeConfig(
      "push-tags",
      `phrase:
  project_id: ${PROJECT_ID}
  file_format: simple_json
  push:
    sources:
      - file: ${localesDir}/<locale_name>.json
        params:
          locale_id: <locale_name>
          tags: onboarding,marketing
          update_translations: true
`,
    );

    const result = await handler(makeStringsRuntime())({ config_path: configPath });
    const summary = JSON.parse(result.content[0].text) as {
      summary: { succeeded: number };
    };
    expect(summary.summary.succeeded).toBe(2);
  });

  it("reports an error when no files match the source pattern", async () => {
    const configPath = await writeConfig(
      "push-no-match",
      `phrase:
  project_id: ${PROJECT_ID}
  file_format: simple_json
  push:
    sources:
      - file: ${join(tempDir, "nonexistent")}/<locale_name>.json
`,
    );

    const result = await handler(makeStringsRuntime())({ config_path: configPath });
    const summary = JSON.parse(result.content[0].text) as {
      results: Array<{ status: string; error?: string }>;
    };
    expect(summary.results[0]?.status).toBe("error");
    expect(summary.results[0]?.error).toContain("No files matched");
  });

  it("throws when project_id is missing from config", async () => {
    const configPath = await writeConfig(
      "push-no-project",
      `phrase:
  file_format: simple_json
  push:
    sources:
      - file: ./locales/<locale_name>.json
`,
    );
    await expect(
      handler(makeStringsRuntime())({ config_path: configPath }),
    ).rejects.toThrow("project_id");
  });

  it("throws when no push sources are defined", async () => {
    const configPath = await writeConfig(
      "push-no-sources",
      `phrase:
  project_id: ${PROJECT_ID}
  file_format: simple_json
`,
    );
    await expect(
      handler(makeStringsRuntime())({ config_path: configPath }),
    ).rejects.toThrow("No push.sources");
  });
});
