import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Polly } from "@pollyjs/core";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { registerPullTool } from "#products/strings/tools/pull";
import { createPolly, makeStringsRuntime } from "#products/strings/tools/polly-setup";
import type { ProductRuntime } from "#products/types";

// ---------------------------------------------------------------------------
// Project constants — mcp-pull-push-test project
// ---------------------------------------------------------------------------

const PROJECT_ID = "628d14d653d4a5844e8e92251b9b2e2a";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ToolHandler = (
  input: Record<string, unknown>,
) => Promise<{ content: Array<{ text: string }> }>;

function captureHandler(register: (server: McpServer) => void): ToolHandler {
  let handler: ToolHandler | undefined;
  const server = {
    registerTool: (_name: string, _schema: unknown, h: ToolHandler) => {
      handler = h;
    },
    registerPrompt: () => undefined,
  } as unknown as McpServer;
  register(server);
  if (!handler) throw new Error("Tool handler was not registered");
  return handler;
}

function handler(runtime: ProductRuntime<"strings">): ToolHandler {
  return captureHandler((s) => registerPullTool(s, runtime));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("strings_pull", () => {
  let polly: Polly;
  let tempDir = "";

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "phrase-pull-test-"));
  });

  afterAll(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  beforeEach((ctx) => {
    polly = createPolly(`strings_pull/${ctx.task.name}`);
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

  it("downloads all locales when locale_id contains a placeholder", async () => {
    const outDir = join(tempDir, "pull-all");
    const configPath = await writeConfig(
      "pull-all",
      `phrase:
  project_id: ${PROJECT_ID}
  file_format: simple_json
  pull:
    targets:
      - file: ${outDir}/<locale_name>.json
        params:
          locale_id: <locale_name>
`,
    );

    const result = await handler(makeStringsRuntime())({ config_path: configPath });
    const summary = JSON.parse(result.content[0].text) as {
      summary: { total: number; succeeded: number; failed: number };
      results: Array<{ locale: string; status: string; file: string }>;
    };

    expect(summary.summary.succeeded).toBe(2);
    expect(summary.summary.failed).toBe(0);
    expect(summary.results.map((r) => r.locale)).toEqual(expect.arrayContaining(["en", "de"]));

    const enContent = await readFile(join(outDir, "en.json"), "utf-8");
    const deContent = await readFile(join(outDir, "de.json"), "utf-8");
    expect(JSON.parse(enContent)).toMatchObject({ "welcome.title": "Welcome" });
    expect(JSON.parse(deContent)).toMatchObject({ "welcome.title": "Willkommen" });
  });

  it("writes files to per-locale subdirectories using locale_name/filename pattern", async () => {
    const outDir = join(tempDir, "pull-subdir");
    const configPath = await writeConfig(
      "pull-subdir",
      `phrase:
  project_id: ${PROJECT_ID}
  file_format: simple_json
  pull:
    targets:
      - file: ${outDir}/<locale_name>/messages.json
        params:
          locale_id: <locale_name>
`,
    );

    const result = await handler(makeStringsRuntime())({ config_path: configPath });
    const summary = JSON.parse(result.content[0].text) as {
      summary: { succeeded: number; failed: number };
    };

    expect(summary.summary.succeeded).toBe(2);
    expect(summary.summary.failed).toBe(0);

    const enContent = await readFile(join(outDir, "en", "messages.json"), "utf-8");
    const deContent = await readFile(join(outDir, "de", "messages.json"), "utf-8");
    expect(JSON.parse(enContent)).toMatchObject({ "welcome.title": "Welcome" });
    expect(JSON.parse(deContent)).toMatchObject({ "welcome.title": "Willkommen" });
  });

  it("downloads a single locale when locale_id is a literal name", async () => {
    const outDir = join(tempDir, "pull-single");
    await mkdir(outDir, { recursive: true });
    const configPath = await writeConfig(
      "pull-single",
      `phrase:
  project_id: ${PROJECT_ID}
  file_format: simple_json
  pull:
    targets:
      - file: ${outDir}/de.json
        params:
          locale_id: de
`,
    );

    const result = await handler(makeStringsRuntime())({ config_path: configPath });
    const summary = JSON.parse(result.content[0].text) as {
      summary: { total: number; succeeded: number };
    };

    expect(summary.summary.total).toBe(1);
    expect(summary.summary.succeeded).toBe(1);
    const deContent = await readFile(join(outDir, "de.json"), "utf-8");
    expect(JSON.parse(deContent)).toMatchObject({ "welcome.title": "Willkommen" });
  });

  it("passes tags to the download API", async () => {
    const outDir = join(tempDir, "pull-tags");
    const configPath = await writeConfig(
      "pull-tags",
      `phrase:
  project_id: ${PROJECT_ID}
  file_format: simple_json
  pull:
    targets:
      - file: ${outDir}/<locale_name>.json
        params:
          locale_id: <locale_name>
          tags: onboarding
`,
    );

    // In replay mode this just verifies the cassette was recorded with tags param
    const result = await handler(makeStringsRuntime())({ config_path: configPath });
    const summary = JSON.parse(result.content[0].text) as {
      summary: { succeeded: number };
    };
    expect(summary.summary.succeeded).toBe(2);
  });

  it("passes branch to the download API", async () => {
    const outDir = join(tempDir, "pull-branch");
    const configPath = await writeConfig(
      "pull-branch",
      `phrase:
  project_id: ${PROJECT_ID}
  file_format: simple_json
  pull:
    targets:
      - file: ${outDir}/<locale_name>.json
        params:
          locale_id: <locale_name>
          branch: main
`,
    );

    const result = await handler(makeStringsRuntime())({ config_path: configPath });
    const summary = JSON.parse(result.content[0].text) as {
      summary: { succeeded: number };
    };
    expect(summary.summary.succeeded).toBe(2);
  });

  it("throws when project_id is missing from config", async () => {
    const configPath = await writeConfig(
      "pull-no-project",
      `phrase:
  file_format: simple_json
  pull:
    targets:
      - file: ./locales/<locale_name>.json
`,
    );
    await expect(handler(makeStringsRuntime())({ config_path: configPath })).rejects.toThrow(
      "project_id",
    );
  });

  it("throws when no pull targets are defined", async () => {
    const configPath = await writeConfig(
      "pull-no-targets",
      `phrase:
  project_id: ${PROJECT_ID}
  file_format: simple_json
`,
    );
    await expect(handler(makeStringsRuntime())({ config_path: configPath })).rejects.toThrow(
      "No pull.targets",
    );
  });

  it("throws when no phrase config file exists", async () => {
    await expect(
      handler(makeStringsRuntime())({
        config_path: join(tempDir, "nonexistent.yml"),
      }),
    ).rejects.toThrow();
  });
});
