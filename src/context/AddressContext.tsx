"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Address {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
  lastUsed?: Date;
}

interface AddressContextType {
  addresses: Address[];
  selectedAddressId: string | null;
  addAddress: (address: Omit<Address, "id">) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  selectAddress: (id: string) => void;
  setAsDefault: (id: string) => void;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error("useAddress must be used within an AddressProvider");
  }
  return context;
};

// Dummy addresses for development
const dummyAddresses: Address[] = [
  {
    id: "addr-1",
    name: "home",
    addressLine1: "123 main street",
    addressLine2: "apartment 4b",
    city: "mumbai",
    state: "maharashtra",
    pincode: "400001",
    phone: "+91 9876543210",
    isDefault: false,
    lastUsed: new Date("2024-01-10"),
  },
  {
    id: "addr-2",
    name: "office",
    addressLine1: "456 business park",
    city: "bangalore",
    state: "karnataka",
    pincode: "560001",
    phone: "+91 9876543211",
    isDefault: true,
    lastUsed: new Date("2024-01-15"),
  },
  {
    id: "addr-3",
    name: "parents house",
    addressLine1: "789 residential colony",
    addressLine2: "near central park",
    city: "delhi",
    state: "delhi",
    pincode: "110001",
    phone: "+91 9876543212",
    isDefault: false,
    lastUsed: new Date("2024-01-05"),
  },
];

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [addresses, setAddresses] = useState<Address[]>(dummyAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );

  // Load addresses from localStorage on mount
  useEffect(() => {
    const savedAddresses = localStorage.getItem("juneof_addresses");
    if (savedAddresses) {
      const parsedAddresses = JSON.parse(savedAddresses);
      setAddresses(parsedAddresses);
    }
  }, []);

  // Save addresses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("juneof_addresses", JSON.stringify(addresses));
  }, [addresses]);

  // Set initial selected address to the most recently used one
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const mostRecentAddress = addresses
        .filter((addr) => addr.lastUsed)
        .sort(
          (a, b) =>
            new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime()
        )[0];

      if (mostRecentAddress) {
        setSelectedAddressId(mostRecentAddress.id);
      } else {
        // If no lastUsed dates, select the default one or first one
        const defaultAddress =
          addresses.find((addr) => addr.isDefault) || addresses[0];
        setSelectedAddressId(defaultAddress.id);
      }
    }
  }, [addresses, selectedAddressId]);

  const addAddress = (addressData: Omit<Address, "id">) => {
    const newAddress: Address = {
      ...addressData,
      id: `addr-${Date.now()}`,
      lastUsed: new Date(),
    };

    setAddresses((prev) => {
      // If the new address is set as default, clear default flag from all existing addresses
      if (newAddress.isDefault) {
        return [
          ...prev.map((addr) => ({ ...addr, isDefault: false })),
          newAddress,
        ];
      }
      return [...prev, newAddress];
    });
    setSelectedAddressId(newAddress.id);
  };

  const updateAddress = (id: string, updates: Partial<Address>) => {
    setAddresses((prev) =>
      prev.map((addr) => (addr.id === id ? { ...addr, ...updates } : addr))
    );
  };

  const deleteAddress = (id: string) => {
    const addressToDelete = addresses.find((addr) => addr.id === id);
    const remainingAddresses = addresses.filter((addr) => addr.id !== id);

    // If we're deleting the default address and there are remaining addresses,
    // set the first remaining address as default
    if (addressToDelete?.isDefault && remainingAddresses.length > 0) {
      const updatedAddresses = remainingAddresses.map((addr, index) => ({
        ...addr,
        isDefault: index === 0, // Set first remaining address as default
      }));
      setAddresses(updatedAddresses);
    } else {
      setAddresses(remainingAddresses);
    }

    // Update selected address if the deleted one was selected
    if (selectedAddressId === id) {
      setSelectedAddressId(
        remainingAddresses.length > 0 ? remainingAddresses[0].id : null
      );
    }
  };

  const selectAddress = (id: string) => {
    setSelectedAddressId(id);
    // Update lastUsed when selecting an address
    updateAddress(id, { lastUsed: new Date() });
  };

  const setAsDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };

  const value = {
    addresses,
    selectedAddressId,
    addAddress,
    updateAddress,
    deleteAddress,
    selectAddress,
    setAsDefault,
  };

  return (
    <AddressContext.Provider value={value}>{children}</AddressContext.Provider>
  );
};
