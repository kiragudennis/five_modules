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
        { status: 400 },
      );
    }

    // Validate callback secret
    if (callbackSecret !== process.env.MPESA_CALLBACK_SECRET) {
      return NextResponse.json(
        { error: "Invalid callback secret" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { Body } = body;

    if (!Body || !Body.stkCallback) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const stkCallback = Body.stkCallback;

    // Extract metadata safely
    const items = stkCallback.CallbackMetadata?.Item || [];
    const amountItem = items.find((item: any) => item.Name === "Amount");
    const receiptItem = items.find(
      (item: any) => item.Name === "MpesaReceiptNumber",
    );
    const phoneItem = items.find((item: any) => item.Name === "PhoneNumber");
    const transactionDateItem = items.find(
      (item: any) => item.Name === "TransactionDate",
    );

    const amount = amountItem?.Value || 0;
    const receipt = receiptItem?.Value || "N/A";
    const phone = phoneItem?.Value || "N/A";
    const transactionDate = transactionDateItem?.Value || null;

    // Handle failed/cancelled payments
    if (stkCallback.ResultCode !== 0) {
      console.log(
        `Payment failed for order ${orderId}:`,
        stkCallback.ResultDesc,
      );

      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "failed",
          status: "pending",
          metadata: {
            mpesa_failure: {
              result_code: stkCallback.ResultCode,
              result_desc: stkCallback.ResultDesc,
              failed_at: new Date().toISOString(),
            },
          },
        })
        .eq("id", orderId);

      return NextResponse.json(
        { message: "Payment not successful - order status updated" },
        { status: 200 },
      );
    }

    // Get order details first
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if already processed (idempotency)
    if (order.payment_status === "completed") {
      console.log(`Order ${orderId} already processed`);
      return NextResponse.json(
        { message: "Order already processed" },
        { status: 200 },
      );
    }

    if (order?.referred_by) {
      // Award referral points if applicable

      // 🔥 CALL RPC FUNCTION TO AWARD REFERRAL POINTS
      const { data: referralResult, error: referralError } =
        await supabaseAdmin.rpc("award_referral_points_on_order_complete", {
          p_order_id: orderId,
        });

      if (referralError) {
        console.error("RPC error:", referralError);
        // Continue anyway, don't fail the webhook
      } else if (referralResult && !referralResult.success) {
        console.log("Referral points not awarded:", referralResult.error);
      } else if (referralResult && referralResult.success) {
        console.log("Referral points awarded:", referralResult);
      }
    }

    // Convert transaction date to timestamp if available
    let paidAt = new Date();
    if (transactionDate) {
      try {
        // M-Pesa transaction date format: YYYYMMDDHHMMSS
        const year = transactionDate.substring(0, 4);
        const month = transactionDate.substring(4, 6);
        const day = transactionDate.substring(6, 8);
        const hour = transactionDate.substring(8, 10);
        const minute = transactionDate.substring(10, 12);
        const second = transactionDate.substring(12, 14);
        paidAt = new Date(
          `${year}-${month}-${day}T${hour}:${minute}:${second}Z`,
        );
      } catch (e) {
        console.warn("Failed to parse transaction date:", e);
      }
    }

    // Update order with new structure
    const updateData: any = {
      payment_status: "completed",
      status: "processing", // Use 'processing' instead of 'paid' to match your workflow
      paid_at: paidAt.toISOString(),
      payment_reference: receipt,
      metadata: {
        ...order.metadata,
        mpesa_success: {
          receipt_number: receipt,
          phone_number: phone,
          amount_paid: amount,
          transaction_date: transactionDate,
          callback_data: stkCallback,
        },
        payment_completed_at: new Date().toISOString(),
      },
    };

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 },
      );
    }

    // Save transaction record
    const { error: txErr } = await supabaseAdmin.from("transactions").insert({
      order_id: orderId,
      gateway: "mpesa",
      amount: amount,
      status: "completed",
      receipt_number: receipt,
      phone_number: phone,
      gateway_tx_id:
        stkCallback.CheckoutRequestID || stkCallback.MerchantRequestID,
      transaction_date: paidAt.toISOString(),
      currency: order.currency || "KES",
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      payload: stkCallback,
    });

    if (txErr) {
      console.error("Error saving transaction:", txErr);
      // Don't fail the whole request if transaction logging fails
    }

    // Here you could trigger additional actions:
    // - Send confirmation email
    // - Update inventory
    // - Send notification to admin
    // - etc.

    console.log(`✅ Payment processed successfully for order ${orderId}`);

    return NextResponse.json(
      {
        message: "Payment processed successfully",
        orderId,
        receiptNumber: receipt,
        amount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Mpesa callback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
