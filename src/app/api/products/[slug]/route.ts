// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { secureRatelimit } from "@/lib/limit";

export async function GET(request: NextRequest, context: any) {
  const { slug } = (await context.params) as { slug: string };
  // Rate limiting
  const { success } = await secureRatelimit(request);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    // Fetch the specific product
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("slug", slug)
      .single();

    if (productError) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Fetch related products (same category, excluding current product)
    const { data: relatedProducts, error: relatedError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("category", product.category)
      .neq("slug", slug)
      .limit(4);

    if (relatedError) {
      console.error("Error fetching related products:", relatedError);
      // Continue even if related products fail
    }

    const response = NextResponse.json({
      product,
      relatedProducts: relatedProducts || [],
    });

    // Cache product details aggressively
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=1800"
    );

    return response;
  } catch (error: any) {
    console.error("Product fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
