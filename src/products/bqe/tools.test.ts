import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { bqeModule } from "#products/bqe/index";
import type { ProductRuntime } from "#products/types";

type RegisteredTool = {
  annotations: { readOnlyHint?: boolean; destructiveHint?: boolean; title?: string } | undefined;
  handler: (input: Record<string, unknown>) => Promise<{ content: Array<{ text: string }> }>;
};

type MockBqeClient = {
  get: ReturnType<typeof vi.fn>;
  postJson: ReturnType<typeof vi.fn>;
  putJson: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};

function createRecordingServer(registrations: Map<string, RegisteredTool>): McpServer {
  return {
    registerTool: (...args: unknown[]) => {
      const [name, options, handler] = args as [
        string,
        { annotations?: RegisteredTool["annotations"] },
        RegisteredTool["handler"],
      ];
      registrations.set(name, { annotations: options.annotations, handler });
    },
  } as unknown as McpServer;
}

function createClientMock(): MockBqeClient {
  return {
    get: vi.fn().mockResolvedValue({ ok: true }),
    postJson: vi.fn().mockResolvedValue({ ok: true }),
    putJson: vi.fn().mockResolvedValue({ ok: true }),
    del: vi.fn().mockResolvedValue({}),
  };
}

function registerTools(client: MockBqeClient): Map<string, RegisteredTool> {
  const registrations = new Map<string, RegisteredTool>();
  const runtime: ProductRuntime<"bqe"> = {
    key: "bqe",
    client: client as unknown as ProductRuntime<"bqe">["client"],
  };
  bqeModule.register(createRecordingServer(registrations), runtime);
  return registrations;
}

async function invokeTool(
  registrations: Map<string, RegisteredTool>,
  toolName: string,
  input: Record<string, unknown>,
) {
  const registration = registrations.get(toolName);
  expect(registration).toBeDefined();
  const response = await registration?.handler(input);
  return JSON.parse(response?.content[0]?.text ?? "null");
}

const EXPECTED_TOOL_NAMES = [
  "bqe_list_ai_checks",
  "bqe_get_ai_check",
  "bqe_create_ai_check",
  "bqe_update_ai_check",
  "bqe_delete_ai_check",
  "bqe_list_quality_profiles",
  "bqe_get_quality_profile",
  "bqe_create_quality_profile",
  "bqe_update_quality_profile",
  "bqe_delete_quality_profile",
  "bqe_evaluate_segments",
  "bqe_get_analytics",
];

describe("bqeModule tools", () => {
  let client: MockBqeClient;
  let registrations: Map<string, RegisteredTool>;

  beforeEach(() => {
    client = createClientMock();
    registrations = registerTools(client);
  });

  it("registers every expected bqe tool", () => {
    expect(new Set(registrations.keys())).toEqual(new Set(EXPECTED_TOOL_NAMES));
  });

  it("every tool declares exactly one of readOnlyHint or destructiveHint", () => {
    for (const [name, tool] of registrations) {
      const { readOnlyHint, destructiveHint } = tool.annotations ?? {};
      const hasReadOnly = readOnlyHint === true;
      const hasDestructive = destructiveHint === true;
      expect(
        hasReadOnly || hasDestructive,
        `${name} must declare readOnlyHint: true or destructiveHint: true`,
      ).toBe(true);
      expect(
        hasReadOnly && hasDestructive,
        `${name} must not declare both readOnlyHint and destructiveHint`,
      ).toBe(false);
    }
  });

  // Anthropic MCP Directory Policy requires tool names to be at most 64 characters.
  // https://support.claude.com/en/articles/11697096-anthropic-mcp-directory-policy
  it("every tool name is at most 64 characters", () => {
    for (const name of registrations.keys()) {
      expect(
        name.length,
        `tool name "${name}" exceeds 64 characters (${name.length})`,
      ).toBeLessThanOrEqual(64);
    }
  });

  // Anthropic MCP Directory Policy requires tools to declare a human-readable title annotation.
  // https://support.claude.com/en/articles/11697096-anthropic-mcp-directory-policy
  it("every tool declares a title annotation", () => {
    for (const [name, tool] of registrations) {
      const { title } = tool.annotations ?? {};
      expect(title, `${name} must declare a non-empty title annotation`).toBeTruthy();
    }
  });

  it("every tool title is prefixed with [BQE]", () => {
    for (const [name, tool] of registrations) {
      expect(
        tool.annotations?.title?.startsWith("[BQE] "),
        `${name} title must start with '[BQE] '`,
      ).toBe(true);
    }
  });

  describe("AI Check tools", () => {
    it("bqe_list_ai_checks calls GET /v1/aiChecks with sort and order", async () => {
      client.get.mockResolvedValueOnce({ items: [{ uid: "ai-1", name: "x" }] });

      const result = await invokeTool(registrations, "bqe_list_ai_checks", {
        sort: "name",
        order: "desc",
      });

      expect(client.get).toHaveBeenCalledWith("/v1/aiChecks", {
        sort: "name",
        order: "desc",
      });
      expect(result).toEqual({ items: [{ uid: "ai-1", name: "x" }] });
    });

    it("bqe_list_ai_checks works without parameters", async () => {
      await invokeTool(registrations, "bqe_list_ai_checks", {});

      expect(client.get).toHaveBeenCalledWith("/v1/aiChecks", {
        sort: undefined,
        order: undefined,
      });
    });

    it("bqe_get_ai_check encodes the UID in the path", async () => {
      await invokeTool(registrations, "bqe_get_ai_check", { uid: "ai/1" });
      expect(client.get).toHaveBeenCalledWith("/v1/aiChecks/ai%2F1");
    });

    it("bqe_create_ai_check posts the name and qualityRequirements", async () => {
      await invokeTool(registrations, "bqe_create_ai_check", {
        name: "No Yoda Speech",
        qualityRequirements: "must not invert sentence structure",
      });
      expect(client.postJson).toHaveBeenCalledWith("/v1/aiChecks", {
        name: "No Yoda Speech",
        qualityRequirements: "must not invert sentence structure",
      });
    });

    it("bqe_update_ai_check puts name and qualityRequirements at the encoded UID", async () => {
      await invokeTool(registrations, "bqe_update_ai_check", {
        uid: "ai/1",
        name: "Updated",
        qualityRequirements: "be formal",
      });
      expect(client.putJson).toHaveBeenCalledWith("/v1/aiChecks/ai%2F1", {
        name: "Updated",
        qualityRequirements: "be formal",
      });
    });

    it("bqe_delete_ai_check sends DELETE at the encoded UID", async () => {
      await invokeTool(registrations, "bqe_delete_ai_check", { uid: "ai/1" });
      expect(client.del).toHaveBeenCalledWith("/v1/aiChecks/ai%2F1");
    });
  });

  describe("Quality Profile tools", () => {
    it("bqe_list_quality_profiles passes filters", async () => {
      await invokeTool(registrations, "bqe_list_quality_profiles", {
        sort: "createdDate",
        order: "asc",
        createdByUid: "user-1",
        name: "marketing",
      });
      expect(client.get).toHaveBeenCalledWith("/v1/qualityProfiles", {
        sort: "createdDate",
        order: "asc",
        createdByUid: "user-1",
        name: "marketing",
      });
    });

    it("bqe_get_quality_profile encodes the UID", async () => {
      await invokeTool(registrations, "bqe_get_quality_profile", { uid: "qp/1" });
      expect(client.get).toHaveBeenCalledWith("/v1/qualityProfiles/qp%2F1");
    });

    it("bqe_create_quality_profile posts name and aiCheckUids", async () => {
      await invokeTool(registrations, "bqe_create_quality_profile", {
        name: "Marketing",
        aiCheckUids: ["ai-1", "ai-2"],
      });
      expect(client.postJson).toHaveBeenCalledWith("/v1/qualityProfiles", {
        name: "Marketing",
        aiCheckUids: ["ai-1", "ai-2"],
      });
    });

    it("bqe_update_quality_profile puts at the encoded UID", async () => {
      await invokeTool(registrations, "bqe_update_quality_profile", {
        uid: "qp/1",
        name: "Marketing",
        aiCheckUids: ["ai-1"],
      });
      expect(client.putJson).toHaveBeenCalledWith("/v1/qualityProfiles/qp%2F1", {
        name: "Marketing",
        aiCheckUids: ["ai-1"],
      });
    });

    it("bqe_delete_quality_profile sends DELETE at the encoded UID", async () => {
      await invokeTool(registrations, "bqe_delete_quality_profile", { uid: "qp/1" });
      expect(client.del).toHaveBeenCalledWith("/v1/qualityProfiles/qp%2F1");
    });
  });

  describe("Evaluation", () => {
    it("bqe_evaluate_segments forwards qualityProfileUid and skips aiCheckUids when not provided", async () => {
      await invokeTool(registrations, "bqe_evaluate_segments", {
        qualityProfileUid: "qp-1",
        segments: [{ id: "s1", source: "Hello", target: "Hallo" }],
        sourceLocaleCode: "en_us",
        targetLocaleCode: "de_de",
      });

      expect(client.postJson).toHaveBeenCalledWith("/v2/evaluation", {
        qualityProfileUid: "qp-1",
        segments: [{ id: "s1", source: "Hello", target: "Hallo" }],
        sourceLocaleCode: "en_us",
        targetLocaleCode: "de_de",
      });
      const body = client.postJson.mock.lastCall?.[1] as Record<string, unknown>;
      expect("aiCheckUids" in body).toBe(false);
    });

    it("bqe_evaluate_segments forwards aiCheckUids and skips qualityProfileUid when not provided", async () => {
      await invokeTool(registrations, "bqe_evaluate_segments", {
        aiCheckUids: ["ai-1", "ai-2"],
        segments: [{ source: "Hello", target: "Hallo" }],
        sourceLocaleCode: "en_us",
        targetLocaleCode: "de_de",
      });

      expect(client.postJson).toHaveBeenCalledWith("/v2/evaluation", {
        aiCheckUids: ["ai-1", "ai-2"],
        segments: [{ source: "Hello", target: "Hallo" }],
        sourceLocaleCode: "en_us",
        targetLocaleCode: "de_de",
      });
      const body = client.postJson.mock.lastCall?.[1] as Record<string, unknown>;
      expect("qualityProfileUid" in body).toBe(false);
    });
  });

  describe("Analytics", () => {
    it("bqe_get_analytics passes filters as query params", async () => {
      await invokeTool(registrations, "bqe_get_analytics", {
        qualityProfileUid: "qp-1",
        dayAfter: "2026-04-01",
        dayBefore: "2026-04-30",
      });
      expect(client.get).toHaveBeenCalledWith("/v1/analytics", {
        qualityProfileUid: "qp-1",
        dayAfter: "2026-04-01",
        dayBefore: "2026-04-30",
      });
    });

    it("bqe_get_analytics omitting all filters still calls the endpoint", async () => {
      await invokeTool(registrations, "bqe_get_analytics", {});
      expect(client.get).toHaveBeenCalledWith("/v1/analytics", {
        qualityProfileUid: undefined,
        dayAfter: undefined,
        dayBefore: undefined,
      });
    });
  });
});
