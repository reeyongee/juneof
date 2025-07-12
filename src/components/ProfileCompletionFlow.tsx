"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAddress } from "@/context/AddressContext";
import { useCart } from "@/context/CartContext";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerProfile, setCustomerProfile] =
    useState<CustomerProfile | null>(null);
  const [profileStatus, setProfileStatus] =
    useState<ProfileCompletionStatus | null>(null);
  const [currentStep, setCurrentStep] = useState<"name" | "address">("name");

  // Simplified state management - track if this session actually completed the profile
  const [hasCompletedInThisSession, setHasCompletedInThisSession] =
    useState(false);
  const [shouldOpenCartOnComplete, setShouldOpenCartOnComplete] =
    useState(false);
  const isLoadingRef = useRef(false);
  const { apiClient, fetchCustomerData } = useAuth();
  const { fetchAddresses } = useAddress();
  const { openCartOverlay } = useCart();

  // Check for checkout login context when dialog opens
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      console.log("ProfileCompletionFlow: Checking for checkout login context");

      const checkoutLoginContext = sessionStorage.getItem(
        "checkout-login-context"
      );
      if (checkoutLoginContext) {
        try {
          const context = JSON.parse(checkoutLoginContext);
          if (context.isCheckoutLogin) {
            console.log(
              "ProfileCompletionFlow: Checkout login detected - will open cart after completion"
            );
            setShouldOpenCartOnComplete(true);

            // Clean up checkout context immediately since we're handling it
            sessionStorage.removeItem("checkout-login-context");
            console.log(
              "ProfileCompletionFlow: Cleaned up checkout login context"
            );
          }
        } catch (error) {
          console.error(
            "ProfileCompletionFlow: Error parsing checkout login context:",
            error
          );
        }
      } else {
        console.log("ProfileCompletionFlow: No checkout login context found");
      }
    }
  }, [isOpen]);

  const loadCustomerProfile = useCallback(async () => {
    if (!apiClient || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      console.log("ProfileCompletionFlow: Loading customer profile...");
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

        console.log("ProfileCompletionFlow: Profile analysis:", {
          isComplete: status.isComplete,
          completionPercentage: status.completionPercentage,
          missingFields: status.missingFields,
          hasCompletedInThisSession,
        });

        if (status.isComplete) {
          console.log(
            "ProfileCompletionFlow: Profile is already complete, closing flow"
          );
          // Profile is already complete - close without triggering completion callback
          // since this wasn't completed in this session
          onClose();
        } else {
          const nextStep = getNextCompletionStep(status);
          if (nextStep === "complete") {
            // This shouldn't happen if status.isComplete is false, but handle it
            console.log(
              "ProfileCompletionFlow: Next step is complete but status says incomplete - closing"
            );
            onClose();
          } else {
            console.log(
              "ProfileCompletionFlow: Setting current step to:",
              nextStep
            );
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
  }, [apiClient, onClose, hasCompletedInThisSession]);

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

  // Reset session completion state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log(
        "ProfileCompletionFlow: Dialog opened, resetting session state"
      );
      setHasCompletedInThisSession(false);
    } else {
      // Reset checkout cart opening flag when dialog closes to prevent stale state
      console.log(
        "ProfileCompletionFlow: Dialog closed, resetting cart opening flag"
      );
      setShouldOpenCartOnComplete(false);
    }
  }, [isOpen]);

  // Fetch and analyze customer profile when dialog opens
  useEffect(() => {
    if (isOpen && apiClient && !isLoadingRef.current) {
      loadCustomerProfile();
    }
  }, [isOpen, apiClient, loadCustomerProfile]);

  const handleStepCompleteWithDirectCheck = async () => {
    console.log("ProfileCompletionFlow: Step completion triggered");

    if (!apiClient) {
      console.error("No apiClient available for step completion");
      return;
    }

    try {
      // Refresh customer data and recalculate status
      const response = await fetchCustomerProfileForCompletion(apiClient);
      const errors = handleGraphQLErrors(response);

      if (errors.length > 0) {
        console.error("Error fetching profile after step completion:", errors);
        return;
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

        console.log("ProfileCompletionFlow: After step completion analysis:", {
          isComplete: status.isComplete,
          completionPercentage: status.completionPercentage,
          missingFields: status.missingFields,
        });

        // Refresh the auth context customer data as well
        await fetchCustomerData();

        // Refresh addresses to show newly added addresses
        await fetchAddresses();

        if (status.isComplete) {
          // Profile is now complete due to user action in this session
          console.log(
            "ProfileCompletionFlow: Profile completed by user action - triggering completion callback"
          );
          setHasCompletedInThisSession(true);

          // Handle cart opening for checkout login flows
          if (shouldOpenCartOnComplete) {
            console.log(
              "ProfileCompletionFlow: Opening cart after profile completion for checkout login"
            );

            // Use a timeout to ensure profile completion flow closes first
            setTimeout(() => {
              console.log("ProfileCompletionFlow: Executing cart overlay open");
              openCartOverlay();

              // Reset the flag after opening to prevent any future accidental opens
              setShouldOpenCartOnComplete(false);
            }, 100);
          }

          // Always trigger completion callback when user completes profile
          onComplete?.();
          onClose();
        } else {
          const nextStep = getNextCompletionStep(status);
          if (nextStep === "complete") {
            // This shouldn't happen if status.isComplete is false, but handle it
            console.log(
              "ProfileCompletionFlow: Next step is complete but status incomplete - triggering completion anyway"
            );
            setHasCompletedInThisSession(true);

            // Handle cart opening for checkout login flows
            if (shouldOpenCartOnComplete) {
              console.log(
                "ProfileCompletionFlow: Opening cart after profile completion for checkout login (fallback)"
              );

              // Use a timeout to ensure profile completion flow closes first
              setTimeout(() => {
                console.log(
                  "ProfileCompletionFlow: Executing cart overlay open (fallback)"
                );
                openCartOverlay();

                // Reset the flag after opening to prevent any future accidental opens
                setShouldOpenCartOnComplete(false);
              }, 100);
            }

            onComplete?.();
            onClose();
          } else {
            console.log(
              "ProfileCompletionFlow: Moving to next step:",
              nextStep
            );
            setCurrentStep(nextStep);
          }
        }
      }
    } catch (error) {
      console.error("Error in handleStepCompleteWithDirectCheck:", error);
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
            onComplete={handleStepCompleteWithDirectCheck}
            missingFields={profileStatus?.missingFields}
          />
        );
      case "address":
        return (
          <AddressCompletionStep
            apiClient={apiClient}
            customerProfile={customerProfile}
            onComplete={handleStepCompleteWithDirectCheck}
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
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-gray-900 lowercase">
                {getStepTitle()}
              </h2>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {getStepIcon(currentStep)}
                  <span className="ml-1 capitalize">{currentStep}</span>
                </Badge>
              </div>
            </div>
            <p className="text-sm text-gray-600 lowercase">
              {getStepDescription()}
            </p>
            {profileStatus && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Profile completion</span>
                  <span>{profileStatus.completionPercentage}%</span>
                </div>
                <Progress
                  value={profileStatus.completionPercentage}
                  className="h-2"
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 text-sm mb-4">{error}</p>
                <button
                  onClick={loadCustomerProfile}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              renderCurrentStep()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
