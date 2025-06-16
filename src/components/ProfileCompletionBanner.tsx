"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { X, User, MapPin, AlertCircle } from "lucide-react";
import { type ProfileCompletionStatus } from "@/lib/profile-completion";

interface ProfileCompletionBannerProps {
  profileStatus: ProfileCompletionStatus;
  onComplete: () => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export function ProfileCompletionBanner({
  profileStatus,
  onComplete,
  onDismiss,
  showDismiss = true,
}: ProfileCompletionBannerProps) {
  const getMissingFieldsText = () => {
    const missing = [];
    if (
      profileStatus.missingFields.firstName ||
      profileStatus.missingFields.lastName
    ) {
      missing.push("name");
    }
    if (profileStatus.missingFields.completeAddressWithPhone) {
      missing.push("address and phone number");
    }

    if (missing.length === 0) return "";
    if (missing.length === 1) return missing[0];
    return `${missing[0]} and ${missing[1]}`;
  };

  const getMissingFieldIcons = () => {
    const icons = [];
    if (
      profileStatus.missingFields.firstName ||
      profileStatus.missingFields.lastName
    ) {
      icons.push(<User key="user" className="h-4 w-4" />);
    }
    if (profileStatus.missingFields.completeAddressWithPhone) {
      icons.push(<MapPin key="address" className="h-4 w-4" />);
    }
    return icons;
  };

  const getCompletionColor = () => {
    if (profileStatus.completionPercentage >= 75) return "text-green-600";
    if (profileStatus.completionPercentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = () => {
    if (profileStatus.completionPercentage >= 75) return "bg-green-500";
    if (profileStatus.completionPercentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>

            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-blue-900">
                    Complete Your Profile
                  </h3>
                  <Badge variant="secondary" className={getCompletionColor()}>
                    {profileStatus.completionPercentage}% complete
                  </Badge>
                </div>

                <p className="text-sm text-blue-800">
                  Add your {getMissingFieldsText()} to get the best shopping
                  experience with faster checkout and personalized
                  recommendations.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-blue-700">
                  <span>Profile completion</span>
                  <div className="flex items-center space-x-1">
                    {getMissingFieldIcons().map((icon, index) => (
                      <span key={index} className="text-blue-500">
                        {icon}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <Progress
                    value={profileStatus.completionPercentage}
                    className="h-2"
                  />
                  <div
                    className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor()}`}
                    style={{ width: `${profileStatus.completionPercentage}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={onComplete}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Complete Profile
                </Button>
                {showDismiss && onDismiss && (
                  <Button
                    onClick={onDismiss}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                  >
                    Maybe later
                  </Button>
                )}
              </div>
            </div>
          </div>

          {showDismiss && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="flex-shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
