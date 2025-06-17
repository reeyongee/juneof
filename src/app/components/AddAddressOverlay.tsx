"use client";

import React, { useState } from "react";
import { useAddress } from "@/context/AddressContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CustomerAddressInput } from "@/lib/shopify-customer-address-api";
import { validatePhoneNumber } from "@/lib/profile-completion";

interface AddAddressOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddAddressOverlay({
  isOpen,
  onClose,
}: AddAddressOverlayProps) {
  const { addShopifyAddress } = useAddress();
  const { customerData } = useAuth();

  const [formData, setFormData] = useState({
    firstName: customerData?.customer.firstName || "",
    lastName: customerData?.customer.lastName || "",
    phoneNumber: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    company: "",
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.address1.trim()) {
      newErrors.address1 = "Address line 1 is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }
    if (!formData.zip.trim()) {
      newErrors.zip = "PIN code is required";
    } else if (!/^\d{6}$/.test(formData.zip.trim())) {
      newErrors.zip = "PIN code must be 6 digits";
    }

    // Validate phone number if provided
    if (formData.phoneNumber.trim()) {
      const phoneValidation = validatePhoneNumber(
        `+91${formData.phoneNumber.replace(/\D/g, "")}`
      );
      if (!phoneValidation.isValid) {
        newErrors.phoneNumber =
          phoneValidation.message || "Invalid phone number";
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

    try {
      // Format phone number in E.164 format if provided
      const e164PhoneNumber = formData.phoneNumber.trim()
        ? `+91${formData.phoneNumber.replace(/\D/g, "")}`
        : undefined;

      const shopifyAddressInput: CustomerAddressInput = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        address1: formData.address1.trim(),
        address2: formData.address2.trim() || null,
        city: formData.city.trim(),
        zoneCode: formData.state.trim(),
        territoryCode: "IN", // Always India
        zip: formData.zip.trim(),
        phone: e164PhoneNumber || null,
        company: formData.company.trim() || null,
      };

      const newAddress = await addShopifyAddress(
        shopifyAddressInput,
        formData.isDefault
      );

      if (newAddress) {
        toast.success("address added!", {
          description: "your new address has been saved successfully.",
          duration: 3000,
        });
        handleClose();
      } else {
        toast.error("failed to add address", {
          description: "please try again.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error("failed to add address", {
        description: "please try again.",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: customerData?.customer.firstName || "",
      lastName: customerData?.customer.lastName || "",
      phoneNumber: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      company: "",
      isDefault: false,
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* Overlay Content */}
      <div className="relative bg-[#F8F4EC] w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto border border-gray-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-300">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="h-5 w-5" />
            <h2 className="text-xl font-serif lowercase tracking-widest text-black">
              add new address
            </h2>
          </div>
          <p className="text-sm lowercase tracking-wider text-gray-600">
            add a new delivery address to your account.
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
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
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className={`bg-white border-gray-300 text-black placeholder:text-gray-400 lowercase tracking-wider ${
                    errors.firstName ? "border-red-500" : ""
                  }`}
                  placeholder="enter first name"
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500 lowercase tracking-wider">
                    {errors.firstName}
                  </p>
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
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className={`bg-white border-gray-300 text-black placeholder:text-gray-400 lowercase tracking-wider ${
                    errors.lastName ? "border-red-500" : ""
                  }`}
                  placeholder="enter last name"
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500 lowercase tracking-wider">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label
                htmlFor="phoneNumber"
                className="text-sm lowercase tracking-widest text-black"
              >
                phone number (optional)
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600 lowercase tracking-wider">
                  🇮🇳 +91
                </div>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 10) {
                      handleInputChange("phoneNumber", value);
                    }
                  }}
                  className={`bg-white border-gray-300 text-black placeholder:text-gray-400 lowercase tracking-wider pl-20 ${
                    errors.phoneNumber ? "border-red-500" : ""
                  }`}
                  placeholder="enter 10-digit number"
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-xs text-red-500 lowercase tracking-wider">
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Address Line 1 */}
            <div className="space-y-2">
              <Label
                htmlFor="address1"
                className="text-sm lowercase tracking-widest text-black"
              >
                address line 1
              </Label>
              <Input
                id="address1"
                type="text"
                value={formData.address1}
                onChange={(e) => handleInputChange("address1", e.target.value)}
                className={`bg-white border-gray-300 text-black placeholder:text-gray-400 lowercase tracking-wider ${
                  errors.address1 ? "border-red-500" : ""
                }`}
                placeholder="house/flat no., building name"
              />
              {errors.address1 && (
                <p className="text-xs text-red-500 lowercase tracking-wider">
                  {errors.address1}
                </p>
              )}
            </div>

            {/* Address Line 2 */}
            <div className="space-y-2">
              <Label
                htmlFor="address2"
                className="text-sm lowercase tracking-widest text-black"
              >
                address line 2 (optional)
              </Label>
              <Input
                id="address2"
                type="text"
                value={formData.address2}
                onChange={(e) => handleInputChange("address2", e.target.value)}
                className="bg-white border-gray-300 text-black placeholder:text-gray-400 lowercase tracking-wider"
                placeholder="street, landmark"
              />
            </div>

            {/* City and State */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="city"
                  className="text-sm lowercase tracking-widest text-black"
                >
                  city
                </Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className={`bg-white border-gray-300 text-black placeholder:text-gray-400 lowercase tracking-wider ${
                    errors.city ? "border-red-500" : ""
                  }`}
                  placeholder="enter city"
                />
                {errors.city && (
                  <p className="text-xs text-red-500 lowercase tracking-wider">
                    {errors.city}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="state"
                  className="text-sm lowercase tracking-widest text-black"
                >
                  state
                </Label>
                <Input
                  id="state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className={`bg-white border-gray-300 text-black placeholder:text-gray-400 lowercase tracking-wider ${
                    errors.state ? "border-red-500" : ""
                  }`}
                  placeholder="enter state"
                />
                {errors.state && (
                  <p className="text-xs text-red-500 lowercase tracking-wider">
                    {errors.state}
                  </p>
                )}
              </div>
            </div>

            {/* PIN Code and Company */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="zip"
                  className="text-sm lowercase tracking-widest text-black"
                >
                  PIN code
                </Label>
                <Input
                  id="zip"
                  type="text"
                  value={formData.zip}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 6) {
                      handleInputChange("zip", value);
                    }
                  }}
                  className={`bg-white border-gray-300 text-black placeholder:text-gray-400 lowercase tracking-wider ${
                    errors.zip ? "border-red-500" : ""
                  }`}
                  placeholder="6-digit PIN"
                />
                {errors.zip && (
                  <p className="text-xs text-red-500 lowercase tracking-wider">
                    {errors.zip}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="company"
                  className="text-sm lowercase tracking-widest text-black"
                >
                  company (optional)
                </Label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-400 lowercase tracking-wider"
                  placeholder="company name"
                />
              </div>
            </div>

            {/* Default Address Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  handleInputChange("isDefault", checked === true)
                }
                className="border-gray-300"
              />
              <Label
                htmlFor="isDefault"
                className="text-sm lowercase tracking-wider text-gray-700"
              >
                set as default address
              </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 lowercase tracking-widest border-gray-300 text-black hover:bg-gray-50"
                disabled={isSubmitting}
              >
                cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-black text-white hover:bg-gray-800 lowercase tracking-widest"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    adding...
                  </>
                ) : (
                  "add address"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
