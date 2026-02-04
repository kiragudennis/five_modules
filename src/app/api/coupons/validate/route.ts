// app/api/coupons/validate/route.ts
import { secureRatelimit } from "@/lib/limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Rate limiting
  const { success } = await secureRatelimit(request);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { couponCode, orderAmount, customerEmail } = await request.json();

    const { data, error } = await supabaseAdmin.rpc("validate_coupon", {
      coupon_code: couponCode,
      order_amount: orderAmount,
      customer_email_param: customerEmail,
    });

    if (error) throw error;

    return Response.json(data);
  } catch (error: any) {
    return Response.json(
      { valid: false, message: error.message || "Coupon validation failed" },
      { status: 400 },
    );
  }
}
