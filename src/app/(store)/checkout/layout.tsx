// app/checkout/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Checkout | Northwind Systems",
    template: "%s | Checkout",
  },
  description:
    "Secure checkout process for Northwind Systems. Earn loyalty points on every purchase. Multiple payment options including M-Pesa, credit cards, and Lipa Pole Pole financing. Points can be redeemed for discounts.",
  keywords: [
    "secure checkout",
    "loyalty points checkout",
    "points redemption",
    "M-Pesa payment",
    "credit card payment",
    "order confirmation",
    "payment processing",
    "earn points on purchase",
    "redeem points discount",
    "engagement platform checkout",
  ],
  robots: {
    index: false, // Don't index checkout pages
    follow: true,
    googleBot: {
      index: false,
      follow: true,
      noimageindex: true,
    },
  },
  authors: [{ name: "Northwind Systems" }],
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://ns.yunobase.com/checkout",
    title: "Checkout | Northwind Systems",
    description:
      "Complete your purchase securely and earn loyalty points redeemable for discounts across all 5 engagement modules.",
    siteName: "Northwind Systems",
  },
  twitter: {
    card: "summary",
    title: "Checkout | Northwind Systems",
    description: "Secure checkout. Earn points on every purchase.",
  },
  alternates: {
    canonical: "/checkout",
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">{children}</main>
  );
}
