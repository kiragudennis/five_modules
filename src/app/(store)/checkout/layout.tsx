// app/checkout/layout.tsx
import { Metadata } from "next";
export const metadata: Metadata = {
  title: {
    default: "Checkout | Blessed Two Electronics",
    template: "%s | Checkout",
  },
  description:
    "Secure checkout process for Blessed Two Electronics lighting products. Multiple payment options including M-Pesa, credit cards, and Lipa Pole Pole financing.",
  keywords: [
    "checkout lighting products",
    "secure payment Nairobi",
    "M-Pesa checkout",
    "lighting purchase",
    "order confirmation",
    "payment processing",
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
  authors: [{ name: "Blessed Two Electronics" }],
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://www.blessedtwo.com/checkout",
    title: "Checkout | Blessed Two Electronics",
    description:
      "Complete your lighting purchase securely with multiple payment options.",
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
  return <main>{children}</main>;
}
