"use client";

import React, { useState } from "react";
import { CustomerAccountApiClient } from "@/lib/shopify-auth";
import { CustomerProfile, validatePhoneNumber } from "@/lib/profile-completion";
import { updateCustomerPhoneNumber } from "@/lib/shopify-profile-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Phone } from "lucide-react";

interface PhoneCompletionStepProps {
  apiClient: CustomerAccountApiClient;
  onComplete: (updatedProfile: Partial<CustomerProfile>) => void;
  onSkip: () => void;
}

export function PhoneCompletionStep({
  apiClient,
  onComplete,
  onSkip,
}: PhoneCompletionStepProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fixed country code for India (+91) - unselectable as requested
  const countryCode = "+91";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Format phone number in E.164 format
    const e164PhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;

    // Validate phone number
    const validation = validatePhoneNumber(e164PhoneNumber);
    if (!validation.isValid) {
      setError(validation.message || "Invalid phone number");
      return;
    }

    setIsLoading(true);

    try {
      const response = await updateCustomerPhoneNumber(
        apiClient,
        e164PhoneNumber
      );

      if (!response.success) {
        throw new Error(
          response.errors?.join(", ") || "Failed to update phone number"
        );
      }

      // Update the customer profile with the new phone number
      onComplete({
        phoneNumber: {
          phoneNumber: e164PhoneNumber,
        },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update phone number"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Phone className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Add Your Phone Number</h2>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          We&apos;ll use this to send you order updates and important
          notifications.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex">
              {/* Fixed country code selector - unselectable */}
              <div className="flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 rounded-l-md text-sm font-medium text-gray-700">
                🇮🇳 +91
              </div>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  // Only allow digits and limit to 10 digits for Indian numbers
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPhoneNumber(value);
                }}
                placeholder="9876543210"
                className="rounded-l-none"
                required
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter your 10-digit mobile number (without country code)
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onSkip}
              disabled={isLoading}
              className="flex-1"
            >
              Skip for now
            </Button>
            <Button
              type="submit"
              disabled={isLoading || phoneNumber.length !== 10}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
