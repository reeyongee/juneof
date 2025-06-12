# Shopify Customer Account API 401 Error Troubleshooting Guide

## Overview

This guide helps troubleshoot 401 "Unauthorized" errors when using the Shopify Customer Account API.

## 🚨 CRITICAL FIX - Try This First!

**Problem:** Many developers report 401 errors even with correct credentials.

**Solution:** Put `client_secret` in the request body instead of the Authorization header.

**What Changed:** The implementation has been updated to use this approach based on community feedback:

```javascript
// OLD APPROACH (causing 401 errors):
headers["Authorization"] = `Basic ${btoa(clientId + ":" + clientSecret)}`;

// NEW APPROACH (fixes 401 errors):
body.append("client_secret", clientSecret);
// No Authorization header needed
```

**Source:** Multiple developers in Shopify community forums reported this fix works when the standard Authorization header approach fails.

## Common Causes and Solutions

### 1. Missing Required Headers

**Problem:** Shopify Customer Account API requires specific headers to prevent 401/403 errors.

**Solution:** Ensure these headers are included in all API requests:

- `User-Agent`: Required to prevent 403 errors
- `Origin`: Required for browser-based requests and must match JavaScript Origins in Shopify admin

**Fixed in:** Updated `makeCustomerAccountRequest`, `exchangeCodeForTokens`, and `refreshAccessToken` functions.

### 2. Incorrect Client Authentication Method

**Problem:** Using Authorization header instead of request body for client credentials.

**Solution:** ✅ **IMPLEMENTED** - Client credentials are now sent in the request body:

- `client_id` in body
- `client_secret` in body (for confidential clients)
- No Authorization header required

**Your Configuration:**

- Client Type: **Confidential** (you have both client_id and client_secret)
- Authentication Method: **client_secret in request body** ✅

### 3. Shopify Admin Configuration Issues

**Required Settings in Shopify Admin:**

1. **Customer Account API Settings:**

   - Client Type: Set to "Confidential"
   - Callback URI: `https://dev.juneof.com/api/auth/shopify/callback`
   - JavaScript Origins: `https://dev.juneof.com`
   - Logout URI: `https://dev.juneof.com`

2. **Customer Accounts:**
   - Must be enabled in Settings > Customer accounts
   - Set to "Customer accounts" (not "Optional" or "Disabled")

### 4. Environment Variables Verification

**Check these environment variables:**

```bash
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID="cb889c45-0663-4367-a226-d90ebcfd026c"
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET="4892ae94d7e965077f3958aaa298e84ce60da4c6caac7175aef815887a690370"
NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID="70458179741"
NEXTAUTH_URL="https://dev.juneof.com"
```

### 5. Token Exchange Issues

**Common Problems:**

- Using wrong authorization URL format
- Incorrect redirect_uri (must exactly match Shopify admin settings)
- Missing or incorrect client authentication

**Debug Steps:**

1. Check browser console for detailed error logs
2. Verify the authorization URL is correctly formatted
3. Ensure redirect_uri matches exactly what's configured in Shopify admin

### 6. GraphQL Request Issues

**Common Problems:**

- Missing Authorization header
- Incorrect Bearer token format
- Invalid or expired access token

**Debug Steps:**

1. Check if access token is properly formatted (should start with letters/numbers)
2. Verify token hasn't expired (tokens expire after 1 hour)
3. Check if refresh token logic is working

## Testing Steps

### 1. Test Authorization Flow

Visit: `http://localhost:3001/auth-test`

### 2. Check Browser Console

Look for detailed error logs that show:

- HTTP status codes
- Response headers
- Request details
- Authentication method used (`client_secret_in_body` vs `basic_auth`)

### 3. Verify Shopify Admin Settings

1. Go to Sales Channels > Headless
2. Check Customer Account API settings
3. Verify all URIs match your domain exactly

### 4. Test with cURL (for debugging)

```bash
# Test token exchange with NEW approach (client_secret in body)
curl -X POST \
  'https://shopify.com/authentication/70458179741/oauth/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'User-Agent: Mozilla/5.0 (compatible; Shopify-Customer-Account-API)' \
  -H 'Origin: https://dev.juneof.com' \
  -d 'grant_type=authorization_code&client_id=cb889c45-0663-4367-a226-d90ebcfd026c&client_secret=4892ae94d7e965077f3958aaa298e84ce60da4c6caac7175aef815887a690370&redirect_uri=https://dev.juneof.com/api/auth/shopify/callback&code=<authorization_code>'
```

## Updated Implementation

The following functions have been updated with the critical fix and better error handling:

1. `exchangeCodeForTokens` - **CRITICAL FIX**: Now puts `client_secret` in request body instead of Authorization header
2. `refreshAccessToken` - **CRITICAL FIX**: Now puts `client_secret` in request body instead of Authorization header
3. `makeCustomerAccountRequest` - Added User-Agent and Origin headers

## What to Expect

After this fix, you should see in the browser console logs:

- `authMethod: "client_secret_in_body"` for token exchange
- More detailed error information if issues persist
- Better debugging information for troubleshooting

## Next Steps

1. **Test the authentication flow** using the test page - the critical fix is now implemented
2. **Check browser console** for detailed error information with the new authentication method
3. **Verify Shopify Admin Settings** if issues persist
4. **Check the detailed error logs** to see exactly what's happening

## Additional Resources

- [Shopify Customer Account API Documentation](https://shopify.dev/docs/api/customer)
- [Customer Account API Authentication Guide](https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api/getting-started)
- [Community Forum Discussion](https://community.shopify.com/c/shopify-discussions/problems-when-trying-to-use-the-customer-account-api/m-p/2285237) - Source of the critical fix
