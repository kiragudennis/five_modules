// /api/checkout/mpesa/initial/route.ts
import { secureRatelimit } from "@/lib/limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateToken } from "@/lib/utils";
import axios from "axios";
import { checkBotId } from "botid/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { cart, phoneNumber } = body;

  // Destructure the new cart structure
  const {
    items,
    customer,
    shipping,
    payment,
    services,
    coupon,
    loyaltyCode,
    totals,
    metadata,
  } = cart;

  // Validate required fields
  if (!items || !customer || !shipping || !totals) {
    return NextResponse.json(
      { error: "Missing required cart data" },
      { status: 400 },
    );
  }

  // Validate phone number
  if (
    !phoneNumber ||
    phoneNumber.length !== 12 ||
    !phoneNumber.startsWith("254")
  ) {
    return NextResponse.json(
      { error: "Invalid phone number" },
      { status: 400 },
    );
  }

  // Validate customer info
  if (
    !customer.firstName ||
    !customer.lastName ||
    !customer.email ||
    !customer.phone
  ) {
    return NextResponse.json(
      { error: "Missing customer information" },
      { status: 400 },
    );
  }

  const verification = await checkBotId();

  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { success } = await secureRatelimit(req);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized", redirect: "/login" },
      { status: 401 },
    );
  }

  // Convert currency to KES if needed (using totals.total)
  let amountKES = totals.total;
  const currency = totals.currency || "KES"; // Assuming currency is in totals

  if (currency !== "KES") {
    try {
      const access_key = process.env.EXCHANGE_API_KEY;
      const endpoint = process.env.ENDPOINT;

      const res = await fetch(
        `https://api.exchangerate.host/${endpoint}?access_key=${access_key}&from=${currency}&to=KES&amount=${amountKES}`,
        { next: { revalidate: 3600 * 12 } },
      );
      const json = await res.json();
      const rate = json.result;

      if (!rate) throw new Error("Rate missing");
      amountKES = Math.round(rate);
    } catch (err) {
      console.error(
        "Exchange rate fetch failed, defaulting to hardcoded rate",
        err,
      );
      amountKES = Math.round(totals.total * 131); // fallback
    }
  }

  // Prepare M-Pesa timestamp and password
  const current_time = new Date();
  const year = current_time.getFullYear();
  const month = String(current_time.getMonth() + 1).padStart(2, "0");
  const day = String(current_time.getDate()).padStart(2, "0");
  const hours = String(current_time.getHours()).padStart(2, "0");
  const minutes = String(current_time.getMinutes()).padStart(2, "0");
  const seconds = String(current_time.getSeconds()).padStart(2, "0");

  const shortCode = process.env.MPESA_SHORTCODE!;
  const passKey = process.env.MPESA_PASSKEY!;
  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
  const password = Buffer.from(shortCode + passKey + timestamp).toString(
    "base64",
  );

  try {
    // 📦 1. Create order with new schema
    const orderItems = items.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.id,
      product_name: item.name,
      product_title: item.title,
      product_sku: item.sku,
      product_category: item.category,
      product_image: item.image,
      unit_price: item.price,
      wholesale_price: item.wholesale_price,
      wholesale_min_quantity: item.wholesale_min_quantity,
      has_wholesale: item.has_wholesale,
      applied_price: item.applied_price,
      quantity: item.quantity,
      variant: item.variant ? JSON.stringify(item.variant) : null,
      metadata: {
        original_data: {
          name: item.name,
          title: item.title,
          sku: item.sku,
          category: item.category,
        },
      },
    }));

    const orderPayload = {
      // User information
      user_id: user.id,

      // Customer Information (flattened)
      customer_name: `${customer.firstName} ${customer.lastName}`.trim(),
      customer_email: customer.email,
      customer_phone: customer.phone,

      // Product referral details
      referral_source: metadata?.referral.source || "",
      referred_by: metadata?.referral.referrerId || null,
      referral_product_id: metadata?.referral.productId || null,

      // Shipping Information (flattened)
      shipping_address: shipping.address,
      shipping_city: shipping.city,
      shipping_county: shipping.county,
      shipping_postal_code: shipping.postalCode,
      shipping_country: shipping.country || "Kenya",
      shipping_method: shipping.method,
      shipping_cost: shipping.cost || 0,
      shipping_total: shipping.cost || 0,
      estimated_delivery: shipping.estimatedDelivery,

      // Payment Information
      payment_method: payment.method,
      payment_status: "pending",
      payment_reference: null,

      // Order Totals
      subtotal: totals.subtotal,
      wholesale_savings: totals.wholesaleSavings || 0,
      coupon_discount: totals.couponDiscount || 0,
      installation_cost: totals.installation || 0,
      total_amount: totals.total,
      currency: "KES", // Converted to KES for M-Pesa

      // Installation Services
      installation_required: services?.installation?.required || false,
      installation_service: services?.installation?.required
        ? {
            name: services.installation.service?.name,
            description: services.installation.service?.description,
            price: services.installation.cost,
          }
        : null,
      installation_date: services?.installation?.date,
      installation_time: services?.installation?.time,
      special_instructions: services?.installation?.instructions,

      // Coupon Information
      coupon_code: coupon?.code || null,
      coupon_data: coupon?.data || null,

      // Order Status
      status: "pending",

      // Metadata
      notes: metadata?.notes || null,
      metadata: {
        original_currency: currency,
        converted_amount_kes: amountKES,
        cart_count: metadata?.cartCount,
        wholesale_applied: metadata?.wholesaleApplied,
        referral: metadata?.referral || null,
        bundle: metadata?.bundle || null,
        items: orderItems ?? [],
        user_agent: req.headers.get("user-agent"),
        ip_address:
          req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      },
    };

    const { data: orderData, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert(orderPayload)
      .select()
      .single();

    if (orderErr) {
      console.error("Order creation error:", orderErr);
      throw orderErr;
    }

    // 📦 2. Insert order items (snapshot_product_details trigger will populate product details)
    const { error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsErr) {
      console.error("Order items creation error:", itemsErr);

      // Rollback order if items fail
      await supabaseAdmin.from("orders").delete().eq("id", orderData.id);

      throw itemsErr;
    }

    // 📦 3. APPLY COUPON IF PROVIDED
    let couponResult = null;
    if (coupon?.code) {
      try {
        // Call the PostgreSQL function to apply coupon
        const { data: couponData, error: couponError } =
          await supabaseAdmin.rpc("apply_coupon_to_order", {
            order_uuid: orderData.id,
            coupon_code: coupon.code,
            customer_email_param: customer.email,
          });

        if (couponError) {
          console.warn(
            "Coupon application failed, continuing without coupon:",
            couponError.message,
          );
          // Continue without coupon - order already created
        } else {
          couponResult = couponData;
        }
      } catch (couponErr) {
        console.warn(
          "Coupon application error, continuing without coupon:",
          couponErr,
        );
        // Continue without coupon
      }
    }

    // Update amountKES with final total after coupon
    if (couponResult && couponResult.success) {
      amountKES = Math.max(1, amountKES - couponResult.discount_amount); // Ensure positive amount
    }

    // 📦 3. APPLY POINTS IF PROVIDED
    let redeemResult = null;
    if (loyaltyCode) {
      try {
        // Call the PostgreSQL function to apply coupon
        const { data: redeemData, error: redeemError } =
          await supabaseAdmin.rpc("apply_loyalty_redemption_to_order", {
            p_order_id: orderData.id,
            p_redemption_code: loyaltyCode,
            p_user_id: orderData.user_id,
          });

        if (redeemError) {
          console.warn(
            "Redeem application failed, continuing without redeeming:",
            redeemError.message,
          );
          // Continue without redeem - order already created
        } else {
          redeemResult = redeemData;
        }
      } catch (redeemErr) {
        console.warn(
          "Redeem application error, continuing without redeeming:",
          redeemErr,
        );
        // Continue without redeem
      }
    }

    if (redeemResult && redeemResult.success) {
      // Update amountKES with loyalty discount
      amountKES = Math.max(1, amountKES - redeemResult.discount_amount);
    }

    // 📦 3. Initiate M-Pesa payment
    const token = await generateToken();

    const { data: mpesaData } = await axios.post(
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerBuyGoodsOnline",
        Amount: amountKES,
        PartyA: phoneNumber,
        PartyB: process.env.MPESA_TILL!,
        PhoneNumber: phoneNumber,
        CallBackURL: `${
          process.env.NEXT_PUBLIC_SITE_URL
        }/api/webhooks/mpesa?orderId=${orderData.id}&callbackSecret=${process
          .env.MPESA_CALLBACK_SECRET!}`,
        AccountReference:
          orderData.order_number || `ORDER-${orderData.id.substring(0, 8)}`,
        TransactionDesc: `Payment for order ${
          orderData.order_number || orderData.id
        }`,
      },
      {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (mpesaData.ResponseCode !== "0") {
      throw new Error(`M-Pesa error: ${mpesaData.ResponseDescription}`);
    }

    // Update order with M-Pesa reference
    await supabaseAdmin
      .from("orders")
      .update({
        payment_reference: mpesaData.CheckoutRequestID,
        metadata: {
          ...orderData.metadata,
          mpesa_request_id: mpesaData.CheckoutRequestID,
          mpesa_response: mpesaData,
          coupon_attempted: !!coupon?.code,
          coupon_result: couponResult,
        },
      })
      .eq("id", orderData.id);

    return NextResponse.json(
      {
        orderId: orderData.id,
        orderNumber: orderData.order_number,
        mpesa: mpesaData,
        message: "Order created successfully. Please complete payment.",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Checkout error:", error);

    // More detailed error logging
    if (error.response) {
      console.error("API response error:", error.response.data);
      console.error("Status code:", error.response.status);
    } else if (error.message) {
      console.error("Error message:", error.message);
    }

    return NextResponse.json(
      {
        error: "Failed to process checkout",
        details: error.message,
        ...(error.response?.data && { mpesaError: error.response.data }),
      },
      { status: 500 },
    );
  }
}
