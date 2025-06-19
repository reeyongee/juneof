import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });

    // Clear all authentication cookies by setting them to expire immediately
    const expiredDate = new Date(0);

    response.cookies.set("shopify-access-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: expiredDate,
      path: "/",
    });

    response.cookies.set("shopify-refresh-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: expiredDate,
      path: "/",
    });

    response.cookies.set("shopify-token-metadata", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: expiredDate,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error clearing authentication cookies:", error);
    return NextResponse.json(
      { error: "Failed to clear authentication cookies" },
      { status: 500 }
    );
  }
}
