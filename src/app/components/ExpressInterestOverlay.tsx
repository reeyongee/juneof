"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExpressInterestOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export default function ExpressInterestOverlay({
  isOpen,
  onClose,
  productName,
}: ExpressInterestOverlayProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement submission logic
    console.log("Express Interest Submission:", {
      firstName,
      lastName,
      email,
      productName,
    });
    // Close overlay after submission
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay with blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative bg-[#F8F4EC] p-6 rounded-lg shadow-xl w-full max-w-md">
        {/* Header with close button aligned */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-medium tracking-widest lowercase text-gray-900">
              express interest
            </h2>
            <p className="text-sm text-gray-600 mt-2 lowercase tracking-wide">
              be notified when {productName.toLowerCase()} is available
            </p>
          </div>
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-4 flex-shrink-0"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First name and Last name side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="firstName"
                className="text-sm tracking-wider lowercase text-gray-700"
              >
                first name
              </Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="mt-1 lowercase"
                placeholder="enter your first name"
              />
            </div>

            <div>
              <Label
                htmlFor="lastName"
                className="text-sm tracking-wider lowercase text-gray-700"
              >
                last name
              </Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="mt-1 lowercase"
                placeholder="enter your last name"
              />
            </div>
          </div>

          {/* Email field full width */}
          <div>
            <Label
              htmlFor="email"
              className="text-sm tracking-wider lowercase text-gray-700"
            >
              email address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 lowercase"
              placeholder="enter your email address"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-black/90 py-3 text-sm tracking-widest lowercase border-0 mt-6"
          >
            express interest!
          </Button>
        </form>
      </div>
    </div>
  );
}
