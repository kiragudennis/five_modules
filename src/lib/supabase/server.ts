// /lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cache to prevent recreating clients
const clientCache = new Map<
  string,
  {
    client: ReturnType<typeof createServerClient>;
    timestamp: number;
  }
>();

const CACHE_TTL = 5000; // 5 seconds

export async function createClient() {
  const cookieStore = await cookies();

  // Create a cache key based on cookies
  const cookieString = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .sort()
    .join(";");
  const cacheKey = `client_${cookieString}`;

  // Return cached client if valid
  const cached = clientCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.client;
  }

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use ANON_KEY for most operations
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Ignore - cookies can't be set in some server contexts
          }
        },
      },
      auth: {
        autoRefreshToken: false, // CRITICAL: Disable auto-refresh
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );

  // Cache the client
  clientCache.set(cacheKey, {
    client,
    timestamp: Date.now(),
  });

  // Clean up old cache entries periodically
  if (clientCache.size > 50) {
    const cutoff = Date.now() - 30000; // 30 seconds
    for (const [key, value] of clientCache.entries()) {
      if (value.timestamp < cutoff) {
        clientCache.delete(key);
      }
    }
  }

  return client;
}
