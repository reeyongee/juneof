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
  code: string
): Promise<AccessTokenResponse> {
  const codeVerifier = getStoredCodeVerifier();
  if (!codeVerifier) {
    throw new Error("Code verifier not found in storage");
  }

  try {
    const tokens = await exchangeCodeForTokens(config, code, codeVerifier);

    // Clear stored authentication parameters after successful exchange
    clearAuthStorage();

    return tokens;
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
 * Stores tokens securely in localStorage (for demo purposes only)
 * In production, use secure HTTP-only cookies or server-side session storage
 * @param tokens - Token response from Shopify
 * @param issuedAt - When the tokens were issued (defaults to now)
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
 * Clears stored tokens from localStorage
 */
export function clearStoredTokens(): void {
  localStorage.removeItem("shopify-tokens");
}

/**
 * Automatically refreshes tokens if they are expired or will expire soon
 * @param config - Shopify authentication configuration
 * @param forceRefresh - Force refresh even if token is not expired
 * @returns Promise<TokenStorage | null> - Updated tokens or null if refresh failed
 */
export async function autoRefreshTokens(
  config: ShopifyAuthConfig,
  forceRefresh: boolean = false
): Promise<TokenStorage | null> {
  const storedTokens = getStoredTokens();

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
    const refreshedTokens = await refreshAccessToken(
      config,
      storedTokens.refreshToken
    );
    const issuedAt = Date.now();

    // Store the new tokens
    storeTokens(refreshedTokens, issuedAt);

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
    // Clear invalid tokens
    clearStoredTokens();
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
 * Checkout URL configuration interface
 */
export interface CheckoutUrlConfig {
  shopDomain: string;
  checkoutId: string;
  stayAuthenticated?: boolean;
}

/**
 * Creates a checkout URL that maintains authentication from headless storefront
 * Following Shopify's recommended implementation for staying authenticated
 * @param config - Checkout URL configuration
 * @returns string - Complete checkout URL with authentication parameter
 */
export function createAuthenticatedCheckoutUrl(
  config: CheckoutUrlConfig
): string {
  const checkoutUrl = new URL(
    `https://${config.shopDomain}/checkouts/${config.checkoutId}`
  );

  // Add logged_in=true parameter to maintain authentication
  if (config.stayAuthenticated !== false) {
    checkoutUrl.searchParams.append("logged_in", "true");
  }

  return checkoutUrl.toString();
}

/**
 * Silent authentication configuration interface
 */
export interface SilentAuthConfig extends ShopifyAuthConfig {
  onLoginRequired?: () => void;
  onSuccess?: (tokens: AccessTokenResponse) => void;
  onError?: (error: string, description?: string) => void;
}

/**
 * Performs silent authentication check using prompt=none
 * This checks if the customer is still authenticated without showing login UI
 * Following Shopify's recommended implementation
 * @param config - Silent authentication configuration
 * @returns Promise<boolean> - True if silent auth succeeded, false if login required
 */
export async function performSilentAuth(
  config: SilentAuthConfig
): Promise<boolean> {
  try {
    // Create authorization URL with prompt=none for silent check
    const authData = await createAuthorizationUrl(config, { prompt: "none" });

    // Store auth parameters for callback validation
    localStorage.setItem("shopify-auth-state", authData.state);
    localStorage.setItem("shopify-auth-nonce", authData.nonce);
    localStorage.setItem("shopify-auth-code-verifier", authData.codeVerifier);

    // Create a hidden iframe for silent authentication
    return new Promise((resolve) => {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = authData.url;

      // Handle iframe load event
      iframe.onload = () => {
        try {
          // Check if we can access iframe content (same-origin)
          const iframeUrl = iframe.contentWindow?.location.href;

          if (iframeUrl && iframeUrl.includes(config.redirectUri)) {
            // Parse callback URL
            const callbackResult = validateCallback(iframeUrl);

            if (callbackResult.isValid && callbackResult.code) {
              // Exchange code for tokens
              exchangeCodeForTokens(
                config,
                callbackResult.code,
                authData.codeVerifier
              )
                .then((tokens) => {
                  config.onSuccess?.(tokens);
                  resolve(true);
                })
                .catch((error) => {
                  config.onError?.(error.message || "Token exchange failed");
                  resolve(false);
                });
            } else if (callbackResult.error === "login_required") {
              // Session expired, login required
              config.onLoginRequired?.();
              resolve(false);
            } else {
              // Other error
              config.onError?.(
                callbackResult.error || "Unknown error",
                callbackResult.errorDescription
              );
              resolve(false);
            }
          }
        } catch (error) {
          // Cross-origin error or other issue
          config.onError?.(
            "Silent authentication failed",
            error instanceof Error ? error.message : "Unknown error"
          );
          resolve(false);
        } finally {
          // Clean up iframe
          document.body.removeChild(iframe);
        }
      };

      // Handle iframe error
      iframe.onerror = () => {
        config.onError?.(
          "Silent authentication failed",
          "Failed to load authentication frame"
        );
        document.body.removeChild(iframe);
        resolve(false);
      };

      // Add iframe to document
      document.body.appendChild(iframe);

      // Set timeout for silent auth
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
          config.onError?.(
            "Silent authentication timeout",
            "Authentication check took too long"
          );
          resolve(false);
        }
      }, 10000); // 10 second timeout
    });
  } catch (error) {
    config.onError?.(
      "Silent authentication setup failed",
      error instanceof Error ? error.message : "Unknown error"
    );
    return false;
  }
}

/**
 * Checks if customer is authenticated and performs silent re-authentication if needed
 * This is useful for maintaining authentication state in headless storefronts
 * @param config - Silent authentication configuration
 * @returns Promise<boolean> - True if customer is authenticated, false otherwise
 */
export async function ensureAuthentication(
  config: SilentAuthConfig
): Promise<boolean> {
  // Check if we have valid stored tokens
  const storedTokens = getStoredTokens();

  if (
    storedTokens &&
    !isTokenExpired(storedTokens.expiresIn, storedTokens.issuedAt)
  ) {
    // We have valid tokens
    return true;
  }

  // Try to refresh tokens if we have a refresh token
  if (storedTokens?.refreshToken) {
    try {
      const refreshedTokens = await autoRefreshTokens(config);
      if (refreshedTokens) {
        return true;
      }
    } catch {
      // Refresh failed, continue to silent auth
    }
  }

  // Perform silent authentication check
  return await performSilentAuth(config);
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
        Authorization: `Bearer ${config.accessToken}`,
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
              province
              country
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
