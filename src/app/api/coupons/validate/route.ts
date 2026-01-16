// app/api/coupons/validate/route.ts
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { couponCode, orderAmount, customerEmail } = await request.json();

    const { data, error } = await supabaseAdmin.rpc("validate_coupon", {
      coupon_code: couponCode,
      order_amount: orderAmount,
      customer_email: customerEmail,
    });

    if (error) throw error;

    return Response.json(data);
  } catch (error: any) {
    return Response.json(
      { valid: false, message: error.message || "Coupon validation failed" },
      { status: 400 }
    );
  }
}
