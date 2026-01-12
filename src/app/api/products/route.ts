// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { secureRatelimit } from "@/lib/limit";

export async function GET(request: NextRequest) {
  // Rate limiting
  const { success } = await secureRatelimit(request);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const now = new Date().toISOString();

    // Fetch products and coupons in parallel
    const [productsResponse, couponsResponse] = await Promise.all([
      supabaseAdmin.from("products").select("*"),
      supabaseAdmin
        .from("coupons")
        .select(
          `
          *,
          coupon_redemptions(count)
        `
        )
        .eq("is_active", true)
        .lte("valid_from", now)
        .gte("valid_until", now)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    if (productsResponse.error) {
      console.error("Database error:", productsResponse.error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      products: productsResponse.data || [],
      coupons: couponsResponse.data || [],
    });

    // Cache products aggressively, but coupons shorter
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=1800"
    );

    return response;
  } catch (error: any) {
    console.error("Products fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
