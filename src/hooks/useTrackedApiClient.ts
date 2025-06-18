"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLoading } from "@/context/LoadingContext";
import { TrackedShopifyApiClient } from "@/lib/shopify-request-wrapper";

export function useTrackedApiClient() {
  const { apiClient, isAuthenticated } = useAuth();
  const { startRequest, endRequest } = useLoading();

  const trackedClient = useMemo(() => {
    if (!apiClient || !isAuthenticated) {
      return null;
    }

    return new TrackedShopifyApiClient(apiClient, {
      startRequest,
      endRequest,
    });
  }, [apiClient, isAuthenticated, startRequest, endRequest]);

  return trackedClient;
}
