// Shopify Customer Account API Authentication
// Implements OAuth 2.0 with PKCE for public clients

/**
 * Generates a cryptographically secure random string for PKCE code verifier
 * Following Shopify's recommended implementation
 * @returns Promise<string> - Base64URL encoded random string
 */
export async function generateCodeVerifier(): Promise<string> {
  const rando = generateRandomCode();
  return base64UrlEncode(rando);
}

/**
 * Generates code challenge from code verifier using SHA256
 * Following Shopify's recommended implementation
 * @param codeVerifier - The code verifier string
 * @returns Promise<string> - Base64URL encoded SHA256 hash of verifier
 */
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

/**
 * Generates a state parameter for CSRF protection
 * Following Shopify's recommended implementation
 * @returns string - State string combining timestamp and random string
 */
export function generateState(): string {
  const timestamp = Date.now().toString();
  const randomString = Math.random().toString(36).substring(2);
  return timestamp + randomString;
}

/**
 * Generates a nonce (number used once) for replay attack protection
 * Following Shopify's recommended implementation
 * @param length - Length of the nonce string to generate
 * @returns string - Random nonce string using alphanumeric characters
 */
export function generateNonce(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    nonce += characters.charAt(randomIndex);
  }

  return nonce;
}

/**
 * Generates a cryptographically secure random code for PKCE
 * Following Shopify's recommended implementation
 * @returns string - Random string from crypto values
 */
function generateRandomCode(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return String.fromCharCode.apply(null, Array.from(array));
}

/**
 * Base64URL encode without padding
 * Following Shopify's recommended implementation
 * @param str - String to encode
 * @returns string - Base64URL encoded string
 */
function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  // This is to ensure that the encoding does not have +, /, or = characters in it.
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Converts ArrayBuffer to string
 * Following Shopify's recommended implementation
 * @param hash - ArrayBuffer from crypto.subtle.digest
 * @returns string - String representation of the buffer
 */
function convertBufferToString(hash: ArrayBuffer): string {
  const uintArray = new Uint8Array(hash);
  const numberArray = Array.from(uintArray);
  return String.fromCharCode(...numberArray);
}

/**
 * Configuration for Shopify Customer Account API authentication
 */
export interface ShopifyAuthConfig {
  shopId: string;
  clientId: string;
  redirectUri: string;
  scope?: string;
  locale?: string;
}

/**
 * Parameters for authorization request
 */
export interface AuthorizationParams {
  scope: string;
  clientId: string;
  responseType: "code";
  redirectUri: string;
  state: string;
  nonce: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  prompt?: "none";
  locale?: string;
}

/**
 * Token exchange request payload for public clients
 */
export interface TokenExchangeRequest {
  grant_type: "authorization_code";
  client_id: string;
  code: string;
  redirect_uri: string;
  code_verifier: string;
}

/**
 * Refresh token request payload
 */
export interface RefreshTokenRequest {
  grant_type: "refresh_token";
  client_id: string;
  refresh_token: string;
}

/**
 * Access token response from Shopify
 */
export interface AccessTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token?: string;
}

/**
 * Refresh token response from Shopify (no id_token in refresh)
 */
export interface RefreshTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
}

/**
 * Token error response from Shopify
 */
export interface TokenErrorResponse {
  error: string;
  error_description?: string;
}

/**
 * Creates the authorization URL for Shopify Customer Account API
 * @param config - Shopify authentication configuration
 * @param options - Additional options for the authorization request
 * @returns Promise<{url: string, state: string, nonce: string, codeVerifier: string}>
 */
export async function createAuthorizationUrl(
  config: ShopifyAuthConfig,
  options: {
    prompt?: "none";
    locale?: string;
  } = {}
): Promise<{
  url: string;
  state: string;
  nonce: string;
  codeVerifier: string;
}> {
  // Generate PKCE parameters
  const codeVerifier = await generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Generate security parameters
  const state = generateState();
  const nonce = generateNonce(16); // Generate 16-character nonce

  // Build authorization URL
  const authorizationUrl = new URL(
    `https://shopify.com/authentication/${config.shopId}/oauth/authorize`
  );

  const params: AuthorizationParams = {
    scope: config.scope || "openid email customer-account-api:full",
    clientId: config.clientId,
    responseType: "code",
    redirectUri: config.redirectUri,
    state,
    nonce,
    codeChallenge,
    codeChallengeMethod: "S256",
  };

  // Add optional parameters
  if (options.prompt) {
    params.prompt = options.prompt;
  }

  if (options.locale || config.locale) {
    params.locale = options.locale || config.locale;
  }

  // Append all parameters to URL
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      authorizationUrl.searchParams.append(
        key === "clientId"
          ? "client_id"
          : key === "responseType"
          ? "response_type"
          : key === "redirectUri"
          ? "redirect_uri"
          : key === "codeChallenge"
          ? "code_challenge"
          : key === "codeChallengeMethod"
          ? "code_challenge_method"
          : key,
        value
      );
    }
  });

  return {
    url: authorizationUrl.toString(),
    state,
    nonce,
    codeVerifier,
  };
}

/**
 * Exchanges authorization code for access tokens
 * @param config - Shopify authentication configuration
 * @param code - Authorization code received from callback
 * @param codeVerifier - PKCE code verifier used in authorization
 * @returns Promise<AccessTokenResponse> - Access token response
 */
export async function exchangeCodeForTokens(
  config: ShopifyAuthConfig,
  code: string,
  codeVerifier: string
): Promise<AccessTokenResponse> {
  const tokenUrl = `https://shopify.com/authentication/${config.shopId}/oauth/token`;

  // Prepare request body
  const body = new URLSearchParams();
  body.append("grant_type", "authorization_code");
  body.append("client_id", config.clientId);
  body.append("code", code);
  body.append("redirect_uri", config.redirectUri);
  body.append("code_verifier", codeVerifier);

  // Prepare headers
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    "User-Agent": "ShopifyCustomerAuth/1.0", // Required to avoid 403 errors
  };

  // Add Origin header if we're in a browser environment
  if (typeof window !== "undefined") {
    headers["Origin"] = window.location.origin;
  }

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      let errorData: TokenErrorResponse;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: "unknown_error",
          error_description: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Handle specific error cases mentioned in documentation
      if (response.status === 301) {
        throw new Error(
          "Invalid shop_id: Ensure the correct shop_id is specified in the request"
        );
      }

      if (response.status === 400 && errorData.error === "invalid_grant") {
        throw new Error(
          "Invalid grant: Check that base64 padding is removed from code challenge and URL encoding is correct"
        );
      }

      if (response.status === 401 && errorData.error === "invalid_client") {
        throw new Error("Invalid client: Verify that the client_id is correct");
      }

      if (response.status === 401 && errorData.error === "invalid_token") {
        throw new Error(
          "Invalid token: Ensure Origin header is set and matches JavaScript Origins in Customer Account API settings"
        );
      }

      if (response.status === 403) {
        throw new Error(
          "Access forbidden: Ensure User-Agent header is specified in the request"
        );
      }

      throw new Error(
        `Token exchange failed: ${errorData.error} - ${
          errorData.error_description || "Unknown error"
        }`
      );
    }

    const tokenData: AccessTokenResponse = await response.json();
    return tokenData;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Token exchange failed: ${String(error)}`);
  }
}

/**
 * Refreshes an access token using a refresh token
 * @param config - Shopify authentication configuration
 * @param refreshToken - The refresh token received from initial authentication
 * @returns Promise<RefreshTokenResponse> - New access token response
 */
export async function refreshAccessToken(
  config: ShopifyAuthConfig,
  refreshToken: string
): Promise<RefreshTokenResponse> {
  const tokenUrl = `https://shopify.com/authentication/${config.shopId}/oauth/token`;

  // Prepare request body
  const body = new URLSearchParams();
  body.append("grant_type", "refresh_token");
  body.append("client_id", config.clientId);
  body.append("refresh_token", refreshToken);

  // Prepare headers
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    "User-Agent": "ShopifyCustomerAuth/1.0", // Required to avoid 403 errors
  };

  // Add Origin header if we're in a browser environment
  if (typeof window !== "undefined") {
    headers["Origin"] = window.location.origin;
  }

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      let errorData: TokenErrorResponse;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: "unknown_error",
          error_description: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Handle specific error cases
      if (response.status === 400 && errorData.error === "invalid_grant") {
        throw new Error(
          "Invalid refresh token: The refresh token is invalid, expired, or revoked"
        );
      }

      if (response.status === 401 && errorData.error === "invalid_client") {
        throw new Error("Invalid client: Verify that the client_id is correct");
      }

      throw new Error(
        `Token refresh failed: ${errorData.error} - ${
          errorData.error_description || "Unknown error"
        }`
      );
    }

    const tokenData: RefreshTokenResponse = await response.json();
    return tokenData;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Token refresh failed: ${String(error)}`);
  }
}

/**
 * Complete authentication flow - exchanges stored code verifier for tokens
 * @param config - Shopify authentication configuration
 * @param code - Authorization code from callback
 * @returns Promise<AccessTokenResponse> - Access token response
 */
export async function completeAuthentication(
  config: ShopifyAuthConfig,
  code: string,
  useSecureCookies: boolean = process.env.NODE_ENV === "production"
): Promise<AccessTokenResponse> {
  const codeVerifier = getStoredCodeVerifier();
  if (!codeVerifier) {
    throw new Error("Code verifier not found in storage");
  }

  try {
    if (useSecureCookies) {
      // Use secure httpOnly cookies for production
      const tokens = await exchangeCodeForTokensServerWithCookies(
        code,
        codeVerifier,
        config,
        true
      );

      // Clear temporary auth storage since tokens are now in cookies
      clearAuthStorage();

      return tokens;
    } else {
      // Fallback to localStorage for development
      const tokens = await exchangeCodeForTokensServer(
        code,
        codeVerifier,
        config
      );
      const issuedAt = Date.now();
      storeTokens(tokens, issuedAt);
      clearAuthStorage();
      return tokens;
    }
  } catch (error) {
    // Clear storage on error to prevent stale data
    clearAuthStorage();
    throw error;
  }
}

/**
 * Initiates the Shopify Customer Account API authentication flow
 * Stores necessary parameters in localStorage and redirects to Shopify
 * @param config - Shopify authentication configuration
 * @param options - Additional options for the authorization request
 */
export async function initiateShopifyAuth(
  config: ShopifyAuthConfig,
  options: {
    prompt?: "none";
    locale?: string;
  } = {}
): Promise<void> {
  const { url, state, nonce, codeVerifier } = await createAuthorizationUrl(
    config,
    options
  );

  // Store parameters in localStorage for callback verification
  localStorage.setItem("shopify-auth-state", state);
  localStorage.setItem("shopify-auth-nonce", nonce);
  localStorage.setItem("shopify-auth-code-verifier", codeVerifier);

  // Redirect to Shopify authorization page
  window.location.href = url;
}

/**
 * Validates the callback parameters from Shopify
 * @param callbackUrl - The callback URL with query parameters
 * @returns {isValid: boolean, code?: string, error?: string}
 */
export function validateCallback(callbackUrl: string): {
  isValid: boolean;
  code?: string;
  error?: string;
  errorDescription?: string;
} {
  const url = new URL(callbackUrl);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Check for error response
  if (error) {
    return {
      isValid: false,
      error,
      errorDescription: errorDescription || undefined,
    };
  }

  // Validate state parameter
  const storedState = localStorage.getItem("shopify-auth-state");
  if (!state || !storedState || state !== storedState) {
    return {
      isValid: false,
      error: "invalid_state",
      errorDescription: "State parameter mismatch or missing",
    };
  }

  // Validate authorization code
  if (!code) {
    return {
      isValid: false,
      error: "missing_code",
      errorDescription: "Authorization code not received",
    };
  }

  return {
    isValid: true,
    code,
  };
}

/**
 * Clears stored authentication parameters from localStorage
 */
export function clearAuthStorage(): void {
  localStorage.removeItem("shopify-auth-state");
  localStorage.removeItem("shopify-auth-nonce");
  localStorage.removeItem("shopify-auth-code-verifier");
}

/**
 * Gets the stored code verifier for token exchange
 * @returns string | null - The stored code verifier or null if not found
 */
export function getStoredCodeVerifier(): string | null {
  return localStorage.getItem("shopify-auth-code-verifier");
}

/**
 * Gets the stored nonce for ID token validation
 * @returns string | null - The stored nonce or null if not found
 */
export function getStoredNonce(): string | null {
  return localStorage.getItem("shopify-auth-nonce");
}

/**
 * Checks if an access token is expired or will expire soon
 * @param expiresIn - Token expiration time in seconds
 * @param issuedAt - When the token was issued (timestamp in milliseconds)
 * @param bufferSeconds - Buffer time in seconds before considering token expired (default: 300 = 5 minutes)
 * @returns boolean - True if token is expired or will expire soon
 */
export function isTokenExpired(
  expiresIn: number,
  issuedAt: number,
  bufferSeconds: number = 300
): boolean {
  const now = Date.now();
  const expirationTime = issuedAt + expiresIn * 1000;
  const bufferTime = bufferSeconds * 1000;

  return now + bufferTime >= expirationTime;
}

/**
 * Calculates the expiration timestamp for a token
 * @param expiresIn - Token expiration time in seconds
 * @param issuedAt - When the token was issued (timestamp in milliseconds, defaults to now)
 * @returns number - Expiration timestamp in milliseconds
 */
export function calculateTokenExpiration(
  expiresIn: number,
  issuedAt: number = Date.now()
): number {
  return issuedAt + expiresIn * 1000;
}

/**
 * Token storage interface for managing tokens securely
 */
export interface TokenStorage {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  issuedAt: number;
  scope: string;
  idToken?: string;
}

/**
 * Stores tokens in httpOnly cookies (more secure than localStorage)
 * Note: This requires server-side implementation to set httpOnly cookies
 */
export function storeTokensInCookies(
  tokens: AccessTokenResponse | RefreshTokenResponse,
  issuedAt: number = Date.now()
): void {
  // SSR safety check
  if (typeof document === "undefined") {
    console.warn("storeTokensInCookies: Cannot set cookies on server-side");
    return;
  }

  const tokenStorage: TokenStorage = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenType: tokens.token_type,
    expiresIn: tokens.expires_in,
    issuedAt,
    scope: tokens.scope,
    idToken: "id_token" in tokens ? tokens.id_token : undefined,
  };

  // Calculate expiration date
  const expirationDate = new Date(issuedAt + tokens.expires_in * 1000);

  // Set individual cookies (httpOnly should be set server-side)
  document.cookie = `shopify-access-token=${
    tokens.access_token
  }; expires=${expirationDate.toUTCString()}; path=/; secure; samesite=strict`;
  document.cookie = `shopify-refresh-token=${
    tokens.refresh_token || ""
  }; expires=${expirationDate.toUTCString()}; path=/; secure; samesite=strict`;
  document.cookie = `shopify-token-data=${encodeURIComponent(
    JSON.stringify(tokenStorage)
  )}; expires=${expirationDate.toUTCString()}; path=/; secure; samesite=strict`;
}

/**
 * Retrieves tokens from cookies
 */
export function getTokensFromCookies(): TokenStorage | null {
  // SSR safety check
  if (typeof document === "undefined") {
    return null;
  }

  try {
    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const tokenData = cookies["shopify-token-data"];
    if (!tokenData) return null;

    return JSON.parse(decodeURIComponent(tokenData)) as TokenStorage;
  } catch {
    return null;
  }
}

/**
 * Clears authentication cookies
 */
export function clearTokenCookies(): void {
  // SSR safety check
  if (typeof document === "undefined") {
    return;
  }

  const expiredDate = new Date(0).toUTCString();
  document.cookie = `shopify-access-token=; expires=${expiredDate}; path=/; secure; samesite=strict`;
  document.cookie = `shopify-refresh-token=; expires=${expiredDate}; path=/; secure; samesite=strict`;
  document.cookie = `shopify-token-data=; expires=${expiredDate}; path=/; secure; samesite=strict`;
}

/**
 * Stores tokens in localStorage
 * @param tokens - Access or refresh token response
 * @param issuedAt - Timestamp when tokens were issued
 */
export function storeTokens(
  tokens: AccessTokenResponse | RefreshTokenResponse,
  issuedAt: number = Date.now()
): void {
  const tokenStorage: TokenStorage = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenType: tokens.token_type,
    expiresIn: tokens.expires_in,
    issuedAt,
    scope: tokens.scope,
    idToken: "id_token" in tokens ? tokens.id_token : undefined,
  };

  localStorage.setItem("shopify-tokens", JSON.stringify(tokenStorage));
}

/**
 * Retrieves stored tokens from localStorage
 * @returns TokenStorage | null - Stored tokens or null if not found
 */
export function getStoredTokens(): TokenStorage | null {
  try {
    const stored = localStorage.getItem("shopify-tokens");
    if (!stored) return null;

    return JSON.parse(stored) as TokenStorage;
  } catch {
    return null;
  }
}

/**
 * Unified function to get tokens from either cookies or localStorage
 * Prioritizes cookies in production, falls back to localStorage
 * @param preferCookies - Whether to prefer cookie storage (default: true in production)
 * @returns Promise<TokenStorage | null> - Stored tokens or null if not found
 */
export async function getTokensUnified(
  preferCookies: boolean = process.env.NODE_ENV === "production"
): Promise<TokenStorage | null> {
  if (preferCookies) {
    // Try to get tokens from httpOnly cookies first
    const cookieTokens = await getTokensFromServer();
    if (cookieTokens) {
      return cookieTokens;
    }
  }

  // Fallback to localStorage
  return getStoredTokens();
}

/**
 * Clears stored tokens from localStorage
 */
export function clearStoredTokens(): void {
  localStorage.removeItem("shopify-tokens");
}

/**
 * Automatically refreshes tokens if they are expired or will expire soon
 * Works with both cookie and localStorage storage
 * @param config - Shopify authentication configuration
 * @param forceRefresh - Force refresh even if token is not expired
 * @param useSecureCookies - Whether to use secure cookies (default: true in production)
 * @returns Promise<TokenStorage | null> - Updated tokens or null if refresh failed
 */
export async function autoRefreshTokens(
  config: ShopifyAuthConfig,
  forceRefresh: boolean = false,
  useSecureCookies: boolean = process.env.NODE_ENV === "production"
): Promise<TokenStorage | null> {
  const storedTokens = await getTokensUnified(useSecureCookies);

  if (!storedTokens || !storedTokens.refreshToken) {
    return null;
  }

  // Check if token needs refresh
  const needsRefresh =
    forceRefresh ||
    isTokenExpired(storedTokens.expiresIn, storedTokens.issuedAt);

  if (!needsRefresh) {
    return storedTokens;
  }

  try {
    // Use server-side refresh to bypass Safari CORS issues
    const refreshedTokens = await refreshAccessTokenServer(
      storedTokens.refreshToken,
      config,
      useSecureCookies
    );
    const issuedAt = Date.now();

    if (!useSecureCookies) {
      // Store the new tokens in localStorage (cookies are handled by the server)
      storeTokens(refreshedTokens, issuedAt);
    }

    return {
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token,
      tokenType: refreshedTokens.token_type,
      expiresIn: refreshedTokens.expires_in,
      issuedAt,
      scope: refreshedTokens.scope,
    };
  } catch (error) {
    console.error("Auto refresh failed:", error);
    // Clear invalid tokens from both storage methods
    if (useSecureCookies) {
      await clearTokenCookiesServer();
    } else {
      clearStoredTokens();
    }
    return null;
  }
}

/**
 * JWT payload interface for ID tokens
 */
export interface JwtPayload {
  nonce?: string;
  sub?: string;
  aud?: string;
  iss?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * JWT header interface
 */
export interface JwtHeader {
  alg?: string;
  typ?: string;
  [key: string]: unknown;
}

/**
 * Decoded JWT structure
 */
export interface DecodedJwt {
  header: JwtHeader;
  payload: JwtPayload;
  signature: string;
}

/**
 * Decodes a JWT token without verification
 * Following Shopify's recommended implementation
 * @param token - JWT token string
 * @returns DecodedJwt - Decoded JWT with header, payload, and signature
 */
export function decodeJwt(token: string): DecodedJwt {
  const [header, payload, signature] = token.split(".");

  const decodedHeader = JSON.parse(atob(header));
  const decodedPayload = JSON.parse(atob(payload));

  return {
    header: decodedHeader,
    payload: decodedPayload,
    signature,
  };
}

/**
 * Retrieves the nonce from an ID token
 * Following Shopify's recommended implementation
 * @param token - JWT ID token string
 * @returns string | undefined - The nonce value from the token payload
 */
export function getNonce(token: string): string | undefined {
  return decodeJwt(token).payload.nonce;
}

/**
 * Logout configuration interface
 */
export interface LogoutConfig {
  shopId: string;
  idToken: string;
  postLogoutRedirectUri?: string;
}

/**
 * Enhanced logout configuration with better error handling
 */
export interface EnhancedLogoutConfig {
  shopId: string;
  idToken?: string;
  postLogoutRedirectUri?: string;
  appBaseUrl?: string;
}

/**
 * Creates a complete logout URL for Shopify Customer Account API
 * This will redirect to Shopify's logout endpoint to completely clear the session
 * @param config - Enhanced logout configuration
 * @returns string - Complete logout URL
 */
export function createEnhancedLogoutUrl(config: EnhancedLogoutConfig): string {
  const logoutUrl = new URL(
    `https://shopify.com/authentication/${config.shopId}/logout`
  );

  // Add required id_token_hint parameter if available
  if (config.idToken) {
    logoutUrl.searchParams.append("id_token_hint", config.idToken);
  }

  // Add post_logout_redirect_uri parameter
  const postLogoutRedirectUri =
    config.postLogoutRedirectUri ||
    `${
      config.appBaseUrl ||
      (typeof window !== "undefined" ? window.location.origin : "")
    }/?shopify_logout=true`;

  logoutUrl.searchParams.append(
    "post_logout_redirect_uri",
    postLogoutRedirectUri
  );

  return logoutUrl.toString();
}

/**
 * Performs a complete logout including Shopify session clearing
 * This function will:
 * 1. Clear all local storage and cookies
 * 2. Redirect to Shopify's logout endpoint to clear their session
 * 3. Shopify will redirect back to your app with shopify_logout=true parameter
 * @param config - Enhanced logout configuration
 */
export function performCompleteLogout(config: EnhancedLogoutConfig): void {
  // Clear stored tokens and auth data first
  clearStoredTokens();
  clearAuthStorage();

  // Create logout URL and redirect
  const logoutUrl = createEnhancedLogoutUrl(config);

  console.log(
    "Shopify Auth: Performing complete logout, redirecting to:",
    logoutUrl
  );

  // Redirect to Shopify logout endpoint
  if (typeof window !== "undefined") {
    window.location.href = logoutUrl;
  } else {
    console.warn(
      "Shopify Auth: Cannot redirect on server-side, use client-side only"
    );
  }
}

/**
 * Logs out a customer by redirecting to Shopify's logout endpoint
 * Following Shopify's recommended implementation
 * @param config - Logout configuration with shop ID, ID token, and optional redirect URI
 */
export function logoutCustomer(config: LogoutConfig): void {
  const logoutUrl = new URL(
    `https://shopify.com/authentication/${config.shopId}/logout`
  );

  // Add required id_token_hint parameter
  logoutUrl.searchParams.append("id_token_hint", config.idToken);

  // Add optional post_logout_redirect_uri parameter
  if (config.postLogoutRedirectUri) {
    logoutUrl.searchParams.append(
      "post_logout_redirect_uri",
      config.postLogoutRedirectUri
    );
  }

  // Clear stored tokens and auth data before redirecting
  clearStoredTokens();
  clearAuthStorage();

  // Redirect to logout endpoint
  window.location.href = logoutUrl.toString();
}

/**
 * Creates a logout URL without performing the redirect
 * Useful for custom logout implementations or server-side usage
 * @param config - Logout configuration with shop ID, ID token, and optional redirect URI
 * @returns string - Complete logout URL
 */
export function createLogoutUrl(config: LogoutConfig): string {
  const logoutUrl = new URL(
    `https://shopify.com/authentication/${config.shopId}/logout`
  );

  // Add required id_token_hint parameter
  logoutUrl.searchParams.append("id_token_hint", config.idToken);

  // Add optional post_logout_redirect_uri parameter
  if (config.postLogoutRedirectUri) {
    logoutUrl.searchParams.append(
      "post_logout_redirect_uri",
      config.postLogoutRedirectUri
    );
  }

  return logoutUrl.toString();
}

/**
 * Customer Account API configuration interface
 */
export interface CustomerAccountApiConfig {
  shopId: string;
  accessToken: string;
  apiVersion?: string;
}

/**
 * GraphQL operation interface
 */
export interface GraphQLOperation {
  operationName?: string;
  query: string;
  variables?: Record<string, unknown>;
}

/**
 * GraphQL response interface
 */
export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
    extensions?: Record<string, unknown>;
  }>;
  extensions?: {
    context?: {
      country?: string;
      language?: string;
    };
    cost?: {
      requestedQueryCost: number;
      actualQueryCost: number;
    };
    [key: string]: unknown;
  };
}

/**
 * Customer Account API error class
 */
export class CustomerAccountApiError extends Error {
  public errors: GraphQLResponse["errors"];
  public extensions?: GraphQLResponse["extensions"];

  constructor(
    message: string,
    errors?: GraphQLResponse["errors"],
    extensions?: GraphQLResponse["extensions"]
  ) {
    super(message);
    this.name = "CustomerAccountApiError";
    this.errors = errors;
    this.extensions = extensions;
  }
}

/**
 * Makes a GraphQL request to the Shopify Customer Account API
 * Following Shopify's recommended implementation
 * @param config - Customer Account API configuration
 * @param operation - GraphQL operation to execute
 * @returns Promise<GraphQLResponse<T>> - GraphQL response
 */
export async function executeCustomerAccountQuery<T = unknown>(
  config: CustomerAccountApiConfig,
  operation: GraphQLOperation
): Promise<GraphQLResponse<T>> {
  const apiVersion = config.apiVersion || "2025-04";
  const endpoint = `https://shopify.com/${config.shopId}/account/customer/api/${apiVersion}/graphql`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: config.accessToken,
      },
      body: JSON.stringify({
        operationName: operation.operationName,
        query: operation.query,
        variables: operation.variables || {},
      }),
    });

    if (!response.ok) {
      if (response.status === 500) {
        throw new CustomerAccountApiError(
          "Internal server error - verify access token parameters are correct",
          undefined,
          { httpStatus: 500 }
        );
      }

      throw new CustomerAccountApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        undefined,
        { httpStatus: response.status }
      );
    }

    const result: GraphQLResponse<T> = await response.json();

    // Check for GraphQL errors
    if (result.errors && result.errors.length > 0) {
      throw new CustomerAccountApiError(
        `GraphQL errors: ${result.errors.map((e) => e.message).join(", ")}`,
        result.errors,
        result.extensions
      );
    }

    return result;
  } catch (error) {
    if (error instanceof CustomerAccountApiError) {
      throw error;
    }

    throw new CustomerAccountApiError(
      `Network error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      undefined,
      { networkError: true }
    );
  }
}

/**
 * Language codes supported by the @inContext directive
 */
export type SupportedLanguage =
  | "AF"
  | "AK"
  | "AM"
  | "AR"
  | "AS"
  | "AZ"
  | "BE"
  | "BG"
  | "BM"
  | "BN"
  | "BO"
  | "BR"
  | "BS"
  | "CA"
  | "CE"
  | "CKB"
  | "CO"
  | "CS"
  | "CU"
  | "CY"
  | "DA"
  | "DE"
  | "DV"
  | "DZ"
  | "EE"
  | "EL"
  | "EN"
  | "EO"
  | "ES"
  | "ET"
  | "EU"
  | "FA"
  | "FF"
  | "FI"
  | "FO"
  | "FR"
  | "FY"
  | "GA"
  | "GD"
  | "GL"
  | "GN"
  | "GU"
  | "GV"
  | "HA"
  | "HE"
  | "HI"
  | "HR"
  | "HU"
  | "HY"
  | "IA"
  | "ID"
  | "IG"
  | "II"
  | "IS"
  | "IT"
  | "JA"
  | "JV"
  | "KA"
  | "KI"
  | "KK"
  | "KL"
  | "KM"
  | "KN"
  | "KO"
  | "KS"
  | "KU"
  | "KW"
  | "KY"
  | "LB"
  | "LG"
  | "LN"
  | "LO"
  | "LT"
  | "LU"
  | "LV"
  | "MG"
  | "MI"
  | "MK"
  | "ML"
  | "MN"
  | "MR"
  | "MS"
  | "MT"
  | "MY"
  | "NB"
  | "ND"
  | "NE"
  | "NL"
  | "NN"
  | "NO"
  | "NV"
  | "NY"
  | "OM"
  | "OR"
  | "OS"
  | "PA"
  | "PL"
  | "PS"
  | "PT"
  | "QU"
  | "RM"
  | "RN"
  | "RO"
  | "RU"
  | "RW"
  | "SD"
  | "SE"
  | "SG"
  | "SI"
  | "SK"
  | "SL"
  | "SN"
  | "SO"
  | "SQ"
  | "SR"
  | "SU"
  | "SV"
  | "SW"
  | "TA"
  | "TE"
  | "TG"
  | "TH"
  | "TI"
  | "TK"
  | "TO"
  | "TR"
  | "TT"
  | "UG"
  | "UK"
  | "UR"
  | "UZ"
  | "VI"
  | "WO"
  | "XH"
  | "YI"
  | "YO"
  | "ZH"
  | "ZU";

/**
 * Creates a GraphQL operation with @inContext directive for language support
 * @param operation - Base GraphQL operation
 * @param language - Language code for @inContext directive
 * @returns GraphQLOperation - Operation with @inContext directive applied
 */
export function createLocalizedOperation(
  operation: GraphQLOperation,
  language: SupportedLanguage
): GraphQLOperation {
  // Add @inContext directive to the operation
  const localizedQuery = operation.query.replace(
    /(query|mutation)(\s+\w+)?(\s*\([^)]*\))?(\s*{)/,
    `$1$2$3 @inContext(language: ${language})$4`
  );

  return {
    ...operation,
    query: localizedQuery,
  };
}

/**
 * Customer Account API client class for easier usage
 */
export class CustomerAccountApiClient {
  private config: CustomerAccountApiConfig;

  constructor(config: CustomerAccountApiConfig) {
    this.config = config;
  }

  /**
   * Executes a GraphQL query
   * @param operation - GraphQL operation to execute
   * @returns Promise<GraphQLResponse<T>> - GraphQL response
   */
  async query<T = unknown>(
    operation: GraphQLOperation
  ): Promise<GraphQLResponse<T>> {
    return executeCustomerAccountQuery<T>(this.config, operation);
  }

  /**
   * Executes a localized GraphQL query with @inContext directive
   * @param operation - GraphQL operation to execute
   * @param language - Language code for localization
   * @returns Promise<GraphQLResponse<T>> - GraphQL response
   */
  async localizedQuery<T = unknown>(
    operation: GraphQLOperation,
    language: SupportedLanguage
  ): Promise<GraphQLResponse<T>> {
    const localizedOperation = createLocalizedOperation(operation, language);
    return this.query<T>(localizedOperation);
  }

  /**
   * Gets customer profile information
   * @param language - Optional language for localized responses
   * @returns Promise<GraphQLResponse> - Customer profile data
   */
  async getCustomerProfile(
    language?: SupportedLanguage
  ): Promise<GraphQLResponse> {
    const operation: GraphQLOperation = {
      operationName: "GetCustomerProfile",
      query: `
        query GetCustomerProfile {
          customer {
            id
            firstName
            lastName
            displayName
            emailAddress {
              emailAddress
            }
            phoneNumber {
              phoneNumber
            }
            defaultAddress {
              id
              firstName
              lastName
              company
              address1
              address2
              city
              territoryCode
              zoneCode
              zip
              phoneNumber
            }
          }
        }
      `,
    };

    if (language) {
      return this.localizedQuery(operation, language);
    }

    return this.query(operation);
  }

  /**
   * Updates the access token for API calls
   * @param accessToken - New access token
   */
  updateAccessToken(accessToken: string): void {
    this.config.accessToken = accessToken;
  }

  /**
   * Updates the API version
   * @param apiVersion - New API version (e.g., '2025-04')
   */
  updateApiVersion(apiVersion: string): void {
    this.config.apiVersion = apiVersion;
  }
}

/**
 * Request storage access for Safari ITP compatibility
 * This is required for Safari to allow cross-site authentication requests
 */
export async function requestStorageAccessForSafari(): Promise<boolean> {
  // Check if we're in Safari and if Storage Access API is available
  if (typeof document !== "undefined" && "requestStorageAccess" in document) {
    try {
      // First check if we already have storage access
      const hasAccess = await document.hasStorageAccess();
      if (hasAccess) {
        return true;
      }

      // Request storage access from the user
      await document.requestStorageAccess();
      console.log("✅ Storage access granted by user");
      return true;
    } catch (error) {
      console.warn("⚠️ Storage access denied or not available:", error);
      return false;
    }
  }

  // Not Safari or Storage Access API not available
  return true;
}

/**
 * Safari-compatible token exchange with Storage Access API
 */
export async function exchangeCodeForTokensSafari(
  config: ShopifyAuthConfig,
  code: string,
  codeVerifier: string
): Promise<AccessTokenResponse> {
  // Request storage access first for Safari
  const hasStorageAccess = await requestStorageAccessForSafari();

  if (!hasStorageAccess) {
    throw new Error(
      "Storage access required for authentication. Please enable cross-site tracking in Safari or use Chrome."
    );
  }

  // Proceed with normal token exchange
  return exchangeCodeForTokens(config, code, codeVerifier);
}

/**
 * Server-side token exchange to bypass Safari CORS issues
 * This function exchanges the authorization code for tokens on the server
 */
export async function exchangeCodeForTokensServer(
  code: string,
  codeVerifier: string,
  config: ShopifyAuthConfig
): Promise<AccessTokenResponse> {
  try {
    // Call our backend API route instead of Shopify directly
    const response = await fetch("/api/auth/shopify/token-exchange", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        codeVerifier,
        config,
        useCookies: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    const tokenData = await response.json();
    return tokenData;
  } catch (error) {
    console.error("Server-side token exchange failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to exchange authorization code: ${errorMessage}`);
  }
}

/**
 * Server-side token refresh to bypass Safari CORS issues
 * This function refreshes tokens on the server
 */
export async function refreshAccessTokenServer(
  refreshToken: string,
  config?: ShopifyAuthConfig,
  useCookies: boolean = false
): Promise<RefreshTokenResponse> {
  try {
    // Call our backend API route instead of Shopify directly
    const response = await fetch("/api/auth/shopify/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
        config,
        useCookies,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    const tokenData: RefreshTokenResponse = await response.json();
    return tokenData;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Token refresh failed: ${String(error)}`);
  }
}

/**
 * Exchange code for tokens using server-side API with cookie storage option
 */
export async function exchangeCodeForTokensServerWithCookies(
  code: string,
  codeVerifier: string,
  config: ShopifyAuthConfig,
  useCookies: boolean = false
): Promise<AccessTokenResponse> {
  const response = await fetch("/api/auth/shopify/token-exchange", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      codeVerifier,
      config,
      useCookies,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Server-side token exchange failed: ${errorData.error} - ${
        errorData.error_description || "Unknown error"
      }`
    );
  }

  return response.json();
}

/**
 * Get tokens from httpOnly cookies via server-side API
 */
export async function getTokensFromServer(): Promise<TokenStorage | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch("/api/auth/shopify/get-tokens", {
      method: "GET",
      credentials: "include", // Include cookies in request
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        return null; // No tokens found
      }
      throw new Error(`Failed to get tokens: ${response.status}`);
    }

    const tokenData = await response.json();

    return {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      tokenType: tokenData.tokenType,
      expiresIn: tokenData.expiresIn,
      issuedAt: tokenData.issuedAt,
      scope: tokenData.scope,
      idToken: tokenData.idToken, // ID token is now included for logout functionality
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Timeout getting tokens from server");
      return null;
    }
    console.error("Error getting tokens from server:", error);
    return null;
  }
}

/**
 * Clear authentication cookies via server-side API
 */
export async function clearTokenCookiesServer(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch("/api/auth/shopify/clear-tokens", {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Timeout clearing tokens on server");
      return false;
    }
    console.error("Error clearing tokens on server:", error);
    return false;
  }
}
