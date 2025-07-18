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
let globalIsFetching = false;
let globalLastFetchTime = 0;
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

const setGlobalIsFetching = (isFetching: boolean) => {
  globalIsFetching = isFetching;
  profileStatusListeners.forEach((listener) => listener());
};

const setGlobalLastFetchTime = (time: number) => {
  globalLastFetchTime = time;
};

export interface UseProfileCompletionReturn {
  profileStatus: ProfileCompletionStatus | null;
  shouldShowCompletion: boolean;
  showCompletionFlow: () => void;
  hideCompletionFlow: () => void;
  isCompletionFlowOpen: boolean;
  refreshProfileStatus: () => void;
  isProfileComplete: boolean;
  ensureFreshProfileStatus: () => Promise<ProfileCompletionStatus | null>;
  isFetching: boolean;
}

export function useProfileCompletion(): UseProfileCompletionReturn {
  const { apiClient, isAuthenticated, isLoading } = useAuth();
  const [profileStatus, setProfileStatus] =
    useState<ProfileCompletionStatus | null>(globalProfileStatus);
  const [isCompletionFlowOpen, setIsCompletionFlowOpen] = useState(
    globalIsCompletionFlowOpen
  );
  const [isFetching, setIsFetching] = useState(globalIsFetching);
  const hasFetchedRef = useRef(false);

  // Subscribe to global state changes
  useEffect(() => {
    const updateProfileStatus = () => {
      setProfileStatus(globalProfileStatus);
      setIsFetching(globalIsFetching);
    };
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
    if (!apiClient) return null;

    try {
      setGlobalIsFetching(true);
      const response = await fetchCustomerProfileForCompletion(apiClient);
      const errors = handleGraphQLErrors(response);

      if (errors.length > 0) {
        console.error("Error fetching profile for completion:", errors);
        return null;
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
        setGlobalLastFetchTime(Date.now());
        hasFetchedRef.current = true;
        return status;
      }
    } catch (error) {
      console.error("Error analyzing profile completion:", error);
    } finally {
      setGlobalIsFetching(false);
    }
    return null;
  }, [apiClient]);

  // Function to ensure we have fresh profile status with caching
  const ensureFreshProfileStatus = useCallback(async () => {
    if (!apiClient || !isAuthenticated || isLoading) return null;

    // Check if we already have fresh data (within last 30 seconds)
    const now = Date.now();
    const CACHE_DURATION = 30000; // 30 seconds
    const timeSinceLastFetch = now - globalLastFetchTime;

    // If we have recent data and we're not currently fetching, return cached status
    if (
      timeSinceLastFetch < CACHE_DURATION &&
      globalProfileStatus &&
      !globalIsFetching
    ) {
      console.log(
        "useProfileCompletion: Using cached profile status (fresh within 30s)"
      );
      return globalProfileStatus;
    }

    // If we're already fetching, wait for that to complete rather than starting another fetch
    if (globalIsFetching) {
      console.log(
        "useProfileCompletion: Profile fetch already in progress, waiting..."
      );
      // Wait up to 5 seconds for the current fetch to complete
      let attempts = 0;
      while (globalIsFetching && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
      return globalProfileStatus;
    }

    // Fetch fresh data
    console.log("useProfileCompletion: Fetching fresh profile status");
    const freshStatus = await fetchAndAnalyzeProfile();
    return freshStatus;
  }, [apiClient, isAuthenticated, isLoading, fetchAndAnalyzeProfile]);

  // Analyze profile completion status when auth state changes
  useEffect(() => {
    if (isAuthenticated && !isLoading && apiClient && !hasFetchedRef.current) {
      fetchAndAnalyzeProfile();
    } else if (!isAuthenticated) {
      setGlobalProfileStatus(null);
      setGlobalIsFetching(false);
      setGlobalLastFetchTime(0);
      hasFetchedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, apiClient]);

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
    setGlobalLastFetchTime(0); // Reset cache
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
    ensureFreshProfileStatus,
    isFetching,
  };
}
