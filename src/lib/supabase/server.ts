// /lib/supabase/server.ts - App Router version (CORRECT FOR YOUR PROJECT)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface CacheEntry {
  client: ReturnType<typeof createServerClient>;
  timestamp: number;
}

interface CookieData {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

interface CookieOptions {
  getAll(): CookieData[];
  setAll(cookiesToSet: CookieData[]): void;
}

const clientCache: Map<string, CacheEntry> = new Map<string, CacheEntry>();
const CACHE_TTL: number = 5000; // 5 seconds

export async function createClient(): Promise<ReturnType<typeof createServerClient>> {
  const cookieStore = await cookies();

  // Create a cache key based on cookies
  const cookieString: string = cookieStore
    .getAll()
    .map((c): string => `${c.name}=${c.value}`)
    .sort()
    .join(";");
  const cacheKey: string = `client_${cookieString}`;

  // Return cached client if valid
  const cached: CacheEntry | undefined = clientCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.client;
  }

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll(): CookieData[] {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieData[]): void {
          try {
            cookiesToSet.forEach(({ name, value, options }: CookieData): void => {
              cookieStore.set(name, value, options);
            });
          } catch (error: unknown) {
            // Handle error - cookies can't be set in some server contexts
          }
        },
      },
      auth: {
        autoRefreshToken: false,
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
    const cutoff: number = Date.now() - 30000; // 30 seconds
    for (const [key, value] of clientCache.entries()) {
      if (value.timestamp < cutoff) {
        clientCache.delete(key);
      }
    }
  }

  return client;
}