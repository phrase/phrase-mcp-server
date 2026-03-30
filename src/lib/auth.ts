const TOKEN_EXCHANGE_GRANT = "urn:ietf:params:oauth:grant-type:token-exchange";
const TOKEN_EXCHANGE_SUBJECT_TOKEN_TYPE = "urn:phrase:params:oauth:token-type:api_token";
const TOKEN_EXCHANGE_REQUESTED_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:access_token";
const REFRESH_SAFETY_WINDOW_MS = 30_000;
const DEFAULT_EXPIRES_IN_SECONDS = 10 * 60;
const MAX_ERROR_BODY_LENGTH = 500;

export interface UnifiedAccessTokenResponse {
  access_token?: string;
  expires_in?: number;
}

function summarizeErrorBody(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return "empty response body";
  }
  if (trimmed.length <= MAX_ERROR_BODY_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_ERROR_BODY_LENGTH)}...`;
}

function normalizeRegion(region: string): string {
  const value = region.trim().toLowerCase();
  if (value === "eu" || value === "us") {
    return value;
  }
  throw new Error(`Unsupported region '${region}'. Expected 'eu' or 'us'.`);
}

export interface AccessTokenProvider {
  getAccessToken(): Promise<string>;
}

export class UnifiedAccessTokenProvider implements AccessTokenProvider {
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
      subject_token_type: TOKEN_EXCHANGE_SUBJECT_TOKEN_TYPE,
      requested_token_type: TOKEN_EXCHANGE_REQUESTED_TOKEN_TYPE,
      subject_token: this.phraseApiToken,
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    const rawBody = await response.text();
    let payload: UnifiedAccessTokenResponse | null = null;
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody) as UnifiedAccessTokenResponse;
      } catch {
        if (!response.ok) {
          throw new Error(
            `Unified token exchange failed (${response.status}): ${summarizeErrorBody(rawBody)}`,
          );
        }
        throw new Error("Unified token exchange response was not valid JSON.");
      }
    }

    if (!response.ok) {
      const message = payload ? JSON.stringify(payload) : summarizeErrorBody(rawBody);
      throw new Error(`Unified token exchange failed (${response.status}): ${message}`);
    }

    if (!payload?.access_token) {
      throw new Error("Unified token exchange response did not include access_token.");
    }

    const expiresInMs = (payload.expires_in ?? DEFAULT_EXPIRES_IN_SECONDS) * 1000;
    this.accessToken = payload.access_token;
    this.accessTokenExpiresAt = now + expiresInMs;
    return this.accessToken;
  }
}

export class ConnectorsAccessTokenProvider implements AccessTokenProvider {
  private readonly subjectToken: string;
  private readonly tokenEndpoint: string;
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  constructor(subjectToken: string, baseUrl: string) {
    const parsedBaseUrl = new URL(baseUrl);

    this.subjectToken = subjectToken;
    this.tokenEndpoint = new URL("/idm/oauth/token", parsedBaseUrl.origin).toString();
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now + REFRESH_SAFETY_WINDOW_MS < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    const body = new URLSearchParams({
      grant_type: TOKEN_EXCHANGE_GRANT,
      subject_token: this.subjectToken,
    });

    const response = await fetch(this.tokenEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.subjectToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    const rawBody = await response.text();
    let payload: UnifiedAccessTokenResponse | null = null;
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody) as UnifiedAccessTokenResponse;
      } catch {
        if (!response.ok) {
          throw new Error(
            `Connectors token exchange failed (${response.status}): ${summarizeErrorBody(rawBody)}`,
          );
        }
        throw new Error("Connectors token exchange response was not valid JSON.");
      }
    }

    if (!response.ok) {
      const message = payload ? JSON.stringify(payload) : summarizeErrorBody(rawBody);
      throw new Error(`Connectors token exchange failed (${response.status}): ${message}`);
    }

    if (!payload?.access_token) {
      throw new Error("Connectors token exchange response did not include access_token.");
    }

    const expiresInMs = (payload.expires_in ?? DEFAULT_EXPIRES_IN_SECONDS) * 1000;
    this.accessToken = payload.access_token;
    this.accessTokenExpiresAt = now + expiresInMs;
    return this.accessToken;
  }
}
