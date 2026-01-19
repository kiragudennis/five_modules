// app/categories/layout.tsx
import { Metadata } from "next";
export const metadata: Metadata = {
  title: {
    default: "Lighting Categories | Blessed Two Electronics Nairobi",
    template: "%s Lighting | Categories",
  },
  description:
    "Browse our complete range of lighting categories including LED bulbs, solar lighting, security lights, smart lighting, and commercial lighting solutions in Nairobi.",
  keywords: [
    "LED bulbs categories",
    "solar lighting categories",
    "security lights types",
    "smart lighting categories",
    "commercial lighting",
    "lighting solutions Nairobi",
    "electrical products categories",
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
    url: "https://www.blessedtwo.com/categories",
    title: "Lighting Categories | Blessed Two Electronics",
    description:
      "Browse all lighting categories and solutions available at Blessed Two Electronics.",
    images: [
      {
        url: "/categories/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Lighting Categories at Blessed Two Electronics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lighting Categories | Blessed Two Electronics",
    description:
      "Complete range of lighting solutions categorized for easy browsing.",
    images: ["/categories/twitter-image.jpg"],
  },
  alternates: {
    canonical: "/categories",
  },
};

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main>{children}</main>;
}
