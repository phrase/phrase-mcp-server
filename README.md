# Phrase MCP Server

MCP server exposing tools for Phrase products over stdio.

## Features

- Product-based tool registration with env toggles
- Product-level client override support (each product module can define its own API client)
- Tools split into separate files for easier extension
- Strings tools (using `phrase-js` client by default):
  - `strings_list_projects`
  - `strings_list_locales`
  - `strings_list_keys`
  - `strings_list_translations`
- Generic GET tools for additional products:
  - `tms_get`
  - `orchestrator_get`
  - `analytics_get`

## Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- A Phrase token with access to your projects

## Setup

```bash
npm install
cp .env.example .env
```

Set env vars in `.env`.

### Product Enable/Disable

- `PHRASE_ENABLED_PRODUCTS`: comma-separated list of `strings,tms,orchestrator,analytics`
- `PHRASE_DISABLED_PRODUCTS`: comma-separated products to remove from enabled set
- Default behavior: all products are enabled

Examples:

```bash
PHRASE_ENABLED_PRODUCTS=strings,tms
```

```bash
PHRASE_DISABLED_PRODUCTS=analytics,orchestrator
```

### Product Configuration

For each product, set:

- `PHRASE_<PRODUCT>_BASE_URL`
- `PHRASE_<PRODUCT>_TOKEN`
- Optional: `PHRASE_<PRODUCT>_AUTH_HEADER` (default `Authorization`)
- Optional: `PHRASE_<PRODUCT>_AUTH_PREFIX` (default `Bearer`, Strings default `token`)

Strings compatibility shortcuts are supported:

- `PHRASE_STRINGS_TOKEN` (required for Strings)
- `PHRASE_BASE_URL` (same as `PHRASE_STRINGS_BASE_URL`, default `https://api.phrase.com/v2`)

## Run

For local development:

```bash
npm run dev
```

For production:

```bash
npm run build
npm start
```

## MCP Client Configuration Example

Example for a local MCP client config:

```json
{
  "mcpServers": {
    "phrase": {
      "command": "node",
      "args": ["/absolute/path/to/phrase-mcp-server/dist/index.js"],
      "env": {
        "PHRASE_STRINGS_TOKEN": "your_phrase_strings_token",
        "PHRASE_ENABLED_PRODUCTS": "strings"
      }
    }
  }
}
```

If your client supports dotenv automatically, you can also launch through:

```bash
npm run dev
```
