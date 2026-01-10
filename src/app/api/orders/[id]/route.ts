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
      `*,
      order_items (
        id,
        qty,
        unit_price,
        products (
          id,
          name,
          description
        )
      )
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

  return NextResponse.json(order);
}
