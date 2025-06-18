"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAddress } from "@/context/AddressContext";
import {
  analyzeProfileCompletion,
  getNextCompletionStep,
  type CustomerProfile,
  type ProfileCompletionStatus,
} from "@/lib/profile-completion";
import {
  fetchCustomerProfileForCompletion,
  handleGraphQLErrors,
} from "@/lib/shopify-profile-api";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { User, MapPin } from "lucide-react";
import { NameCompletionStep } from "./profile-completion/NameCompletionStep";
import { AddressCompletionStep } from "./profile-completion/AddressCompletionStep";

interface ProfileCompletionFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function ProfileCompletionFlow({
  isOpen,
  onClose,
  onComplete,
}: ProfileCompletionFlowProps) {
  const { apiClient, fetchCustomerData } = useAuth();
  const { fetchAddresses } = useAddress();
  const [currentStep, setCurrentStep] = useState<"name" | "address">("name");
  const [profileStatus, setProfileStatus] =
    useState<ProfileCompletionStatus | null>(null);
  const [customerProfile, setCustomerProfile] =
    useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const loadCustomerProfile = useCallback(async () => {
    if (!apiClient || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchCustomerProfileForCompletion(apiClient);
      const errors = handleGraphQLErrors(response);

      if (errors.length > 0) {
        throw new Error(errors.join(", "));
      }

      if (response.data?.customer) {
        const customer = response.data.customer;

        // Transform the API response to match our CustomerProfile interface
        const profile: CustomerProfile = {
          id: customer.id,
          displayName: customer.displayName,
          firstName: customer.firstName,
          lastName: customer.lastName,
          emailAddress: customer.emailAddress,
          phoneNumber: customer.phoneNumber,
          defaultAddress: customer.defaultAddress,
          addresses: customer.addresses.nodes,
        };

        setCustomerProfile(profile);

        const status = analyzeProfileCompletion(profile);
        setProfileStatus(status);

        if (status.isComplete) {
          // Profile is complete, trigger completion callback and close
          onComplete?.();
          onClose();
        } else {
          const nextStep = getNextCompletionStep(status);
          if (nextStep === "complete") {
            // This shouldn't happen if status.isComplete is false, but handle it
            onComplete?.();
            onClose();
          } else {
            setCurrentStep(nextStep);
          }
        }
      }
    } catch (err) {
      console.error("Error loading customer profile:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiClient]);

  // Prevent ESC key from closing the dialog
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown, true);
      return () => {
        document.removeEventListener("keydown", handleKeyDown, true);
      };
    }
  }, [isOpen]);

  // Fetch and analyze customer profile when dialog opens
  useEffect(() => {
    if (isOpen && apiClient && !isLoadingRef.current) {
      loadCustomerProfile();
    }
  }, [isOpen, apiClient, loadCustomerProfile]);

  const handleStepComplete = async () => {
    // Refresh customer data and recalculate status
    await loadCustomerProfile();

    // Refresh the auth context customer data as well
    await fetchCustomerData();

    // Refresh addresses to show newly added addresses
    await fetchAddresses();

    if (profileStatus?.isComplete) {
      // Profile is now complete, trigger completion callback and close
      onComplete?.();
      onClose();
    } else if (profileStatus) {
      const nextStep = getNextCompletionStep(profileStatus);
      if (nextStep === "complete") {
        // This shouldn't happen if profileStatus.isComplete is false, but handle it
        onComplete?.();
        onClose();
      } else {
        setCurrentStep(nextStep);
      }
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case "name":
        return <User className="h-5 w-5" />;
      case "address":
        return <MapPin className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "name":
        return "complete your name";
      case "address":
        return "add your address & phone";
      default:
        return "complete your profile";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case "name":
        return "help us personalize your experience by completing your name.";
      case "address":
        return "add your complete address and phone number for delivery and order updates.";
      default:
        return "complete your profile to get the best experience.";
    }
  };

  const renderCurrentStep = () => {
    if (!apiClient || !customerProfile) return null;

    switch (currentStep) {
      case "name":
        return (
          <NameCompletionStep
            apiClient={apiClient}
            customerProfile={customerProfile}
            onComplete={handleStepComplete}
            missingFields={profileStatus?.missingFields}
          />
        );
      case "address":
        return (
          <AddressCompletionStep
            apiClient={apiClient}
            customerProfile={customerProfile}
            onComplete={handleStepComplete}
          />
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* Overlay Content */}
      <div className="relative bg-[#F8F4EC] w-full max-w-md mx-4 max-h-[calc(100vh-12rem)] overflow-y-auto border border-gray-300 mt-24">
        {/* Header */}
        <div className="p-6 border-b border-gray-300">
          <div className="flex items-center gap-3 mb-3">
            {getStepIcon(currentStep)}
            <h2 className="text-xl font-serif lowercase tracking-widest text-black">
              {getStepTitle()}
            </h2>
          </div>

          <p className="text-sm lowercase tracking-wider text-gray-600 mb-4">
            {getStepDescription()}
          </p>

          {profileStatus && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="lowercase tracking-wider text-gray-600">
                  profile completion
                </span>
                <Badge
                  variant="secondary"
                  className="bg-black text-white text-xs lowercase tracking-widest"
                >
                  {profileStatus.completionPercentage}%
                </Badge>
              </div>
              <Progress
                value={profileStatus.completionPercentage}
                className="h-2 bg-gray-200"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4 text-sm lowercase tracking-wider">
                {error}
              </p>
              <button
                onClick={loadCustomerProfile}
                className="bg-black text-white px-4 py-2 text-sm lowercase tracking-widest hover:opacity-75 transition-opacity"
              >
                try again
              </button>
            </div>
          ) : (
            renderCurrentStep()
          )}
        </div>
      </div>
    </div>
  );
}
