"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAddress } from "@/context/AddressContext";
import { useAuth } from "@/context/AuthContext";
import { useLoading } from "@/context/LoadingContext";
import AddAddressOverlay from "@/app/components/AddAddressOverlay";
import CustomerOrders from "@/components/CustomerOrders";
import { ProfileCompletionFlow } from "@/components/ProfileCompletionFlow";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { updateCustomerProfile } from "@/lib/shopify-profile-api";
import { toast } from "sonner";
import { Package, MapPin, User, Edit3, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState("orders");
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const hasFetchedCustomerDataRef = useRef(false);
  const hasFetchedAddressesRef = useRef(false);

  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedFirstName, setEditedFirstName] = useState("");
  const [editedLastName, setEditedLastName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
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
    apiClient,
    login,
    logout,
    isLoading: authIsLoading, // Rename to avoid conflict with local isLoading if any
    error: authError,
    fetchCustomerData,
  } = useAuth();
  const { startLoading, stopLoading, isGlobalLoading } = useLoading();
  const {
    hideCompletionFlow,
    isCompletionFlowOpen,
    refreshProfileStatus,
    showCompletionFlow,
    isProfileComplete,
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

  // Name editing functions
  const handleEditName = () => {
    setEditedFirstName(customerData?.customer.firstName || "");
    setEditedLastName(customerData?.customer.lastName || "");
    setIsEditingName(true);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedFirstName("");
    setEditedLastName("");
  };

  const handleSaveName = async () => {
    if (!apiClient) {
      toast.error("not authenticated. please refresh and try again.");
      return;
    }

    if (!editedFirstName.trim() || !editedLastName.trim()) {
      toast.error("both first name and last name are required.");
      return;
    }

    setIsSavingName(true);

    try {
      const result = await updateCustomerProfile(apiClient, {
        firstName: editedFirstName.trim(),
        lastName: editedLastName.trim(),
      });

      if (result.success) {
        // Refresh customer data to reflect changes everywhere
        await fetchCustomerData();
        setIsEditingName(false);
        toast.success("name updated successfully!", {
          description: "your name has been updated across your profile.",
          duration: 3000,
        });
      } else {
        throw new Error(result.errors?.join(", ") || "failed to update name");
      }
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error("failed to update name. please try again.");
    } finally {
      setIsSavingName(false);
    }
  };

  // Memoize the config to prevent CustomerOrders from re-rendering
  const shopifyConfig = useMemo(() => {
    const getRedirectUri = () => {
      if (typeof window !== "undefined") {
        return window.location.origin + "/api/auth/shopify/callback";
      }
      // Fallback for server-side rendering
      return "https://dev.juneof.com/api/auth/shopify/callback";
    };

    return {
      shopId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID || "",
      clientId:
        process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID || "",
      redirectUri: getRedirectUri(),
    };
  }, []);

  // Effect to handle post-authentication data fetching
  useEffect(() => {
    // If user lands here and is authenticated but data isn't loaded yet
    // (e.g., after redirect from callback-handler), trigger a fetch.
    if (
      isAuthenticated &&
      !customerData &&
      !authIsLoading &&
      !authError &&
      !hasFetchedCustomerDataRef.current
    ) {
      console.log("Dashboard: Authenticated, no customer data. Fetching...");
      hasFetchedCustomerDataRef.current = true;
      fetchCustomerData();
    } else if (!isAuthenticated) {
      hasFetchedCustomerDataRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, customerData, authIsLoading, authError]);

  // Effect to fetch addresses when authenticated
  useEffect(() => {
    if (
      isAuthenticated &&
      addresses.length === 0 &&
      !addressLoading &&
      !hasFetchedAddressesRef.current
    ) {
      console.log("Dashboard: Fetching addresses...");
      hasFetchedAddressesRef.current = true;
      fetchAddresses();
    } else if (!isAuthenticated) {
      hasFetchedAddressesRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, addresses.length, addressLoading]);

  // Effect to handle post-login redirect check
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isPostLoginRedirect = urlParams.get("auth_completed") === "true";

    if (isPostLoginRedirect && isAuthenticated && !authIsLoading) {
      // If this is a post-login redirect, always show loading to prevent content flash
      console.log(
        "Dashboard: Post-login redirect detected, starting loading state"
      );
      setIsRedirecting(true);

      if (isProfileComplete) {
        // Complete profile should not be here, redirect to homepage
        console.log(
          "Dashboard: Complete profile detected with auth_completed, redirecting to homepage"
        );
        startLoading("dashboard-redirect-complete", 500);
        setTimeout(() => {
          stopLoading("dashboard-redirect-complete");
          window.location.href = "/";
        }, 500);
      } else {
        // Incomplete profile - brief loading then show dashboard
        startLoading("dashboard-redirect-incomplete", 300);
        setTimeout(() => {
          stopLoading("dashboard-redirect-incomplete");
          setIsRedirecting(false);
        }, 300);
      }
    }
  }, [
    isAuthenticated,
    authIsLoading,
    isProfileComplete,
    startLoading,
    stopLoading,
  ]);

  // Effect to show profile completion flow for incomplete profiles
  useEffect(() => {
    if (
      isAuthenticated &&
      !authIsLoading &&
      !isProfileComplete &&
      !isCompletionFlowOpen
    ) {
      console.log("Dashboard: Profile incomplete, showing completion flow...");
      showCompletionFlow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authIsLoading, isProfileComplete, isCompletionFlowOpen]);

  // Show loading state while checking authentication or redirecting, or if global loading is active
  if (authIsLoading || isRedirecting || isGlobalLoading) {
    console.log(
      "DashboardPage: Rendering loading state (authIsLoading, redirecting, or global loading active)"
    );
    // Don't render anything if global loading is active - let LoadingProvider handle it
    if (isGlobalLoading) {
      return null;
    }
    return (
      <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
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
    return <CustomerOrders config={shopifyConfig} />;
  };

  const renderAddresses = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-serif lowercase tracking-widest text-black mb-6">
        saved addresses
      </h3>

      {/* Show address loading state */}
      {addressLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
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

            {/* Editable Name Section */}
            <Card className="bg-white border-gray-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium lowercase tracking-wider text-black">
                    personal information
                  </h4>
                  {!isEditingName && (
                    <Button
                      onClick={handleEditName}
                      variant="ghost"
                      size="sm"
                      className="p-2 h-8 w-8 hover:bg-gray-100"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {!isEditingName ? (
                  // Display mode
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm lowercase tracking-widest text-gray-600">
                        first name
                      </Label>
                      <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm">
                        {customerData?.customer.firstName || "not set"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm lowercase tracking-widest text-gray-600">
                        last name
                      </Label>
                      <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm">
                        {customerData?.customer.lastName || "not set"}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="editFirstName"
                          className="text-sm lowercase tracking-widest text-black"
                        >
                          first name
                        </Label>
                        <Input
                          id="editFirstName"
                          type="text"
                          value={editedFirstName}
                          onChange={(e) => setEditedFirstName(e.target.value)}
                          placeholder="first name"
                          className="mt-1 bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-black focus:ring-black/20 h-10 text-sm"
                          disabled={isSavingName}
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="editLastName"
                          className="text-sm lowercase tracking-widest text-black"
                        >
                          last name
                        </Label>
                        <Input
                          id="editLastName"
                          type="text"
                          value={editedLastName}
                          onChange={(e) => setEditedLastName(e.target.value)}
                          placeholder="last name"
                          className="mt-1 bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-black focus:ring-black/20 h-10 text-sm"
                          disabled={isSavingName}
                        />
                      </div>
                    </div>

                    {/* Save/Cancel buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleSaveName}
                        disabled={
                          isSavingName ||
                          !editedFirstName.trim() ||
                          !editedLastName.trim()
                        }
                        className="bg-black text-white hover:bg-gray-800 h-9 px-4 text-sm lowercase tracking-wider"
                      >
                        {isSavingName ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            saving...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            save
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        disabled={isSavingName}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 h-9 px-4 text-sm lowercase tracking-wider"
                      >
                        <X className="mr-2 h-4 w-4" />
                        cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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

                  {/* Spacer */}
                  <div className="h-4"></div>

                  {/* Logout Button */}
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-3 lowercase tracking-wider transition-colors no-underline-effect border border-red-600 text-red-600 bg-transparent hover:bg-red-600 hover:text-white"
                  >
                    logout
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
