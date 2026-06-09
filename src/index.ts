#!/usr/bin/env node

import { createServer, type ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { loadProductRuntimes } from "#config";
import { APP_NAME, APP_VERSION } from "#lib/runtime-info";
import { connectorsModule } from "#products/connectors";
import { productModules } from "#products/index";
import type { AnyProductRuntime } from "#products/types";
import { bqeModule } from "#products/bqe/index";
import { stringsModule } from "#products/strings/index";
import { tmsModule } from "#products/tms/index";

// Product runtimes are loaded once at startup — credentials are validated here.
const runtimes = await loadProductRuntimes(productModules);
if (runtimes.length === 0) {
  throw new Error(
    "No Phrase products are configured. Set credentials for at least one enabled product.",
  );
}

function registerRuntime(server: McpServer, runtime: AnyProductRuntime): void {
  switch (runtime.key) {
    case "connectors":
      connectorsModule.register(server, runtime);
      return;
    case "strings":
      stringsModule.register(server, runtime);
      return;
    case "tms":
      tmsModule.register(server, runtime);
      return;
    case "bqe":
      bqeModule.register(server, runtime);
      return;
  }
}

// TRANSPORT=http: opt-in HTTP mode for remote/hosted deployments.
// Default is stdio for local use with MCP clients (e.g. Claude Desktop).
if (process.env.TRANSPORT !== "http") {
  const server = new McpServer({ name: APP_NAME, version: APP_VERSION });
  for (const runtime of runtimes) registerRuntime(server, runtime);
  const transport = new StdioServerTransport();
  await server.connect(transport);
} else {
  // The SDK requires a fresh transport per request in stateless mode to avoid
  // message ID collisions across concurrent clients.
  async function createMcpRequestHandler(): Promise<StreamableHTTPServerTransport> {
    const server = new McpServer({ name: APP_NAME, version: APP_VERSION });
    for (const runtime of runtimes) registerRuntime(server, runtime);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    return transport;
  }

  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
  const MAX_BODY_BYTES = 4 * 1024 * 1024; // 4 MB

  const rawOrigins = process.env.CORS_ALLOWED_ORIGINS ?? "https://claude.ai";
  const allowedOrigins = new Set(
    rawOrigins
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  function setCorsHeaders(res: ServerResponse, origin: string): void {
    if (allowedOrigins.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
  }

  const httpServer = createServer(async (req, res) => {
    const origin = req.headers.origin ?? "";

    if (req.method === "OPTIONS") {
      if (allowedOrigins.has(origin)) {
        res.writeHead(200, {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        });
      } else {
        res.writeHead(204);
      }
      res.end();
      return;
    }

    if (req.method === "GET" && req.url === "/health") {
      setCorsHeaders(res, origin);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    if (req.method === "POST" && req.url === "/mcp") {
      setCorsHeaders(res, origin);

      // Pre-read the body to work around stream-consumption issues with
      // @hono/node-server's Web Standard API adapter (observed on macOS Docker Desktop).
      const chunks: Buffer[] = [];
      let totalBytes = 0;
      for await (const chunk of req) {
        totalBytes += (chunk as Buffer).byteLength;
        if (totalBytes > MAX_BODY_BYTES) {
          res
            .writeHead(413, { "Content-Type": "application/json" })
            .end(JSON.stringify({ error: "Request body too large" }));
          return;
        }
        chunks.push(chunk as Buffer);
      }

      const rawBody = Buffer.concat(chunks).toString();
      let parsedBody: unknown;
      try {
        parsedBody = rawBody ? JSON.parse(rawBody) : undefined;
      } catch {
        res
          .writeHead(400, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }

      const transport = await createMcpRequestHandler();
      try {
        await transport.handleRequest(req, res, parsedBody);
      } catch (err) {
        process.stderr.write(`[phrase-mcp] handleRequest error: ${err}\n`);
        if (!res.writableEnded) res.writeHead(500).end();
      } finally {
        await transport.close();
      }
      return;
    }

    res.writeHead(404).end();
  });

  function shutdown() {
    httpServer.close(() => process.exit(0));
    // Force-exit after 10 s if connections don't drain; exit 0 so orchestrators
    // (ECS, Kubernetes) don't treat a timeout shutdown as a crash.
    setTimeout(() => process.exit(0), 10_000).unref();
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  httpServer.listen(PORT, () => {
    process.stderr.write(`Phrase MCP server listening on port ${PORT}\n`);
  });
}
