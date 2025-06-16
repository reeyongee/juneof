"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  analyzeProfileCompletion,
  type ProfileCompletionStatus,
} from "@/lib/profile-completion";

interface UseProfileCompletionReturn {
  profileStatus: ProfileCompletionStatus | null;
  shouldShowCompletion: boolean;
  showCompletionFlow: () => void;
  hideCompletionFlow: () => void;
  isCompletionFlowOpen: boolean;
  refreshProfileStatus: () => void;
}

export function useProfileCompletion(): UseProfileCompletionReturn {
  const { customerData, isAuthenticated, isLoading } = useAuth();
  const [profileStatus, setProfileStatus] =
    useState<ProfileCompletionStatus | null>(null);
  const [isCompletionFlowOpen, setIsCompletionFlowOpen] = useState(false);
  const [hasBeenPrompted, setHasBeenPrompted] = useState(false);

  // Analyze profile completion status when customer data changes
  useEffect(() => {
    if (customerData?.customer) {
      const customer = customerData.customer;

      // Transform to our CustomerProfile interface
      const profile = {
        id: customer.id,
        displayName: customer.displayName,
        firstName: customer.firstName,
        lastName: customer.lastName,
        emailAddress: customer.emailAddress,
        phoneNumber: customer.phoneNumber,
        defaultAddress: customer.defaultAddress,
        addresses: [], // We don't have addresses in the basic customer data
      };

      const status = analyzeProfileCompletion(profile);
      setProfileStatus(status);
    } else {
      setProfileStatus(null);
    }
  }, [customerData]);

  // Auto-show completion flow for incomplete profiles (only once per session)
  useEffect(() => {
    if (
      isAuthenticated &&
      !isLoading &&
      profileStatus &&
      !profileStatus.isComplete &&
      !hasBeenPrompted &&
      !isCompletionFlowOpen
    ) {
      // Only auto-show if completion is significantly low (less than 50%)
      if (profileStatus.completionPercentage < 50) {
        setIsCompletionFlowOpen(true);
        setHasBeenPrompted(true);
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    profileStatus,
    hasBeenPrompted,
    isCompletionFlowOpen,
  ]);

  const shouldShowCompletion = Boolean(
    isAuthenticated && !isLoading && profileStatus && !profileStatus.isComplete
  );

  const showCompletionFlow = () => {
    setIsCompletionFlowOpen(true);
    setHasBeenPrompted(true);
  };

  const hideCompletionFlow = () => {
    setIsCompletionFlowOpen(false);
  };

  const refreshProfileStatus = () => {
    if (customerData?.customer) {
      const customer = customerData.customer;

      const profile = {
        id: customer.id,
        displayName: customer.displayName,
        firstName: customer.firstName,
        lastName: customer.lastName,
        emailAddress: customer.emailAddress,
        phoneNumber: customer.phoneNumber,
        defaultAddress: customer.defaultAddress,
        addresses: [],
      };

      const status = analyzeProfileCompletion(profile);
      setProfileStatus(status);
    }
  };

  return {
    profileStatus,
    shouldShowCompletion,
    showCompletionFlow,
    hideCompletionFlow,
    isCompletionFlowOpen,
    refreshProfileStatus,
  };
}
