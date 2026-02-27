import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError, type BinaryResponse } from "#lib/http.js";
import { APP_NAME, APP_VERSION } from "#lib/runtime-info.js";
import { tmsModule } from "#products/tms/index.js";
import type { ProductRuntime } from "#products/types.js";

type RegisteredTool = {
  handler: (input: Record<string, unknown>) => Promise<{ content: Array<{ text: string }> }>;
};

type MockTmsClient = {
  get: ReturnType<typeof vi.fn>;
  postJson: ReturnType<typeof vi.fn>;
  putJson: ReturnType<typeof vi.fn>;
  postBinary: ReturnType<typeof vi.fn>;
  putBinary: ReturnType<typeof vi.fn>;
  getBinary: ReturnType<typeof vi.fn>;
  paginateGet: ReturnType<typeof vi.fn>;
};

function createHttpError(status: number, statusText: string, body: string): HttpError {
  const headers = new Headers();
  return new HttpError(status, statusText, body, headers);
}

function createRecordingServer(registrations: Map<string, RegisteredTool>): McpServer {
  return {
    registerTool: (...args: unknown[]) => {
      const [name, _options, handler] = args as [string, unknown, RegisteredTool["handler"]];
      registrations.set(name, { handler });
    },
  } as unknown as McpServer;
}

function createClientMock(): MockTmsClient {
  return {
    get: vi.fn().mockResolvedValue({ ok: true }),
    postJson: vi.fn().mockResolvedValue({ ok: true }),
    putJson: vi.fn().mockResolvedValue({ ok: true }),
    postBinary: vi.fn().mockResolvedValue({ ok: true }),
    putBinary: vi.fn().mockResolvedValue({ ok: true }),
    getBinary: vi.fn().mockResolvedValue({
      contentType: "application/octet-stream",
      contentDisposition: null,
      bytesBase64: Buffer.from("file bytes").toString("base64"),
      sizeBytes: 10,
    } satisfies BinaryResponse),
    paginateGet: vi.fn().mockResolvedValue({
      items: [{ uid: "template-uid-1", templateName: "Template 1" }],
      pages_fetched: 1,
      items_returned: 1,
      truncated: false,
    }),
  };
}

function registerTools(client: MockTmsClient): Map<string, RegisteredTool> {
  const registrations = new Map<string, RegisteredTool>();
  const runtime: ProductRuntime<"tms"> = {
    key: "tms",
    client: client as unknown as ProductRuntime<"tms">["client"],
  };
  tmsModule.register(createRecordingServer(registrations), runtime);
  return registrations;
}

async function invokeTool(
  registrations: Map<string, RegisteredTool>,
  toolName: string,
  input: Record<string, unknown>,
) {
  const registration = registrations.get(toolName);
  expect(registration).toBeDefined();
  if (!registration) {
    throw new Error(`Tool ${toolName} is not registered`);
  }
  const response = await registration.handler(input);
  return JSON.parse(response.content[0]?.text ?? "null");
}

const EXPECTED_TOOL_NAMES = [
  "tms_list_projects",
  "tms_get_project",
  "tms_create_project",
  "tms_update_project",
  "tms_set_project_status",
  "tms_list_project_templates",
  "tms_get_project_template",
  "tms_create_project_from_template",
  "tms_create_project_from_template_shorthand",
  "tms_list_jobs",
  "tms_get_job",
  "tms_search_jobs",
  "tms_create_job_from_file",
  "tms_download_target_file_async",
  "tms_download_target_file_by_async_request",
  "tms_list_pending_requests",
  "tms_get_async_request",
  "tms_get_async_limits",
];

describe("tmsModule tools", () => {
  let client: MockTmsClient;
  let registrations: Map<string, RegisteredTool>;
  let tempDir = "";
  let uploadFilePath = "";

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "tms-tools-test-"));
    uploadFilePath = join(tempDir, "upload-source.md");
    await writeFile(uploadFilePath, "# demo", "utf8");
  });

  afterAll(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    client = createClientMock();
    registrations = registerTools(client);
  });

  it("registers every expected tms tool", () => {
    expect(new Set(registrations.keys())).toEqual(new Set(EXPECTED_TOOL_NAMES));
  });

  it("handles direct get/post/put wrapper tools", async () => {
    await invokeTool(registrations, "tms_get_project", { project_uid: "proj/1" });
    await invokeTool(registrations, "tms_create_project", { project: { name: "Demo" } });
    await invokeTool(registrations, "tms_update_project", {
      project_uid: "proj/1",
      project: { note: "updated" },
    });
    await invokeTool(registrations, "tms_set_project_status", {
      project_uid: "proj/1",
      status: "NEW",
    });
    await invokeTool(registrations, "tms_get_project_template", {
      template_uid: "template/1",
    });
    await invokeTool(registrations, "tms_create_project_from_template", {
      template_uid: "template/1",
    });
    await invokeTool(registrations, "tms_get_job", {
      project_uid: "proj/1",
      job_uid: "job/1",
    });
    await invokeTool(registrations, "tms_search_jobs", {
      project_uid: "proj/1",
    });
    await invokeTool(registrations, "tms_get_async_request", {
      async_request_id: "req/1",
    });
    await invokeTool(registrations, "tms_get_async_limits", {});

    expect(client.get).toHaveBeenCalledWith("/v1/projects/proj%2F1");
    expect(client.postJson).toHaveBeenCalledWith("/v3/projects", { name: "Demo" });
    expect(client.putJson).toHaveBeenCalledWith("/v2/projects/proj%2F1", { note: "updated" });
    expect(client.postJson).toHaveBeenCalledWith("/v1/projects/proj%2F1/setStatus", {
      status: "NEW",
    });
    expect(client.get).toHaveBeenCalledWith("/v1/projectTemplates/template%2F1");
    expect(client.postJson).toHaveBeenCalledWith("/v2/projects/applyTemplate/template%2F1", {});
    expect(client.get).toHaveBeenCalledWith("/v1/projects/proj%2F1/jobs/job%2F1");
    expect(client.postJson).toHaveBeenCalledWith("/v1/projects/proj%2F1/jobs/search", {});
    expect(client.get).toHaveBeenCalledWith("/v1/async/req%2F1");
    expect(client.get).toHaveBeenCalledWith("/v1/async/status");
  });

  it("lists projects/templates/pending requests without and with pagination", async () => {
    await invokeTool(registrations, "tms_list_projects", {
      query: { status: "NEW" },
    });
    await invokeTool(registrations, "tms_list_project_templates", {
      query: { name: "Demo" },
    });
    await invokeTool(registrations, "tms_list_pending_requests", {
      query: { action: "IMPORT_JOB" },
    });

    expect(client.get).toHaveBeenCalledWith("/v1/projects", { status: "NEW" });
    expect(client.get).toHaveBeenCalledWith("/v1/projectTemplates", { name: "Demo" });
    expect(client.get).toHaveBeenCalledWith("/v1/async", { action: "IMPORT_JOB" });

    await invokeTool(registrations, "tms_list_projects", {
      paginate: true,
      page_size: 25,
      max_pages: 3,
      max_items: 100,
    });
    await invokeTool(registrations, "tms_list_project_templates", {
      paginate: true,
      page_size: 10,
      max_pages: 2,
      max_items: 20,
    });
    await invokeTool(registrations, "tms_list_pending_requests", {
      paginate: true,
      page_size: 15,
      max_pages: 4,
      max_items: 40,
    });

    expect(client.paginateGet).toHaveBeenCalledWith("/v1/projects", {
      query: undefined,
      pageSize: 25,
      maxPages: 3,
      maxItems: 100,
    });
    expect(client.paginateGet).toHaveBeenCalledWith("/v1/projectTemplates", {
      query: undefined,
      pageSize: 10,
      maxPages: 2,
      maxItems: 20,
    });
    expect(client.paginateGet).toHaveBeenCalledWith("/v1/async", {
      query: undefined,
      pageSize: 15,
      maxPages: 4,
      maxItems: 40,
    });
  });

  it("list jobs falls back to v1 after v2 not found", async () => {
    client.get
      .mockRejectedValueOnce(createHttpError(404, "Not Found", "missing on v2"))
      .mockResolvedValueOnce({ content: [{ uid: "job-1" }] });

    const result = await invokeTool(registrations, "tms_list_jobs", {
      project_uid: "proj-1",
      query: { status: "NEW" },
    });

    expect(client.get).toHaveBeenNthCalledWith(1, "/v2/projects/proj-1/jobs", { status: "NEW" });
    expect(client.get).toHaveBeenNthCalledWith(2, "/v1/projects/proj-1/jobs", { status: "NEW" });
    expect(result).toEqual({ content: [{ uid: "job-1" }] });
  });

  it("list jobs retries without query on 400", async () => {
    client.get
      .mockRejectedValueOnce(createHttpError(400, "Bad Request", "invalid query"))
      .mockResolvedValueOnce({ content: [{ uid: "job-1" }] });

    const result = await invokeTool(registrations, "tms_list_jobs", {
      project_uid: "proj-1",
      query: { unsupportedFilter: true },
    });

    expect(client.get).toHaveBeenNthCalledWith(1, "/v2/projects/proj-1/jobs", {
      unsupportedFilter: true,
    });
    expect(client.get).toHaveBeenNthCalledWith(2, "/v2/projects/proj-1/jobs");
    expect(result).toEqual({ content: [{ uid: "job-1" }] });
  });

  it("list jobs aggregates retry errors when all non-paginated attempts fail", async () => {
    client.get
      .mockRejectedValueOnce(createHttpError(400, "Bad Request", "v2 invalid query"))
      .mockRejectedValueOnce(createHttpError(400, "Bad Request", "v2 no-query still invalid"))
      .mockRejectedValueOnce(createHttpError(400, "Bad Request", "v1 invalid query"))
      .mockRejectedValueOnce(createHttpError(400, "Bad Request", "v1 no-query still invalid"));

    await expect(
      invokeTool(registrations, "tms_list_jobs", {
        project_uid: "proj-1",
        query: { unsupportedFilter: true },
      }),
    ).rejects.toThrow(/tms_list_jobs failed for all attempts\..+\(without query\)/);
  });

  it("list jobs paginated mode rotates page parameter strategies", async () => {
    client.paginateGet
      .mockRejectedValueOnce(createHttpError(400, "Bad Request", "invalid page params"))
      .mockResolvedValueOnce({
        items: [{ uid: "job-1" }],
        pages_fetched: 1,
        items_returned: 1,
        truncated: false,
      });

    const result = await invokeTool(registrations, "tms_list_jobs", {
      project_uid: "proj-1",
      paginate: true,
      page_size: 5,
      max_pages: 2,
      max_items: 10,
    });

    expect(client.paginateGet).toHaveBeenNthCalledWith(1, "/v2/projects/proj-1/jobs", {
      query: undefined,
      pageParam: "pageNumber",
      sizeParam: "pageSize",
      pageSize: 5,
      maxPages: 2,
      maxItems: 10,
    });
    expect(client.paginateGet).toHaveBeenNthCalledWith(2, "/v2/projects/proj-1/jobs", {
      query: undefined,
      pageParam: "page",
      sizeParam: "perPage",
      pageSize: 5,
      maxPages: 2,
      maxItems: 10,
    });
    expect(result).toEqual({
      items: [{ uid: "job-1" }],
      pages_fetched: 1,
      items_returned: 1,
      truncated: false,
    });
  });

  it("list jobs throws after all pagination fallback attempts fail", async () => {
    client.paginateGet.mockRejectedValue(createHttpError(404, "Not Found", "not supported"));

    await expect(
      invokeTool(registrations, "tms_list_jobs", {
        project_uid: "proj-1",
        paginate: true,
      }),
    ).rejects.toThrow("tms_list_jobs failed for all attempts.");

    expect(client.paginateGet).toHaveBeenCalledTimes(4);
  });

  it("list jobs paginated mode rethrows non-http errors", async () => {
    client.paginateGet.mockRejectedValueOnce(new Error("paginated transport failure"));

    await expect(
      invokeTool(registrations, "tms_list_jobs", {
        project_uid: "proj-1",
        paginate: true,
      }),
    ).rejects.toThrow("paginated transport failure");
  });

  it("list jobs rethrows non-retryable errors", async () => {
    client.get.mockRejectedValueOnce(new Error("network down"));

    await expect(
      invokeTool(registrations, "tms_list_jobs", {
        project_uid: "proj-1",
      }),
    ).rejects.toThrow("network down");
  });

  it("create project from template shorthand resolves template and creates project", async () => {
    client.paginateGet.mockResolvedValueOnce({
      items: [{ uid: "template-42", templateName: "Translate ENG text template" }],
      pages_fetched: 1,
      items_returned: 1,
      truncated: false,
    });
    client.postJson.mockResolvedValueOnce({ uid: "project-7" });

    const result = await invokeTool(registrations, "tms_create_project_from_template_shorthand", {
      template: "Translate ENG text template",
      payload: { name: "From shorthand" },
    });

    expect(client.paginateGet).toHaveBeenCalledWith("/v1/projectTemplates", {
      query: { name: "Translate ENG text template" },
      pageSize: 50,
      maxPages: 20,
      maxItems: 2000,
      extractItems: expect.any(Function),
    });
    expect(client.postJson).toHaveBeenCalledWith("/v2/projects/applyTemplate/template-42", {
      name: "From shorthand",
    });
    expect(result).toEqual({
      template_uid: "template-42",
      project: { uid: "project-7" },
    });
  });

  it("create project from template shorthand falls back to full template listing", async () => {
    client.paginateGet
      .mockResolvedValueOnce({
        items: [],
        pages_fetched: 1,
        items_returned: 0,
        truncated: false,
      })
      .mockResolvedValueOnce({
        items: [
          { uid: "u1", templateName: "Other template" },
          { uid: "u2", templateName: "Leadership translation pack" },
        ],
        pages_fetched: 1,
        items_returned: 2,
        truncated: false,
      });
    client.postJson.mockResolvedValueOnce({ uid: "project-22" });

    const result = await invokeTool(registrations, "tms_create_project_from_template_shorthand", {
      template: "Leadership",
    });

    expect(client.paginateGet).toHaveBeenCalledTimes(2);
    expect(client.postJson).toHaveBeenCalledWith("/v2/projects/applyTemplate/u2", {});
    expect(result).toEqual({
      template_uid: "u2",
      project: { uid: "project-22" },
    });
  });

  it("create project from template shorthand rejects ambiguous templates", async () => {
    client.paginateGet.mockResolvedValueOnce({
      items: [
        { uid: "u1", templateName: "Demo" },
        { uid: "u2", templateName: "Demo" },
      ],
      pages_fetched: 1,
      items_returned: 2,
      truncated: false,
    });

    await expect(
      invokeTool(registrations, "tms_create_project_from_template_shorthand", {
        template: "Demo",
      }),
    ).rejects.toThrow("is ambiguous");
  });

  it("create project from template shorthand rejects unmatched templates", async () => {
    client.paginateGet
      .mockResolvedValueOnce({
        items: [],
        pages_fetched: 1,
        items_returned: 0,
        truncated: false,
      })
      .mockResolvedValueOnce({
        items: [],
        pages_fetched: 1,
        items_returned: 0,
        truncated: false,
      });

    await expect(
      invokeTool(registrations, "tms_create_project_from_template_shorthand", {
        template: "does-not-exist",
      }),
    ).rejects.toThrow("No project template matched");
  });

  it("create project from template shorthand rejects blank shorthand after trimming", async () => {
    await expect(
      invokeTool(registrations, "tms_create_project_from_template_shorthand", {
        template: "   ",
      }),
    ).rejects.toThrow("Template shorthand cannot be empty.");
  });

  it("create job from file merges memsource and adds sourceData", async () => {
    client.postBinary.mockResolvedValueOnce({ id: "new-job" });

    await invokeTool(registrations, "tms_create_job_from_file", {
      project_uid: "proj/1",
      file_path: uploadFilePath,
      file_name: "  demo upload.md  ",
      target_langs: ["es_es"],
      memsource: { targetLangs: ["de_de"], customField: "x" },
    });

    expect(client.postBinary).toHaveBeenCalledTimes(1);
    const [path, body, headers] = client.postBinary.mock.calls[0] as [
      string,
      Buffer,
      Record<string, string>,
    ];
    expect(path).toBe("/v1/projects/proj%2F1/jobs");
    expect(body.byteLength).toBeGreaterThan(0);
    expect(headers["Content-Disposition"]).toBe('filename="demo upload.md"');
    const memsource = JSON.parse(headers.Memsource) as {
      targetLangs: string[];
      customField: string;
      sourceData: { clientType: string; clientVersion: string };
    };
    expect(memsource.targetLangs).toEqual(["es_es"]);
    expect(memsource.customField).toBe("x");
    expect(memsource.sourceData.clientType).toBe(APP_NAME);
    expect(memsource.sourceData.clientVersion).toBe(APP_VERSION);
  });

  it("create job from file uses memsource.targetLangs when target_langs is omitted", async () => {
    client.postBinary.mockResolvedValueOnce({ id: "new-job" });

    await invokeTool(registrations, "tms_create_job_from_file", {
      project_uid: "proj-1",
      file_path: uploadFilePath,
      memsource: { targetLangs: ["sv_se"] },
    });

    const headers = client.postBinary.mock.calls[0]?.[2] as Record<string, string>;
    const memsource = JSON.parse(headers.Memsource) as { targetLangs: string[] };
    expect(memsource.targetLangs).toEqual(["sv_se"]);
  });

  it("create job from file validates required target languages", async () => {
    await expect(
      invokeTool(registrations, "tms_create_job_from_file", {
        project_uid: "proj-1",
        file_path: uploadFilePath,
      }),
    ).rejects.toThrow("Missing required target languages");
  });

  it("create job from file validates file_name constraints", async () => {
    await expect(
      invokeTool(registrations, "tms_create_job_from_file", {
        project_uid: "proj-1",
        file_path: uploadFilePath,
        file_name: "   ",
        target_langs: ["es_es"],
      }),
    ).rejects.toThrow("file_name cannot be empty.");

    await expect(
      invokeTool(registrations, "tms_create_job_from_file", {
        project_uid: "proj-1",
        file_path: uploadFilePath,
        file_name: "bad\nname.md",
        target_langs: ["es_es"],
      }),
    ).rejects.toThrow("file_name cannot contain CR/LF characters.");

    await expect(
      invokeTool(registrations, "tms_create_job_from_file", {
        project_uid: "proj-1",
        file_path: uploadFilePath,
        file_name: "bad/name.md",
        target_langs: ["es_es"],
      }),
    ).rejects.toThrow("file_name contains unsupported characters");
  });

  it("download target file async uses v3 and falls back to v2 for compatibility", async () => {
    await invokeTool(registrations, "tms_download_target_file_async", {
      project_uid: "proj/1",
      job_uid: "job/2",
      payload: { format: "JSON" },
    });
    expect(client.putJson).toHaveBeenCalledWith("/v3/projects/proj%2F1/jobs/job%2F2/targetFile", {
      format: "JSON",
    });

    client.putJson.mockReset();
    client.putJson
      .mockRejectedValueOnce(createHttpError(404, "Not Found", "v3 unavailable"))
      .mockResolvedValueOnce({ asyncRequest: { id: "123" } });

    const result = await invokeTool(registrations, "tms_download_target_file_async", {
      project_uid: "proj/1",
      job_uid: "job/2",
    });

    expect(client.putJson).toHaveBeenNthCalledWith(
      1,
      "/v3/projects/proj%2F1/jobs/job%2F2/targetFile",
      {},
    );
    expect(client.putJson).toHaveBeenNthCalledWith(
      2,
      "/v2/projects/proj%2F1/jobs/job%2F2/targetFile",
      {},
    );
    expect(result).toEqual({ asyncRequest: { id: "123" } });
  });

  it("download target file async rethrows non-fallback errors", async () => {
    client.putJson.mockRejectedValueOnce(createHttpError(500, "Internal Server Error", "boom"));

    await expect(
      invokeTool(registrations, "tms_download_target_file_async", {
        project_uid: "proj-1",
        job_uid: "job-1",
      }),
    ).rejects.toThrow("HTTP 500");
  });

  it("download target file by async request decodes filename and saves output", async () => {
    client.getBinary.mockResolvedValueOnce({
      contentType: "application/json",
      contentDisposition: "attachment; filename*=UTF-8''report%20final.json",
      bytesBase64: Buffer.from('{"ok":true}').toString("base64"),
      sizeBytes: 11,
    } satisfies BinaryResponse);

    const outputPath = join(tempDir, "outputs", "report-final.json");
    const result = await invokeTool(registrations, "tms_download_target_file_by_async_request", {
      project_uid: "proj/1",
      job_uid: "job/2",
      async_request_id: "async/3",
      output_path: outputPath,
    });

    expect(client.getBinary).toHaveBeenCalledWith(
      "/v3/projects/proj%2F1/jobs/job%2F2/downloadTargetFile/async%2F3",
    );
    expect(result.file_name).toBe("report final.json");
    expect(result.saved_to).toBe(resolve(outputPath));
    const savedContent = await readFile(resolve(outputPath), "utf8");
    expect(savedContent).toBe('{"ok":true}');
  });

  it("download target file by async request falls back from v3 to v2", async () => {
    client.getBinary
      .mockRejectedValueOnce(createHttpError(400, "Bad Request", "unsupported"))
      .mockResolvedValueOnce({
        contentType: "application/octet-stream",
        contentDisposition: null,
        bytesBase64: Buffer.from("abc").toString("base64"),
        sizeBytes: 3,
      } satisfies BinaryResponse);

    const result = await invokeTool(registrations, "tms_download_target_file_by_async_request", {
      project_uid: "proj-1",
      job_uid: "job-1",
      async_request_id: "req-1",
    });

    expect(client.getBinary).toHaveBeenNthCalledWith(
      1,
      "/v3/projects/proj-1/jobs/job-1/downloadTargetFile/req-1",
    );
    expect(client.getBinary).toHaveBeenNthCalledWith(
      2,
      "/v2/projects/proj-1/jobs/job-1/downloadTargetFile/req-1",
    );
    expect(result.saved_to).toBeNull();
  });

  it("download target file by async request handles invalid encoded filenames", async () => {
    client.getBinary.mockResolvedValueOnce({
      contentType: "text/plain",
      contentDisposition: "attachment; filename*=UTF-8''bad%ZZname.txt",
      bytesBase64: Buffer.from("abc").toString("base64"),
      sizeBytes: 3,
    } satisfies BinaryResponse);

    const result = await invokeTool(registrations, "tms_download_target_file_by_async_request", {
      project_uid: "proj-1",
      job_uid: "job-1",
      async_request_id: "req-1",
    });

    expect(result.file_name).toBe("bad%ZZname.txt");
  });

  it("download target file by async request returns null filename when header has no filename", async () => {
    client.getBinary.mockResolvedValueOnce({
      contentType: "text/plain",
      contentDisposition: "attachment",
      bytesBase64: Buffer.from("abc").toString("base64"),
      sizeBytes: 3,
    } satisfies BinaryResponse);

    const result = await invokeTool(registrations, "tms_download_target_file_by_async_request", {
      project_uid: "proj-1",
      job_uid: "job-1",
      async_request_id: "req-1",
    });

    expect(result.file_name).toBeNull();
  });

  it("download target file by async request rethrows non-fallback errors", async () => {
    client.getBinary.mockRejectedValueOnce(createHttpError(500, "Internal Server Error", "boom"));

    await expect(
      invokeTool(registrations, "tms_download_target_file_by_async_request", {
        project_uid: "proj-1",
        job_uid: "job-1",
        async_request_id: "req-1",
      }),
    ).rejects.toThrow("HTTP 500");
  });
});
