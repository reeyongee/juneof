"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function ClientAuthInfo() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="p-4 bg-gray-100 rounded-lg">Loading session...</div>;
  }

  if (!session) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Client-side Auth Status</h3>
        <p className="mb-4">No active session</p>
        <button
          onClick={() => signIn("shopify")}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Sign in with Shopify
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Client-side Auth Status</h3>
      <div className="mb-4">
        <p className="font-medium">Welcome, {session.user?.name}!</p>
        <p className="text-sm text-gray-600">Email: {session.user?.email}</p>
      </div>
      <button
        onClick={() => signOut()}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Sign out
      </button>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium">
          Session Details
        </summary>
        <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </details>
    </div>
  );
}
