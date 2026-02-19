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

    if (order?.metadata?.bundle) {
      try {
        await recordBundlePurchases(order);
      } catch (bundleError) {
        console.error("Error recording bundle purchases:", bundleError);
        // Don't fail the webhook - bundle recording is secondary
      }
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

export async function recordBundlePurchases(order: any) {
  try {
    const bundleData = order.metadata?.bundle;

    if (!bundleData || !bundleData.bundle_id) {
      console.log("No bundle data found for order", order.id);
      return;
    }

    console.log("Recording bundle purchase:", bundleData);

    // Start a transaction to ensure data consistency
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from("bundle_purchases")
      .insert({
        bundle_id: bundleData.bundle_id,
        user_id: order.user_id,
        order_id: order.id,
        quantity: 1, // One bundle per order
        price_paid: calculateBundlePriceFromOrder(order),
        savings_amount: calculateBundleSavings(order, bundleData),
        points_used: bundleData.points_required || 0,
        // loyalty_transaction_id will be linked separately if points were used
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (purchaseError) {
      throw new Error(
        `Failed to insert bundle purchase: ${purchaseError.message}`,
      );
    }

    console.log("Bundle purchase recorded:", purchase);

    // Update bundle current purchases count
    const { error: updateError } = await supabaseAdmin.rpc(
      "increment_mistry_bundle",
      { bundle_id: bundleData.bundle_id },
    );

    if (updateError) {
      console.error("Failed to update bundle purchase count:", updateError);
      // Don't throw - this is non-critical
    }

    // If points were used, link the loyalty transaction
    if (bundleData.points_required && bundleData.points_required > 0) {
      // Find the loyalty transaction for this order where points were used
      const { data: loyaltyTx, error: txError } = await supabaseAdmin
        .from("loyalty_transactions")
        .select("id")
        .eq("order_id", order.id)
        .eq("transaction_type", "redeemed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!txError && loyaltyTx) {
        // Link the transaction to bundle purchase
        await supabaseAdmin
          .from("bundle_purchases")
          .update({ loyalty_transaction_id: loyaltyTx.id })
          .eq("id", purchase.id);
      }
    }

    return purchase;
  } catch (error) {
    console.error("Error in recordBundlePurchases:", error);
    throw error;
  }
}

function calculateBundlePriceFromOrder(order: any): number {
  // Calculate how much the customer actually paid for the bundle
  // This is the total order amount minus shipping, installation, etc.
  const baseTotal = order.total_amount;
  const shipping = order.shipping_cost || 0;
  const installation = order.installation_cost || 0;

  // If there were no other services, the bundle price is the total
  if (shipping === 0 && installation === 0) {
    return baseTotal;
  }

  // Otherwise, we need to estimate the bundle's portion
  // For now, use a simplified approach - assume bundle price is total minus extras
  return Math.max(0, baseTotal - shipping - installation);
}

function calculateBundleSavings(order: any, bundleData: any): number {
  // Calculate original total of bundle items
  const orderItems = order.metadata?.items || [];
  const bundleItems = bundleData.items || [];

  let originalTotal = 0;

  // Match order items with bundle items by product_id
  bundleItems.forEach((bundleItem: any) => {
    const orderItem = orderItems.find(
      (oi: any) => oi.product_id === bundleItem.product_id,
    );
    if (orderItem) {
      originalTotal += (orderItem.unit_price || 0) * bundleItem.quantity;
    }
  });

  // Calculate what they actually paid for these items
  const bundlePrice = calculateBundlePriceFromOrder(order);

  return Math.max(0, originalTotal - bundlePrice);
}
