"use client";

import React from "react";
import { CustomerProfile } from "@/lib/profile-completion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, User, Phone, MapPin } from "lucide-react";

interface CompletionSuccessStepProps {
  customerProfile: CustomerProfile;
  onClose: () => void;
}

export function CompletionSuccessStep({
  customerProfile,
  onClose,
}: CompletionSuccessStepProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-green-900">
              Profile Complete!
            </h3>
            <p className="text-muted-foreground">
              Thank you for completing your profile. You&apos;re all set for a
              better shopping experience.
            </p>
          </div>

          <div className="space-y-3 text-left bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Your Information
            </h4>

            <div className="space-y-2">
              {(customerProfile.firstName || customerProfile.lastName) && (
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {[customerProfile.firstName, customerProfile.lastName]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                </div>
              )}

              {customerProfile.phoneNumber?.phoneNumber && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customerProfile.phoneNumber.phoneNumber}</span>
                </div>
              )}

              {customerProfile.defaultAddress && (
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {[
                      customerProfile.defaultAddress.address1,
                      customerProfile.defaultAddress.city,
                      customerProfile.defaultAddress.province,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={onClose} className="w-full">
              Continue Shopping
            </Button>

            <p className="text-xs text-muted-foreground">
              You can update your profile information anytime in your account
              settings.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
