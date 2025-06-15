import { ShopifyAuthExample } from "@/components/ShopifyAuth";
import CustomerDataDemo from "@/components/CustomerDataDemo";
import PKCEDemo from "@/components/PKCEDemo";

export default function AuthTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Shopify Customer Account API Authentication Test
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This page demonstrates the implementation of Shopify&apos;s Customer
            Account API authentication using OAuth 2.0 with PKCE (Proof Key for
            Code Exchange) for public clients.
          </p>
        </div>

        <div className="mb-8">
          <ShopifyAuthExample />
        </div>

        <div className="mb-8">
          <PKCEDemo />
        </div>

        <div className="mb-8">
          <CustomerDataDemo
            config={{
              shopId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID || "",
              clientId:
                process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID ||
                "",
              redirectUri:
                process.env.NEXTAUTH_URL + "/api/auth/shopify/callback",
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Implementation Details</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Environment Variables Required
              </h3>
              <div className="bg-gray-50 p-4 rounded text-sm font-mono">
                <div>NEXTAUTH_URL=https://dev.juneof.com</div>
                <div>NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID=70458179741</div>
                <div>
                  NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID=13297620-a9c9-4e6d-ba0c-ca6c2e00750d
                </div>
                <div>
                  NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=df3sub-yw.myshopify.com
                </div>
                <div className="mt-2 text-gray-600">
                  # Redirect URI will be: NEXTAUTH_URL +
                  /api/auth/shopify/callback
                </div>
                <div className="text-xs text-gray-500">
                  # https://dev.juneof.com/api/auth/shopify/callback
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">OAuth Flow Steps</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Generate PKCE code verifier and challenge (using
                  Shopify&apos;s method)
                </li>
                <li>Generate state and nonce for security</li>
                <li>
                  Redirect to Shopify authorization URL with code_challenge
                </li>
                <li>User authenticates with Shopify</li>
                <li>Shopify redirects back with authorization code</li>
                <li>
                  Exchange code for access tokens using PKCE code_verifier
                </li>
                <li>Receive access_token, refresh_token, and id_token</li>
                <li>Store tokens securely and establish session</li>
                <li>Monitor token expiration and refresh automatically</li>
                <li>Use refresh_token to get new access_token when needed</li>
              </ol>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Security Features</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <h4 className="font-semibold text-blue-800">
                  PKCE (Shopify Method)
                </h4>
                <p className="text-sm text-blue-700">
                  Proof Key for Code Exchange using Shopify&apos;s recommended
                  implementation prevents authorization code interception
                  attacks
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <h4 className="font-semibold text-green-800">
                  State Parameter
                </h4>
                <p className="text-sm text-green-700">
                  Prevents CSRF/XSRF attacks by validating request origin
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <h4 className="font-semibold text-purple-800">Nonce</h4>
                <p className="text-sm text-purple-700">
                  Prevents replay attacks and ensures token freshness
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded">
                <h4 className="font-semibold text-orange-800">
                  Refresh Tokens
                </h4>
                <p className="text-sm text-orange-700">
                  Automatically refresh expired access tokens without
                  re-authentication
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Files Created</h3>
            <div className="bg-gray-50 p-4 rounded text-sm">
              <ul className="space-y-1 font-mono">
                <li>
                  📁 <strong>src/lib/shopify-auth.ts</strong> - Core
                  authentication library with token exchange
                </li>
                <li>
                  📁 <strong>src/app/api/auth/shopify/callback/route.ts</strong>{" "}
                  - OAuth callback handler (server-side)
                </li>
                <li>
                  📁 <strong>src/components/ShopifyAuth.tsx</strong> - React
                  authentication component with dual modes
                </li>
                <li>
                  📁 <strong>src/app/auth-test/page.tsx</strong> - This test
                  page
                </li>
                <li>
                  📁 <strong>src/app/auth/success/page.tsx</strong> - Success
                  page
                </li>
                <li>
                  📁 <strong>src/app/auth/error/page.tsx</strong> - Error
                  handling page
                </li>
                <li>
                  📁 <strong>src/app/api/auth/shopify/refresh/route.ts</strong>{" "}
                  - Token refresh API endpoint
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              ⚠️ Production Considerations
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>
                • Store code verifier securely server-side (not in localStorage)
              </li>
              <li>
                • Implement proper session management with secure HTTP-only
                cookies
              </li>
              <li>
                • Store tokens securely server-side (encrypted database/session)
              </li>
              <li>
                • Implement automatic token refresh with proper error handling
              </li>
              <li>• Validate ID tokens and implement token refresh logic</li>
              <li>• Use HTTPS in production and configure proper CORS</li>
              <li>• Never expose actual access tokens in client-side code</li>
              <li>• Implement proper error handling and logging</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
