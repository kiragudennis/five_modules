import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Mpesa callback webhook listener
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get("orderId");
    const callbackSecret = url.searchParams.get("callbackSecret");

    if (!orderId || !callbackSecret) {
      return NextResponse.json(
        { error: "Missing orderId or callbackSecret" },
        { status: 400 }
      );
    }

    // Validate callback secret
    if (callbackSecret !== process.env.MPESA_CALLBACK_SECRET) {
      return NextResponse.json(
        { error: "Invalid callback secret" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { Body } = body;

    if (!Body || !Body.stkCallback) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const stkCallback = Body.stkCallback;

    // Handle failed/cancelled payments
    if (stkCallback.ResultCode !== 0) {
      return NextResponse.json(
        { message: "Payment not successful" },
        { status: 200 }
      );
    }

    // Extract metadata safely
    const items = stkCallback.CallbackMetadata?.Item || [];
    const amountItem = items.find((item: any) => item.Name === "Amount");
    const receiptItem = items.find(
      (item: any) => item.Name === "MpesaReceiptNumber"
    );
    const phoneItem = items.find((item: any) => item.Name === "PhoneNumber");

    const amount = amountItem?.Value || 0;
    const receipt = receiptItem?.Value || "N/A";
    const phone = phoneItem?.Value || "N/A";

    const { data: Order } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
      })
      .eq("id", orderId)
      .select()
      .single();

    if (!Order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const { error: txErr } = await supabaseAdmin.from("transactions").insert({
      order_id: Order.id,
      gateway: "mpesa",
      amount,
      status: "completed",
      receipt_number: receipt,
      phone_number: phone,
      gateway_tx_id: stkCallback.CheckoutRequestID,
      payload: stkCallback,
    });

    if (txErr) {
      console.error("Error saving transaction:", txErr);
      return NextResponse.json(
        { error: "Failed to save transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Payment processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Mpesa callback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
