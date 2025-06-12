# Shopify Customer Account API Setup Guide

## Step 1: Enable Customer Accounts in Shopify

1. Go to **Settings** → **Customer accounts** in your Shopify admin
2. Under **Accounts in online store and checkout**, click **Edit**
3. Choose **Customer accounts** (not optional accounts)
4. Click **Save**

## Step 2: Configure Customer Account API Access

1. In Shopify admin, go to **Sales channels** → **Headless** or **Hydrogen**
2. Select your storefront (or create one if needed)
3. Navigate to **Customer Account API settings** (Headless) or **Storefront settings** → **Customer Account API** (Hydrogen)

## Step 3: Configure Application Settings

### Client Type

Choose **Public** client type for web applications (recommended for Next.js)

### Application Setup

Configure these URLs (replace with your actual domain):

**Callback URI(s):**

- `https://yourdomain.com/account/authorize`
- For development: `https://your-ngrok-domain.ngrok.io/account/authorize`

**JavaScript Origins:**

- `https://yourdomain.com`
- For development: `https://your-ngrok-domain.ngrok.io`

**Logout URI:**

- `https://yourdomain.com`
- For development: `https://your-ngrok-domain.ngrok.io`

## Step 4: Get Your Credentials

From the **Customer Account API Credentials** section, copy:

- **Client ID** (starts with `shp_`)
- **Client Secret** (only if using confidential client)

## Step 5: Environment Variables

Create a `.env.local` file in your project root with these variables:

```env
# Required: Your Customer Account API Client ID (starts with shp_)
PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID=shp_your_client_id_here

# Optional: Client Secret (only needed for confidential clients)
CUSTOMER_ACCOUNT_API_CLIENT_SECRET=your_client_secret_here

# Your Shopify store domain
PUBLIC_STORE_DOMAIN=your-shop.myshopify.com

# Your Shop ID (found in the API endpoints URLs)
SHOP_ID=your_shop_id_here

# Customer Account API Endpoints (replace {shop_id} with your actual shop ID)
CUSTOMER_ACCOUNT_API_URL=https://shopify.com/{shop_id}/account/customer/api/2025-04/graphql
CUSTOMER_ACCOUNT_AUTH_URL=https://shopify.com/authentication/{shop_id}/oauth/authorize
CUSTOMER_ACCOUNT_TOKEN_URL=https://shopify.com/authentication/{shop_id}/oauth/token
CUSTOMER_ACCOUNT_LOGOUT_URL=https://shopify.com/authentication/{shop_id}/logout

# Development domain (use ngrok or similar for local development)
# Customer Account API doesn't support localhost
NEXT_PUBLIC_APP_URL=https://your-ngrok-domain.ngrok.io
```

## Step 6: Development Setup (Important!)

The Customer Account API **does not support localhost** for security reasons. For local development, you must use a tunneling service like ngrok:

1. Install ngrok: `npm install -g ngrok`
2. Start your Next.js app: `npm run dev`
3. In another terminal, run: `ngrok http 3001` (or whatever port your app is running on)
4. Use the ngrok HTTPS URL in your Shopify settings and environment variables

## Step 7: Required API Endpoints

You'll need to implement these routes in your Next.js app:

- `/account/login` - Redirects to Shopify login
- `/account/authorize` - Handles OAuth callback
- `/account/logout` - Handles logout

## Next Steps

1. Install required packages for OAuth implementation
2. Set up the authentication flow
3. Create the required API routes
4. Test the authentication process

## Important Notes

- Never expose your client secret on the client side
- Always use HTTPS in production
- The Customer Account API uses OAuth 2.0 with PKCE for public clients
- Tokens expire and need to be refreshed
- Customer Account API data should never be cached due to PII concerns
