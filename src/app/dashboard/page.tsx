"use client";

import { useState } from "react";
import Image from "next/image";
import { useAddress } from "@/context/AddressContext";
import { useAuth } from "@/context/AuthContext";
import { useCustomerData } from "@/hooks/useCustomerData";
import AddAddressOverlay from "@/app/components/AddAddressOverlay";
import { toast } from "sonner";
import {
  Package,
  MapPin,
  User,
  Truck,
  X,
  RotateCcw,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Format price function
const formatPrice = (price: number, currencyCode: string = "INR"): string => {
  const currencySymbol = currencyCode === "INR" ? "₹" : currencyCode;
  return `${currencySymbol} ${price.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Format date function
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

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

  const { isAuthenticated, customerData } = useAuth();
  const { profile, orders, isLoading, error } = useCustomerData();

  // Get user name from customer data or fallback
  const userName =
    profile?.displayName ||
    profile?.firstName ||
    customerData?.displayName ||
    "user";

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8F4EC] pt-32 pb-8 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-md mx-auto">
            <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-serif lowercase tracking-widest text-black mb-4">
              please log in
            </h1>
            <p className="text-gray-600 lowercase tracking-wider mb-6">
              you need to be logged in to view your dashboard
            </p>
            <p className="text-sm text-gray-500 lowercase tracking-wider">
              hover over the user icon in the navbar to log in
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderOrders = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600 lowercase tracking-wider">
            loading orders...
          </span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <p className="text-red-600 lowercase tracking-wider mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="lowercase tracking-wider border-red-400 text-red-600 hover:bg-red-50"
          >
            try again
          </Button>
        </div>
      );
    }

    if (!orders || orders.length === 0) {
      return (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-serif lowercase tracking-widest text-black mb-2">
            no orders yet
          </h3>
          <p className="text-gray-600 lowercase tracking-wider">
            your order history will appear here once you make a purchase
          </p>
        </div>
      );
    }

    // Separate current and past orders based on fulfillment status
    const currentOrders = orders.filter(
      (order) =>
        order.fulfillmentStatus !== "FULFILLED" &&
        order.financialStatus !== "REFUNDED"
    );
    const pastOrders = orders.filter(
      (order) =>
        order.fulfillmentStatus === "FULFILLED" ||
        order.financialStatus === "REFUNDED"
    );

    return (
      <div className="space-y-8">
        {/* Current Orders */}
        {currentOrders.length > 0 && (
          <div>
            <h3 className="text-xl font-serif lowercase tracking-widest text-black mb-4">
              current orders
            </h3>
            <div className="space-y-4">
              {currentOrders.map((order) => (
                <Card key={order.id} className="bg-white border-gray-300">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg lowercase tracking-wider text-black">
                          order {order.name}
                        </CardTitle>
                        <CardDescription className="lowercase tracking-wider">
                          placed on {formatDate(order.processedAt)}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs lowercase tracking-wider px-2 py-1 rounded ${
                            order.fulfillmentStatus === "FULFILLED"
                              ? "bg-green-100 text-green-800"
                              : order.fulfillmentStatus === "PARTIAL"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {order.fulfillmentStatus.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Order Items */}
                      {order.lineItems.edges.map((edge) => (
                        <div
                          key={edge.node.id}
                          className="flex items-center space-x-4"
                        >
                          <div className="w-16 h-16 relative bg-gray-100">
                            <Image
                              src={
                                edge.node.variant.image?.originalSrc ||
                                "/api/placeholder/80/80"
                              }
                              alt={
                                edge.node.variant.image?.altText ||
                                edge.node.title
                              }
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-medium lowercase tracking-wider text-black">
                              {edge.node.title}
                            </h4>
                            <p className="text-sm text-gray-600 lowercase tracking-wider">
                              {edge.node.variant.title} • qty:{" "}
                              {edge.node.quantity}
                            </p>
                          </div>
                          <p className="font-medium text-black">
                            {formatPrice(
                              parseFloat(edge.node.variant.price.amount) *
                                edge.node.quantity,
                              edge.node.variant.price.currencyCode
                            )}
                          </p>
                        </div>
                      ))}

                      <Separator />

                      {/* Order Total */}
                      <div className="flex justify-between items-center">
                        <span className="font-medium lowercase tracking-wider text-black">
                          total
                        </span>
                        <span className="font-medium text-lg text-black">
                          {formatPrice(
                            parseFloat(order.totalPrice.amount),
                            order.totalPrice.currencyCode
                          )}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="lowercase tracking-wider border-black text-black hover:bg-black hover:text-white no-underline-effect"
                        >
                          <Truck className="w-4 h-4 mr-2" />
                          track order
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="lowercase tracking-wider border-black text-black hover:bg-black hover:text-white no-underline-effect"
                        >
                          <X className="w-4 h-4 mr-2" />
                          cancel
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="lowercase tracking-wider border-black text-black hover:bg-black hover:text-white no-underline-effect"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          return policy
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Past Orders */}
        {pastOrders.length > 0 && (
          <div>
            <h3 className="text-xl font-serif lowercase tracking-widest text-black mb-4">
              past orders
            </h3>
            <div className="space-y-4">
              {pastOrders.map((order) => (
                <Card key={order.id} className="bg-white border-gray-300">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg lowercase tracking-wider text-black">
                          order {order.name}
                        </CardTitle>
                        <CardDescription className="lowercase tracking-wider">
                          placed on {formatDate(order.processedAt)}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs lowercase tracking-wider px-2 py-1 rounded ${
                            order.fulfillmentStatus === "FULFILLED"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.fulfillmentStatus.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Order Items */}
                      {order.lineItems.edges.map((edge) => (
                        <div
                          key={edge.node.id}
                          className="flex items-center space-x-4"
                        >
                          <div className="w-16 h-16 relative bg-gray-100">
                            <Image
                              src={
                                edge.node.variant.image?.originalSrc ||
                                "/api/placeholder/80/80"
                              }
                              alt={
                                edge.node.variant.image?.altText ||
                                edge.node.title
                              }
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-medium lowercase tracking-wider text-black">
                              {edge.node.title}
                            </h4>
                            <p className="text-sm text-gray-600 lowercase tracking-wider">
                              {edge.node.variant.title} • qty:{" "}
                              {edge.node.quantity}
                            </p>
                          </div>
                          <p className="font-medium text-black">
                            {formatPrice(
                              parseFloat(edge.node.variant.price.amount) *
                                edge.node.quantity,
                              edge.node.variant.price.currencyCode
                            )}
                          </p>
                        </div>
                      ))}

                      <Separator />

                      {/* Order Total */}
                      <div className="flex justify-between items-center">
                        <span className="font-medium lowercase tracking-wider text-black">
                          total
                        </span>
                        <span className="font-medium text-lg text-black">
                          {formatPrice(
                            parseFloat(order.totalPrice.amount),
                            order.totalPrice.currencyCode
                          )}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="lowercase tracking-wider border-black text-black hover:bg-black hover:text-white no-underline-effect"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          return
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="lowercase tracking-wider border-black text-black hover:bg-black hover:text-white no-underline-effect"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          return policy
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
