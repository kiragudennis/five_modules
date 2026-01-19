// app/(store)/about/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Blessed Two Electronics | Nairobi's Premier Lighting Solutions",
  description:
    "Discover Blessed Two Electronics - Nairobi's leading lighting solutions provider since 2018. Premium LED bulbs, solar lighting, security systems & professional installation services at Duruma Road.",
  keywords: [
    "About Blessed Two Electronics",
    "lighting company Nairobi",
    "LED lighting experts",
    "solar lighting solutions",
    "security lighting specialists",
    "lighting store Duruma Road",
    "electric lighting solutions Kenya",
  ],
  openGraph: {
    title: "About Blessed Two Electronics | Quality Lighting Nairobi",
    description:
      "Nairobi's premier lighting destination providing energy-efficient lighting solutions since 2018.",
    images: [
      {
        url: "/about/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "About Blessed Two Electronics - Lighting Experts Nairobi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Blessed Two Electronics",
    description:
      "Your trusted partner for quality lighting solutions in Nairobi since 2018.",
    images: ["/about/twitter-image.jpg"],
  },
  alternates: {
    canonical: "/about",
  },
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
};

export default function AboutPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main>{children}</main>;
}
