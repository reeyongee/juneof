import AuthProvider from "../components/AuthProvider";
import ClientAuthInfo from "../components/ClientAuthInfo";
import ServerAuthInfo from "../components/ServerAuthInfo";
import Link from "next/link";

export default function AuthTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            NextAuth + Shopify Customer Account API Test
          </h1>
          <p className="text-gray-600 mb-4">
            This page demonstrates both client-side and server-side
            authentication status.
          </p>
          <div className="space-x-4">
            <Link
              href="/signin"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Sign In Page
            </Link>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <AuthProvider>
            <ClientAuthInfo />
          </AuthProvider>
          <ServerAuthInfo />
        </div>

        <div className="mt-8 p-4 bg-yellow-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Setup Instructions</h3>
          <p className="text-sm text-gray-700 mb-2">
            To test this authentication, you need to set up the following
            environment variables:
          </p>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
            <li>
              <code>NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID</code> - Your Shopify
              shop ID
            </li>
            <li>
              <code>SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID</code> - Your Shopify
              Customer Account API client ID
            </li>
            <li>
              <code>SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET</code> - Your Shopify
              Customer Account API client secret
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
