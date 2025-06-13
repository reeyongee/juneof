# Shopify Customer Account API Authentication Flow

## Overview

This implementation uses OAuth 2.0 with PKCE (Proof Key for Code Exchange) for secure client-side authentication with Shopify's Customer Account API.

## Authentication Flow

### 1. User Initiates Login

- User clicks "Login with Shopify" button
- PKCE parameters (code verifier, code challenge) are generated client-side
- Parameters stored in localStorage: `shopify-auth-code-verifier`, `shopify-auth-state`, `shopify-auth-nonce`
- User redirected to Shopify authorization URL

### 2. Shopify Authorization

- User authenticates with Shopify
- Shopify redirects back to: `https://dev.juneof.com/api/auth/shopify/callback`

### 3. Server-Side Callback (Expected Redirect)

**File:** `src/app/api/auth/shopify/callback/route.ts`

```
✅ Code verifier not available server-side (expected) - redirecting to client-side handler for token exchange
🔄 Redirecting to client-side handler: https://dev.juneof.com/auth/callback-handler?code=...&state=...
```

**Why this happens:**

- Server cannot access localStorage (where code verifier is stored)
- This is **EXPECTED BEHAVIOR** for client-side PKCE authentication
- Server redirects to client-side handler that can access localStorage

### 4. Client-Side Token Exchange

**File:** `src/app/auth/callback-handler/page.tsx`

- Retrieves code verifier from localStorage
- Validates state parameter
- Exchanges authorization code for access tokens
- Stores tokens in localStorage
- Redirects back to `/auth-test`

### 5. Customer Data Access

**File:** `src/components/CustomerDataDemo.tsx`

- Automatically loads stored tokens
- Creates GraphQL API client
- Fetches customer profile data
- Displays customer information

## Server Logs Explanation

### ✅ Normal/Expected Logs:

```
✅ Code verifier not available server-side (expected) - redirecting to client-side handler for token exchange
🔄 Redirecting to client-side handler: https://dev.juneof.com/auth/callback-handler?code=...&state=...
```

### ❌ Error Logs to Watch For:

```
❌ Shopify OAuth error: [error_code] [description]
❌ Missing required parameters: code=false, state=false
❌ Missing environment variables
❌ Callback handler error: [error_message]
```

## Environment Variables Required

```env
NEXTAUTH_URL=https://dev.juneof.com
NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID=70458179741
NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID=13297620-a9c9-4e6d-ba0c-ca6c2e00750d
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=df3sub-yw.myshopify.com
```

## Security Features

- **PKCE (Proof Key for Code Exchange)**: Prevents authorization code interception
- **State Parameter**: Prevents CSRF attacks
- **Nonce Parameter**: Prevents replay attacks
- **Automatic Token Refresh**: Refreshes tokens before expiration

## Troubleshooting

### Authentication Not Persisting

1. Check browser console for error messages
2. Verify localStorage contains `shopify-tokens`
3. Check if tokens are expired
4. Use "Clear All Storage & Reload" button to reset

### Server Logs Show "Missing code verifier"

- This is **EXPECTED** - not an error
- Indicates normal client-side PKCE flow
- Server correctly redirects to client-side handler

### Customer Data Not Loading

1. Verify authentication completed successfully
2. Check browser console for GraphQL errors
3. Verify environment variables are correct
4. Check network tab for API request failures

## Files Structure

```
src/
├── lib/shopify-auth.ts              # Core authentication library
├── app/api/auth/shopify/
│   ├── callback/route.ts            # Server-side callback (redirects to client)
│   └── refresh/route.ts             # Token refresh endpoint
├── app/auth/
│   ├── callback-handler/page.tsx    # Client-side token exchange
│   ├── success/page.tsx             # Success page
│   └── error/page.tsx               # Error handling
├── components/
│   ├── ShopifyAuth.tsx              # Authentication component
│   └── CustomerDataDemo.tsx         # Customer data display
└── app/auth-test/page.tsx           # Test page
```

## Production Considerations

- Store code verifier securely server-side (not localStorage)
- Use secure HTTP-only cookies for token storage
- Implement proper session management
- Add rate limiting and security headers
- Never expose actual tokens in URLs or logs
- Implement proper error handling and monitoring
