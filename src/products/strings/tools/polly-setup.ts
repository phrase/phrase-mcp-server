import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Polly, type PollyConfig } from "@pollyjs/core";
import FetchAdapter from "@pollyjs/adapter-fetch";
import FSPersister from "@pollyjs/persister-fs";
import { StringsClient } from "#products/strings/client";
import type { ProductRuntime } from "#products/types";

Polly.register(FetchAdapter as Parameters<typeof Polly.register>[0]);
Polly.register(FSPersister as Parameters<typeof Polly.register>[0]);

const RECORDINGS_DIR = join(dirname(fileURLToPath(import.meta.url)), "__recordings__");

/**
 * Create a Polly instance for a test. Cassettes are stored under __recordings__/<cassetteName>.
 *
 * Run with POLLY_MODE=record to capture real API interactions.
 * Default mode is "replay" — no network, no token required.
 */
export function createPolly(cassetteName: string): Polly {
  const mode = (process.env.POLLY_MODE ?? "replay") as PollyConfig["mode"];

  const polly = new Polly(cassetteName, {
    adapters: ["fetch"],
    persister: "fs",
    persisterOptions: { fs: { recordingsDir: RECORDINGS_DIR } },
    mode,
    recordIfMissing: false,
    // Match on method + URL (path only, no query).
    // Ignoring headers and body means auth tokens and multipart boundaries
    // don't affect matching; request order differentiates sibling calls.
    matchRequestsBy: {
      headers: false,
      body: false,
      url: { query: false },
    },
  });

  // Normalize multipart form boundaries so push uploads match consistently.
  // The boundary string is randomly generated each run; replace it with a fixed token.
  polly.server.any().on("request", (req) => {
    const contentType = (req.getHeader("content-type") as string | undefined) ?? "";
    const boundaryMatch = contentType.match(/boundary=([^;,\s]+)/);
    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      const escaped = boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (typeof req.body === "string") {
        req.body = req.body.replace(new RegExp(escaped, "g"), "POLLY_BOUNDARY");
      }
      req.headers["content-type"] = contentType.replace(boundary, "POLLY_BOUNDARY");
    }
  });

  // Scrub auth tokens before writing cassettes so they're safe to commit.
  polly.server.any().on("beforePersist", (_req, recording) => {
    // Scrub Authorization request header
    for (const header of recording.request.headers ?? []) {
      if ((header.name as string).toLowerCase() === "authorization") {
        header.value = "Bearer REDACTED";
      }
    }
    // Scrub sensitive fields from IDM token exchange request body
    if (
      typeof recording.request.body === "string" &&
      recording.request.body.includes("subject_token")
    ) {
      recording.request.body = recording.request.body.replace(
        /subject_token=[^&]*/,
        "subject_token=REDACTED",
      );
    }
    // Scrub access_token from IDM token exchange response body
    if (typeof recording.response.content?.text === "string") {
      recording.response.content.text = recording.response.content.text.replace(
        /"access_token"\s*:\s*"[^"]*"/,
        '"access_token":"REDACTED"',
      );
    }
  });

  return polly;
}

/** Build a real StringsClient. Token is only needed when recording. */
export function makeStringsRuntime(): ProductRuntime<"strings"> {
  const client = new StringsClient({
    key: "strings",
    region: "eu",
    baseUrl: "https://api.phrase.com/v2",
    authHeader: "Authorization",
    // PHRASE_STRINGS_TOKEN is the Phrase API key (same env var used by the MCP server).
    // In replay mode any non-empty value works since cassettes are matched without headers.
    authToken: process.env.PHRASE_STRINGS_TOKEN ?? "replay-token",
    // "Bearer" triggers UnifiedAccessTokenProvider (OAuth token exchange via Phrase IDM).
    authPrefix: "Bearer",
  });
  return { key: "strings", client };
}
