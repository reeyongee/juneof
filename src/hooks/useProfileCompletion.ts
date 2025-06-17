"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  analyzeProfileCompletion,
  type ProfileCompletionStatus,
  type CustomerProfile,
} from "@/lib/profile-completion";
import {
  fetchCustomerProfileForCompletion,
  handleGraphQLErrors,
} from "@/lib/shopify-profile-api";

interface UseProfileCompletionReturn {
  profileStatus: ProfileCompletionStatus | null;
  shouldShowCompletion: boolean;
  showCompletionFlow: () => void;
  hideCompletionFlow: () => void;
  isCompletionFlowOpen: boolean;
  refreshProfileStatus: () => void;
}

export function useProfileCompletion(): UseProfileCompletionReturn {
  const { apiClient, isAuthenticated, isLoading } = useAuth();
  const [profileStatus, setProfileStatus] =
    useState<ProfileCompletionStatus | null>(null);
  const [isCompletionFlowOpen, setIsCompletionFlowOpen] = useState(false);
  const [hasBeenPrompted, setHasBeenPrompted] = useState(false);
  const hasFetchedRef = useRef(false);

  // Function to fetch complete profile data for analysis
  const fetchAndAnalyzeProfile = useCallback(async () => {
    if (!apiClient) return;

    try {
      const response = await fetchCustomerProfileForCompletion(apiClient);
      const errors = handleGraphQLErrors(response);

      if (errors.length > 0) {
        console.error("Error fetching profile for completion:", errors);
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

        const status = analyzeProfileCompletion(profile);
        setProfileStatus(status);
        hasFetchedRef.current = true;
      }
    } catch (error) {
      console.error("Error analyzing profile completion:", error);
    }
  }, [apiClient]);

  // Analyze profile completion status when auth state changes
  useEffect(() => {
    if (isAuthenticated && !isLoading && apiClient && !hasFetchedRef.current) {
      fetchAndAnalyzeProfile();
    } else if (!isAuthenticated) {
      setProfileStatus(null);
      hasFetchedRef.current = false;
    }
  }, [isAuthenticated, isLoading, apiClient]);

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
    hasFetchedRef.current = false;
    fetchAndAnalyzeProfile();
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
