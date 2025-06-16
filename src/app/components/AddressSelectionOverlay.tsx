"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAddress } from "@/context/AddressContext";

interface AddressSelectionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelect?: (addressId: string) => void;
}

export default function AddressSelectionOverlay({
  isOpen,
  onClose,
  onAddressSelect,
}: AddressSelectionOverlayProps) {
  const { addresses, selectedAddressId, selectAddress } = useAddress();

  const handleAddressSelect = (addressId: string) => {
    selectAddress(addressId);
    if (onAddressSelect) {
      onAddressSelect(addressId);
    }
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Overlay Content */}
      <div className="relative bg-[#F8F4EC] w-full max-w-md max-h-[75vh] overflow-hidden border border-gray-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
          <h2 className="text-lg font-serif lowercase tracking-widest text-black">
            select address
          </h2>
          <button
            onClick={handleClose}
            className="text-black hover:opacity-75 transition-opacity no-underline-effect"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Address List */}
        <div className="p-4 overflow-y-auto max-h-[calc(75vh-140px)]">
          <div className="space-y-3">
            {addresses.map((address) => (
              <Card
                key={address.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedAddressId === address.id
                    ? "border-2 border-black bg-gray-50"
                    : "border border-gray-300 hover:border-gray-400"
                } ${
                  address.isDefaultShopify
                    ? "ring-1 ring-black ring-opacity-20"
                    : ""
                }`}
                onClick={() => handleAddressSelect(address.id)}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium lowercase tracking-wider text-black text-sm truncate">
                          {address.name ||
                            `${address.firstName} ${address.lastName}`.trim()}
                        </h4>
                        {address.isDefaultShopify && (
                          <span className="text-xs lowercase tracking-wider bg-black text-white px-2 py-0.5 flex-shrink-0">
                            default
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 lowercase tracking-wider space-y-0.5">
                        <p className="truncate">{address.address1}</p>
                        {address.address2 && (
                          <p className="truncate">{address.address2}</p>
                        )}
                        <p className="truncate">
                          {address.city},{" "}
                          {address.province || address.provinceCode}{" "}
                          {address.zip}
                        </p>
                        {address.country && (
                          <p className="truncate">{address.country}</p>
                        )}
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    <div className="ml-3 flex-shrink-0">
                      {selectedAddressId === address.id ? (
                        <div className="w-5 h-5 border-2 border-black bg-black flex items-center justify-center">
                          <div className="w-2 h-2 bg-white"></div>
                        </div>
                      ) : (
                        <div className="w-5 h-5 border border-gray-400"></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 p-4 border-t border-gray-300">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1 lowercase tracking-widest border-gray-400 text-gray-700 hover:bg-gray-100 h-9 text-sm transition-all duration-300 no-underline-effect"
          >
            cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedAddressId && onAddressSelect) {
                onAddressSelect(selectedAddressId);
              }
              onClose();
            }}
            variant="outline"
            className="flex-1 lowercase tracking-widest border-black text-black hover:bg-black hover:text-white h-9 text-sm transition-all duration-300 no-underline-effect"
          >
            confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
