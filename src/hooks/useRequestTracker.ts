"use client";

import { useCallback } from "react";
import { useLoading } from "@/context/LoadingContext";

export function useRequestTracker() {
  const { startRequest, endRequest } = useLoading();

  const trackRequest = useCallback(
    async <T>(
      requestName: string,
      requestFunction: () => Promise<T>
    ): Promise<T> => {
      try {
        startRequest(requestName);
        console.log(`RequestTracker: Starting tracked request: ${requestName}`);

        const result = await requestFunction();

        console.log(
          `RequestTracker: Completed tracked request: ${requestName}`
        );
        return result;
      } catch (error) {
        console.log(
          `RequestTracker: Failed tracked request: ${requestName}`,
          error
        );
        throw error;
      } finally {
        endRequest(requestName);
      }
    },
    [startRequest, endRequest]
  );

  return { trackRequest };
}
