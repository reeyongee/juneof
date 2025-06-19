# Shopify Complete Logout Implementation

## Overview

This implementation provides proper Shopify Customer Account API logout that completely clears Shopify's session, ensuring that when users log out, they will need to enter credentials again on the next login attempt.

## Problem Solved

**Before**: The app only cleared local tokens and redirected to homepage, but Shopify's session remained active. Users could log back in without entering credentials.

**After**: The app redirects to Shopify's official logout endpoint first, which clears Shopify's session completely, then redirects back to the app.

## Implementation Details

### 1. Enhanced Logout Flow

```typescript
// AuthContext.tsx - Updated logout function
const logout = useCallback(async () => {
  // Get current tokens to check if we have an id_token for Shopify logout
  const currentTokens = await getTokensUnified();

  // Clear local storage and cookies first
  clearAuthStorage();
  clearStoredTokens();

  // If we have an id_token, redirect to Shopify's logout endpoint first
  if (currentTokens?.idToken) {
    // Create Shopify logout URL
    const logoutUrl = new URL(
      `https://shopify.com/authentication/${shopifyAuthConfig.shopId}/logout`
    );

    // Add required id_token_hint parameter
    logoutUrl.searchParams.append("id_token_hint", currentTokens.idToken);

    // Add post_logout_redirect_uri to come back to our app
    const postLogoutRedirectUri = `${appBaseUrl}/?shopify_logout=true`;
    logoutUrl.searchParams.append(
      "post_logout_redirect_uri",
      postLogoutRedirectUri
    );

    // Redirect to Shopify logout endpoint
    window.location.href = logoutUrl.toString();
    return;
  } else {
    // If no id_token, just redirect to homepage
    router.push("/");
  }
}, [router, shopifyAuthConfig.shopId, appBaseUrl]);
```

### 2. Return from Shopify Logout Detection

```typescript
// AuthContext.tsx - Updated initializeAuth function
const initializeAuth = useCallback(
  async () => {
    const localUrlParams = new URLSearchParams(window.location.search);
    const shopifyLogoutSignal = localUrlParams.get("shopify_logout") === "true";

    // If user is returning from Shopify logout, clean up URL and ensure clean state
    if (shopifyLogoutSignal) {
      // Ensure all auth data is cleared
      clearAuthStorage();
      clearStoredTokens();
      if (process.env.NODE_ENV === "production") {
        await clearTokenCookiesServer();
      }

      // Set clean unauthenticated state
      setIsAuthenticated(false);
      setCustomerData(null);
      setTokens(null);
      setApiClient(null);
      setError(null);

      // Clean up URL parameter
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete("shopify_logout");
      window.history.replaceState(
        {},
        document.title,
        currentUrl.pathname + currentUrl.search
      );

      setIsLoading(false);
      return; // Exit early, user is logged out
    }

    // ... rest of initialization logic
  },
  [
    /* dependencies */
  ]
);
```

### 3. New Helper Functions

```typescript
// shopify-auth.ts - Enhanced logout functions
export interface EnhancedLogoutConfig {
  shopId: string;
  idToken?: string;
  postLogoutRedirectUri?: string;
  appBaseUrl?: string;
}

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
    `${config.appBaseUrl || window.location.origin}/?shopify_logout=true`;

  logoutUrl.searchParams.append(
    "post_logout_redirect_uri",
    postLogoutRedirectUri
  );

  return logoutUrl.toString();
}

export function performCompleteLogout(config: EnhancedLogoutConfig): void {
  // Clear stored tokens and auth data first
  clearStoredTokens();
  clearAuthStorage();

  // Create logout URL and redirect
  const logoutUrl = createEnhancedLogoutUrl(config);

  // Redirect to Shopify logout endpoint
  if (typeof window !== "undefined") {
    window.location.href = logoutUrl;
  }
}
```

## Authentication Flow

### Complete Logout Flow:

1. **User clicks logout** → `logout()` function called
2. **App clears local data** → localStorage, cookies, React state
3. **App redirects to Shopify logout** → `https://shopify.com/authentication/{shop_id}/logout?id_token_hint={token}&post_logout_redirect_uri={app_url}/?shopify_logout=true`
4. **Shopify clears their session** → Completely logs user out of Shopify
5. **Shopify redirects back to app** → `{app_url}/?shopify_logout=true`
6. **App detects return from logout** → `shopify_logout=true` parameter
7. **App ensures clean state** → Double-check all data is cleared
8. **App cleans up URL** → Remove `shopify_logout` parameter
9. **User is completely logged out** → Next login requires full credentials

### Login Flow (After Complete Logout):

1. **User clicks login** → Redirects to Shopify authorization
2. **Shopify shows login form** → User must enter email and verification code
3. **User authenticates** → Fresh login, not remembered session
4. **Shopify redirects back** → With authorization code
5. **App exchanges code for tokens** → Fresh authentication complete

## Benefits

1. **Complete Session Clearing**: Shopify's session is completely cleared, not just app tokens
2. **Enhanced Security**: Users must re-authenticate fully on next login
3. **Cross-Device Logout**: Clears session across all devices for that user
4. **Safari Compatibility**: Works perfectly with Safari's strict cookie policies
5. **Standard OAuth Flow**: Follows OAuth 2.0 logout specifications

## Testing

To test the implementation:

1. **Login to the app** → Should work normally
2. **Click logout** → Should redirect to Shopify logout, then back to app
3. **Try to login again** → Should require full email + verification code entry
4. **Check browser storage** → Should be completely clean
5. **Test in Safari** → Should work identically to Chrome

## Backward Compatibility

The original logout functions are preserved for backward compatibility:

- `logoutCustomer(config: LogoutConfig)` - Original function
- `createLogoutUrl(config: LogoutConfig)` - Original URL creator

New enhanced functions:

- `performCompleteLogout(config: EnhancedLogoutConfig)` - New complete logout
- `createEnhancedLogoutUrl(config: EnhancedLogoutConfig)` - New URL creator

## Environment Variables Required

- `NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID` - Your Shopify shop ID
- `NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID` - Your Customer Account API client ID
- `NEXTAUTH_URL` or fallback to `window.location.origin` - Your app's base URL

## Notes

- The `id_token` is required for Shopify logout to work properly
- If no `id_token` is available, the app falls back to simple local logout
- The `shopify_logout=true` parameter is used to detect return from Shopify logout
- URL cleanup ensures a clean user experience
- Works in both development and production environments
