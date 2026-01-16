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

  // Verify webhook signature
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
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: body,
      }),
    }
  );

  const verifyData = await verifyRes.json();
  const isInvalid = verifyData.verification_status !== "SUCCESS";
  const isBanned = await banIfInvalid(
    req,
    isInvalid,
    "Invalid PayPal signature"
  );

  if (isBanned) {
    return NextResponse.json({ message: "Success" }, { status: 201 });
  }

  const eventType = body.event_type;
  const resource = body.resource;

  try {
    // --- Step 1: Handle ORDER APPROVED ---
    if (eventType === "CHECKOUT.ORDER.APPROVED") {
      const paypalOrderId = resource.id;
      const supabaseOrderId = resource?.purchase_units?.[0]?.custom_id;

      if (!supabaseOrderId) {
        throw new Error("No Supabase order ID found in PayPal resource");
      }

      console.log("⚡ PayPal order approved:", {
        paypalOrderId,
        supabaseOrderId,
      });

      // Auto-capture the payment
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

      // Update order metadata with approval info
      await supabaseAdmin
        .from("orders")
        .update({
          metadata: {
            paypal_order_approved: true,
            paypal_approval_time: new Date().toISOString(),
            paypal_capture_attempted: true,
            paypal_capture_response: captureData,
          },
        })
        .eq("id", supabaseOrderId);

      // Wait for PAYMENT.CAPTURE.COMPLETED for final status
    }

    // --- Step 2: Handle COMPLETED PAYMENT ---
    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const supabaseOrderId =
        resource?.custom_id ||
        resource?.supplementary_data?.related_ids?.order_id ||
        resource?.purchase_units?.[0]?.reference_id ||
        resource?.purchase_units?.[0]?.custom_id;

      if (!supabaseOrderId) {
        throw new Error("No Supabase order ID found in PayPal resource");
      }

      // Get order details first
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", supabaseOrderId)
        .single();

      if (orderError || !order) {
        console.error("Order not found:", orderError);
        throw new Error(`Order ${supabaseOrderId} not found`);
      }

      // Check if already processed (idempotency)
      if (order.payment_status === "completed") {
        console.log(`Order ${supabaseOrderId} already processed`);
        return NextResponse.json({ status: "already_processed" });
      }

      const amount = resource.amount.value;
      const currency = resource.amount.currency_code;
      const fees = resource.seller_receivable_breakdown?.paypal_fee?.value || 0;
      const netAmount =
        resource.seller_receivable_breakdown?.net_amount?.value || amount;

      // ✅ Update order with new structure
      const updateData: any = {
        payment_status: "completed",
        status: "processing", // Update to match your workflow
        paid_at: new Date().toISOString(),
        payment_reference: resource.id,
        metadata: {
          ...order.metadata,
          paypal_payment_completed: {
            capture_id: resource.id,
            amount_captured: amount,
            currency: currency,
            fees: fees,
            net_amount: netAmount,
            payer_email: resource.payer?.email_address,
            payer_name:
              resource.payer?.name?.given_name +
              " " +
              resource.payer?.name?.surname,
            completed_at: new Date().toISOString(),
          },
        },
      };

      await supabaseAdmin
        .from("orders")
        .update(updateData)
        .eq("id", supabaseOrderId)
        .neq("payment_status", "completed"); // Idempotency check

      // ✅ Insert transaction
      await supabaseAdmin.from("transactions").insert({
        order_id: supabaseOrderId,
        gateway: "paypal",
        amount: amount,
        currency: currency,
        fees: fees,
        net_amount: netAmount,
        receipt_number: resource.id,
        payer_email: resource.payer?.email_address,
        payer_name:
          resource.payer?.name?.given_name +
          " " +
          resource.payer?.name?.surname,
        gateway_tx_id: resource.id,
        status: "completed",
        payload: resource,
      });

      console.log(`💰 Order ${supabaseOrderId} marked as paid (PayPal)`);

      // Here you could trigger additional actions:
      // - Send confirmation email
      // - Update inventory
      // - Send notification to admin
      // - etc.
    }

    // --- Step 3: Handle OTHER PAYMENT STATUSES ---
    if (
      eventType === "PAYMENT.CAPTURE.DENIED" ||
      eventType === "PAYMENT.CAPTURE.FAILED" ||
      eventType === "PAYMENT.CAPTURE.PENDING"
    ) {
      const supabaseOrderId =
        resource?.custom_id ||
        resource?.purchase_units?.[0]?.reference_id ||
        resource?.purchase_units?.[0]?.custom_id;

      if (supabaseOrderId) {
        let paymentStatus = "failed";
        if (eventType === "PAYMENT.CAPTURE.PENDING") {
          paymentStatus = "pending";
        }

        await supabaseAdmin
          .from("orders")
          .update({
            payment_status: paymentStatus,
            metadata: {
              paypal_payment_status: eventType,
              paypal_failure_reason: resource.reason || eventType,
              last_updated: new Date().toISOString(),
            },
          })
          .eq("id", supabaseOrderId);

        console.log(`🔄 Order ${supabaseOrderId} payment status: ${eventType}`);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
