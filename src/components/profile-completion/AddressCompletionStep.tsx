"use client";

import React, { useState } from "react";
import { CustomerAccountApiClient } from "@/lib/shopify-auth";
import { CustomerProfile, validateAddressForm } from "@/lib/profile-completion";
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
import { Loader2, MapPin } from "lucide-react";

interface AddressCompletionStepProps {
  apiClient: CustomerAccountApiClient;
  customerProfile: CustomerProfile;
  onComplete: () => void;
}

// Common countries - you can expand this list
const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "IN", label: "India" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "JP", label: "Japan" },
  { value: "BR", label: "Brazil" },
  { value: "MX", label: "Mexico" },
];

export function AddressCompletionStep({
  apiClient,
  onComplete,
}: AddressCompletionStepProps) {
  const [formData, setFormData] = useState({
    address1: "",
    address2: "",
    city: "",
    province: "",
    zip: "",
    country: "US", // Default to US
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = () => {
    const validation = validateAddressForm(formData);
    setErrors(validation.errors);
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
      const response = await createCustomerAddress(apiClient, {
        address1: formData.address1.trim(),
        address2: formData.address2.trim() || undefined,
        city: formData.city.trim(),
        territoryCode: formData.country,
        zoneCode: formData.province.trim(),
        zip: formData.zip.trim(),
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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-2 mb-4">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Add your address for faster checkout and accurate delivery.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => handleInputChange("country", value)}
            >
              <SelectTrigger
                className={errors.country ? "border-destructive" : ""}
              >
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
              <p className="text-sm text-destructive">{errors.country}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address1">Address Line 1</Label>
            <Input
              id="address1"
              type="text"
              value={formData.address1}
              onChange={(e) => handleInputChange("address1", e.target.value)}
              placeholder="Street address, P.O. box, company name"
              className={errors.address1 ? "border-destructive" : ""}
              disabled={isSubmitting}
            />
            {errors.address1 && (
              <p className="text-sm text-destructive">{errors.address1}</p>
            )}
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="City"
                className={errors.city ? "border-destructive" : ""}
                disabled={isSubmitting}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
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
                className={errors.province ? "border-destructive" : ""}
                disabled={isSubmitting}
              />
              {errors.province && (
                <p className="text-sm text-destructive">{errors.province}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zip">{getZipLabel()}</Label>
            <Input
              id="zip"
              type="text"
              value={formData.zip}
              onChange={(e) => handleInputChange("zip", e.target.value)}
              placeholder={getZipLabel()}
              className={errors.zip ? "border-destructive" : ""}
              disabled={isSubmitting}
            />
            {errors.zip && (
              <p className="text-sm text-destructive">{errors.zip}</p>
            )}
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
                "Complete Profile"
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
