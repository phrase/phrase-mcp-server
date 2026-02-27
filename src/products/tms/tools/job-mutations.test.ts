import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { registerPatchJobTool } from "#products/tms/tools/patch-job.js";
import { registerSetJobStatusTool } from "#products/tms/tools/set-job-status.js";
import { registerUpdateJobTool } from "#products/tms/tools/update-job.js";
import type { ProductRuntime } from "#products/types.js";

type RegisteredTool = {
  inputSchema: Record<string, z.ZodTypeAny>;
  handler: (input: Record<string, unknown>) => Promise<{ content: Array<{ text: string }> }>;
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
  } as unknown as McpServer;
}

describe("tms job mutation tools", () => {
  it("tms_update_job calls putJson with encoded identifiers", async () => {
    const putJson = vi.fn().mockResolvedValue({ ok: true });
    const runtime: ProductRuntime<"tms"> = {
      key: "tms",
      client: { putJson } as unknown as ProductRuntime<"tms">["client"],
    };
    const registrations = new Map<string, RegisteredTool>();
    registerUpdateJobTool(createRecordingServer(registrations), runtime);

    const tool = registrations.get("tms_update_job");
    expect(tool).toBeDefined();
    if (!tool) {
      return;
    }

    const result = await tool.handler({
      project_uid: "proj/123",
      job_uid: "job id",
      job: { due: "today" },
    });

    expect(putJson).toHaveBeenCalledWith("/v1/projects/proj%2F123/jobs/job%20id", {
      due: "today",
    });
    const text = result.content[0]?.text;
    if (!text) {
      throw new Error("Missing response text");
    }
    expect(JSON.parse(text)).toEqual({ ok: true });
  });

  it("tms_patch_job calls patchJson with encoded identifiers", async () => {
    const patchJson = vi.fn().mockResolvedValue({ ok: true });
    const runtime: ProductRuntime<"tms"> = {
      key: "tms",
      client: { patchJson } as unknown as ProductRuntime<"tms">["client"],
    };
    const registrations = new Map<string, RegisteredTool>();
    registerPatchJobTool(createRecordingServer(registrations), runtime);

    const tool = registrations.get("tms_patch_job");
    expect(tool).toBeDefined();
    if (!tool) {
      return;
    }

    const result = await tool.handler({
      project_uid: "proj/123",
      job_uid: "job id",
      job: { note: "patched" },
    });

    expect(patchJson).toHaveBeenCalledWith("/v1/projects/proj%2F123/jobs/job%20id", {
      note: "patched",
    });
    const text = result.content[0]?.text;
    if (!text) {
      throw new Error("Missing response text");
    }
    expect(JSON.parse(text)).toEqual({ ok: true });
  });

  it("tms_set_job_status calls postJson with status payload", async () => {
    const postJson = vi.fn().mockResolvedValue({ ok: true });
    const runtime: ProductRuntime<"tms"> = {
      key: "tms",
      client: { postJson } as unknown as ProductRuntime<"tms">["client"],
    };
    const registrations = new Map<string, RegisteredTool>();
    registerSetJobStatusTool(createRecordingServer(registrations), runtime);

    const tool = registrations.get("tms_set_job_status");
    expect(tool).toBeDefined();
    if (!tool) {
      return;
    }

    const result = await tool.handler({
      project_uid: "proj/123",
      job_uid: "job id",
      status: "COMPLETED",
    });

    expect(postJson).toHaveBeenCalledWith("/v1/projects/proj%2F123/jobs/job%20id/setStatus", {
      status: "COMPLETED",
    });
    const text = result.content[0]?.text;
    if (!text) {
      throw new Error("Missing response text");
    }
    expect(JSON.parse(text)).toEqual({ ok: true });
  });
});
