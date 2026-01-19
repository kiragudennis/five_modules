// /app/api/paypal/checkout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { secureRatelimit } from "@/lib/limit";
import { supabaseAdmin } from "@/lib/supabase/admin";

const PAYPAL_BASE_URL =
  process.env.VERCEL_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export async function POST(req: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const body = await req.json();

  const { cart } = body;

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

  try {
    // 📦 1. Create order with new schema
    const orderPayload = {
      // User information
      user_id: user.id,

      // Customer Information (flattened)
      customer_name: `${customer.firstName} ${customer.lastName}`.trim(),
      customer_email: customer.email,
      customer_phone: customer.phone,

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
      payment_method: "paypal",
      payment_status: "pending",
      payment_reference: null,

      // Order Totals
      subtotal: totals.subtotal,
      wholesale_savings: totals.wholesaleSavings || 0,
      coupon_discount: totals.couponDiscount || 0,
      installation_cost: totals.installation || 0,
      total_amount: totals.total,
      currency: totals.currency || "USD", // PayPal typically uses USD

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
        original_currency: totals.currency,
        cart_count: metadata?.cartCount,
        wholesale_applied: metadata?.wholesaleApplied,
        user_agent: req.headers.get("user-agent"),
        ip_address:
          req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        checkout_type: "paypal",
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

    // 📦 2. Insert order items
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
      metadata: {
        original_data: {
          name: item.name,
          title: item.title,
          sku: item.sku,
          category: item.category,
        },
      },
    }));

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

    // 📦 4. Get updated order total after coupon application
    let finalAmount = totals.total;
    if (couponResult && couponResult.success) {
      finalAmount = couponResult.final_total;
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
      finalAmount = Math.max(1, finalAmount - redeemResult.discount_amount);
    }

    // 📦 5. Get PayPal access token
    const basicAuth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
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

    if (!tokenData.access_token) {
      throw new Error("Failed to get PayPal access token");
    }

    const accessToken = tokenData.access_token;

    // 📦 6. Create PayPal order with proper line items
    const purchaseUnits: any[] = [
      {
        reference_id: orderData.id,
        custom_id: orderData.id,
        amount: {
          currency_code: orderData.currency || "USD",
          value: finalAmount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: orderData.currency || "USD",
              value: totals.subtotal.toFixed(2),
            },
            discount: {
              currency_code: orderData.currency || "USD",
              value: (
                (totals.couponDiscount || 0) +
                (totals.wholesaleSavings || 0) +
                (redeemResult.discount_amount || 0)
              ).toFixed(2),
            },
            shipping: {
              currency_code: orderData.currency || "USD",
              value: (shipping.cost || 0).toFixed(2),
            },
          },
        },
        items: items.map((item: any) => ({
          name: item.title || item.name,
          unit_amount: {
            currency_code: orderData.currency || "USD",
            value: item.applied_price.toFixed(2),
          },
          quantity: item.quantity.toString(),
          category: "PHYSICAL_GOODS", // Or 'DIGITAL_GOODS' if applicable
        })),
      },
    ];

    // Add shipping cost as an item if it's not included in breakdown
    if (shipping.cost > 0) {
      purchaseUnits[0].items.push({
        name: `${shipping.method} Shipping`,
        unit_amount: {
          currency_code: orderData.currency || "USD",
          value: shipping.cost.toFixed(2),
        },
        quantity: "1",
        category: "SHIPPING",
      });
    }

    // Add installation cost as an item if applicable
    if (services?.installation?.cost > 0) {
      purchaseUnits[0].items.push({
        name: services.installation.service?.name || "Installation Service",
        unit_amount: {
          currency_code: orderData.currency || "USD",
          value: services.installation.cost.toFixed(2),
        },
        quantity: "1",
        category: "SERVICE",
      });
    }

    const orderRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": orderData.id, // For idempotency
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: purchaseUnits,
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "Blessed Two Electronics",
              locale: "en-US",
              landing_page: "BILLING", // LOGIN, BILLING, or NO_PREFERENCE
              shipping_preference:
                shipping.method === "pickup"
                  ? "NO_SHIPPING"
                  : "SET_PROVIDED_ADDRESS",
              user_action: "PAY_NOW",
              payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
              return_url: `${siteUrl}/checkout/success?orderId=${orderData.id}&paymentMethod=paypal`,
              cancel_url: `${siteUrl}/checkout?canceled=true&orderId=${orderData.id}`,
            },
          },
        },
      }),
    });

    const paypalOrderData = await orderRes.json();

    if (orderRes.status !== 201) {
      console.error("PayPal order creation error:", paypalOrderData);

      // Update order status to indicate PayPal failure
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "failed",
          status: "pending",
          notes: `PayPal order creation failed: ${
            paypalOrderData.message || "Unknown error"
          }`,
          metadata: {
            ...orderData.metadata,
            paypal_error: paypalOrderData,
          },
        })
        .eq("id", orderData.id);

      throw new Error("Failed to create PayPal order");
    }

    // 📦 7. Update order with PayPal reference
    await supabaseAdmin
      .from("orders")
      .update({
        payment_reference: paypalOrderData.id,
        metadata: {
          ...orderData.metadata,
          paypal_order_id: paypalOrderData.id,
          paypal_status: paypalOrderData.status,
          paypal_create_time: paypalOrderData.create_time,
          coupon_attempted: !!coupon?.code,
          coupon_result: couponResult,
          redeem_result: redeemResult,
        },
      })
      .eq("id", orderData.id);

    // Find approval URL
    const approveUrl = paypalOrderData.links?.find(
      (link: any) => link.rel === "approve",
    )?.href;

    if (!approveUrl) {
      throw new Error("PayPal approval link not found");
    }

    return NextResponse.json({
      success: true,
      url: approveUrl,
      order: {
        id: orderData.id,
        orderNumber: orderData.order_number,
        total: finalAmount,
        currency: orderData.currency,
        couponApplied: couponResult?.success || false,
        discountAmount: couponResult?.discount_amount || 0,
      },
      paypalOrderId: paypalOrderData.id,
    });
  } catch (err: any) {
    console.error("PayPal checkout error:", err);

    // Return more detailed error information
    return NextResponse.json(
      {
        error: "Failed to process PayPal checkout",
        details: err.message,
        ...(err.response?.data && { paypalError: err.response.data }),
      },
      { status: 500 },
    );
  }
}
