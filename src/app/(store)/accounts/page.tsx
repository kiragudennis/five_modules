// app/accounts/page.tsx (Admin view)
"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";

import { redirect } from "next/navigation";

export default function AccountsPage() {
  const { profile } = useAuth();
  useEffect(() => {
    if (profile) {
      redirect(`/accounts/${profile?.id}`);
    } else {
      redirect("/login");
    }
  }, [profile]);

  return null;
}
