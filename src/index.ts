#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadProductRuntimes } from "#config";
import { APP_NAME, APP_VERSION } from "#lib/runtime-info";
import { connectorsModule } from "#products/connectors";
import { productModules } from "#products/index";
import type { AnyProductRuntime } from "#products/types";
import { stringsModule } from "#products/strings/index";
import { tmsModule } from "#products/tms/index";

const server = new McpServer({
  name: APP_NAME,
  version: APP_VERSION,
});

const runtimes = await loadProductRuntimes(productModules);
if (runtimes.length === 0) {
  throw new Error(
    "No Phrase products are configured. Set credentials for at least one enabled product.",
  );
}

function registerRuntime(runtime: AnyProductRuntime): void {
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
  }
}

for (const runtime of runtimes) {
  registerRuntime(runtime);
}

const transport = new StdioServerTransport();
await server.connect(transport);
