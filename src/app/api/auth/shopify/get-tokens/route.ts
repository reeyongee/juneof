import { NextRequest, NextResponse } from "next/server";

interface TokenMetadata {
  tokenType: string;
  expiresIn: number;
  issuedAt: number;
  scope: string;
  hasRefreshToken: boolean;
  hasIdToken: boolean;
}

export async function GET(request: NextRequest) {
  try {
    // Get tokens from httpOnly cookies
    const accessToken = request.cookies.get("shopify-access-token")?.value;
    const refreshToken = request.cookies.get("shopify-refresh-token")?.value;
    const idToken = request.cookies.get("shopify-id-token")?.value;
    const metadataString = request.cookies.get("shopify-token-metadata")?.value;

    if (!accessToken || !metadataString) {
      return NextResponse.json(
        { error: "No authentication tokens found" },
        { status: 401 }
      );
    }

    let metadata: TokenMetadata;
    try {
      metadata = JSON.parse(metadataString);
    } catch (parseError) {
      console.error("Error parsing token metadata:", parseError);
      return NextResponse.json(
        { error: "Invalid token metadata" },
        { status: 500 }
      );
    }

    // Check if token is expired with 5-minute buffer
    const bufferSeconds = 300; // 5 minutes
    const now = Date.now();
    const expirationTime = metadata.issuedAt + metadata.expiresIn * 1000;
    const bufferTime = bufferSeconds * 1000;
    const isExpired = now + bufferTime >= expirationTime;

    return NextResponse.json({
      accessToken,
      refreshToken: refreshToken || undefined,
      idToken: idToken || undefined,
      tokenType: metadata.tokenType,
      expiresIn: metadata.expiresIn,
      issuedAt: metadata.issuedAt,
      scope: metadata.scope,
      hasRefreshToken: metadata.hasRefreshToken,
      hasIdToken: metadata.hasIdToken,
      isExpired,
      expiresAt: expirationTime,
      timeUntilExpiration: Math.max(0, expirationTime - now),
    });
  } catch (error) {
    console.error("Error retrieving tokens from cookies:", error);
    return NextResponse.json(
      { error: "Failed to retrieve authentication tokens" },
      { status: 500 }
    );
  }
}
