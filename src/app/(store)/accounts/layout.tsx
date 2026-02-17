import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "My Account | Blessed Two Electronics",
    template: "%s | My Account",
  },
  description:
    "Manage your account, view orders, track loyalty points, and update preferences at Blessed Two Electronics.",
  keywords: [
    "customer account",
    "order history",
    "track orders",
    "loyalty points",
    "profile management",
    "customer dashboard",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  authors: [{ name: "Blessed Two Electronics" }],
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://www.blessedtwoelectronics.com/accounts",
    title: "My Account | Blessed Two Electronics",
    description: "Manage your lighting purchases, orders, and loyalty rewards.",
  },
  alternates: {
    canonical: "/accounts",
  },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main>{children}</main>;
}
