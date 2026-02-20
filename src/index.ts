#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadProductRuntimes } from "#config.js";
import { productModules } from "#products/index.js";
import type { AnyProductRuntime } from "#products/types.js";
import { analyticsModule } from "#products/analytics/index.js";
import { orchestratorModule } from "#products/orchestrator/index.js";
import { stringsModule } from "#products/strings/index.js";
import { tmsModule } from "#products/tms/index.js";

const server = new McpServer({
  name: "phrase-mcp-server",
  version: "0.1.0",
});

const runtimes = await loadProductRuntimes(productModules);
if (runtimes.length === 0) {
  throw new Error(
    "No Phrase products are configured. Set credentials for at least one enabled product.",
  );
}

function registerRuntime(runtime: AnyProductRuntime): void {
  switch (runtime.key) {
    case "strings":
      stringsModule.register(server, runtime);
      return;
    case "tms":
      tmsModule.register(server, runtime);
      return;
    case "orchestrator":
      orchestratorModule.register(server, runtime);
      return;
    case "analytics":
      analyticsModule.register(server, runtime);
      return;
  }
}

for (const runtime of runtimes) {
  registerRuntime(runtime);
}

const transport = new StdioServerTransport();
await server.connect(transport);
