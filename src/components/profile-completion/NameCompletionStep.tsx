"use client";

import React, { useState } from "react";
import { CustomerAccountApiClient } from "@/lib/shopify-auth";
import { CustomerProfile, validateName } from "@/lib/profile-completion";
import {
  updateCustomerProfile,
  handleGraphQLErrors,
} from "@/lib/shopify-profile-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface NameCompletionStepProps {
  apiClient: CustomerAccountApiClient;
  customerProfile: CustomerProfile;
  onComplete: () => void;
  missingFields?: {
    firstName: boolean;
    lastName: boolean;
    phoneNumber: boolean;
    completeAddress: boolean;
  };
}

export function NameCompletionStep({
  apiClient,
  customerProfile,
  onComplete,
  missingFields,
}: NameCompletionStepProps) {
  const [firstName, setFirstName] = useState(customerProfile.firstName || "");
  const [lastName, setLastName] = useState(customerProfile.lastName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: { firstName?: string; lastName?: string } = {};

    // Only validate fields that are actually missing
    if (missingFields?.firstName) {
      const firstNameValidation = validateName(firstName, "First name");
      if (!firstNameValidation.isValid) {
        newErrors.firstName = firstNameValidation.message;
      }
    }

    if (missingFields?.lastName) {
      const lastNameValidation = validateName(lastName, "Last name");
      if (!lastNameValidation.isValid) {
        newErrors.lastName = lastNameValidation.message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const updateData: { firstName?: string; lastName?: string } = {};

      // Only update fields that are missing
      if (missingFields?.firstName && firstName.trim()) {
        updateData.firstName = firstName.trim();
      }
      if (missingFields?.lastName && lastName.trim()) {
        updateData.lastName = lastName.trim();
      }

      const response = await updateCustomerProfile(apiClient, updateData);
      const apiErrors = handleGraphQLErrors(response);

      if (apiErrors.length > 0) {
        throw new Error(apiErrors.join(", "));
      }

      onComplete();
    } catch (err) {
      console.error("Error updating customer name:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Failed to update name"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipStep = () => {
    onComplete();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {missingFields?.firstName && (
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                className={errors.firstName ? "border-destructive" : ""}
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName}</p>
              )}
            </div>
          )}

          {missingFields?.lastName && (
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                className={errors.lastName ? "border-destructive" : ""}
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName}</p>
              )}
            </div>
          )}

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
