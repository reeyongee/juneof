import { NextRequest, NextResponse } from "next/server";
import {
  storefrontApiRequest,
  GET_PRODUCT_BY_HANDLE_QUERY,
  ShopifyProductByHandleData,
} from "@/lib/shopify";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;

    // Fetch fresh product data with cache bypass
    const data = await storefrontApiRequest<ShopifyProductByHandleData>(
      GET_PRODUCT_BY_HANDLE_QUERY,
      { handle },
      { bypassCache: true }
    );

    if (!data.productByHandle) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const expressInterest = data.productByHandle.metafield?.value || "false";

    return NextResponse.json({
      expressInterest,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch product metafield:", error);
    return NextResponse.json(
      { error: "Failed to fetch product data" },
      { status: 500 }
    );
  }
}
