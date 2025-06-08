"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleShopifySignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("shopify-customer", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Shopify Sign-in initiation error:", error);
      toast.error("Sign-in failed", {
        description:
          "Could not initiate sign-in with Shopify. Please try again.",
        duration: 4000,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#F8F4EC] px-4">
      <div className="w-full max-w-md">
        <Card className="bg-[#F8F4EC] border-none shadow-none">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl lowercase tracking-widest text-black mb-1">
              sign in
            </CardTitle>
            <CardDescription className="text-black/70 lowercase tracking-wider text-sm">
              continue with your shopify account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="w-full lowercase tracking-widest border-black text-black hover:bg-black hover:text-white h-10 text-sm transition-all duration-300 mb-6"
              onClick={handleShopifySignIn}
              disabled={isLoading}
            >
              {isLoading ? "redirecting..." : "sign in with shopify"}
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-black/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#F8F4EC] px-3 text-black/70 lowercase tracking-wider">
                  new to juneof?
                </span>
              </div>
            </div>
            <div>
              <p className="text-black/70 mb-3 lowercase tracking-wider text-sm text-center">
                creating an account is now part of the shopify sign-in process.
              </p>
              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full lowercase tracking-widest border-black/30 text-black/70 hover:border-black hover:text-black h-10 text-sm transition-all duration-300"
                  data-underline-button-effect
                >
                  back to store
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
