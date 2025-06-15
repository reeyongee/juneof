"use client";

import { useState, useEffect } from "react";
import { useAddress } from "@/context/AddressContext";
import { useAuth } from "@/context/AuthContext";
import AddAddressOverlay from "@/app/components/AddAddressOverlay";
import CustomerOrders from "@/components/CustomerOrders";
import { toast } from "sonner";
import { Package, MapPin, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState("orders");
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const {
    addresses,
    selectedAddressId,
    selectAddress,
    setAsDefault,
    deleteAddress,
  } = useAddress();
  const { isAuthenticated, customerData, login, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      login();
    }
  }, [isAuthenticated, isLoading, login]);

  // Get user name from customer data
  const userName =
    customerData?.customer.firstName ||
    customerData?.customer.displayName ||
    "user";

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-lg lowercase tracking-wider">loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif lowercase tracking-widest mb-4">
            please log in
          </h1>
          <p className="text-lg lowercase tracking-wider mb-6">
            you need to be logged in to view your dashboard
          </p>
          <button
            onClick={login}
            className="bg-black text-white px-6 py-3 lowercase tracking-wider hover:opacity-75 transition-opacity"
          >
            login with shopify
          </button>
        </div>
      </div>
    );
  }

  const renderOrders = () => {
    // Shopify auth configuration
    const getRedirectUri = () => {
      if (typeof window !== "undefined") {
        return window.location.origin + "/api/auth/shopify/callback";
      }
      // Fallback for server-side rendering
      return "https://dev.juneof.com/api/auth/shopify/callback";
    };

    const config = {
      shopId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID || "",
      clientId:
        process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID || "",
      redirectUri: getRedirectUri(),
    };

    return <CustomerOrders config={config} />;
  };

  const renderAddresses = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-serif lowercase tracking-widest text-black mb-6">
        saved addresses
      </h3>

      {/* Address Cards */}
      <div className="space-y-4">
        {addresses.map((address) => (
          <Card
            key={address.id}
            className={`bg-white border-2 cursor-pointer transition-all duration-200 ${
              selectedAddressId === address.id
                ? "border-black bg-gray-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => selectAddress(address.id)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium lowercase tracking-wider text-black text-lg">
                      {address.name}
                    </h4>
                    {address.isDefault && (
                      <span className="text-xs lowercase tracking-wider bg-black text-white px-2 py-1">
                        default
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 lowercase tracking-wider space-y-1">
                    <p>{address.addressLine1}</p>
                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                    <p>
                      {address.city}, {address.state} {address.pincode}
                    </p>
                    <p>{address.phone}</p>
                  </div>
                </div>
                {selectedAddressId === address.id && (
                  <div className="w-6 h-6 border-2 border-black bg-black flex items-center justify-center">
                    <div className="w-2 h-2 bg-white"></div>
                  </div>
                )}
              </div>

              {/* Action Buttons - only show for selected addresses */}
              {selectedAddressId === address.id && (
                <div className="flex justify-end gap-2 mt-4">
                  {/* Set as Default Button - only for non-default addresses */}
                  {!address.isDefault && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card selection when clicking button
                        setAsDefault(address.id);
                        toast.success("default address updated!", {
                          description: `${address.name} is now your default address.`,
                          duration: 3000,
                        });
                      }}
                      variant="outline"
                      size="sm"
                      className="lowercase tracking-wider border-black text-black hover:bg-black hover:text-white text-xs transition-all duration-300 no-underline-effect"
                    >
                      set as default
                    </Button>
                  )}

                  {/* Remove Address Button */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card selection when clicking button
                      if (addresses.length === 1) {
                        toast.error("cannot remove address", {
                          description: "you must have at least one address.",
                          duration: 3000,
                        });
                        return;
                      }
                      const wasDefault = address.isDefault;
                      const addressName = address.name;
                      deleteAddress(address.id);

                      if (wasDefault && addresses.length > 1) {
                        toast.success("address removed!", {
                          description: `${addressName} has been deleted. another address is now your default.`,
                          duration: 4000,
                        });
                      } else {
                        toast.success("address removed!", {
                          description: `${addressName} has been deleted.`,
                          duration: 3000,
                        });
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="lowercase tracking-wider border-red-600 text-red-600 hover:bg-red-600 hover:text-white text-xs transition-all duration-300 no-underline-effect"
                  >
                    remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Address Button */}
      <div className="pt-6">
        <Button
          onClick={() => setIsAddAddressOpen(true)}
          variant="outline"
          className="w-full lowercase tracking-widest border-black text-black hover:bg-black hover:text-white h-12 text-sm transition-all duration-300 no-underline-effect"
        >
          + add new address
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "orders":
        return renderOrders();
      case "addresses":
        return renderAddresses();
      case "profile":
        return (
          <div className="text-center py-12">
            <p className="text-gray-600 lowercase tracking-wider">
              edit profile section coming soon
            </p>
          </div>
        );
      default:
        return renderOrders();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4EC] pt-32 pb-8 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-serif lowercase tracking-widest text-black">
            hi, {userName}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-white border-gray-300">
              <CardContent className="p-6">
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveSection("orders")}
                    className={`w-full text-left px-4 py-3 lowercase tracking-wider transition-colors no-underline-effect ${
                      activeSection === "orders"
                        ? "bg-black text-white"
                        : "text-black hover:bg-gray-100"
                    }`}
                  >
                    <Package className="w-4 h-4 inline mr-3" />
                    orders
                  </button>
                  <button
                    onClick={() => setActiveSection("addresses")}
                    className={`w-full text-left px-4 py-3 lowercase tracking-wider transition-colors no-underline-effect ${
                      activeSection === "addresses"
                        ? "bg-black text-white"
                        : "text-black hover:bg-gray-100"
                    }`}
                  >
                    <MapPin className="w-4 h-4 inline mr-3" />
                    addresses
                  </button>
                  <button
                    onClick={() => setActiveSection("profile")}
                    className={`w-full text-left px-4 py-3 lowercase tracking-wider transition-colors no-underline-effect ${
                      activeSection === "profile"
                        ? "bg-black text-white"
                        : "text-black hover:bg-gray-100"
                    }`}
                  >
                    <User className="w-4 h-4 inline mr-3" />
                    edit profile
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">{renderContent()}</div>
        </div>
      </div>

      {/* Add Address Overlay */}
      <AddAddressOverlay
        isOpen={isAddAddressOpen}
        onClose={() => setIsAddAddressOpen(false)}
      />
    </div>
  );
}
