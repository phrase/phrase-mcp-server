import { afterEach, describe, expect, it, vi } from "vitest";
import { StringsClient } from "#products/strings/client.js";

function asUrl(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  if (input instanceof Request) {
    return input.url;
  }
  return String(input);
}

function asBodyString(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URLSearchParams) {
    return input.toString();
  }
  return String(input ?? "");
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("StringsClient auth", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("uses static token auth when auth prefix is token", async () => {
    const fetchMock = vi.fn(async (input: unknown, _init?: RequestInit) => {
      const url = asUrl(input);
      if (url.startsWith("https://api.example.com/projects")) {
        return jsonResponse([]);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new StringsClient({
      key: "strings",
      region: "eu",
      baseUrl: "https://api.example.com",
      authHeader: "Authorization",
      authToken: "direct-token",
      authPrefix: "token",
    });

    await client.projectsApi.projectsList({});

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0];
    const headers = new Headers((request[1]?.headers as HeadersInit | undefined) ?? {});
    expect(headers.get("Authorization")).toBe("token direct-token");
  });

  it("uses unified token exchange when auth prefix is Bearer", async () => {
    const fetchMock = vi.fn(async (input: unknown, _init?: RequestInit) => {
      const url = asUrl(input);
      if (url === "https://eu.phrase.com/idm/oauth/token") {
        return jsonResponse({ access_token: "exchanged-access-token", expires_in: 600 });
      }
      if (url.startsWith("https://api.example.com/projects")) {
        return jsonResponse([]);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new StringsClient({
      key: "strings",
      region: "eu",
      baseUrl: "https://api.example.com",
      authHeader: "Authorization",
      authToken: "platform-token",
      authPrefix: "Bearer",
    });

    await client.projectsApi.projectsList({});
    await client.projectsApi.projectsList({});

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(asUrl(fetchMock.mock.calls[0][0])).toBe("https://eu.phrase.com/idm/oauth/token");
    const tokenExchangeRequest = fetchMock.mock.calls[0][1];
    const tokenExchangeHeaders = new Headers(
      (tokenExchangeRequest?.headers as HeadersInit | undefined) ?? {},
    );
    const tokenExchangeBody = asBodyString(tokenExchangeRequest?.body);
    expect(tokenExchangeHeaders.get("Content-Type")).toBe("application/x-www-form-urlencoded");
    expect(tokenExchangeHeaders.get("Accept")).toBe("application/json");
    expect(tokenExchangeBody).toContain(
      "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Atoken-exchange",
    );
    expect(tokenExchangeBody).toContain(
      "subject_token_type=urn%3Aphrase%3Aparams%3Aoauth%3Atoken-type%3Aapi_token",
    );
    expect(tokenExchangeBody).toContain(
      "requested_token_type=urn%3Aietf%3Aparams%3Aoauth%3Atoken-type%3Aaccess_token",
    );
    expect(tokenExchangeBody).toContain("subject_token=platform-token");

    const firstApiHeaders = new Headers(
      (fetchMock.mock.calls[1][1]?.headers as HeadersInit | undefined) ?? {},
    );
    const secondApiHeaders = new Headers(
      (fetchMock.mock.calls[2][1]?.headers as HeadersInit | undefined) ?? {},
    );
    expect(firstApiHeaders.get("Authorization")).toBe("Bearer exchanged-access-token");
    expect(secondApiHeaders.get("Authorization")).toBe("Bearer exchanged-access-token");
  });
});
