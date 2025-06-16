"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, User, Phone, MapPin, CheckCircle } from "lucide-react";
import { NameCompletionStep } from "./profile-completion/NameCompletionStep";
import { PhoneCompletionStep } from "./profile-completion/PhoneCompletionStep";
import { AddressCompletionStep } from "./profile-completion/AddressCompletionStep";
import { CompletionSuccessStep } from "./profile-completion/CompletionSuccessStep";

interface ProfileCompletionFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  allowSkip?: boolean;
}

export function ProfileCompletionFlow({
  isOpen,
  onClose,
  onComplete,
  allowSkip = true,
}: ProfileCompletionFlowProps) {
  const { apiClient, fetchCustomerData } = useAuth();
  const [currentStep, setCurrentStep] = useState<
    "name" | "phone" | "address" | "complete"
  >("name");
  const [profileStatus, setProfileStatus] =
    useState<ProfileCompletionStatus | null>(null);
  const [customerProfile, setCustomerProfile] =
    useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomerProfile = useCallback(async () => {
    if (!apiClient) return;

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
          setCurrentStep("complete");
        } else {
          setCurrentStep(getNextCompletionStep(status));
        }
      }
    } catch (err) {
      console.error("Error loading customer profile:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  // Fetch and analyze customer profile when dialog opens
  useEffect(() => {
    if (isOpen && apiClient) {
      loadCustomerProfile();
    }
  }, [isOpen, apiClient, loadCustomerProfile]);

  const handleStepComplete = async () => {
    // Refresh customer data and recalculate status
    await loadCustomerProfile();

    // Refresh the auth context customer data as well
    await fetchCustomerData();

    if (profileStatus?.isComplete) {
      setCurrentStep("complete");
      onComplete?.();
    } else if (profileStatus) {
      setCurrentStep(getNextCompletionStep(profileStatus));
    }
  };

  const handleSkip = () => {
    if (allowSkip) {
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case "name":
        return <User className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "address":
        return <MapPin className="h-4 w-4" />;
      case "complete":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "name":
        return "Complete Your Name";
      case "phone":
        return "Add Your Phone Number";
      case "address":
        return "Add Your Address";
      case "complete":
        return "Profile Complete!";
      default:
        return "Complete Your Profile";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case "name":
        return "Help us personalize your experience by completing your name.";
      case "phone":
        return "Add your phone number for order updates and support.";
      case "address":
        return "Add your address for faster checkout and delivery.";
      case "complete":
        return "Your profile is now complete! You can update it anytime.";
      default:
        return "Complete your profile to get the best experience.";
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
      case "phone":
        return (
          <PhoneCompletionStep
            apiClient={apiClient}
            customerProfile={customerProfile}
            onComplete={handleStepComplete}
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
      case "complete":
        return (
          <CompletionSuccessStep
            customerProfile={customerProfile}
            onClose={handleClose}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStepIcon(currentStep)}
              <DialogTitle className="text-xl font-semibold">
                {getStepTitle()}
              </DialogTitle>
            </div>
            {allowSkip && currentStep !== "complete" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Skip
              </Button>
            )}
          </div>

          <DialogDescription className="text-base">
            {getStepDescription()}
          </DialogDescription>

          {profileStatus && currentStep !== "complete" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Profile completion
                </span>
                <Badge variant="secondary">
                  {profileStatus.completionPercentage}%
                </Badge>
              </div>
              <Progress
                value={profileStatus.completionPercentage}
                className="h-2"
              />
            </div>
          )}
        </DialogHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={loadCustomerProfile} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            renderCurrentStep()
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
