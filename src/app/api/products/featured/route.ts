// app/api/products/featured/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { secureRatelimit } from "@/lib/limit";

export async function GET(request: NextRequest) {
  // Rate limiting
  const { success } = await secureRatelimit(request);
  if (!success) {
    console.log("issue here");
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const now = new Date().toISOString();

    // Fetch featured products and top coupons in parallel
    const [productsResponse, couponsResponse] = await Promise.all([
      supabaseAdmin
        .from("products")
        .select(
          "id, title, price, originalPrice, currency, images, category, slug, featured, isDealOfTheDay, rating, reviewsCount, stock, description"
        )
        .or("featured.eq.true,isDealOfTheDay.eq.true")
        .order("isDealOfTheDay", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(12),
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
      console.error(
        "Error fetching featured products:",
        productsResponse.error
      );
      return NextResponse.json(
        { error: "Failed to fetch featured products" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      products: productsResponse.data || [],
      coupons: couponsResponse.data || [],
    });

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=1800, stale-while-revalidate=900"
    );

    return response;
  } catch (error: any) {
    console.error("Featured products fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
