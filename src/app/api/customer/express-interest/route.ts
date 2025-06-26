import { NextRequest, NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";
import { authenticateRequest } from "@/lib/api-auth-helpers";

interface InterestedCustomer {
  customer_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  timestamp: string;
}

interface InterestedCustomersData {
  customers: InterestedCustomer[];
}

interface MetafieldResponse {
  product: {
    id: string;
    metafield?: {
      id?: string;
      value: string;
      jsonValue?: InterestedCustomersData;
    } | null;
  } | null;
}

interface MetafieldUpdateResponse {
  metafieldsSet: {
    metafields: Array<{
      id: string;
      key: string;
      value: string;
      jsonValue?: InterestedCustomersData;
    }>;
    userErrors: Array<{
      field: string[];
      message: string;
    }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log("Express Interest API: Starting request processing");

    // Get environment variables for Admin API
    const adminApiToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
    const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;

    if (!adminApiToken || !shopDomain) {
      console.error("Express Interest API: Missing environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Parse request body
    const { productId, firstName, lastName, email } = await request.json();
    console.log("Express Interest API: Request data", {
      productId: productId ? "provided" : "missing",
      firstName: firstName ? "provided" : "missing",
      lastName: lastName ? "provided" : "missing",
      email: email ? "provided" : "missing",
    });

    if (!productId || !firstName || !lastName || !email) {
      console.error("Express Interest API: Missing required fields");
      return NextResponse.json(
        {
          error:
            "Missing required fields: productId, firstName, lastName, email",
        },
        { status: 400 }
      );
    }

    // Try to authenticate the request (optional for express interest)
    let customerId: string | undefined;
    const authResult = await authenticateRequest(request);

    if (authResult.success && authResult.user) {
      customerId = authResult.user.customerId;
      console.log("Express Interest API: Authenticated user", { customerId });
    } else {
      console.log("Express Interest API: Non-authenticated user submission");
    }

    // Create GraphQL client for Admin API
    const adminApiUrl = `https://${shopDomain}/admin/api/2024-10/graphql.json`;
    const adminClient = new GraphQLClient(adminApiUrl, {
      headers: {
        "X-Shopify-Access-Token": adminApiToken,
        "Content-Type": "application/json",
      },
    });

    // Step 1: Fetch current metafield value
    console.log("Express Interest API: Fetching current metafield data");
    const fetchQuery = `
      query GetInterestedCustomers($productId: ID!) {
        product(id: $productId) {
          id
          metafield(namespace: "custom", key: "interested_customers") {
            id
            value
            jsonValue
          }
        }
      }
    `;

    const fetchResponse = await adminClient.request<MetafieldResponse>(
      fetchQuery,
      {
        productId: productId,
      }
    );

    console.log("Express Interest API: Fetched metafield response", {
      productExists: !!fetchResponse.product,
      metafieldExists: !!fetchResponse.product?.metafield,
      currentValue: fetchResponse.product?.metafield?.value || "null",
    });

    if (!fetchResponse.product) {
      console.error("Express Interest API: Product not found", { productId });
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Step 2: Parse existing customers or initialize empty array
    let existingCustomers: InterestedCustomer[] = [];
    const currentMetafield = fetchResponse.product.metafield;

    if (currentMetafield?.jsonValue) {
      existingCustomers = currentMetafield.jsonValue.customers || [];
      console.log("Express Interest API: Parsed existing customers", {
        count: existingCustomers.length,
      });
    } else if (currentMetafield?.value) {
      try {
        const parsed = JSON.parse(
          currentMetafield.value
        ) as InterestedCustomersData;
        existingCustomers = parsed.customers || [];
        console.log(
          "Express Interest API: Parsed customers from value string",
          {
            count: existingCustomers.length,
          }
        );
      } catch (error) {
        console.warn(
          "Express Interest API: Failed to parse existing metafield value",
          error
        );
        existingCustomers = [];
      }
    } else {
      console.log(
        "Express Interest API: No existing metafield, starting with empty array"
      );
    }

    // Step 3: Check for duplicates (by email or customer ID)
    const isDuplicate = existingCustomers.some((customer) => {
      if (customerId && customer.customer_id === customerId) {
        return true;
      }
      return customer.email.toLowerCase() === email.toLowerCase();
    });

    if (isDuplicate) {
      console.log("Express Interest API: Duplicate customer found", {
        email,
        customerId,
      });
      return NextResponse.json(
        { message: "You have already expressed interest in this product" },
        { status: 200 }
      );
    }

    // Step 4: Create new customer entry
    const newCustomer: InterestedCustomer = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      timestamp: new Date().toISOString(),
    };

    if (customerId) {
      newCustomer.customer_id = customerId;
    }

    console.log("Express Interest API: Creating new customer entry", {
      hasCustomerId: !!customerId,
      email: email,
    });

    // Step 5: Append new customer to existing list
    const updatedCustomers = [...existingCustomers, newCustomer];
    const updatedData: InterestedCustomersData = {
      customers: updatedCustomers,
    };

    console.log("Express Interest API: Updated customers list", {
      previousCount: existingCustomers.length,
      newCount: updatedCustomers.length,
    });

    // Step 6: Update metafield with new data
    const updateMutation = `
      mutation SetInterestedCustomers($productId: ID!, $value: String!) {
        metafieldsSet(
          metafields: [
            {
              ownerId: $productId
              namespace: "custom"
              key: "interested_customers"
              type: "json"
              value: $value
            }
          ]
        ) {
          metafields {
            id
            key
            value
            jsonValue
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const updateResponse = await adminClient.request<MetafieldUpdateResponse>(
      updateMutation,
      {
        productId: productId,
        value: JSON.stringify(updatedData),
      }
    );

    console.log("Express Interest API: Metafield update response", {
      metafieldsCount: updateResponse.metafieldsSet.metafields.length,
      errorsCount: updateResponse.metafieldsSet.userErrors.length,
      errors: updateResponse.metafieldsSet.userErrors,
    });

    if (updateResponse.metafieldsSet.userErrors.length > 0) {
      console.error(
        "Express Interest API: Metafield update errors",
        updateResponse.metafieldsSet.userErrors
      );
      return NextResponse.json(
        {
          error: "Failed to save interest",
          details: updateResponse.metafieldsSet.userErrors
            .map((err) => err.message)
            .join(", "),
        },
        { status: 400 }
      );
    }

    console.log("Express Interest API: Successfully saved interest", {
      customerId: customerId || "anonymous",
      email: email,
      totalCustomers: updatedCustomers.length,
    });

    return NextResponse.json({
      success: true,
      message: "Interest expressed successfully",
      totalInterestedCustomers: updatedCustomers.length,
    });
  } catch (error) {
    console.error("Express Interest API: Unexpected error", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
