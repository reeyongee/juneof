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
import { Loader2 } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerProfile, setCustomerProfile] =
    useState<CustomerProfile | null>(null);
  const [profileStatus, setProfileStatus] =
    useState<ProfileCompletionStatus | null>(null);
  const [currentStep, setCurrentStep] = useState<"name" | "address">("name");

  const isLoadingRef = useRef(false);
  const { apiClient, fetchCustomerData } = useAuth();
  const { fetchAddresses } = useAddress();

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
          onClose(); // Already complete, just close.
        } else {
          const nextStep = getNextCompletionStep(status);
          if (nextStep === "name" || nextStep === "address") {
            setCurrentStep(nextStep);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [apiClient, onClose]);

  // Prevent ESC key from closing the dialog
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen]);

  // Fetch profile when the dialog opens
  useEffect(() => {
    if (isOpen && apiClient) {
      loadCustomerProfile();
    }
  }, [isOpen, apiClient, loadCustomerProfile]);

  const handleStepComplete = async () => {
    if (!apiClient) return;

    // Refresh data to see if we're done
    const response = await fetchCustomerProfileForCompletion(apiClient);
    if (response.data?.customer) {
      const profile: CustomerProfile = {
        ...response.data.customer,
        addresses: response.data.customer.addresses.nodes,
      };
      const newStatus = analyzeProfileCompletion(profile);
      setProfileStatus(newStatus);
      await fetchCustomerData();
      await fetchAddresses();

      if (newStatus.isComplete) {
        onComplete?.(); // Signal completion to the parent
        onClose();
      } else {
        const nextStep = getNextCompletionStep(newStatus);
        if (nextStep === "name" || nextStep === "address") {
          setCurrentStep(nextStep);
        }
      }
    }
  };

  const getStepTitle = () => {
    if (currentStep === "name") return "complete your name";
    if (currentStep === "address") return "add your address & phone";
    return "complete your profile";
  };

  const getStepDescription = () => {
    if (currentStep === "name")
      return "help us personalize your experience by completing your name.";
    if (currentStep === "address")
      return "add your complete address and phone number for delivery and order updates.";
    return "complete your profile to get the best experience.";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 lowercase">
              {getStepTitle()}
            </h2>
            <p className="text-sm text-gray-600 lowercase mt-1">
              {getStepDescription()}
            </p>
            {profileStatus && (
              <div className="mt-3">
                <Progress
                  value={profileStatus.completionPercentage}
                  className="h-2"
                />
              </div>
            )}
          </div>
          <div className="px-6 py-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
              </div>
            )}
            {error && (
              <div className="text-center py-8">
                <p className="text-red-600 text-sm mb-4">{error}</p>
              </div>
            )}
            {!isLoading &&
              !error &&
              apiClient &&
              customerProfile &&
              (currentStep === "name" ? (
                <NameCompletionStep
                  apiClient={apiClient}
                  customerProfile={customerProfile}
                  onComplete={handleStepComplete}
                  missingFields={profileStatus?.missingFields}
                />
              ) : (
                <AddressCompletionStep
                  apiClient={apiClient}
                  customerProfile={customerProfile}
                  onComplete={handleStepComplete}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
