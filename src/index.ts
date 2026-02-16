import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadProductRuntimes } from "./config.js";
import { productModules } from "./products/index.js";

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

for (const runtime of runtimes) {
  const module = productModules.find((candidate) => candidate.key === runtime.key);
  if (!module) {
    continue;
  }
  module.register(server, runtime);
}

const transport = new StdioServerTransport();
await server.connect(transport);
