"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Welcome back, {session.user?.name}!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You are already signed in.
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <button
              onClick={() => router.push("/dashboard")}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => signOut()}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect with your Shopify customer account
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <button
              onClick={() => signIn("shopify")}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M15.8 2.21c-.68-.24-1.48-.3-2.32-.18-.84.12-1.72.42-2.52.84-.8.42-1.52.96-2.12 1.56-.6.6-1.08 1.26-1.44 1.98-.36.72-.6 1.5-.72 2.34-.12.84-.12 1.68.06 2.52.18.84.54 1.68 1.08 2.46.54.78 1.26 1.5 2.16 2.1.9.6 1.98 1.08 3.18 1.38 1.2.3 2.52.42 3.9.36 1.38-.06 2.82-.3 4.32-.72v-2.4c-1.38.36-2.7.54-3.96.54-1.26 0-2.4-.12-3.42-.36-.96-.24-1.8-.6-2.52-1.08-.72-.48-1.32-1.08-1.8-1.8-.48-.72-.84-1.56-1.08-2.52-.24-.96-.36-2.04-.36-3.24 0-1.2.12-2.28.36-3.24.24-.96.6-1.8 1.08-2.52.48-.72 1.08-1.32 1.8-1.8.72-.48 1.56-.84 2.52-1.08 1.02-.24 2.16-.36 3.42-.36 1.26 0 2.58.18 3.96.54V2.93c-1.5-.42-2.94-.66-4.32-.72z" />
              </svg>
              Sign in with Shopify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
