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

// Global state for profile completion to ensure consistency across components
let globalProfileStatus: ProfileCompletionStatus | null = null;
let globalIsCompletionFlowOpen = false;
const profileStatusListeners: Set<() => void> = new Set();
const completionFlowListeners: Set<() => void> = new Set();

const setGlobalProfileStatus = (status: ProfileCompletionStatus | null) => {
  globalProfileStatus = status;
  profileStatusListeners.forEach((listener) => listener());
};

const setGlobalCompletionFlowOpen = (isOpen: boolean) => {
  globalIsCompletionFlowOpen = isOpen;
  completionFlowListeners.forEach((listener) => listener());
};

interface UseProfileCompletionReturn {
  profileStatus: ProfileCompletionStatus | null;
  shouldShowCompletion: boolean;
  showCompletionFlow: () => void;
  hideCompletionFlow: () => void;
  isCompletionFlowOpen: boolean;
  refreshProfileStatus: () => void;
  isProfileComplete: boolean;
}

export function useProfileCompletion(): UseProfileCompletionReturn {
  const { apiClient, isAuthenticated, isLoading } = useAuth();
  const [profileStatus, setProfileStatus] =
    useState<ProfileCompletionStatus | null>(globalProfileStatus);
  const [isCompletionFlowOpen, setIsCompletionFlowOpen] = useState(
    globalIsCompletionFlowOpen
  );
  const hasFetchedRef = useRef(false);

  // Subscribe to global state changes
  useEffect(() => {
    const updateProfileStatus = () => setProfileStatus(globalProfileStatus);
    const updateCompletionFlow = () =>
      setIsCompletionFlowOpen(globalIsCompletionFlowOpen);

    profileStatusListeners.add(updateProfileStatus);
    completionFlowListeners.add(updateCompletionFlow);

    return () => {
      profileStatusListeners.delete(updateProfileStatus);
      completionFlowListeners.delete(updateCompletionFlow);
    };
  }, []);

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
        setGlobalProfileStatus(status);
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
      setGlobalProfileStatus(null);
      hasFetchedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, apiClient]);

  // Auto-show completion flow for incomplete profiles (only once per session)
  // Disabled auto-show since we now handle this manually in dashboard and post-login redirect
  // useEffect(() => {
  //   if (
  //     isAuthenticated &&
  //     !isLoading &&
  //     profileStatus &&
  //     !profileStatus.isComplete &&
  //     !hasBeenPrompted &&
  //     !isCompletionFlowOpen
  //   ) {
  //     // Only auto-show if completion is significantly low (less than 50%)
  //     if (profileStatus.completionPercentage < 50) {
  //       setIsCompletionFlowOpen(true);
  //       setHasBeenPrompted(true);
  //     }
  //   }
  // }, [
  //   isAuthenticated,
  //   isLoading,
  //   profileStatus,
  //   hasBeenPrompted,
  //   isCompletionFlowOpen,
  // ]);

  const shouldShowCompletion = Boolean(
    isAuthenticated && !isLoading && profileStatus && !profileStatus.isComplete
  );

  const showCompletionFlow = () => {
    setGlobalCompletionFlowOpen(true);
  };

  const hideCompletionFlow = () => {
    setGlobalCompletionFlowOpen(false);
  };

  const refreshProfileStatus = () => {
    hasFetchedRef.current = false;
    fetchAndAnalyzeProfile();
  };

  const isProfileComplete = Boolean(profileStatus?.isComplete);

  return {
    profileStatus,
    shouldShowCompletion,
    showCompletionFlow,
    hideCompletionFlow,
    isCompletionFlowOpen,
    refreshProfileStatus,
    isProfileComplete,
  };
}
