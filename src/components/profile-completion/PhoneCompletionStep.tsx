"use client";

import React, { useState } from "react";
import { CustomerAccountApiClient } from "@/lib/shopify-auth";
import { CustomerProfile, validatePhoneNumber } from "@/lib/profile-completion";
import { updateCustomerProfile } from "@/lib/shopify-profile-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Phone } from "lucide-react";

interface PhoneCompletionStepProps {
  apiClient: CustomerAccountApiClient;
  customerProfile: CustomerProfile;
  onComplete: () => void;
}

export function PhoneCompletionStep({
  apiClient,
  customerProfile,
  onComplete,
}: PhoneCompletionStepProps) {
  // Extract existing phone number if it exists
  const existingPhone = customerProfile.phoneNumber?.phoneNumber || "";
  const [countryCode] = useState("+91"); // India country code, unselectable
  const [phoneNumber, setPhoneNumber] = useState(() => {
    // If existing phone starts with +91, remove it for display
    if (existingPhone.startsWith("+91")) {
      return existingPhone.substring(3);
    }
    // If it starts with any other country code, keep as is for now
    if (existingPhone.startsWith("+")) {
      return existingPhone;
    }
    return existingPhone;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = () => {
    // Combine country code with phone number for validation
    const fullPhoneNumber = countryCode + phoneNumber.replace(/^\+/, "");
    const validation = validatePhoneNumber(fullPhoneNumber);
    setError(validation.isValid ? null : validation.message || null);
    return validation.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Format phone number in E.164 format
      const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");
      const e164PhoneNumber = countryCode + cleanPhoneNumber.replace(/^\+/, "");

      const response = await updateCustomerProfile(apiClient, {
        phone: e164PhoneNumber,
      });

      if (!response.success) {
        throw new Error(
          response.errors?.join(", ") || "Failed to update phone number"
        );
      }

      onComplete();
    } catch (err) {
      console.error("Error updating customer phone:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Failed to update phone number"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipStep = () => {
    onComplete();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove any non-digit characters except spaces and dashes for display
    const cleanValue = value.replace(/[^\d\s\-]/g, "");
    setPhoneNumber(cleanValue);

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-2 mb-4">
          <Phone className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            We&apos;ll use this for order updates and customer support.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <div className="flex">
              <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm font-medium">
                {countryCode}
              </div>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="9876543210"
                className={`rounded-l-none ${
                  error ? "border-destructive" : ""
                }`}
                disabled={isSubmitting}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              Enter your 10-digit mobile number (India +91)
            </p>
          </div>

          {submitError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Continue"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSkipStep}
              disabled={isSubmitting}
            >
              Skip for now
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
