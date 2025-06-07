"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAddress } from "@/context/AddressContext";
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

// Dummy data for orders
const currentOrders = [
  {
    id: "ORD-2024-001",
    date: "2024-01-15",
    status: "shipped",
    total: 4500,
    estimatedDelivery: "2024-01-18",
    items: [
      {
        id: "1",
        name: "minimalist white tee",
        size: "M",
        quantity: 2,
        price: 1500,
        image: "/api/placeholder/80/80",
      },
      {
        id: "2",
        name: "organic cotton hoodie",
        size: "L",
        quantity: 1,
        price: 3000,
        image: "/api/placeholder/80/80",
      },
    ],
  },
  {
    id: "ORD-2024-002",
    date: "2024-01-12",
    status: "processing",
    total: 2200,
    estimatedDelivery: "2024-01-20",
    items: [
      {
        id: "3",
        name: "linen summer dress",
        size: "S",
        quantity: 1,
        price: 2200,
        image: "/api/placeholder/80/80",
      },
    ],
  },
];

const pastOrders = [
  {
    id: "ORD-2023-045",
    date: "2023-12-20",
    status: "delivered",
    total: 3200,
    deliveredDate: "2023-12-23",
    items: [
      {
        id: "4",
        name: "wool winter coat",
        size: "M",
        quantity: 1,
        price: 3200,
        image: "/api/placeholder/80/80",
      },
    ],
  },
  {
    id: "ORD-2023-038",
    date: "2023-11-15",
    status: "delivered",
    total: 1800,
    deliveredDate: "2023-11-18",
    items: [
      {
        id: "5",
        name: "cotton joggers",
        size: "L",
        quantity: 2,
        price: 900,
        image: "/api/placeholder/80/80",
      },
    ],
  },
];

// Format price function
const formatPrice = (price: number): string => {
  return `₹ ${price.toLocaleString("en-IN", {
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
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated";
  const userEmail = session?.user?.email;
  const {
    addresses,
    selectedAddressId,
    selectAddress,
    setAsDefault,
    deleteAddress,
  } = useAddress();
  const router = useRouter();

  // Use actual name from session, fallback to email username, then "user"
  const userName =
    session?.user?.name || (userEmail ? userEmail.split("@")[0] : "user");

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isSignedIn) {
      router.push("/signin");
    }
  }, [isSignedIn, router]);

  // Don't render anything if not signed in
  if (!isSignedIn) {
    return null;
  }

  const renderOrders = () => (
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
                        order {order.id}
                      </CardTitle>
                      <CardDescription className="lowercase tracking-wider">
                        placed on {formatDate(order.date)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Order Items */}
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-4"
                      >
                        <div className="w-16 h-16 relative bg-gray-100">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium lowercase tracking-wider text-black">
                            {item.name}
                          </h4>
                          <p className="text-sm text-gray-600 lowercase tracking-wider">
                            size: {item.size} • qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium text-black">
                          {formatPrice(item.price * item.quantity)}
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
                        {formatPrice(order.total)}
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
                        order {order.id}
                      </CardTitle>
                      <CardDescription className="lowercase tracking-wider">
                        placed on {formatDate(order.date)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mt-1 lowercase tracking-wider">
                        delivered on {formatDate(order.deliveredDate)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Order Items */}
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-4"
                      >
                        <div className="w-16 h-16 relative bg-gray-100">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium lowercase tracking-wider text-black">
                            {item.name}
                          </h4>
                          <p className="text-sm text-gray-600 lowercase tracking-wider">
                            size: {item.size} • qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium text-black">
                          {formatPrice(item.price * item.quantity)}
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
                        {formatPrice(order.total)}
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
