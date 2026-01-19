import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard | Blessed Two Electronics",
    template: "%s | Admin Dashboard",
  },
  description:
    "Administrative dashboard for managing Blessed Two Electronics lighting products, orders, customers, and inventory.",
  keywords: [
    "admin dashboard",
    "inventory management",
    "order management",
    "customer management",
    "lighting products admin",
    "business dashboard",
  ],
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "none",
      "max-snippet": -1,
    },
  },
  authors: [{ name: "Blessed Two Electronics" }],
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://www.blessedtwo.com/admin",
    title: "Admin Dashboard | Blessed Two Electronics",
    description:
      "Administrative dashboard for managing lighting business operations.",
  },
  alternates: {
    canonical: "/admin",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
