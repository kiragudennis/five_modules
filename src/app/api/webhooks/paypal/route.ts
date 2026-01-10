import { banIfInvalid } from "@/lib/limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const PAYPAL_BASE_URL =
  process.env.VERCEL_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const body = JSON.parse(rawBody);

  // Validate required PayPal headers
  const requiredHeaders = [
    "paypal-auth-algo",
    "paypal-cert-url",
    "paypal-transmission-id",
    "paypal-transmission-sig",
    "paypal-transmission-time",
  ];

  const missingHeaders = requiredHeaders.filter((h) => !req.headers.get(h));

  const headersMissing = missingHeaders.length > 0;

  const earlyBan = await banIfInvalid(
    req,
    headersMissing,
    "Missing PayPal headers"
  );
  if (earlyBan) {
    return new Response("OK", { status: 200 });
  }

  const authString = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const tokenRes = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authString}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const { access_token } = await tokenRes.json();

  // Before trusting
  const verifyRes = await fetch(
    `${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        auth_algo: req.headers.get("paypal-auth-algo"),
        cert_url: req.headers.get("paypal-cert-url"),
        transmission_id: req.headers.get("paypal-transmission-id"),
        transmission_sig: req.headers.get("paypal-transmission-sig"),
        transmission_time: req.headers.get("paypal-transmission-time"),
        webhook_id: process.env.PAYPAL_WEBHOOK_ID, // you get this from their dashboard
        webhook_event: body,
      }),
    }
  );

  const verifyData = await verifyRes.json();
  const isInvalid = verifyData.verification_status !== "SUCCESS";
  const isBanned = await banIfInvalid(
    req,
    isInvalid,
    "Missing Stripe signature"
  );

  if (isBanned) {
    return NextResponse.json({ message: "Success" }, { status: 201 }); // acting cool
  }

  const eventType = body.event_type;
  const resource = body.resource;

  try {
    // --- Step 1: Handle APPROVED (auto-capture) ---
    if (eventType === "CHECKOUT.ORDER.APPROVED") {
      const paypalOrderId = resource.id;
      const supabaseOrderId = resource?.purchase_units?.[0]?.custom_id;

      console.log("⚡ Order approved, capturing...", supabaseOrderId);

      const captureRes = await fetch(
        `${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const captureData = await captureRes.json();

      // Don’t update DB yet, wait for PAYMENT.CAPTURE.COMPLETED
    }

    // --- Step 2: Handle COMPLETED payment ---
    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const supabaseOrderId =
        resource?.custom_id ||
        resource?.supplementary_data?.related_ids?.order_id ||
        resource?.purchase_units?.[0]?.reference_id;

      if (!supabaseOrderId) {
        throw new Error("No Supabase order ID found in PayPal resource");
      }

      const amount = resource.amount.value;
      const currency = resource.amount.currency_code;

      // ✅ Update order
      await supabaseAdmin
        .from("orders")
        .update({ status: "paid" })
        .eq("id", supabaseOrderId)
        .neq("status", "paid"); // idempotency

      // ✅ Insert transaction
      await supabaseAdmin.from("transactions").insert({
        order_id: supabaseOrderId,
        gateway: "paypal",
        amount,
        fees: resource.seller_receivable_breakdown?.paypal_fee?.value || 0,
        receipt_number: resource.id,
        phone_number:
          resource.payer?.payer_info?.phone?.phone_number?.national_number ||
          "N/A",
        gateway_tx_id: resource.id,
        status: "completed",
        payload: resource,
      });

      console.log(`💰 Order ${supabaseOrderId} marked as paid`);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
