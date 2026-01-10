"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { use } from "react";
export default function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { profile } = useAuth();
  const { orderId } = use(searchParams);
  const router = useRouter();

  useEffect(() => {
    const checkout = async () => {
      if (!profile) {
        toast.info("Haven't logged in yet, redirecting to login...");
        return router.push("/login");
      }

      if (!orderId) return router.push("/products");

      const res = await fetch("/api/checkout/paypal/retrial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Failed to create session:", data);
      }
    };

    checkout();
  }, [orderId, router, profile]);

  return (
    <div className="p-8 text-center">
      <p>Redirecting to payment...</p>
    </div>
  );
}
