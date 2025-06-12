# Shopify Customer Account API Authentication Setup

This project now includes NextAuth.js integration with Shopify's Customer Account API for customer authentication.

## Environment Variables Required

Create a `.env.local` file in your project root with the following variables:

```env
# Shopify Customer Account API Configuration
NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID=your-shop-id
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID=your-client-id
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET=your-client-secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

## How to Get Shopify Customer Account API Credentials

1. **Access Shopify Partner Dashboard**

   - Go to [partners.shopify.com](https://partners.shopify.com)
   - Log in to your partner account

2. **Create or Access Your App**

   - Navigate to "Apps" in the partner dashboard
   - Create a new app or select an existing one

3. **Enable Customer Account API**

   - In your app settings, find "Customer Account API"
   - Enable the Customer Account API feature
   - Configure the required scopes: `openid email customer-account-api:full`

4. **Get Your Credentials**

   - `NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID`: Your shop's myshopify domain (without .myshopify.com)
   - `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID`: Found in your app's Customer Account API settings
   - `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET`: Found in your app's Customer Account API settings

5. **Configure Redirect URLs**
   - Add `http://localhost:3000/api/auth/callback/shopify` to your app's allowed redirect URLs
   - For production, add your production domain

## Testing the Authentication

1. **Start the development server**

   ```bash
   npm run dev
   ```

2. **Visit the test pages**

   - `/signin` - Sign in page with Shopify authentication
   - `/auth-test` - Test page showing both client and server-side auth status

3. **Test the flow**
   - Click "Sign in with Shopify"
   - You'll be redirected to Shopify's authentication page
   - After successful authentication, you'll be redirected back to your app

## Files Created/Modified

### New Files

- `src/lib/auth/ShopifyProvider.ts` - Custom Shopify OAuth provider
- `src/lib/auth/index.ts` - NextAuth configuration
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `src/app/components/AuthProvider.tsx` - Session provider wrapper
- `src/app/signin/page.tsx` - Sign in page
- `src/app/auth-test/page.tsx` - Authentication test page
- `src/app/components/ClientAuthInfo.tsx` - Client-side auth component
- `src/app/components/ServerAuthInfo.tsx` - Server-side auth component

### Modified Files

- `src/app/layout.tsx` - Added AuthProvider wrapper
- `src/app/page.tsx` - Added links to auth pages

## Features Included

- ✅ Shopify Customer Account API integration
- ✅ NextAuth.js session management
- ✅ Client-side and server-side authentication
- ✅ Automatic token refresh handling
- ✅ Proper sign-out flow with Shopify
- ✅ Session persistence with cookies
- ✅ TypeScript support

## Usage in Your Components

### Client-side (React components)

```tsx
"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export default function MyComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;
  if (!session)
    return <button onClick={() => signIn("shopify")}>Sign in</button>;

  return (
    <div>
      <p>Welcome {session.user?.name}!</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
```

### Server-side (Server components)

```tsx
import { getAuthSession } from "@/lib/auth";

export default async function MyServerComponent() {
  const session = await getAuthSession();

  if (!session) {
    return <p>Please sign in</p>;
  }

  return <p>Welcome {session.user?.name}!</p>;
}
```

## Notes

- The authentication uses Shopify's Customer Account API, which requires customers to have accounts on your Shopify store
- Tokens are automatically refreshed and stored securely
- The implementation includes proper error handling and session expiration
- All authentication state is managed by NextAuth.js for consistency
