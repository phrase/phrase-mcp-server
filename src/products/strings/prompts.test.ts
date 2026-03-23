import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { registerStringsPrompts } from "#products/strings/prompts";

type RegisteredPrompt = {
  argsSchema?: Record<string, z.ZodTypeAny>;
  callback: (args: Record<string, string>) => {
    messages: Array<{ role: string; content: { type: string; text: string } }>;
  };
};

const EXPECTED_PROMPTS = [
  "strings_check_glossary_compliance",
  "strings_export_locale",
  "strings_find_missing_translations",
  "strings_review_job",
  "strings_upload_translations",
];

function createRecordingServer(registrations: Map<string, RegisteredPrompt>): McpServer {
  return {
    registerTool: () => undefined,
    registerPrompt: (...args: unknown[]) => {
      const [name, config, callback] = args as [
        string,
        { argsSchema?: Record<string, z.ZodTypeAny> },
        RegisteredPrompt["callback"],
      ];
      registrations.set(name, { argsSchema: config.argsSchema, callback });
    },
  } as unknown as McpServer;
}

describe("strings prompts", () => {
  const registrations = new Map<string, RegisteredPrompt>();

  registerStringsPrompts(createRecordingServer(registrations));

  it("registers every strings prompt", () => {
    expect(new Set(registrations.keys())).toEqual(new Set(EXPECTED_PROMPTS));
  });

  it("strings_find_missing_translations returns a user message referencing the project and locale", () => {
    const prompt = registrations.get("strings_find_missing_translations");
    expect(prompt).toBeDefined();
    const result = prompt?.callback({ project_id: "proj-1", locale_id: "de" });
    expect(result?.messages).toHaveLength(1);
    expect(result?.messages[0]?.role).toBe("user");
    expect(result?.messages[0]?.content.text).toContain("proj-1");
    expect(result?.messages[0]?.content.text).toContain("de");
  });

  it("strings_review_job returns a user message referencing the project and job", () => {
    const prompt = registrations.get("strings_review_job");
    expect(prompt).toBeDefined();
    const result = prompt?.callback({ project_id: "proj-2", job_id: "job-99" });
    expect(result?.messages).toHaveLength(1);
    expect(result?.messages[0]?.role).toBe("user");
    expect(result?.messages[0]?.content.text).toContain("proj-2");
    expect(result?.messages[0]?.content.text).toContain("job-99");
  });

  it("strings_export_locale returns a user message referencing locale and format", () => {
    const prompt = registrations.get("strings_export_locale");
    expect(prompt).toBeDefined();
    const result = prompt?.callback({ project_id: "proj-3", locale_id: "fr", file_format: "json" });
    expect(result?.messages).toHaveLength(1);
    expect(result?.messages[0]?.content.text).toContain("fr");
    expect(result?.messages[0]?.content.text).toContain("json");
  });

  it("strings_check_glossary_compliance returns a user message embedding the text and referencing the glossary", () => {
    const prompt = registrations.get("strings_check_glossary_compliance");
    expect(prompt).toBeDefined();
    const result = prompt?.callback({
      account_id: "acc-1",
      glossary_id: "gloss-1",
      text: "Click the Submit button to continue.",
    });
    expect(result?.messages).toHaveLength(1);
    expect(result?.messages[0]?.role).toBe("user");
    const text = result?.messages[0]?.content.text ?? "";
    expect(text).toContain("gloss-1");
    expect(text).toContain("acc-1");
    expect(text).toContain("Click the Submit button to continue.");
  });

  it("strings_upload_translations returns a user message referencing file path and locale", () => {
    const prompt = registrations.get("strings_upload_translations");
    expect(prompt).toBeDefined();
    const result = prompt?.callback({
      project_id: "proj-4",
      locale_id: "es",
      file_path: "/tmp/es.json",
      file_format: "json",
    });
    expect(result?.messages).toHaveLength(1);
    expect(result?.messages[0]?.content.text).toContain("/tmp/es.json");
    expect(result?.messages[0]?.content.text).toContain("es");
  });
});
