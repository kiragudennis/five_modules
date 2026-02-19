// lib/limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { supabaseAdmin } from "./supabase/admin";
import { Resend } from "resend";

// ✅ Shared Redis instance
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const resend = new Resend(process.env.RESEND_API_KEY);

// 🔁 Default limit: 5 reqs / 1 min
const defaultRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "global",
});

// 🔒 Booking limit: 2 reqs / 5 mins
export const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(2, "300 s"),
  analytics: true,
  prefix: "bookme",
});

// 🚨 Stripe-safe default limiter
export async function secureRatelimit(req: Request) {
  const ip = getIP(req);
  const isStripeWebhook =
    req.url.includes("/api/webhooks/stripe") &&
    req.headers.get("stripe-signature");

  if (isStripeWebhook) {
    return { success: true };
  }

  return await defaultRateLimit.limit(ip);
}

// 🛡️ Revised country-aware, IP-priority limiter with soft sinkhole
export async function countryAwareRateLimit(
  req: Request,
  maxIPHits = 100, // Allow 100 hits per IP...
  ipWindowSec = 30, // ...every 30 seconds
  logCountryHits = true, // but we’ll just observe the country-wide patterns
) {
  const ip = getIP(req);
  const country = req.headers.get("cf-ipcountry") ?? "XX";
  const now = Math.floor(Date.now() / ipWindowSec);

  const ipKey = `quota:ip:${ip}:${now}`;
  const ipCount = await redis.incr(ipKey);
  await redis.expire(ipKey, ipWindowSec + 5);

  const isIPLimited = ipCount > maxIPHits;

  // 🚨 Soft sinkhole for light abuse
  if (isIPLimited) {
    const strikeKey = `softstrike:${ip}`;
    const strikes = await redis.incr(strikeKey);
    await redis.expire(strikeKey, 900); // 15 min decay

    const delay = 1000 + (strikes - 1) * 300; // 1s base + 0.3s per strike

    // Optional: block if it’s really sketch
    if (strikes >= 25) {
      await redis.setex(`block:ip:${ip}`, 86400, "1"); // 1 day block
    }

    await logAbuseToSupabase(ip, country, strikes, req, "ip_soft_limit");

    await new Promise((res) => setTimeout(res, delay));
  }

  // 🧾 Just log country quota bursts (no banning)
  if (logCountryHits) {
    const countryKey = `log:country:${country}:${now}`;
    await redis.incr(countryKey);
    await redis.expire(countryKey, ipWindowSec + 2);
  }

  const isBlocked = await redis.get(`block:ip:${ip}`);

  return {
    blocked: Boolean(isBlocked),
  };
}

async function logAbuseToSupabase(
  ip: string,
  country: string,
  strikes: number,
  req: Request,
  reason: string,
): Promise<void> {
  const userAgent: string = req.headers.get("user-agent") || "unknown";

  await supabaseAdmin.from("bot_breaches").insert({
    ip_address: ip,
    country,
    user_agent: userAgent,
    reason,
    strike_count: strikes,
    burst_count: 0,
  });
}

// 🧠 Extract IP
export function getIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export async function banIfInvalid(
  req: Request,
  isInvalid: boolean,
  reason: string,
) {
  if (!isInvalid) return false; // nothing to ban

  const ip = getIP(req);
  const banKey = `block:ip:${ip}`;
  const strikes = await redis.incr(banKey);

  if (strikes === 1) {
    await redis.expire(banKey, 60 * 60); // 1 hour timeout for first strike
  }

  if (strikes >= 3) {
    await redis.set(banKey, "banned");
    await redis.expire(banKey, 60 * 60 * 24 * 7); // 1 week ban
    console.warn(`🚫 IP ${ip} permabanned for: ${reason}`);
  }

  return true;
}

export async function recordBundlePurchases(order: any) {
  try {
    const bundleData = order.metadata?.bundle;

    if (!bundleData || !bundleData.bundle_id) {
      console.log("No bundle data found for order", order.id);
      return;
    }

    // Start a transaction to ensure data consistency
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from("bundle_purchases")
      .insert({
        bundle_id: bundleData.bundle_id,
        user_id: order.user_id,
        order_id: order.id,
        quantity: 1, // One bundle per order
        price_paid: bundleData.discounted_total,
        savings_amount: bundleData.savings,
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
