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
          title: "access denied",
          message: "you denied access to your shopify account.",
          suggestion:
            "to use this application, you need to grant access to your shopify customer account.",
        };
      case "invalid_request":
        return {
          title: "invalid request",
          message: "the authentication request was malformed or invalid.",
          suggestion:
            "please try again. if the problem persists, contact support.",
        };
      case "invalid_client":
        return {
          title: "invalid client",
          message: "the application is not properly configured.",
          suggestion: "please contact the application administrator.",
        };
      case "invalid_grant":
        return {
          title: "invalid grant",
          message: "the authorization code is invalid or has expired.",
          suggestion: "please try the authentication process again.",
        };
      case "unsupported_response_type":
        return {
          title: "unsupported response type",
          message: "the requested response type is not supported.",
          suggestion: "please contact the application administrator.",
        };
      case "invalid_scope":
        return {
          title: "invalid scope",
          message: "the requested permissions are invalid.",
          suggestion: "please contact the application administrator.",
        };
      case "server_error":
        return {
          title: "server error",
          message: "shopify encountered an internal error.",
          suggestion:
            "please try again later. if the problem persists, contact shopify support.",
        };
      case "temporarily_unavailable":
        return {
          title: "service temporarily unavailable",
          message: "the authentication service is temporarily unavailable.",
          suggestion: "please try again in a few minutes.",
        };
      case "login_required":
        return {
          title: "login required",
          message: "you need to log in to your shopify account.",
          suggestion: "please try again and complete the login process.",
        };
      case "missing_parameters":
        return {
          title: "missing parameters",
          message: "required authentication parameters are missing.",
          suggestion: "please try the authentication process again.",
        };
      case "invalid_state":
        return {
          title: "invalid state",
          message:
            "the authentication state is invalid or has been tampered with.",
          suggestion: "this could indicate a security issue. please try again.",
        };
      case "missing_code_verifier":
        return {
          title: "missing code verifier",
          message: "the pkce code verifier is missing.",
          suggestion: "please try the authentication process again.",
        };
      case "server_configuration":
        return {
          title: "server configuration error",
          message: "the server is not properly configured.",
          suggestion: "please contact the application administrator.",
        };
      default:
        return {
          title: "authentication error",
          message: "an error occurred during authentication.",
          suggestion:
            "please try again. if the problem persists, contact support.",
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
          <h2 className="mt-6 text-2xl font-serif lowercase tracking-widest text-black">
            {errorDetails.title}
          </h2>
          <p className="mt-2 text-lg lowercase tracking-wider text-gray-600">
            {errorDetails.message}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium lowercase tracking-wider text-black">
                error code
              </h3>
              <p className="mt-1 text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
                {error}
              </p>
            </div>

            {description && description !== errorDetails.message && (
              <div>
                <h3 className="text-sm font-medium lowercase tracking-wider text-black">
                  error description
                </h3>
                <p className="mt-1 text-sm lowercase tracking-wider text-gray-600">
                  {description}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium lowercase tracking-wider text-black">
                suggestion
              </h3>
              <p className="mt-1 text-sm lowercase tracking-wider text-gray-600">
                {errorDetails.suggestion}
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <Link
            href="/dashboard"
            className="flex-1 bg-black text-white py-3 px-4 rounded text-center lowercase tracking-wider hover:opacity-75 transition-opacity"
          >
            try again
          </Link>
          <Link
            href="/"
            className="flex-1 bg-gray-600 text-white py-3 px-4 rounded text-center lowercase tracking-wider hover:opacity-75 transition-opacity"
          >
            go home
          </Link>
        </div>

        <div className="text-xs lowercase tracking-wider text-gray-500 text-center">
          <p>if you continue to experience issues, please contact support.</p>
          <p className="mt-1">
            error occurred during shopify customer account api authentication.
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
        <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-lg lowercase tracking-wider text-gray-600">
              loading error details...
            </p>
          </div>
        </div>
      }
    >
      <AuthErrorContent searchParams={params} />
    </Suspense>
  );
}
