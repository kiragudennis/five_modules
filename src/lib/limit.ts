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
const bookingPageRateLimit = new Ratelimit({
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

// 🔐 Booking limiter
export async function secureBookingRateLimit(req: Request) {
  const ip = getIP(req);
  return await bookingPageRateLimit.limit(ip);
}

// 🛡️ Revised country-aware, IP-priority limiter with soft sinkhole
export async function countryAwareRateLimit(
  req: Request,
  maxIPHits = 100, // Allow 100 hits per IP...
  ipWindowSec = 30, // ...every 30 seconds
  logCountryHits = true // but we’ll just observe the country-wide patterns
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
  reason: string
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
  reason: string
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
