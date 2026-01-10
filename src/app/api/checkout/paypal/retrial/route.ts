// /app/api/paypal/checkout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { secureRatelimit } from "@/lib/limit";
import { supabaseAdmin } from "@/lib/supabase/admin";

const PAYPAL_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export async function POST(req: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const body = await req.json();
  const { orderId } = body;

  const { success } = await secureRatelimit(req);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "Unauthorized", redirect: "/login" },
      { status: 401 }
    );
  }

  try {
    // Create order in Supabase
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderErr) throw orderErr;

    // Check if order already paid
    if (order.status !== "pending") {
      return NextResponse.json(
        {
          error: "Order already paid",
          url: "/checkout/success?orderId=" + order.id,
        },
        { status: 400 }
      );
    }
    // Get PayPal access token
    const basicAuth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Create PayPal order
    const orderRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: order.id, // tie PayPal order to Supabase order
            custom_id: order.id, // safe place for your internal ID
            amount: {
              currency_code: order.currency,
              value: order.total.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: "World Samma Academy Shop",
          landing_page: "BILLING", // 👈 opens card form directly
          shipping_preference: "NO_SHIPPING", // optional, if no shipping
          user_action: "PAY_NOW",
          return_url: `${siteUrl}/checkout/success?orderId=${order.id}`,
          cancel_url: `${siteUrl}/checkout/cancel?orderId=${order.id}`,
        },
      }),
    });

    const orderData = await orderRes.json();

    const approveUrl = orderData.links?.find(
      (link: any) => link.rel === "approve"
    )?.href;

    if (!approveUrl) {
      throw new Error("PayPal approval link not found");
    }

    return NextResponse.json({ url: approveUrl });
  } catch (err: any) {
    console.error("PayPal session error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
