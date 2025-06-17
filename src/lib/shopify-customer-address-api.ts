import { gql } from "graphql-request";

// Shopify Customer Address interfaces
export interface ShopifyCustomerAddress {
  id: string; // Shopify GID, e.g., "gid://shopify/CustomerAddress/12345"
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  company?: string | null;
  country?: string | null; // Full country name
  territoryCode?: string | null; // Country code (e.g., "IN", "US")
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null; // Concatenation of firstName and lastName
  phoneNumber?: string | null; // E.164 format phone number
  province?: string | null; // Full province/state name
  zoneCode?: string | null; // Province/state code (e.g., "MH", "CA")
  zip?: string | null;
}

// This will be the type stored in our context's state
export interface AppAddress extends ShopifyCustomerAddress {
  isDefaultShopify: boolean; // True if this is the Shopify default address
  localName?: string; // Optional: to keep your "Home", "Office" label locally
}

// CustomerAddressInput for mutations (based on Shopify's Customer Account API schema)
export interface CustomerAddressInput {
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  company?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null; // Customer Account API uses 'phoneNumber' not 'phone'
  territoryCode?: string | null; // Country code (e.g., "IN", "US")
  zip?: string | null;
  zoneCode?: string | null; // Province/state code (e.g., "MH", "CA")
}

// GraphQL Queries
export const GET_CUSTOMER_ADDRESSES_QUERY = gql`
  query GetCustomerAddresses {
    customer {
      defaultAddress {
        id
        address1
        address2
        city
        company
        country
        territoryCode
        firstName
        lastName
        name
        phoneNumber
        province
        zoneCode
        zip
      }
      addresses(first: 10) {
        edges {
          node {
            id
            address1
            address2
            city
            company
            country
            territoryCode
            firstName
            lastName
            name
            phoneNumber
            province
            zoneCode
            zip
          }
        }
      }
    }
  }
`;

// GraphQL Mutations
export const CREATE_CUSTOMER_ADDRESS_MUTATION = gql`
  mutation customerAddressCreate(
    $address: CustomerAddressInput!
    $defaultAddress: Boolean
  ) {
    customerAddressCreate(address: $address, defaultAddress: $defaultAddress) {
      customerAddress {
        id
        address1
        address2
        city
        company
        country
        territoryCode
        firstName
        lastName
        name
        phoneNumber
        province
        zoneCode
        zip
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_CUSTOMER_ADDRESS_MUTATION = gql`
  mutation customerAddressUpdate(
    $addressId: ID!
    $address: CustomerAddressInput!
    $defaultAddress: Boolean
  ) {
    customerAddressUpdate(
      addressId: $addressId
      address: $address
      defaultAddress: $defaultAddress
    ) {
      customerAddress {
        id
        address1
        address2
        city
        company
        country
        territoryCode
        firstName
        lastName
        name
        phoneNumber
        province
        zoneCode
        zip
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const DELETE_CUSTOMER_ADDRESS_MUTATION = gql`
  mutation customerAddressDelete($id: ID!) {
    customerAddressDelete(id: $id) {
      deletedCustomerAddressId
      userErrors {
        field
        message
      }
    }
  }
`;

export const SET_DEFAULT_CUSTOMER_ADDRESS_MUTATION = gql`
  mutation customerAddressUpdate($addressId: ID!, $defaultAddress: Boolean!) {
    customerAddressUpdate(
      addressId: $addressId
      defaultAddress: $defaultAddress
    ) {
      customerAddress {
        id
        address1
        address2
        city
        company
        country
        territoryCode
        firstName
        lastName
        name
        phoneNumber
        province
        zoneCode
        zip
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Response type interfaces
export interface CustomerAddressesData {
  customer: {
    defaultAddress: ShopifyCustomerAddress | null;
    addresses: {
      edges: Array<{ node: ShopifyCustomerAddress }>;
    };
  };
}

export interface CreateCustomerAddressData {
  customerAddressCreate: {
    customerAddress: ShopifyCustomerAddress | null;
    userErrors: Array<{ field: string[] | null; message: string }>;
  };
}

export interface UpdateCustomerAddressData {
  customerAddressUpdate: {
    customerAddress: ShopifyCustomerAddress | null;
    userErrors: Array<{ field: string[] | null; message: string }>;
  };
}

export interface DeleteCustomerAddressData {
  customerAddressDelete: {
    deletedCustomerAddressId: string | null;
    userErrors: Array<{ field: string[] | null; message: string }>;
  };
}

export interface SetDefaultAddressData {
  customerAddressUpdate: {
    customerAddress: ShopifyCustomerAddress | null;
    userErrors: Array<{ field: string[] | null; message: string }>;
  };
}
