// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { secureRatelimit } from "@/lib/limit";
import { checkBotId } from "botid/server";

export async function GET(request: NextRequest) {
  const verification = await checkBotId();

  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  // Rate limiting
  const { success } = await secureRatelimit(request);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const now = new Date().toISOString();

    // Fetch products and coupons in parallel
    const couponsResponse = await supabaseAdmin
      .from("coupons")
      .select(
        `
          *,
          coupon_redemptions(count)
        `,
      )
      .eq("is_active", true)
      .lte("valid_from", now)
      .gte("valid_until", now)
      .order("created_at", { ascending: false })
      .limit(3);

    if (couponsResponse.error) {
      console.error("Database error:", couponsResponse.error);
      return NextResponse.json(
        { error: "Failed to fetch coupons" },
        { status: 500 },
      );
    }

    const response = NextResponse.json({
      // products: productsResponse.data || [],
      coupons: couponsResponse.data || [],
    });

    // Cache products aggressively, but coupons shorter
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=1800",
    );

    return response;
  } catch (error: any) {
    console.error("Products fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
