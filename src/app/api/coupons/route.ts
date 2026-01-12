// app/api/coupons/route.ts
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

    // Fetch active coupons that are currently valid
    const { data: coupons, error } = await supabaseAdmin
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
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching coupons:", error);
      return NextResponse.json(
        { error: "Failed to fetch coupons" },
        { status: 500 }
      );
    }

    const response = NextResponse.json(coupons || []);

    // Cache for 1 hour since coupons don't change frequently
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=1800"
    );

    return response;
  } catch (error: any) {
    console.error("Coupons fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
