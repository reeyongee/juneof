"use client";

import React, { useState } from "react";
import { CustomerAccountApiClient } from "@/lib/shopify-auth";
import {
  CustomerProfile,
  validateAddressForm,
  validatePhoneNumber,
} from "@/lib/profile-completion";
import { createCustomerAddress } from "@/lib/shopify-profile-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin, Phone } from "lucide-react";

// Country options for the select
const COUNTRIES = [
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
];

interface AddressCompletionStepProps {
  apiClient: CustomerAccountApiClient;
  customerProfile: CustomerProfile;
  onComplete: () => void;
}

export function AddressCompletionStep({
  apiClient,
  onComplete,
}: AddressCompletionStepProps) {
  const [formData, setFormData] = useState({
    phoneNumber: "",
    address1: "",
    address2: "",
    city: "",
    province: "",
    zip: "",
    country: "IN", // Default to India
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate phone number
    const phoneValidation = validatePhoneNumber(
      `+91${formData.phoneNumber.replace(/\D/g, "")}`
    );
    if (!phoneValidation.isValid) {
      newErrors.phoneNumber = phoneValidation.message || "Invalid phone number";
    }

    // Validate address fields
    const addressValidation = validateAddressForm({
      address1: formData.address1,
      address2: formData.address2,
      city: formData.city,
      province: formData.province,
      zip: formData.zip,
      country: formData.country,
    });

    if (!addressValidation.isValid) {
      Object.assign(newErrors, addressValidation.errors);
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
      // Format phone number in E.164 format
      const e164PhoneNumber = `+91${formData.phoneNumber.replace(/\D/g, "")}`;

      const response = await createCustomerAddress(apiClient, {
        address1: formData.address1.trim(),
        address2: formData.address2.trim() || undefined,
        city: formData.city.trim(),
        territoryCode: formData.country,
        zoneCode: formData.province.trim(),
        zip: formData.zip.trim(),
        phoneNumber: e164PhoneNumber,
      });

      if (!response.success) {
        throw new Error(
          response.errors?.join(", ") || "Failed to create address"
        );
      }

      onComplete();
    } catch (err) {
      console.error("Error creating customer address:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save address"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipStep = () => {
    onComplete();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const getStateLabel = () => {
    switch (formData.country) {
      case "US":
        return "State";
      case "CA":
        return "Province";
      case "GB":
        return "County";
      default:
        return "State/Province";
    }
  };

  const getZipLabel = () => {
    switch (formData.country) {
      case "US":
        return "ZIP Code";
      case "CA":
        return "Postal Code";
      case "GB":
        return "Postcode";
      default:
        return "Postal/ZIP Code";
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <Phone className="h-4 w-4 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">
            Complete Your Address & Phone
          </h2>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Add your complete address and phone number for delivery and order
          updates.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Number Section */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <div className="flex">
              <div className="flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 rounded-l-md text-sm font-medium text-gray-700">
                🇮🇳 +91
              </div>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  handleInputChange("phoneNumber", value);
                }}
                placeholder="9876543210"
                className={`rounded-l-none ${
                  errors.phoneNumber ? "border-red-500" : ""
                }`}
                required
                disabled={isSubmitting}
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-sm text-red-600">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Country Selection */}
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => handleInputChange("country", value)}
            >
              <SelectTrigger className={errors.country ? "border-red-500" : ""}>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-sm text-red-600">{errors.country}</p>
            )}
          </div>

          {/* Address Line 1 */}
          <div className="space-y-2">
            <Label htmlFor="address1">Address Line 1</Label>
            <Input
              id="address1"
              type="text"
              value={formData.address1}
              onChange={(e) => handleInputChange("address1", e.target.value)}
              placeholder="Street address, P.O. box, company name"
              className={errors.address1 ? "border-red-500" : ""}
              required
              disabled={isSubmitting}
            />
            {errors.address1 && (
              <p className="text-sm text-red-600">{errors.address1}</p>
            )}
          </div>

          {/* Address Line 2 */}
          <div className="space-y-2">
            <Label htmlFor="address2">Address Line 2 (Optional)</Label>
            <Input
              id="address2"
              type="text"
              value={formData.address2}
              onChange={(e) => handleInputChange("address2", e.target.value)}
              placeholder="Apartment, suite, unit, building, floor, etc."
              disabled={isSubmitting}
            />
          </div>

          {/* City and State/Province */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="City"
                className={errors.city ? "border-red-500" : ""}
                required
                disabled={isSubmitting}
              />
              {errors.city && (
                <p className="text-sm text-red-600">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">{getStateLabel()}</Label>
              <Input
                id="province"
                type="text"
                value={formData.province}
                onChange={(e) => handleInputChange("province", e.target.value)}
                placeholder={getStateLabel()}
                className={errors.province ? "border-red-500" : ""}
                required
                disabled={isSubmitting}
              />
              {errors.province && (
                <p className="text-sm text-red-600">{errors.province}</p>
              )}
            </div>
          </div>

          {/* ZIP/Postal Code */}
          <div className="space-y-2">
            <Label htmlFor="zip">{getZipLabel()}</Label>
            <Input
              id="zip"
              type="text"
              value={formData.zip}
              onChange={(e) => handleInputChange("zip", e.target.value)}
              placeholder={getZipLabel()}
              className={errors.zip ? "border-red-500" : ""}
              required
              disabled={isSubmitting}
            />
            {errors.zip && <p className="text-sm text-red-600">{errors.zip}</p>}
          </div>

          {submitError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {submitError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkipStep}
              disabled={isSubmitting}
              className="flex-1"
            >
              Skip for now
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Profile"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
