"use client";

import React, { useState } from "react";
import { CustomerAccountApiClient } from "@/lib/shopify-auth";
import {
  CustomerProfile,
  validateName,
  type ProfileCompletionStatus,
} from "@/lib/profile-completion";
import { updateCustomerProfile } from "@/lib/shopify-profile-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface NameCompletionStepProps {
  apiClient: CustomerAccountApiClient;
  customerProfile: CustomerProfile;
  onComplete: () => void;
  missingFields?: ProfileCompletionStatus["missingFields"];
}

export function NameCompletionStep({
  apiClient,
  customerProfile,
  onComplete,
  missingFields,
}: NameCompletionStepProps) {
  const [formData, setFormData] = useState({
    firstName: customerProfile.firstName || "",
    lastName: customerProfile.lastName || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Only validate fields that are actually missing
    if (missingFields?.firstName) {
      const firstNameValidation = validateName(
        formData.firstName,
        "First name"
      );
      if (!firstNameValidation.isValid) {
        newErrors.firstName =
          firstNameValidation.message || "First name is required";
      }
    }

    if (missingFields?.lastName) {
      const lastNameValidation = validateName(formData.lastName, "Last name");
      if (!lastNameValidation.isValid) {
        newErrors.lastName =
          lastNameValidation.message || "Last name is required";
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
      const response = await updateCustomerProfile(apiClient, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      });

      if (!response.success) {
        throw new Error(
          response.errors?.join(", ") || "Failed to update profile"
        );
      }

      onComplete();
    } catch (err) {
      console.error("Error updating customer profile:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="firstName"
            className="text-sm lowercase tracking-widest text-black"
          >
            first name
          </Label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            placeholder="first name"
            className={`bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-black focus:ring-black/20 h-10 text-sm ${
              errors.firstName ? "border-red-500" : ""
            }`}
            required={missingFields?.firstName}
            disabled={isSubmitting}
          />
          {errors.firstName && (
            <p className="text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="lastName"
            className="text-sm lowercase tracking-widest text-black"
          >
            last name
          </Label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            placeholder="last name"
            className={`bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-black focus:ring-black/20 h-10 text-sm ${
              errors.lastName ? "border-red-500" : ""
            }`}
            required={missingFields?.lastName}
            disabled={isSubmitting}
          />
          {errors.lastName && (
            <p className="text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>

      {submitError && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {submitError}
        </div>
      )}

      <div className="pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full lowercase tracking-widest border-black text-black hover:bg-black hover:text-white h-10 text-sm transition-all duration-300 no-underline-effect bg-white border"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              saving...
            </>
          ) : (
            "continue"
          )}
        </Button>
      </div>
    </form>
  );
}
