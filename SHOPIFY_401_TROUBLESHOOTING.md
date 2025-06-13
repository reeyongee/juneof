# Shopify Customer Account API 401 Error Troubleshooting Guide

## Overview

This guide helps troubleshoot 401 "Unauthorized" errors when using the Shopify Customer Account API.

## 🚨 CRITICAL FIXES APPLIED - Root Cause Found!

After extensive research comparing our implementation with the official Shopify documentation, I've identified and fixed the primary causes of 401 errors:

### **1. WRONG AUTHENTICATION METHOD (MAJOR FIX)**

**Problem:** We were putting `client_secret` in the request body instead of using the standard OAuth 2.0 Authorization header.

**Root Cause:** Community forum advice suggested putting credentials in the body, but this contradicts the official Shopify documentation.

**Solution Applied:**

```javascript
// ❌ OLD APPROACH (causing 401 errors):
body.append("client_secret", clientSecret);

// ✅ NEW APPROACH (follows OAuth 2.0 spec):
const credentials = btoa(`${clientId}:${clientSecret}`);
headers["Authorization"] = `Basic ${credentials}`;
```

**Source:** Official Shopify Customer Account API documentation clearly shows using Authorization header for confidential clients.

### **2. CORRECT ENDPOINTS VERIFIED**

**Confirmed Working Endpoints:**

- **Authorization:** `https://shopify.com/authentication/{shop_id}/oauth/authorize`
- **Token Exchange:** `https://shopify.com/authentication/{shop_id}/oauth/token`
- **GraphQL API:** `https://shopify.com/{shop_id}/account/customer/api/2025-04/graphql`

These match the official documentation exactly.

### **3. REQUIRED HEADERS CONFIRMED**

**Essential Headers for All Requests:**

- `User-Agent`: Prevents 403 "You do not have permission" errors
- `Origin`: Required for browser requests, must match JavaScript Origins in Shopify admin
- `Authorization`: Must use `Bearer {access_token}` for GraphQL requests

## Common Causes and Solutions

### 1. Missing Required Headers

**Problem:** Shopify Customer Account API requires specific headers to prevent 401/403 errors.

**Solution:** Ensure these headers are included in all API requests:

- `User-Agent`: Required to prevent 403 errors
- `Origin`: Required for browser-based requests and must match JavaScript Origins in Shopify admin

**Fixed in:** Updated `makeCustomerAccountRequest`, `exchangeCodeForTokens`, and `refreshAccessToken` functions.

### 2. Incorrect Client Configuration

**Problem:** Mismatch between client type (public vs confidential) and authentication method.

**Solution:**

- **Confidential clients:** Use Authorization header with Basic auth
- **Public clients:** Use PKCE (code_verifier/code_challenge)

**Check:** Verify in Shopify admin that client type matches your implementation.

### 3. Shopify Admin Configuration Issues

**Critical Settings to Verify:**

1. **Callback URI:** Must exactly match `https://dev.juneof.com/api/auth/shopify/callback`
2. **JavaScript Origins:** Must include `https://dev.juneof.com`
3. **Logout URI:** Should be `https://dev.juneof.com`
4. **Client Type:** Set to "Confidential" (since you have both client_id and client_secret)

### 4. Environment Variable Issues

**Verify these environment variables are correct:**

```bash
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID="cb889c45-0663-4367-a226-d90ebcfd026c"
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET="4892ae94d7e965077f3958aaa298e84ce60da4c6caac7175aef815887a690370"
NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID="70458179741"
```

### 5. Token Format Issues

**Problem:** Incorrect token format in Authorization header.

**Solution:** Always use `Bearer {access_token}` format:

```javascript
headers["Authorization"] = `Bearer ${accessToken}`;
```

## Debugging Steps

### Step 1: Verify Shopify Admin Configuration

1. Go to your Shopify admin → Apps → Customer Account API settings
2. Verify all URIs match exactly (no trailing slashes, correct protocol)
3. Ensure client type is set to "Confidential"

### Step 2: Test Token Exchange

1. Check browser network tab for the token exchange request
2. Verify the Authorization header is present and properly formatted
3. Confirm the endpoint URL is correct

### Step 3: Test GraphQL Request

1. Verify the access token is being passed correctly
2. Check that the GraphQL endpoint URL is correct
3. Ensure required headers are present

## Testing the Fix

After applying these fixes, test the authentication flow:

1. Visit `http://localhost:3001/auth-test`
2. Click "Login with Shopify"
3. Complete the OAuth flow
4. Verify successful token exchange and profile data retrieval

## Additional Resources

- [Official Shopify Customer Account API Documentation](https://shopify.dev/docs/api/customer)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [Shopify Customer Account API Setup Guide](./SHOPIFY_CUSTOMER_ACCOUNT_API_SETUP.md)

## Summary

The primary issue was using non-standard authentication methods instead of following the OAuth 2.0 specification. The fixes ensure:

1. ✅ Proper Authorization header usage for confidential clients
2. ✅ Correct Shopify API endpoints
3. ✅ Required headers for all requests
4. ✅ Proper error handling and debugging

These changes align our implementation with both the OAuth 2.0 standard and Shopify's official documentation.
