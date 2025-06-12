// Shopify Customer Account API Authentication Utilities

export interface CustomerAccountConfig {
  clientId: string;
  shopId: string;
  redirectUri: string;
  scope?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
}

// Generate a random code verifier for PKCE
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(String.fromCharCode.apply(null, Array.from(array)));
}

// Generate code challenge from verifier
export async function generateCodeChallenge(
  codeVerifier: string
): Promise<string> {
  const digestOp = await crypto.subtle.digest(
    { name: "SHA-256" },
    new TextEncoder().encode(codeVerifier)
  );
  const hash = convertBufferToString(digestOp);
  return base64UrlEncode(hash);
}

// Generate state parameter for CSRF protection
export function generateState(): string {
  const timestamp = Date.now().toString();
  const randomString = Math.random().toString(36).substring(2);
  return timestamp + randomString;
}

// Generate nonce for replay attack protection
export function generateNonce(length: number = 16): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    nonce += characters.charAt(randomIndex);
  }

  return nonce;
}

// Build authorization URL
export async function buildAuthorizationUrl(
  config: CustomerAccountConfig,
  isConfidentialClient: boolean = false
): Promise<{
  url: string;
  codeVerifier: string;
  state: string;
  nonce: string;
}> {
  const codeVerifier = generateCodeVerifier();
  const state = generateState();
  const nonce = generateNonce();

  const authUrl = new URL(
    `https://shopify.com/authentication/${config.shopId}/oauth/authorize`
  );

  authUrl.searchParams.append(
    "scope",
    config.scope || "openid email customer-account-api:full"
  );
  authUrl.searchParams.append("client_id", config.clientId);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("redirect_uri", config.redirectUri);
  authUrl.searchParams.append("state", state);
  authUrl.searchParams.append("nonce", nonce);

  // Only use PKCE for public clients
  if (!isConfidentialClient) {
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    authUrl.searchParams.append("code_challenge", codeChallenge);
    authUrl.searchParams.append("code_challenge_method", "S256");
  }

  return {
    url: authUrl.toString(),
    codeVerifier,
    state,
    nonce,
  };
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  config: CustomerAccountConfig,
  code: string,
  codeVerifier: string,
  clientSecret?: string
): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.append("grant_type", "authorization_code");
  body.append("client_id", config.clientId);
  body.append("redirect_uri", config.redirectUri);
  body.append("code", code);

  // For public clients, use PKCE
  if (!clientSecret) {
    body.append("code_verifier", codeVerifier);
  }

  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
    "User-Agent": "Mozilla/5.0 (compatible; Shopify-Customer-Account-API)",
  };

  // Add Origin header if we're in a browser environment
  if (typeof window !== "undefined") {
    headers["Origin"] = window.location.origin;
  }

  // For confidential clients, use client secret in Authorization header
  if (clientSecret) {
    const credentials = btoa(`${config.clientId}:${clientSecret}`);
    headers["Authorization"] = `Basic ${credentials}`;
  }

  const response = await fetch(
    `https://shopify.com/authentication/${config.shopId}/oauth/token`,
    {
      method: "POST",
      headers,
      body,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Token exchange failed: ${response.status} ${response.statusText}`;

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage += ` - ${JSON.stringify(errorJson)}`;
    } catch {
      errorMessage += ` - ${errorText}`;
    }

    // Log additional debugging info for 401 errors
    if (response.status === 401) {
      console.error("Token Exchange 401 Error Details:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        clientId: config.clientId,
        shopId: config.shopId,
        redirectUri: config.redirectUri,
        hasClientSecret: !!clientSecret,
      });
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// Refresh access token
export async function refreshAccessToken(
  config: CustomerAccountConfig,
  refreshToken: string,
  clientSecret?: string
): Promise<Omit<TokenResponse, "id_token">> {
  const body = new URLSearchParams();
  body.append("grant_type", "refresh_token");
  body.append("client_id", config.clientId);
  body.append("refresh_token", refreshToken);

  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
    "User-Agent": "Mozilla/5.0 (compatible; Shopify-Customer-Account-API)",
  };

  // Add Origin header if we're in a browser environment
  if (typeof window !== "undefined") {
    headers["Origin"] = window.location.origin;
  }

  // For confidential clients, use client secret in Authorization header
  if (clientSecret) {
    const credentials = btoa(`${config.clientId}:${clientSecret}`);
    headers["Authorization"] = `Basic ${credentials}`;
  }

  const response = await fetch(
    `https://shopify.com/authentication/${config.shopId}/oauth/token`,
    {
      method: "POST",
      headers,
      body,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Token refresh failed: ${response.status} ${response.statusText}`;

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage += ` - ${JSON.stringify(errorJson)}`;
    } catch {
      errorMessage += ` - ${errorText}`;
    }

    // Log additional debugging info for 401 errors
    if (response.status === 401) {
      console.error("Token Refresh 401 Error Details:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        clientId: config.clientId,
        shopId: config.shopId,
        hasClientSecret: !!clientSecret,
      });
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// Make authenticated request to Customer Account API
export async function makeCustomerAccountRequest(
  shopId: string,
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    // Required headers to prevent 401/403 errors
    "User-Agent": "Mozilla/5.0 (compatible; Shopify-Customer-Account-API)",
  };

  // Add Origin header if we're in a browser environment
  if (typeof window !== "undefined") {
    headers["Origin"] = window.location.origin;
  }

  const response = await fetch(
    `https://shopify.com/${shopId}/account/customer/api/2025-04/graphql`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        variables: variables || {},
      }),
    }
  );

  // Enhanced error handling
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `GraphQL request failed: ${response.status} ${response.statusText}`;

    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.errors) {
        errorMessage += ` - ${JSON.stringify(errorJson.errors)}`;
      }
    } catch {
      errorMessage += ` - ${errorText}`;
    }

    // Log additional debugging info for 401 errors
    if (response.status === 401) {
      console.error("401 Error Details:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        shopId,
        accessToken: accessToken
          ? `${accessToken.substring(0, 10)}...`
          : "missing",
      });
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// Decode JWT token
export function decodeJwt(token: string) {
  const [header, payload, signature] = token.split(".");

  const decodedHeader = JSON.parse(atob(header));
  const decodedPayload = JSON.parse(atob(payload));

  return {
    header: decodedHeader,
    payload: decodedPayload,
    signature,
  };
}

// Helper functions
function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  // This is to ensure that the encoding does not have +, /, or = characters in it.
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function convertBufferToString(hash: ArrayBuffer): string {
  const uintArray = new Uint8Array(hash);
  const numberArray = Array.from(uintArray);
  return String.fromCharCode(...numberArray);
}
