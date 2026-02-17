const TOKEN_EXCHANGE_GRANT = "urn:ietf:params:oauth:grant-type:token-exchange";
const REFRESH_SAFETY_WINDOW_MS = 30_000;
const DEFAULT_EXPIRES_IN_SECONDS = 10 * 60;

interface UnifiedAccessTokenResponse {
  access_token?: string;
  expires_in?: number;
}

function normalizeRegion(region: string): string {
  const value = region.trim().toLowerCase();
  if (value === "eu" || value === "us") {
    return value;
  }
  throw new Error(`Unsupported PHRASE_REGION '${region}'. Expected 'eu' or 'us'.`);
}

export class TmsUnifiedTokenProvider {
  private readonly phraseApiToken: string;
  private readonly region: string;
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  constructor(phraseApiToken: string, region: string) {
    this.phraseApiToken = phraseApiToken;
    this.region = normalizeRegion(region);
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now + REFRESH_SAFETY_WINDOW_MS < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    const endpoint = `https://${this.region}.phrase.com/idm/oauth/token`;
    const body = new URLSearchParams({
      grant_type: TOKEN_EXCHANGE_GRANT,
      subject_token: this.phraseApiToken,
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const payload = (await response.json()) as UnifiedAccessTokenResponse;
    if (!response.ok) {
      const message = typeof payload === "object" ? JSON.stringify(payload) : String(payload);
      throw new Error(`Unified token exchange failed (${response.status}): ${message}`);
    }

    if (!payload.access_token) {
      throw new Error("Unified token exchange response did not include access_token.");
    }

    const expiresInMs = (payload.expires_in ?? DEFAULT_EXPIRES_IN_SECONDS) * 1000;
    this.accessToken = payload.access_token;
    this.accessTokenExpiresAt = now + expiresInMs;
    return this.accessToken;
  }
}
