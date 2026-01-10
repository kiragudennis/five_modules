import { secureRatelimit } from "@/lib/limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateToken } from "@/lib/utils";
import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const { cart, phoneNumber } = body;
  const { total, items, currency, shipping } = cart;
  const access_key = process.env.EXCHANGE_API_KEY;
  const endpoint = process.env.ENDPOINT;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  // IF NO PHONE NUMBER
  if (
    !phoneNumber ||
    phoneNumber.length !== 12 ||
    !phoneNumber.startsWith("254")
  ) {
    return NextResponse.json(
      { error: "Invalid phone number" },
      { status: 400 }
    );
  }

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

  // Convert CURRENCY → KES with 12h caching
  let amountKES = total;
  if (currency !== "KSH") {
    try {
      const res = await fetch(
        `https://api.exchangerate.host/${endpoint}?access_key=${access_key}&from=${currency}&to=KES&amount=${amountKES}`,
        { next: { revalidate: 3600 * 12 } } // 12h cache
      );
      const json = await res.json();

      const rate = json.result;

      if (!rate) throw new Error("Rate missing");
      amountKES = Math.round(rate);
    } catch (err) {
      console.error(
        "Exchange rate fetch failed, defaulting to hardcoded rate",
        err
      );
      amountKES = Math.round(total * 131); // fallback
    }
  }

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
    "base64"
  );

  try {
    const token = await generateToken();

    // 📦 1. Create order
    const { data: orderData, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        total,
        currency,
        status: "pending", // default
        shipping_info: shipping,
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // 📦 2. Insert order items
    const orderItems = items.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.id,
      qty: item.quantity,
      unit_price: item.price,
    }));
    const { error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);
    if (itemsErr) throw itemsErr;

    const { data } = await axios.post(
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerBuyGoodsOnline",
        Amount: amountKES, // Use converted amount in KES
        PartyA: phoneNumber,
        PartyB: process.env.MPESA_TILL!,
        PhoneNumber: phoneNumber,
        CallBackURL: `${siteUrl}/api/webhooks/mpesa?orderId=${
          orderData.id
        }&callbackSecret=${process.env.MPESA_CALLBACK_SECRET!}`,
        AccountReference: "World Samma Federation",
        TransactionDesc: "Payment for order",
      },
      {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (data.ResponseCode !== "0") {
      throw new Error(`M-Pesa error: ${data.ResponseDescription}`);
    }

    return NextResponse.json(
      { orderId: orderData.id, mpesa: data },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("M-Pesa checkout error:", error);
    if (error.response) {
      // This logs the full M-Pesa response when the request fails
      console.error("M-Pesa API response error:", error.response.data);
      console.error("Status code:", error.response.status);
      console.error("Headers:", error.response.headers);
    } else {
      console.error("Unknown M-Pesa error:", error.message);
    }
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
