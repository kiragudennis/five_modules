// /lib/supabase/middleware-simple.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function createMiddlewareSupabaseClient(request: Request) {
  const cookieStore = await cookies();
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              httpOnly: true,
            });
          });
        },
      },
      auth: {
        autoRefreshToken: false, // THIS IS THE KEY FIX
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );
}
