"use client";

import React, { useState } from "react";
import { CustomerAccountApiClient } from "@/lib/shopify-auth";
import { CustomerProfile, validatePhoneNumber } from "@/lib/profile-completion";
import {
  updateCustomerProfile,
  handleGraphQLErrors,
} from "@/lib/shopify-profile-api";
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
  const [phoneNumber, setPhoneNumber] = useState(
    customerProfile.phoneNumber?.phoneNumber || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = () => {
    const validation = validatePhoneNumber(phoneNumber);
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
      const response = await updateCustomerProfile(apiClient, {
        phoneNumber: phoneNumber.trim(),
      });

      const apiErrors = handleGraphQLErrors(response);

      if (apiErrors.length > 0) {
        throw new Error(apiErrors.join(", "));
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
    setPhoneNumber(value);

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
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              className={error ? "border-destructive" : ""}
              disabled={isSubmitting}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              Include country code if outside the US (e.g., +1 for US)
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
