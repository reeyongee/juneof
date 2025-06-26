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
  productId: string;
}

export default function ExpressInterestOverlay({
  isOpen,
  onClose,
  productName,
  productId,
}: ExpressInterestOverlayProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      console.log("Express Interest Overlay: Submitting data", {
        firstName,
        lastName,
        email,
        productName,
        productId,
      });

      const response = await fetch("/api/customer/express-interest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          firstName,
          lastName,
          email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Express Interest Overlay: Success", data);
        setSubmitMessage(
          data.message ||
            "thank you! you're first in line now! we'll keep you posted."
        );

        // Check if this is a duplicate case
        const isDuplicate = data.isDuplicate || data.message?.includes("oops");

        if (!isDuplicate) {
          // Clear form only for successful new submissions
          setFirstName("");
          setLastName("");
          setEmail("");
          // Close overlay after 6 seconds (3x the original 2 seconds) for success
          setTimeout(() => {
            onClose();
            setSubmitMessage("");
          }, 6000);
        }
        // For duplicates, don't auto-close the overlay so user can read the message
      } else {
        console.error("Express Interest Overlay: Error", data);
        setSubmitMessage(
          data.message ||
            data.error ||
            "Something went wrong. Please try again."
        );
      }
    } catch (error) {
      console.error("Express Interest Overlay: Network error", error);
      setSubmitMessage(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
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

          {submitMessage && (
            <div
              className={`p-3 rounded-lg text-sm tracking-wide lowercase ${
                submitMessage.includes("thank you") &&
                !submitMessage.includes("oops")
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {submitMessage}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white hover:bg-black/90 py-3 text-sm tracking-widest lowercase border-0 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "submitting..." : "express interest!"}
          </Button>
        </form>
      </div>
    </div>
  );
}
