"use client";

import React, { useState } from "react";
import { useRequestTracker } from "@/hooks/useRequestTracker";
import { useLoading } from "@/context/LoadingContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RequestLoadingDemo() {
  const { trackRequest } = useRequestTracker();
  const { isGlobalLoading, loadingMessage } = useLoading();
  const [results, setResults] = useState<string[]>([]);

  const simulateRequest = async (name: string, duration: number) => {
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`${name} completed after ${duration}ms`);
      }, duration);
    });
  };

  const handleSingleRequest = async () => {
    const result = await trackRequest("demo-single", () =>
      simulateRequest("Single Request", 1000)
    );
    setResults((prev) => [...prev, result]);
  };

  const handleMultipleRequests = async () => {
    // Start multiple requests simultaneously
    const promises = [
      trackRequest("demo-multi-1", () =>
        simulateRequest("Multi Request 1", 800)
      ),
      trackRequest("demo-multi-2", () =>
        simulateRequest("Multi Request 2", 1200)
      ),
      trackRequest("demo-multi-3", () =>
        simulateRequest("Multi Request 3", 600)
      ),
    ];

    const results = await Promise.all(promises);
    setResults((prev) => [...prev, ...results]);
  };

  const handleSequentialRequests = async () => {
    // Start requests one after another
    const result1 = await trackRequest("demo-seq-1", () =>
      simulateRequest("Sequential Request 1", 500)
    );
    setResults((prev) => [...prev, result1]);

    const result2 = await trackRequest("demo-seq-2", () =>
      simulateRequest("Sequential Request 2", 700)
    );
    setResults((prev) => [...prev, result2]);

    const result3 = await trackRequest("demo-seq-3", () =>
      simulateRequest("Sequential Request 3", 400)
    );
    setResults((prev) => [...prev, result3]);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Request-Aware Loading Demo</CardTitle>
        <CardDescription>
          Test the new loading system that tracks actual network requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSingleRequest} disabled={isGlobalLoading}>
            Single Request (1s)
          </Button>
          <Button onClick={handleMultipleRequests} disabled={isGlobalLoading}>
            Multiple Requests (parallel)
          </Button>
          <Button onClick={handleSequentialRequests} disabled={isGlobalLoading}>
            Sequential Requests
          </Button>
          <Button onClick={clearResults} variant="outline">
            Clear Results
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Loading Status:</span>
            <span
              className={`text-sm ${
                isGlobalLoading ? "text-blue-600" : "text-green-600"
              }`}
            >
              {isGlobalLoading ? "Loading..." : "Idle"}
            </span>
          </div>
          {loadingMessage && (
            <div className="text-sm text-gray-600">
              Message: {loadingMessage}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Results:</h3>
          <div className="bg-gray-50 p-3 rounded-md max-h-48 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-sm text-gray-500">No results yet</p>
            ) : (
              <ul className="space-y-1">
                {results.map((result, index) => (
                  <li key={index} className="text-sm">
                    {index + 1}. {result}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>How it works:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Loading appears immediately when first request starts</li>
            <li>
              Loading continues until all requests complete + 200ms grace period
            </li>
            <li>Minimum 500ms display time to prevent flickering</li>
            <li>Multiple simultaneous requests are tracked individually</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
