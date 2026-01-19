import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Blessed Two Electronics Nairobi",
  description:
    "Sign in to access your account, enjoy exclusive coupons, loyalty rewards, daily deals, and premium lighting offers.",
  keywords: [
    "login blessed two",
    "account access Nairobi",
    "lighting coupons Kenya",
    "loyalty program lighting",
    "daily lighting deals",
    "exclusive offers lighting",
    "member discounts Nairobi",
    "premium lighting account",
  ],
  openGraph: {
    title: "Login | Blessed Two Electronics Nairobi",
    description:
      "Sign in to access exclusive coupons, loyalty rewards, daily deals, and premium lighting offers with 2-year warranty.",
    url: "https://www.blessedtwo.com/login",
    siteName: "Blessed Two Electronics",
    images: [
      {
        url: "/og-login.jpg", // You should create this image
        width: 1200,
        height: 630,
        alt: "Login to Blessed Two Electronics - Exclusive Lighting Offers",
      },
    ],
    type: "website",
    locale: "en_KE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Login | Blessed Two Electronics",
    description:
      "Access exclusive coupons, loyalty rewards & daily lighting deals. Sign in to your account.",
    images: ["/twitter-login.jpg"], // Create this image
  },
  robots: {
    index: true, // Typically login pages shouldn't be indexed
    follow: false,
  },
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <main>{children}</main>
    </div>
  );
}
