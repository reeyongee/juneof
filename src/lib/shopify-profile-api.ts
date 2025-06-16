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

export interface CustomerUpdateResponse {
  customer: {
    id: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: {
      phoneNumber: string;
    };
  };
}

export interface AddressCreateResponse {
  customerAddress: {
    id: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
    phoneNumber?: string;
  };
}

export interface AddressUpdateResponse {
  customerAddress: {
    id: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
    phoneNumber?: string;
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
    phone?: string;
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
          phoneNumber {
            phoneNumber
          }
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
        ...(updates.firstName && { firstName: updates.firstName }),
        ...(updates.lastName && { lastName: updates.lastName }),
        ...(updates.phone && { phone: updates.phone }),
      },
    };

    const response = await apiClient.query({
      query: mutation,
      variables,
      operationName: "customerUpdate",
    });

    if (response.errors) {
      return {
        success: false,
        errors: response.errors.map((error) => error.message),
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
 * Creates a new address for the customer
 */
export async function createCustomerAddress(
  apiClient: CustomerAccountApiClient,
  input: CreateAddressInput
): Promise<GraphQLResponse<{ customerAddressCreate: AddressCreateResponse }>> {
  const mutation = `
    mutation customerAddressCreate($address: CustomerAddressInput!) {
      customerAddressCreate(address: $address) {
        customerAddress {
          id
          address1
          address2
          city
          province
          zip
          country
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
    address: {
      address1: input.address1,
      ...(input.address2 && { address2: input.address2 }),
      city: input.city,
      province: input.province,
      zip: input.zip,
      country: input.country,
      ...(input.phoneNumber && { phoneNumber: input.phoneNumber }),
    },
  };

  return apiClient.query({
    query: mutation,
    variables,
    operationName: "customerAddressCreate",
  });
}

/**
 * Updates an existing customer address
 */
export async function updateCustomerAddress(
  apiClient: CustomerAccountApiClient,
  input: UpdateAddressInput
): Promise<GraphQLResponse<{ customerAddressUpdate: AddressUpdateResponse }>> {
  const mutation = `
    mutation customerAddressUpdate($address: CustomerAddressInput!, $addressId: ID!) {
      customerAddressUpdate(address: $address, addressId: $addressId) {
        customerAddress {
          id
          address1
          address2
          city
          province
          zip
          country
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
    addressId: input.addressId,
    address: {
      address1: input.address1,
      ...(input.address2 && { address2: input.address2 }),
      city: input.city,
      province: input.province,
      zip: input.zip,
      country: input.country,
      ...(input.phoneNumber && { phoneNumber: input.phoneNumber }),
    },
  };

  return apiClient.query({
    query: mutation,
    variables,
    operationName: "customerAddressUpdate",
  });
}

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
        province?: string;
        country?: string;
        zip?: string;
      };
      addresses: {
        nodes: Array<{
          id: string;
          address1?: string;
          address2?: string;
          city?: string;
          province?: string;
          country?: string;
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
          province
          country
          zip
        }
        addresses(first: 10) {
          nodes {
            id
            address1
            address2
            city
            province
            country
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
