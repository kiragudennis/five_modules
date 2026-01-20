import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    await supabase
      .from("users")
      .update({
        last_login: new Date().toISOString(),
      })
      .eq("id", data.user.id);

    return NextResponse.redirect(new URL("/admin", request.url));
  } catch (err) {
    console.error("Error in auth callback:", err);
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", request.url),
    );
  }
}
