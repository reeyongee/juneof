import { Suspense } from "react";
import Link from "next/link";

function AuthSuccessContent() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-green-600">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Successful!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You have successfully authenticated with Shopify Customer Account
            API
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            What happens next?
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 bg-blue-400 rounded-full mt-2"></div>
              </div>
              <div className="ml-3">
                <p>
                  Your authorization code has been received and can be exchanged
                  for access tokens
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 bg-blue-400 rounded-full mt-2"></div>
              </div>
              <div className="ml-3">
                <p>
                  The tokens will allow access to customer-scoped data via the
                  Customer Account API
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 bg-blue-400 rounded-full mt-2"></div>
              </div>
              <div className="ml-3">
                <p>
                  In a production app, you would now be logged in and have
                  access to your account data
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <Link
            href="/auth-test"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded text-center hover:bg-blue-700 transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded text-center hover:bg-gray-700 transition-colors"
          >
            Go Home
          </Link>
        </div>

        <div className="text-xs text-gray-500 text-center">
          <p>
            This is a demonstration of the Shopify Customer Account API
            authentication flow.
          </p>
          <p className="mt-1">
            In production, tokens would be handled securely server-side.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthSuccessContent />
    </Suspense>
  );
}
