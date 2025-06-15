"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginAuth } from "@/components/LoginAuth";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // If already authenticated, show loading state while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Redirecting to dashboard...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Login to Your Account
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sign in with your Shopify account to access your dashboard and
            manage your orders.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <LoginAuth />
        </div>
      </div>
    </div>
  );
}
