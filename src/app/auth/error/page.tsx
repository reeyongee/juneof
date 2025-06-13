import { Suspense } from "react";
import Link from "next/link";

function AuthErrorContent({
  searchParams,
}: {
  searchParams: { error?: string; description?: string };
}) {
  const error = searchParams.error || "unknown_error";
  const description =
    searchParams.description ||
    "An unknown error occurred during authentication";

  const getErrorDetails = (errorCode: string) => {
    switch (errorCode) {
      case "access_denied":
        return {
          title: "Access Denied",
          message: "You denied access to your Shopify account.",
          suggestion:
            "To use this application, you need to grant access to your Shopify customer account.",
        };
      case "invalid_request":
        return {
          title: "Invalid Request",
          message: "The authentication request was malformed or invalid.",
          suggestion:
            "Please try again. If the problem persists, contact support.",
        };
      case "invalid_client":
        return {
          title: "Invalid Client",
          message: "The application is not properly configured.",
          suggestion: "Please contact the application administrator.",
        };
      case "invalid_grant":
        return {
          title: "Invalid Grant",
          message: "The authorization code is invalid or has expired.",
          suggestion: "Please try the authentication process again.",
        };
      case "unsupported_response_type":
        return {
          title: "Unsupported Response Type",
          message: "The requested response type is not supported.",
          suggestion: "Please contact the application administrator.",
        };
      case "invalid_scope":
        return {
          title: "Invalid Scope",
          message: "The requested permissions are invalid.",
          suggestion: "Please contact the application administrator.",
        };
      case "server_error":
        return {
          title: "Server Error",
          message: "Shopify encountered an internal error.",
          suggestion:
            "Please try again later. If the problem persists, contact Shopify support.",
        };
      case "temporarily_unavailable":
        return {
          title: "Service Temporarily Unavailable",
          message: "The authentication service is temporarily unavailable.",
          suggestion: "Please try again in a few minutes.",
        };
      case "login_required":
        return {
          title: "Login Required",
          message: "You need to log in to your Shopify account.",
          suggestion: "Please try again and complete the login process.",
        };
      case "missing_parameters":
        return {
          title: "Missing Parameters",
          message: "Required authentication parameters are missing.",
          suggestion: "Please try the authentication process again.",
        };
      case "invalid_state":
        return {
          title: "Invalid State",
          message:
            "The authentication state is invalid or has been tampered with.",
          suggestion: "This could indicate a security issue. Please try again.",
        };
      case "missing_code_verifier":
        return {
          title: "Missing Code Verifier",
          message: "The PKCE code verifier is missing.",
          suggestion: "Please try the authentication process again.",
        };
      case "server_configuration":
        return {
          title: "Server Configuration Error",
          message: "The server is not properly configured.",
          suggestion: "Please contact the application administrator.",
        };
      default:
        return {
          title: "Authentication Error",
          message: "An error occurred during authentication.",
          suggestion:
            "Please try again. If the problem persists, contact support.",
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {errorDetails.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{errorDetails.message}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Error Code</h3>
              <p className="mt-1 text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
                {error}
              </p>
            </div>

            {description && description !== errorDetails.message && (
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Error Description
                </h3>
                <p className="mt-1 text-sm text-gray-600">{description}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-900">Suggestion</h3>
              <p className="mt-1 text-sm text-gray-600">
                {errorDetails.suggestion}
              </p>
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
          <p>If you continue to experience issues, please contact support.</p>
          <p className="mt-1">
            Error occurred during Shopify Customer Account API authentication.
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; description?: string }>;
}) {
  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthErrorContent searchParams={params} />
    </Suspense>
  );
}
