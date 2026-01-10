import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    const params = new URLSearchParams({
      error,
      error_description: errorDescription || "",
    });
    return NextResponse.redirect(new URL(`error?${params}`, request.url));
  }

  const supabase = await createClient();

  try {
    if (!code) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;

    const session = data.session;
    const user = session?.user;
    if (!user) return NextResponse.redirect(new URL("/login", request.url));

    // 🔍 Check if they have a profile
    const { data: profile } = await supabase
      .from("users_profile")
      .select("admission_no, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      console.log(
        `🧹 No profile found for ${user.email}, deleting ghost user...`
      );

      try {
        // 🚨 Delete ghost from auth.users
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        console.log(`Deleted ghost auth user: ${user.email}`);
      } catch (adminErr) {
        console.error("Failed to delete ghost user:", adminErr);
      }

      // Redirect to onboarding
      await supabase.auth.signOut();
      const onboardingUrl = new URL("/login", request.url);
      onboardingUrl.searchParams.set(
        "error",
        "No account found with this email. Please sign up first."
      );
      onboardingUrl.searchParams.set("email", user.email || "");
      return NextResponse.redirect(onboardingUrl);
    }

    // ✅ Profile exists — continue
    const role = profile.role;

    const redirectPage = role === "admin" ? `/admin` : `/products`;

    return NextResponse.redirect(new URL(redirectPage, request.url));
  } catch (err) {
    console.error("Error in auth callback:", err);
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", request.url)
    );
  }
}
