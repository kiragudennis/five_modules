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
    // Fetch featured products
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select(
        "id, title, price, originalPrice, currency, images, category, belt_level, slug"
      )
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(10); // Limit to 8 featured products

    if (error) {
      console.error("Error fetching featured products:", error);
      return NextResponse.json(
        { error: "Failed to fetch featured products" },
        { status: 500 }
      );
    }

    const response = NextResponse.json(products || []);

    // Cache featured products aggressively
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=1800"
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
