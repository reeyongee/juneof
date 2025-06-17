"use client";

import { useState, useEffect } from "react";
import { useAddress } from "@/context/AddressContext";
import { useAuth } from "@/context/AuthContext";
import AddAddressOverlay from "@/app/components/AddAddressOverlay";
import CustomerOrders from "@/components/CustomerOrders";
import { ProfileCompletionFlow } from "@/components/ProfileCompletionFlow";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
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
    setShopifyDefaultAddress,
    deleteShopifyAddress,
    fetchAddresses,
    isLoading: addressLoading,
    error: addressError,
  } = useAddress();
  const {
    isAuthenticated,
    customerData,
    login,
    isLoading: authIsLoading, // Rename to avoid conflict with local isLoading if any
    error: authError,
    fetchCustomerData,
  } = useAuth();
  const {
    profileStatus,
    showCompletionFlow,
    hideCompletionFlow,
    isCompletionFlowOpen,
    refreshProfileStatus,
  } = useProfileCompletion();

  // Log the initial state from AuthContext IMMEDIATELY
  console.log("DashboardPage RENDER - AuthContext state:", {
    isAuthenticated,
    authIsLoading,
    hasCustomerData: !!customerData,
    authError,
  });

  // Get user name from customer data
  const userName =
    customerData?.customer.firstName ||
    customerData?.customer.displayName ||
    "user";

  // Effect to handle post-authentication data fetching
  useEffect(() => {
    // If user lands here and is authenticated but data isn't loaded yet
    // (e.g., after redirect from callback-handler), trigger a fetch.
    if (isAuthenticated && !customerData && !authIsLoading && !authError) {
      console.log("Dashboard: Authenticated, no customer data. Fetching...");
      fetchCustomerData();
    }
  }, [
    isAuthenticated,
    customerData,
    authIsLoading,
    authError,
    fetchCustomerData,
  ]);

  // Effect to fetch addresses when authenticated
  useEffect(() => {
    if (isAuthenticated && addresses.length === 0 && !addressLoading) {
      console.log("Dashboard: Fetching addresses...");
      fetchAddresses();
    }
  }, [isAuthenticated, fetchAddresses, addresses.length, addressLoading]);

  // Show loading state while checking authentication
  if (authIsLoading) {
    console.log(
      "DashboardPage: Rendering loading state (authIsLoading is true)"
    );
    return (
      <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-lg lowercase tracking-wider">
            loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Show error state if there's an authentication error
  if (authError) {
    console.log("DashboardPage: Rendering error state", authError);
    return (
      <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-serif lowercase tracking-widest text-black mb-4">
            error loading dashboard
          </h2>
          <p className="text-lg lowercase tracking-wider text-gray-600 mb-6">
            {authError}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-black text-white py-3 px-6 lowercase tracking-wider hover:opacity-75 transition-opacity"
            >
              refresh page
            </button>
            <button
              onClick={login}
              className="block w-full bg-gray-600 text-white py-3 px-6 lowercase tracking-wider hover:opacity-75 transition-opacity"
            >
              try login again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    console.log(
      "DashboardPage: Rendering 'Please log in' (isAuthenticated is false, authIsLoading is false)"
    );
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

  // If authenticated and not loading and no error:
  console.log("DashboardPage: Rendering authenticated content");

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

      {/* Show address loading state */}
      {addressLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-sm lowercase tracking-wider text-gray-600">
            loading addresses...
          </p>
        </div>
      )}

      {/* Show address error state */}
      {addressError && (
        <div className="text-center py-8">
          <p className="text-sm lowercase tracking-wider text-red-600 mb-4">
            {addressError}
          </p>
          <Button
            onClick={fetchAddresses}
            variant="outline"
            className="lowercase tracking-wider border-black text-black hover:bg-black hover:text-white"
          >
            retry
          </Button>
        </div>
      )}

      {/* Address Cards */}
      {!addressLoading && !addressError && (
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
                        {address.name ||
                          `${address.firstName} ${address.lastName}`.trim()}
                      </h4>
                      {address.isDefaultShopify && (
                        <span className="text-xs lowercase tracking-wider bg-black text-white px-2 py-1">
                          default
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 lowercase tracking-wider space-y-1">
                      <p>{address.address1}</p>
                      {address.address2 && <p>{address.address2}</p>}
                      <p>
                        {address.city}, {address.province || address.zoneCode}{" "}
                        {address.zip}
                      </p>
                      {address.country && (
                        <p>
                          {address.country} ({address.territoryCode})
                        </p>
                      )}
                      {address.phoneNumber && <p>{address.phoneNumber}</p>}
                      {address.company && <p>{address.company}</p>}
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
                    {!address.isDefaultShopify && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card selection when clicking button
                          setShopifyDefaultAddress(address.id);
                          toast.success("default address updated!", {
                            description: `address is now your default address.`,
                            duration: 3000,
                          });
                        }}
                        variant="outline"
                        size="sm"
                        className="lowercase tracking-wider border-black text-black hover:bg-black hover:text-white text-xs transition-all duration-300 no-underline-effect"
                        disabled={addressLoading}
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
                        const wasDefault = address.isDefaultShopify;
                        const addressName =
                          address.name ||
                          `${address.firstName} ${address.lastName}`.trim();
                        deleteShopifyAddress(address.id).then((deletedId) => {
                          if (deletedId) {
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
                          } else {
                            toast.error(
                              "failed to remove address from shopify."
                            );
                          }
                        });
                      }}
                      variant="outline"
                      size="sm"
                      className="lowercase tracking-wider border-red-600 text-red-600 hover:bg-red-600 hover:text-white text-xs transition-all duration-300 no-underline-effect"
                      disabled={addressLoading}
                    >
                      remove
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Address Button */}
      <Button
        onClick={() => setIsAddAddressOpen(true)}
        variant="outline"
        className="w-full lowercase tracking-widest border-black text-black hover:bg-black hover:text-white h-12 text-sm transition-all duration-300 no-underline-effect"
        disabled={addressLoading}
      >
        + add new address
      </Button>
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
          <div className="space-y-6">
            <h3 className="text-xl font-serif lowercase tracking-widest text-black mb-6">
              profile settings
            </h3>

            {/* Profile completion status */}
            {profileStatus && !profileStatus.isComplete && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium lowercase tracking-wider text-blue-900">
                      complete your profile
                    </h4>
                    <span className="text-sm text-blue-700">
                      {profileStatus.completionPercentage}% complete
                    </span>
                  </div>
                  <p className="text-sm text-blue-800 mb-4">
                    complete your profile to get personalized recommendations
                    and faster checkout.
                  </p>
                  <Button
                    onClick={showCompletionFlow}
                    className="bg-blue-600 hover:bg-blue-700 text-white lowercase tracking-wider"
                  >
                    complete profile
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Profile completed status */}
            {profileStatus && profileStatus.isComplete && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <h4 className="font-medium lowercase tracking-wider text-green-900">
                      profile complete
                    </h4>
                  </div>
                  <p className="text-sm text-green-800">
                    your profile is complete! you can update it anytime.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="text-center py-8">
              <p className="text-gray-600 lowercase tracking-wider">
                additional profile settings coming soon
              </p>
            </div>
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

      {/* Profile Completion Flow */}
      <ProfileCompletionFlow
        isOpen={isCompletionFlowOpen}
        onClose={hideCompletionFlow}
        onComplete={() => {
          refreshProfileStatus();
          hideCompletionFlow();
          toast.success("profile completed!", {
            description:
              "your profile has been successfully updated. you'll now get personalized recommendations and faster checkout.",
            duration: 4000,
          });
        }}
      />
    </div>
  );
}
