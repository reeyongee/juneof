"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Globe, Monitor } from "lucide-react";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const error = searchParams.get("error");
  const description = searchParams.get("description");

  const isSafari =
    typeof window !== "undefined" &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const getErrorTitle = () => {
    switch (error) {
      case "missing_parameters":
        return "Authentication Parameters Missing";
      case "invalid_state":
        return "Invalid Authentication State";
      case "server_configuration":
        return "Server Configuration Error";
      case "invalid_grant":
        return "Authentication Failed";
      default:
        return "Authentication Error";
    }
  };

  const getSafariInstructions = () => (
    <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
      <div className="flex items-center mb-3">
        <Globe className="h-5 w-5 text-orange-600 mr-2" />
        <h3 className="font-semibold text-orange-800">Safari Users</h3>
      </div>
      <p className="text-sm text-orange-700 mb-3">
        Safari&apos;s privacy settings are blocking the authentication. To fix
        this:
      </p>
      <ol className="text-sm text-orange-700 space-y-1 ml-4 list-decimal">
        <li>Open Safari Settings (Safari → Settings)</li>
        <li>Go to the &ldquo;Privacy&rdquo; tab</li>
        <li>Uncheck &ldquo;Prevent cross-site tracking&rdquo;</li>
        <li>Refresh this page and try logging in again</li>
      </ol>
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-700">
          <strong>Alternative:</strong> Use Chrome or Firefox for
          authentication, which have more compatible privacy settings.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {getErrorTitle()}
          </CardTitle>
          <CardDescription className="text-gray-600">
            We encountered an issue during authentication
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {description && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
              {description}
            </div>
          )}

          {isSafari && getSafariInstructions()}

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full"
            >
              Try Again
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full"
            >
              Return Home
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>Recommended browsers:</p>
            <div className="flex justify-center space-x-4 mt-2">
              <Monitor className="h-4 w-4" />
              <Globe className="h-4 w-4" />
              <span className="text-orange-500">
                <Globe className="h-4 w-4" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
