import { secureRatelimit } from "@/lib/limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(req: Request, context: any) {
  const { id } = (await context.params) as { id: string };

  // Rate limiting
  const { success } = await secureRatelimit(req);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select(
      `
      id,
      created_at,
      status,
      total,
      currency,
      order_items (
      id,
      qty,
      unit_price,
      products (
      id,
      name,
      description
      )
      ),
      shipping_info
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // 🔥 build a simple invoice payload
  const invoice = {
    invoiceId: `INV-${order.id}`,
    customer: order.shipping_info,
    date: order.created_at,
    items: order.order_items.map((item: any) => ({
      product: item.products?.name ?? "Unknown product",
      quantity: item.qty,
      price: item.unit_price,
      subtotal: item.qty * item.unit_price,
    })),
    total: order.total,
    currency: order.currency,
    status: order.status,
  };

  return NextResponse.json(invoice);
}
