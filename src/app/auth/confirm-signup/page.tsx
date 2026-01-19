// app/auth/confirm-signup/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";

export default function ConfirmSignupPage() {
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<"validating" | "success" | "error">(
    "validating",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const processedRef = useRef(false);

  useEffect(() => {
    const handleMagicLink = async () => {
      // Don't proceed if we already processed
      if (processedRef.current) return;

      // If we already have a profile, redirect immediately
      if (profile?.role) {
        const role = profile.role === "admin" ? "/admin" : "/products";
        processedRef.current = true;
        setIsLoading(false);
        router.push(role);
        return;
      }

      try {
        toast.loading("Verifying your account...");

        // Check if this is a magic link
        const hash = window.location.hash.substring(1);
        if (!hash) {
          // Not a magic link, redirect to home
          toast.dismiss();
          router.push("/");
          return;
        }

        // Parse the hash
        const params = new URLSearchParams(hash);
        const type = params.get("type");
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        // Validate magic link
        if (type !== "magiclink" || !access_token) {
          throw new Error("Invalid or expired confirmation link");
        }

        // Set session
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || "",
        });

        if (sessionError) throw sessionError;

        // IMPORTANT: Get the user after setting session
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("User not found");
        }

        // Update email_verified in the users table
        const { error: updateError } = await supabase
          .from("users")
          .update({
            email_verified: true,
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id); // Use user.id from getUser()

        if (updateError) throw updateError;

        processedRef.current = true;
        setStatus("success");
        toast.dismiss();
        toast.success(
          "Email confirmed successfully! Welcome to Blessed Two Electronics!",
        );

        // Small delay to ensure everything is processed
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Redirect
        const role = profile?.role === "admin" ? "/admin" : "/products";
        router.push(role);
      } catch (err: any) {
        console.error("Magic link confirmation error:", err);
        setStatus("error");
        setErrorMessage(err.message || "Failed to confirm your email");
        toast.dismiss();
        toast.error(
          "Confirmation failed. Please try again or contact support.",
        );

        // Option 1: Redirect to error page
        router.push("/auth/error");

        // Option 2: Show error on same page
        // setErrorMessage(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    handleMagicLink();
  }, [supabase, profile]); // Use supabase, not supabase.auth

  // Loading state
  if (isLoading || status === "validating") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <CardTitle>Confirming Your Email</CardTitle>
            <CardDescription>
              Please wait while we verify your email address...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-2">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Email Confirmed Successfully!</CardTitle>
            <CardDescription>
              Your email has been verified. Redirecting you to complete your
              profile...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-2">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle>Confirmation Failed</CardTitle>
          <CardDescription>
            {errorMessage || "The confirmation link is invalid or has expired."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please request a new confirmation link or contact support if the
            problem persists.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
