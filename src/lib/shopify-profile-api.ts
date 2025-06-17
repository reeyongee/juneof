// Shopify Customer Account API functions for profile updates

import { CustomerAccountApiClient, GraphQLResponse } from "./shopify-auth";

export interface UpdateCustomerProfileInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface CreateAddressInput {
  address1: string;
  address2?: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  phoneNumber?: string;
}

export interface UpdateAddressInput extends CreateAddressInput {
  addressId: string;
}

// GraphQL response types
interface CustomerUpdateResponse {
  customerUpdate: {
    customer: {
      id: string;
      firstName?: string;
      lastName?: string;
    };
    userErrors: Array<{
      field: string;
      message: string;
    }>;
  };
}

interface CustomerResponse {
  customer: {
    id: string;
    firstName?: string;
    lastName?: string;
    defaultAddress?: {
      id: string;
      address1?: string;
      address2?: string;
      city?: string;
      company?: string;
      firstName?: string;
      lastName?: string;
      territoryCode?: string;
      zip?: string;
      zoneCode?: string;
    };
  };
}

interface CustomerAddressUpdateResponse {
  customerAddressUpdate: {
    customerAddress: {
      id: string;
      phoneNumber?: string;
    };
    userErrors: Array<{
      field: string;
      message: string;
    }>;
  };
}

interface CustomerAddressCreateResponse {
  customerAddressCreate: {
    customerAddress: {
      id: string;
      phoneNumber?: string;
      address1?: string;
      city?: string;
      territoryCode?: string;
      zip?: string;
    };
    userErrors: Array<{
      field: string;
      message: string;
    }>;
  };
}

/**
 * Updates customer profile information using Shopify Customer Account API
 */
export async function updateCustomerProfile(
  apiClient: CustomerAccountApiClient,
  updates: {
    firstName?: string;
    lastName?: string;
  }
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    const mutation = `
    mutation customerUpdate($input: CustomerUpdateInput!) {
      customerUpdate(input: $input) {
        customer {
          id
          firstName
          lastName
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

    const variables = {
      input: {
        ...(updates.firstName !== undefined && {
          firstName: updates.firstName,
        }),
        ...(updates.lastName !== undefined && { lastName: updates.lastName }),
      },
    };

    const response = await apiClient.query<CustomerUpdateResponse>({
      query: mutation,
      variables,
      operationName: "customerUpdate",
    });

    if (
      response.data?.customerUpdate?.userErrors &&
      response.data.customerUpdate.userErrors.length > 0
    ) {
      return {
        success: false,
        errors: response.data.customerUpdate.userErrors.map(
          (error) => error.message
        ),
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    };
  }
}

/**
 * Updates customer phone number by creating or updating their default address
 * In the Customer Account API, phone numbers are stored with addresses
 */
export async function updateCustomerPhoneNumber(
  apiClient: CustomerAccountApiClient,
  phoneNumber: string
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    // First, get the customer's current default address
    const customerQuery = `
      query {
        customer {
          id
          firstName
          lastName
          defaultAddress {
            id
            address1
            address2
            city
            company
            firstName
            lastName
            territoryCode
            zip
            zoneCode
          }
        }
      }
    `;

    const customerResponse = await apiClient.query<CustomerResponse>({
      query: customerQuery,
      operationName: "getCustomer",
    });

    const customer = customerResponse.data?.customer;

    if (!customer) {
      return {
        success: false,
        errors: ["Unable to fetch customer information"],
      };
    }

    const defaultAddress = customer.defaultAddress;

    if (defaultAddress) {
      // Update existing default address with new phone number
      const updateMutation = `
        mutation customerAddressUpdate($addressId: ID!, $address: CustomerAddressInput!) {
          customerAddressUpdate(addressId: $addressId, address: $address) {
            customerAddress {
              id
              phoneNumber
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const updateVariables = {
        addressId: defaultAddress.id,
        address: {
          address1: defaultAddress.address1,
          address2: defaultAddress.address2,
          city: defaultAddress.city,
          company: defaultAddress.company,
          firstName: defaultAddress.firstName,
          lastName: defaultAddress.lastName,
          phoneNumber: phoneNumber,
          territoryCode: defaultAddress.territoryCode,
          zip: defaultAddress.zip,
          zoneCode: defaultAddress.zoneCode,
        },
      };

      const updateResponse =
        await apiClient.query<CustomerAddressUpdateResponse>({
          query: updateMutation,
          variables: updateVariables,
          operationName: "customerAddressUpdate",
        });

      if (
        updateResponse.data?.customerAddressUpdate?.userErrors &&
        updateResponse.data.customerAddressUpdate.userErrors.length > 0
      ) {
        return {
          success: false,
          errors: updateResponse.data.customerAddressUpdate.userErrors.map(
            (error) => error.message
          ),
        };
      }

      return { success: true };
    } else {
      // Create a new default address with the phone number
      const createMutation = `
        mutation customerAddressCreate($address: CustomerAddressInput!, $defaultAddress: Boolean!) {
          customerAddressCreate(address: $address, defaultAddress: $defaultAddress) {
            customerAddress {
              id
              phoneNumber
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const createVariables = {
        address: {
          phoneNumber: phoneNumber,
          // Provide minimal but valid address information for India
          firstName: customer.firstName || "",
          lastName: customer.lastName || "",
          city: "Mumbai", // Default city for India
          territoryCode: "IN", // India country code
          zip: "400001", // Default Mumbai postal code
          zoneCode: "MH", // Maharashtra state code
        },
        defaultAddress: true,
      };

      const createResponse =
        await apiClient.query<CustomerAddressCreateResponse>({
          query: createMutation,
          variables: createVariables,
          operationName: "customerAddressCreate",
        });

      if (
        createResponse.data?.customerAddressCreate?.userErrors &&
        createResponse.data.customerAddressCreate.userErrors.length > 0
      ) {
        return {
          success: false,
          errors: createResponse.data.customerAddressCreate.userErrors.map(
            (error) => error.message
          ),
        };
      }

      return { success: true };
    }
  } catch (error) {
    return {
      success: false,
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    };
  }
}

/**
 * Creates a new address for the customer
 */
export async function createCustomerAddress(
  apiClient: CustomerAccountApiClient,
  address: {
    firstName?: string;
    lastName?: string;
    company?: string;
    address1?: string;
    address2?: string;
    city?: string;
    territoryCode?: string;
    zip?: string;
    zoneCode?: string;
    phoneNumber?: string;
  }
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    const mutation = `
    mutation customerAddressCreate($address: CustomerAddressInput!, $defaultAddress: Boolean!) {
      customerAddressCreate(address: $address, defaultAddress: $defaultAddress) {
        customerAddress {
          id
          address1
          city
          territoryCode
          zip
          phoneNumber
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

    const variables = {
      address,
      defaultAddress: false, // Don't make it default unless explicitly requested
    };

    const response = await apiClient.query<CustomerAddressCreateResponse>({
      query: mutation,
      variables,
      operationName: "customerAddressCreate",
    });

    if (
      response.data?.customerAddressCreate?.userErrors &&
      response.data.customerAddressCreate.userErrors.length > 0
    ) {
      return {
        success: false,
        errors: response.data.customerAddressCreate.userErrors.map(
          (error) => error.message
        ),
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    };
  }
}

// Keep the existing functions for backward compatibility

/**
 * Fetches customer profile with addresses for completion checking
 */
export async function fetchCustomerProfileForCompletion(
  apiClient: CustomerAccountApiClient
): Promise<
  GraphQLResponse<{
    customer: {
      id: string;
      displayName: string;
      firstName?: string;
      lastName?: string;
      emailAddress?: { emailAddress: string };
      phoneNumber?: {
        phoneNumber: string;
      };
      defaultAddress?: {
        id: string;
        address1?: string;
        address2?: string;
        city?: string;
        territoryCode?: string;
        zoneCode?: string;
        zip?: string;
        phoneNumber?: string;
      };
      addresses: {
        nodes: Array<{
          id: string;
          address1?: string;
          address2?: string;
          city?: string;
          territoryCode?: string;
          zoneCode?: string;
          zip?: string;
          phoneNumber?: string;
        }>;
      };
    };
  }>
> {
  const query = `
    query getCustomerProfileForCompletion {
      customer {
        id
        displayName
        firstName
        lastName
        emailAddress {
          emailAddress
        }
        phoneNumber {
          phoneNumber
        }
        defaultAddress {
          id
          address1
          address2
          city
          territoryCode
          zoneCode
          zip
          phoneNumber
        }
        addresses(first: 10) {
          nodes {
            id
            address1
            address2
            city
            territoryCode
            zoneCode
            zip
            phoneNumber
          }
        }
      }
    }
  `;

  return apiClient.query({
    query,
    operationName: "getCustomerProfileForCompletion",
  });
}

/**
 * Helper function to handle GraphQL errors
 */
export function handleGraphQLErrors(
  response: GraphQLResponse<unknown>
): string[] {
  const errors: string[] = [];

  if (response.errors) {
    errors.push(...response.errors.map((error) => error.message));
  }

  // Check for userErrors in the response data
  if (
    response.data &&
    typeof response.data === "object" &&
    response.data !== null
  ) {
    const operations = [
      "customerUpdate",
      "customerAddressCreate",
      "customerAddressUpdate",
    ];
    const data = response.data as Record<string, unknown>;

    for (const operation of operations) {
      const operationData = data[operation] as
        | { userErrors?: Array<{ message: string }> }
        | undefined;
      if (operationData?.userErrors) {
        errors.push(...operationData.userErrors.map((error) => error.message));
      }
    }
  }

  return errors;
}
