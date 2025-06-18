"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  GET_CUSTOMER_ADDRESSES_QUERY,
  CREATE_CUSTOMER_ADDRESS_MUTATION,
  UPDATE_CUSTOMER_ADDRESS_MUTATION,
  DELETE_CUSTOMER_ADDRESS_MUTATION,
  SET_DEFAULT_CUSTOMER_ADDRESS_MUTATION,
  CustomerAddressesData,
  CreateCustomerAddressData,
  UpdateCustomerAddressData,
  DeleteCustomerAddressData,
  SetDefaultAddressData,
  AppAddress,
  CustomerAddressInput,
} from "@/lib/shopify-customer-address-api";
import { useAuth } from "./AuthContext";
import { useRequestTracker } from "@/hooks/useRequestTracker";

interface AddressContextType {
  addresses: AppAddress[];
  selectedAddressId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchAddresses: () => Promise<void>;
  addShopifyAddress: (
    addressInput: CustomerAddressInput,
    isDefault?: boolean
  ) => Promise<AppAddress | null>;
  updateShopifyAddress: (
    addressId: string,
    addressInput: CustomerAddressInput,
    isDefault?: boolean
  ) => Promise<AppAddress | null>;
  deleteShopifyAddress: (addressId: string) => Promise<string | null>;
  setShopifyDefaultAddress: (addressId: string) => Promise<void>;
  selectAddress: (id: string) => void;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error("useAddress must be used within an AddressProvider");
  }
  return context;
};

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [addresses, setAddresses] = useState<AppAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { apiClient, isAuthenticated } = useAuth();
  const { trackRequest } = useRequestTracker();

  // Clear addresses when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setAddresses([]);
      setSelectedAddressId(null);
      setError(null);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchAddresses = useCallback(async () => {
    if (!apiClient || !isAuthenticated) {
      setError("Not authenticated. Cannot fetch addresses.");
      return;
    }

    await trackRequest("address-fetch", async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.query<CustomerAddressesData>({
          query: GET_CUSTOMER_ADDRESSES_QUERY,
        });

        if (response.errors || !response.data?.customer) {
          throw new Error(
            response.errors?.[0]?.message ||
              "Failed to fetch addresses data from Shopify."
          );
        }

        const shopifyAddresses = response.data.customer.addresses.edges.map(
          (edge) => edge.node
        );
        const defaultShopifyAddressId =
          response.data.customer.defaultAddress?.id;

        const appAddresses: AppAddress[] = shopifyAddresses.map((addr) => ({
          ...addr,
          isDefaultShopify: addr.id === defaultShopifyAddressId,
        }));

        setAddresses(appAddresses);

        // Set selected address (default or first one)
        if (appAddresses.length > 0) {
          setSelectedAddressId(defaultShopifyAddressId || appAddresses[0].id);
        } else {
          setSelectedAddressId(null);
        }
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error ? e.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Failed to fetch Shopify addresses:", e);
        throw e; // Re-throw for trackRequest to handle
      } finally {
        setIsLoading(false);
      }
    });
  }, [apiClient, isAuthenticated, trackRequest]);

  const addShopifyAddress = async (
    addressInput: CustomerAddressInput,
    isDefault: boolean = false
  ): Promise<AppAddress | null> => {
    if (!apiClient || !isAuthenticated) {
      setError("Not authenticated. Cannot add address.");
      return null;
    }

    return await trackRequest("address-create", async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Create the address with optional defaultAddress parameter
        const response = await apiClient.query<CreateCustomerAddressData>({
          query: CREATE_CUSTOMER_ADDRESS_MUTATION,
          variables: {
            address: addressInput,
            defaultAddress: isDefault,
          },
        });

        if (
          response.errors ||
          !response.data?.customerAddressCreate?.customerAddress
        ) {
          const errMessage =
            response.data?.customerAddressCreate?.userErrors?.[0]?.message ||
            response.errors?.[0]?.message ||
            "Failed to create address.";
          throw new Error(errMessage);
        }

        const newShopifyAddress =
          response.data.customerAddressCreate.customerAddress;

        // Refetch all addresses to get the updated list and default status
        await fetchAddresses();

        return {
          ...newShopifyAddress,
          isDefaultShopify: isDefault,
        } as AppAddress;
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error ? e.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Failed to add Shopify address:", e);
        throw e; // Re-throw for trackRequest to handle
      } finally {
        setIsLoading(false);
      }
    });
  };

  const updateShopifyAddress = async (
    addressId: string,
    addressInput: CustomerAddressInput,
    isDefault?: boolean
  ): Promise<AppAddress | null> => {
    if (!apiClient || !isAuthenticated) {
      setError("Not authenticated. Cannot update address.");
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const variables: Record<string, unknown> = {
        addressId,
        address: addressInput,
      };
      if (typeof isDefault === "boolean") {
        variables.defaultAddress = isDefault;
      }

      const response = await apiClient.query<UpdateCustomerAddressData>({
        query: UPDATE_CUSTOMER_ADDRESS_MUTATION,
        variables,
      });

      if (
        response.errors ||
        !response.data?.customerAddressUpdate?.customerAddress
      ) {
        const errMessage =
          response.data?.customerAddressUpdate?.userErrors?.[0]?.message ||
          response.errors?.[0]?.message ||
          "Failed to update address.";
        throw new Error(errMessage);
      }

      const updatedShopifyAddress =
        response.data.customerAddressUpdate.customerAddress;

      // Refetch all addresses to ensure default status is correct across all addresses
      await fetchAddresses();

      return {
        ...updatedShopifyAddress,
        isDefaultShopify:
          isDefault ??
          addresses.find((a) => a.id === addressId)?.isDefaultShopify ??
          false,
      } as AppAddress;
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Failed to update Shopify address:", e);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const setShopifyDefaultAddress = async (addressId: string): Promise<void> => {
    if (!apiClient || !isAuthenticated) {
      setError("Not authenticated. Cannot set default address.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.query<SetDefaultAddressData>({
        query: SET_DEFAULT_CUSTOMER_ADDRESS_MUTATION,
        variables: { addressId, defaultAddress: true },
      });

      if (
        response.errors ||
        !response.data?.customerAddressUpdate?.customerAddress
      ) {
        const errMessage =
          response.data?.customerAddressUpdate?.userErrors?.[0]?.message ||
          response.errors?.[0]?.message ||
          "Failed to set default address.";
        throw new Error(errMessage);
      }

      // Refetch all addresses to update all default statuses
      await fetchAddresses();
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Failed to set Shopify default address:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteShopifyAddress = async (
    addressId: string
  ): Promise<string | null> => {
    if (!apiClient || !isAuthenticated) {
      setError("Not authenticated. Cannot delete address.");
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.query<DeleteCustomerAddressData>({
        query: DELETE_CUSTOMER_ADDRESS_MUTATION,
        variables: { addressId },
      });

      if (
        response.errors ||
        !response.data?.customerAddressDelete?.deletedAddressId
      ) {
        const errMessage =
          response.data?.customerAddressDelete?.userErrors?.[0]?.message ||
          response.errors?.[0]?.message ||
          "Failed to delete address.";
        throw new Error(errMessage);
      }

      const deletedId = response.data.customerAddressDelete.deletedAddressId;

      // Refetch all addresses to update list
      await fetchAddresses();

      // If the deleted address was selected, clear selection or pick a new default
      if (selectedAddressId === deletedId) {
        const currentAddresses = addresses.filter((a) => a.id !== deletedId);
        const newDefault =
          currentAddresses.find((a) => a.isDefaultShopify) ||
          currentAddresses[0];
        setSelectedAddressId(newDefault ? newDefault.id : null);
      }

      return deletedId;
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Failed to delete Shopify address:", e);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // UI selection logic remains the same
  const selectAddress = (id: string) => {
    setSelectedAddressId(id);
  };

  const value = {
    addresses,
    selectedAddressId,
    isLoading,
    error,
    fetchAddresses,
    addShopifyAddress,
    updateShopifyAddress,
    deleteShopifyAddress,
    setShopifyDefaultAddress,
    selectAddress,
  };

  return (
    <AddressContext.Provider value={value}>{children}</AddressContext.Provider>
  );
};
