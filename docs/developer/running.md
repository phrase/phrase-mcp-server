# Running Published vs Local Builds

Use this guide to choose between running a released package (`npx`) and running local source changes (`node`).

## Option 1: Run a Released Version (`npx`)

Use this when you want the published npm package.

```toml
[mcp_servers.phrase]
command = "npx"
args = ["-y", "phrase-mcp-server"]
```

Characteristics:

- Uses the latest published release from npm.
- No local build required.
- Best for normal usage in MCP clients.

## Option 2: Run Local Changes (`node`)

Use this when testing code before release.

1. Build local output:

```bash
npm run build
```

2. Point your MCP client to the built entrypoint:

```toml
[mcp_servers.phrase]
command = "node"
args = ["/absolute/path/to/phrase-mcp-server/dist/index.js"]
```

Characteristics:

- Runs your local branch, including un-released changes.
- Requires rebuilding (`npm run build`) after TypeScript changes.
- Best for development and verification before tagging a release.
