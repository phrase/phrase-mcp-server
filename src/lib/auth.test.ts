import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UnifiedAccessTokenProvider } from "#lib/auth.js";

describe("UnifiedAccessTokenProvider", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  function mockTokenResponse<T extends object>(body: T, options: { ok: boolean; status: number }) {
    const { ok, status } = options;
    const text = JSON.stringify(body);
    fetchMock.mockResolvedValue({
      ok,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(text),
    });
  }

  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.reject(new Error("fetch not mocked")));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("accepts region 'eu' and stores it normalized", () => {
      const provider = new UnifiedAccessTokenProvider("token", "eu");

      expect(provider).toBeDefined();
    });

    it("accepts region 'us' and stores it normalized", () => {
      const provider = new UnifiedAccessTokenProvider("token", "us");

      expect(provider).toBeDefined();
    });

    it("accepts region with whitespace and mixed case (eu, us)", () => {
      const p1 = new UnifiedAccessTokenProvider("t", " EU ");
      const p2 = new UnifiedAccessTokenProvider("t", "US");

      expect(p1).toBeDefined();
      expect(p2).toBeDefined();
    });

    it("throws when region is unsupported", () => {
      expect(() => new UnifiedAccessTokenProvider("token", "moon")).toThrow(
        "Unsupported region 'moon'. Expected 'eu' or 'us'.",
      );
    });

    it("throws when region is empty", () => {
      expect(() => new UnifiedAccessTokenProvider("token", "")).toThrow(
        "Unsupported region ''. Expected 'eu' or 'us'.",
      );
    });
  });

  describe("getAccessToken", () => {
    it("returns access_token from valid response (200, access_token, expires_in)", async () => {
      mockTokenResponse({ access_token: "secret-123", expires_in: 600 }, { ok: true, status: 200 });

      const provider = new UnifiedAccessTokenProvider("my-token", "eu");
      const token = await provider.getAccessToken();

      expect(token).toBe("secret-123");
      expect(fetchMock).toHaveBeenLastCalledWith(
        "https://eu.phrase.com/idm/oauth/token",
        expect.objectContaining({
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: expect.any(URLSearchParams),
        }),
      );
      const body = fetchMock.mock.lastCall![1]!.body as URLSearchParams;
      expect(body.get("grant_type")).toBe("urn:ietf:params:oauth:grant-type:token-exchange");
      expect(body.get("subject_token_type")).toBe("urn:phrase:params:oauth:token-type:api_token");
      expect(body.get("requested_token_type")).toBe(
        "urn:ietf:params:oauth:token-type:access_token",
      );
      expect(body.get("subject_token")).toBe("my-token");
    });

    it("uses correct endpoint for region 'us'", async () => {
      mockTokenResponse({ access_token: "t", expires_in: 60 }, { ok: true, status: 200 });

      const provider = new UnifiedAccessTokenProvider("x", "us");
      await provider.getAccessToken();

      expect(fetchMock).toHaveBeenCalledWith(
        "https://us.phrase.com/idm/oauth/token",
        expect.any(Object),
      );
    });

    it("throws when server returns non-OK status", async () => {
      mockTokenResponse(
        { error: "unauthorized", error_description: "Bad token" },
        { ok: false, status: 401 },
      );

      const provider = new UnifiedAccessTokenProvider("bad", "eu");

      await expect(provider.getAccessToken()).rejects.toThrow(
        /Unified token exchange failed \(401\)/,
      );
    });

    it("throws when response does not include access_token", async () => {
      mockTokenResponse({ expires_in: 600 }, { ok: true, status: 200 });

      const provider = new UnifiedAccessTokenProvider("t", "eu");

      await expect(provider.getAccessToken()).rejects.toThrow(
        "Unified token exchange response did not include access_token.",
      );
    });

    it("uses default expires_in when missing in response", async () => {
      mockTokenResponse({ access_token: "ok" }, { ok: true, status: 200 });

      const provider = new UnifiedAccessTokenProvider("t", "eu");
      const token = await provider.getAccessToken();

      expect(token).toBe("ok");
    });
  });
});
