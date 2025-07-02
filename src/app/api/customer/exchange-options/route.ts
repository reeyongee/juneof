import { NextRequest, NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";
import { authenticateRequest } from "@/lib/api-auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error || "authentication failed" },
        { status: auth.statusCode || 401 }
      );
    }

    const { variantId } = await request.json();
    if (!variantId) {
      return NextResponse.json(
        { error: "variantId is required" },
        { status: 400 }
      );
    }

    const adminApiToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
    const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;

    if (!adminApiToken || !shopDomain) {
      return NextResponse.json(
        { error: "server configuration error" },
        { status: 500 }
      );
    }

    const adminClient = new GraphQLClient(
      `https://${shopDomain}/admin/api/2024-10/graphql.json`,
      {
        headers: {
          "X-Shopify-Access-Token": adminApiToken,
          "Content-Type": "application/json",
        },
      }
    );

    const query = `
      query GetProductVariants($variantId: ID!) {
        productVariant(id: $variantId) {
          id
          product {
            id
            title
            variants(first: 50) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  inventoryQuantity
                }
              }
            }
          }
        }
      }
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await adminClient.request<any>(query, { variantId });

    type VariantNode = {
      id: string;
      title: string;
      availableForSale: boolean;
      inventoryQuantity: number;
    };

    const edges = (data?.productVariant?.product?.variants?.edges ??
      []) as Array<{
      node: VariantNode;
    }>;

    const variants = edges.map(({ node }) => node);

    return NextResponse.json({ success: true, variants });
  } catch (error) {
    console.error("Exchange options API error", error);
    return NextResponse.json(
      {
        error: "internal server error",
        message: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}
