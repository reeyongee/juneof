"use client";

import React, { useState } from "react";
import { ProfileCompletionFlow } from "./ProfileCompletionFlow";
import { ProfileCompletionBanner } from "./ProfileCompletionBanner";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { User, Phone, MapPin, CheckCircle } from "lucide-react";

export function ProfileCompletionDemo() {
  const [showFlow, setShowFlow] = useState(false);
  const {
    profileStatus,
    shouldShowCompletion,
    showCompletionFlow,
    hideCompletionFlow,
    isCompletionFlowOpen,
    refreshProfileStatus,
  } = useProfileCompletion();

  const handleShowFlow = () => {
    setShowFlow(true);
    showCompletionFlow();
  };

  const handleCloseFlow = () => {
    setShowFlow(false);
    hideCompletionFlow();
  };

  const handleComplete = () => {
    refreshProfileStatus();
    handleCloseFlow();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Completion Demo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Profile Status</h3>

            {profileStatus ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Completion Progress
                  </span>
                  <Badge
                    variant={profileStatus.isComplete ? "default" : "secondary"}
                  >
                    {profileStatus.completionPercentage}% Complete
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      !profileStatus.missingFields.firstName &&
                      !profileStatus.missingFields.lastName
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <User
                      className={`h-4 w-4 ${
                        !profileStatus.missingFields.firstName &&
                        !profileStatus.missingFields.lastName
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                    <span className="text-sm">Name</span>
                    {!profileStatus.missingFields.firstName &&
                      !profileStatus.missingFields.lastName && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                  </div>

                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      !profileStatus.missingFields.phoneNumber
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <Phone
                      className={`h-4 w-4 ${
                        !profileStatus.missingFields.phoneNumber
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                    <span className="text-sm">Phone</span>
                    {!profileStatus.missingFields.phoneNumber && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>

                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      !profileStatus.missingFields.completeAddress
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <MapPin
                      className={`h-4 w-4 ${
                        !profileStatus.missingFields.completeAddress
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                    <span className="text-sm">Address</span>
                    {!profileStatus.missingFields.completeAddress && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>

                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      profileStatus.isComplete
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <CheckCircle
                      className={`h-4 w-4 ${
                        profileStatus.isComplete
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                    <span className="text-sm">Complete</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                No profile data available. Please log in first.
              </p>
            )}
          </div>

          {/* Demo Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Demo Controls</h3>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleShowFlow} disabled={!profileStatus}>
                Open Profile Completion Flow
              </Button>
              <Button
                onClick={refreshProfileStatus}
                variant="outline"
                disabled={!profileStatus}
              >
                Refresh Status
              </Button>
            </div>
          </div>

          {/* Banner Demo */}
          {shouldShowCompletion && profileStatus && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Profile Completion Banner
              </h3>
              <ProfileCompletionBanner
                profileStatus={profileStatus}
                onComplete={handleShowFlow}
                showDismiss={false}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Completion Flow */}
      <ProfileCompletionFlow
        isOpen={showFlow || isCompletionFlowOpen}
        onClose={handleCloseFlow}
        onComplete={handleComplete}
        allowSkip={true}
      />
    </div>
  );
}
