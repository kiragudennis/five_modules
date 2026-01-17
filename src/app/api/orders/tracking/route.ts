// app/api/orders/tracking/route.ts
import { NextRequest, NextResponse } from "next/server";
import { secureRatelimit } from "@/lib/limit";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // Rate limiting
  const { success } = await secureRatelimit(request);
  if (!success) {
    console.log("issue here");
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Check if user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    // Fetch orders
    const { data, error } = await supabase.rpc("get_tracking_orders");

    if (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
