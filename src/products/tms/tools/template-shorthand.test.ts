import { describe, expect, it, vi } from "vitest";
import { resolveTemplateUidByShorthand } from "#products/tms/tools/template-shorthand.js";

interface PaginateLikeOptions {
  query?: Record<string, unknown>;
  extractItems?: (response: unknown) => unknown[];
}

function createTemplateClient(rawResponses: unknown[]) {
  return {
    paginateGet: vi.fn(async (_path: string, options: PaginateLikeOptions = {}) => {
      const raw = rawResponses.shift();
      const extractItems = options.extractItems ?? (() => []);
      const items = extractItems(raw);
      return {
        items,
        pages_fetched: 1,
        items_returned: items.length,
        truncated: false,
      };
    }),
  };
}

describe("resolveTemplateUidByShorthand", () => {
  it("resolves by exact numeric ID", async () => {
    const client = createTemplateClient([
      {
        content: [
          { id: 123, uid: "uid-123", templateName: "Primary template" },
          { id: 999, uid: "uid-999", templateName: "Secondary template" },
        ],
      },
    ]);

    const result = await resolveTemplateUidByShorthand(client as never, "123");
    expect(result).toBe("uid-123");
    expect(client.paginateGet).toHaveBeenCalledTimes(1);
    expect(client.paginateGet).toHaveBeenCalledWith(
      "/v1/projectTemplates",
      expect.objectContaining({
        query: { name: "123" },
      }),
    );
  });

  it("resolves by exact UID match", async () => {
    const client = createTemplateClient([
      {
        content: [
          { uid: "ABC-UID", templateName: "alpha" },
          { uid: "something-else", templateName: "abc-uid" },
        ],
      },
    ]);

    const result = await resolveTemplateUidByShorthand(client as never, "abc-uid");
    expect(result).toBe("ABC-UID");
  });

  it("falls back to full listing when the search response is malformed", async () => {
    const client = createTemplateClient([
      null,
      {
        content: [
          { uid: "uid-222", templateName: "Leadership translation pack" },
          { uid: "uid-333", templateName: "General docs" },
        ],
      },
    ]);

    const result = await resolveTemplateUidByShorthand(client as never, "Leadership");
    expect(result).toBe("uid-222");
    expect(client.paginateGet).toHaveBeenCalledTimes(2);
  });

  it("throws an ambiguity error when multiple templates match equally", async () => {
    const client = createTemplateClient([
      {
        content: [
          { uid: "u-1", templateName: "Demo Template" },
          { uid: "u-2", templateName: "Demo Template" },
        ],
      },
    ]);

    await expect(resolveTemplateUidByShorthand(client as never, "Demo Template")).rejects.toThrow(
      "is ambiguous",
    );
  });

  it("throws when matches exist but no template has a UID", async () => {
    const client = createTemplateClient([
      {
        content: [{ id: 42, templateName: "UID-less template" }],
      },
    ]);

    await expect(
      resolveTemplateUidByShorthand(client as never, "UID-less template"),
    ).rejects.toThrow("No project template matched");
  });

  it("rejects empty shorthand values", async () => {
    const client = createTemplateClient([]);
    await expect(resolveTemplateUidByShorthand(client as never, "   ")).rejects.toThrow(
      "Template shorthand cannot be empty.",
    );
  });
});
