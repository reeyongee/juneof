"use client";

import React from "react";
import { CustomerProfile } from "@/lib/profile-completion";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface CompletionSuccessStepProps {
  customerProfile: CustomerProfile;
  onClose: () => void;
}

export function CompletionSuccessStep({
  customerProfile,
  onClose,
}: CompletionSuccessStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="h-16 w-16 text-green-600" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-serif lowercase tracking-widest text-black">
          profile completed!
        </h3>
        <p className="text-sm lowercase tracking-wider text-gray-600">
          thank you for completing your profile. you&apos;ll now get
          personalized recommendations and faster checkout.
        </p>
      </div>

      <div className="space-y-3 text-sm">
        <div className="bg-gray-50 p-4 rounded-md text-left">
          <h4 className="font-medium lowercase tracking-wider text-black mb-2">
            your profile:
          </h4>
          <div className="space-y-1 text-gray-600">
            <p>
              <span className="lowercase tracking-wider">name:</span>{" "}
              {customerProfile.firstName} {customerProfile.lastName}
            </p>
            {customerProfile.emailAddress && (
              <p>
                <span className="lowercase tracking-wider">email:</span>{" "}
                {customerProfile.emailAddress.emailAddress}
              </p>
            )}
            {customerProfile.defaultAddress && (
              <p>
                <span className="lowercase tracking-wider">address:</span>{" "}
                {[
                  customerProfile.defaultAddress.address1,
                  customerProfile.defaultAddress.city,
                  customerProfile.defaultAddress.territoryCode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button
          onClick={onClose}
          className="w-full lowercase tracking-widest border-black text-black hover:bg-black hover:text-white h-10 text-sm transition-all duration-300 no-underline-effect bg-white border"
        >
          continue shopping
        </Button>
      </div>
    </div>
  );
}
