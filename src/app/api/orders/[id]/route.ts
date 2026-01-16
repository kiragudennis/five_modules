import { secureRatelimit } from "@/lib/limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request, context: any) {
  const { id } = (await context.params) as { id: string };

  // Rate limiting
  const { success } = await secureRatelimit(req);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Check if user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    // Fetch order with the new structure
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        items:order_items (
          id,
          product_id,
          product_name,
          product_title,
          product_sku,
          product_category,
          product_image,
          unit_price,
          wholesale_price,
          wholesale_min_quantity,
          has_wholesale,
          applied_price,
          quantity,
          total_price,
          metadata,
          created_at
        )
      `
      )
      .eq("id", id)
      .single();

    if (orderError) {
      console.error("Order fetch error:", orderError);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user is authorized to view this order
    if (user) {
      // If user is logged in, they can only view their own orders
      if (order.user_id !== user.id) {
        // Check if user is admin
        const { data: userData } = await supabaseAdmin
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userData?.role !== "admin" && userData?.role !== "superadmin") {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      }
    } else {
      // For guest orders, check if email matches
      const emailHeader = req.headers.get("x-user-email");
      if (!emailHeader || emailHeader !== order.customer_email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Format the response to match expected structure
    const formattedOrder = {
      ...order,
      // Backward compatibility fields
      total: order.total_amount,
      shipping_info: {
        firstName: order.customer_name?.split(" ")[0] || "",
        lastName: order.customer_name?.split(" ").slice(1).join(" ") || "",
        email: order.customer_email,
        phone: order.customer_phone,
        address: order.shipping_address,
        city: order.shipping_city,
        county: order.shipping_county,
        postalCode: order.shipping_postal_code,
        country: order.shipping_country,
        paymentMethod: order.payment_method,
      },
    };

    return NextResponse.json(formattedOrder);
  } catch (error: any) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
