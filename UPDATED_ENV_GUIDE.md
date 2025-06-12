# Updated Environment Configuration Guide

## Your Current Environment Variables (Verified)

Based on your provided environment variables, here's what you have configured:

```env
# NextAuth Configuration
NEXTAUTH_SECRET="Q/rTUsGDz/oaW04R5SCXIOEFyOYBZAden0zbpcrVaJ8="
NEXTAUTH_URL="https://dev.juneof.com"

# Shopify Customer Account API (Confidential Client)
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID="cb889c45-0663-4367-a226-d90ebcfd026c"
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET="4892ae94d7e965077f3958aaa298e84ce60da4c6caac7175aef815887a690370"

# Shopify Store Configuration
NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID="70458179741"
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="df3sub-yw.myshopify.com"
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN="b368390b219314260743794847602f77"
```

## Configuration Analysis

✅ **Client Type**: You're using a **Confidential Client** (you have both client ID and secret)
✅ **Domain**: You're using `https://dev.juneof.com` (perfect for Customer Account API)
✅ **Shop ID**: `70458179741` is correctly formatted
✅ **Store Domain**: `df3sub-yw.myshopify.com` is valid

## Required Shopify Admin Configuration

Based on your environment variables, configure these URIs in your Shopify Customer Account API settings:

### Callback URI(s)

```
https://dev.juneof.com/api/auth/shopify/callback
```

### JavaScript Origins (if using web client type)

```
https://dev.juneof.com
```

### Logout URI

```
https://dev.juneof.com
```

## Client Type Configuration

Since you have a client secret, you should configure your Customer Account API as a **Confidential Client** in Shopify admin:

1. Go to your Shopify admin
2. Navigate to **Sales channels** → **Headless** or **Hydrogen**
3. Select your storefront
4. Go to **Customer Account API settings**
5. Set **Client Type** to **Confidential**
6. Configure the URIs as shown above

## Code Updates Made

I've updated the implementation to work with your environment variables:

1. ✅ Updated all API routes to use your environment variable names
2. ✅ Added support for confidential client authentication
3. ✅ Modified token exchange to use client secret instead of PKCE when available
4. ✅ Updated authorization URL generation for confidential clients

## Testing Your Setup

1. **Start your development server** (already running on port 3001)
2. **Add the component to a page**:

   ```tsx
   import ShopifyAuth from "@/components/ShopifyAuth";

   export default function TestPage() {
     return (
       <div className="container mx-auto py-8">
         <ShopifyAuth />
       </div>
     );
   }
   ```

3. **Test the login flow**:
   - Visit the page with the ShopifyAuth component
   - Click "Login with Shopify"
   - You should be redirected to Shopify's login page
   - After login, you should be redirected back and see customer data

## Important Notes

- ✅ Your domain `https://dev.juneof.com` supports Customer Account API (no localhost issues)
- ✅ You're using a confidential client which is more secure for server-side applications
- ✅ All environment variables are properly formatted
- ⚠️ Make sure Customer Accounts are enabled in your Shopify store settings

## Next Steps

1. Configure the URIs in Shopify admin as shown above
2. Ensure Customer Accounts are enabled in your store
3. Test the authentication flow
4. The implementation should work immediately with your current environment variables!

## Troubleshooting

If you encounter issues:

1. **Check Shopify Admin Configuration**: Ensure the URIs match exactly
2. **Verify Customer Accounts**: Make sure they're enabled in Settings → Customer accounts
3. **Check Console**: Look for any error messages in browser console
4. **Verify Environment**: Ensure all environment variables are loaded correctly

Your setup looks good and should work with the updated implementation!
