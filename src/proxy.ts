import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";
import { supabaseAdmin } from "./lib/supabase/admin";
import { createMiddlewareSupabaseClient } from "./lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip certain file types
  const assets = path.match(/\.(png|jpg|jpeg|webp|svg|ico|json|txt)$/);

  // ✅ Skip safe/static/API routes
  if (
    path.startsWith("/auth") ||
    path.startsWith("/_next") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/api/webhook") ||
    path === "/auth/callback" ||
    assets
  ) {
    return NextResponse.next();
  }
  // Parse user agent
  const parser = new UAParser(request.headers.get("user-agent") || "");
  const userAgent = parser.getResult();

  // 🚫 Block non-SEO bots
  const isBot =
    /bot|crawler|spider|crawling/i.test(userAgent.ua ?? "") &&
    !/Googlebot|bingbot|slurp|DuckDuckBot|Baiduspider/i.test(
      userAgent.ua ?? ""
    );

  if (isBot) {
    console.log("Blocked non-SEO bot:", userAgent);
    return NextResponse.next(); // let them pass but don't track
  }

  const res = NextResponse.next();
  const supabase = await createMiddlewareSupabaseClient(request);

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    const isProtectedRoute = path.startsWith("/admin");

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirectedFrom", path);
      return NextResponse.redirect(redirectUrl);
    }

    // Restrict non-creators from accessing dashboard
    if (isProtectedRoute && user) {
      // 🔍 Get user role + profile.username in one shot
      const { data: userData } = await supabaseAdmin
        .from("users_profile")
        .select(`role`)
        .eq("id", user.id)
        .single();

      const userRole = userData?.role;

      if (userRole !== "admin") {
        return NextResponse.redirect(new URL("/products", request.url));
      }
    }

    const pageView = {
      path: path,
      user_id: user?.id,
    };

    await supabaseAdmin.from("page_views").insert(pageView);
  } catch (error) {
    console.error("Middleware error:", error);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|json|txt)).*)",
  ],
};
