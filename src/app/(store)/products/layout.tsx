// app/products/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Lighting Products | Blessed Two Electricals Nairobi",
    template: "%s | Lighting Products",
  },
  description:
    "Browse our complete collection of quality lighting products including LED bulbs, solar lighting, security lights, smart lighting systems, and commercial lighting solutions in Nairobi.",
  keywords: [
    "LED bulbs Nairobi",
    "solar lighting Kenya",
    "security lights",
    "smart lighting",
    "commercial lighting",
    "lighting products",
    "energy saving lights",
    "Duruma Road lighting",
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
  authors: [{ name: "Blessed Two Electricals" }],
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://www.blessedtwoelectricals.com/products",
    title: "Lighting Products | Blessed Two Electricals",
    description:
      "Complete range of quality lighting solutions for homes, businesses, and industries in Nairobi.",
    images: [
      {
        url: "/products/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Lighting Products Collection - Blessed Two Electricals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lighting Products | Blessed Two Electricals",
    description: "Quality lighting solutions for every need in Nairobi.",
    images: ["/products/twitter-image.jpg"],
  },
  alternates: {
    canonical: "/products",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Lighting Products Collection",
            description:
              "Complete collection of lighting products at Blessed Two Electricals",
            url: "https://www.blessedtwoelectricals.com/products",
            mainEntity: {
              "@type": "ItemList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  item: {
                    "@type": "Product",
                    name: "LED Bulbs",
                    url: "https://www.blessedtwoelectricals.com/category/led-bulbs",
                  },
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  item: {
                    "@type": "Product",
                    name: "Solar Lighting",
                    url: "https://www.blessedtwoelectricals.com/category/solar-lighting",
                  },
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  item: {
                    "@type": "Product",
                    name: "Security Lights",
                    url: "https://www.blessedtwoelectricals.com/category/security-lights",
                  },
                },
                {
                  "@type": "ListItem",
                  position: 4,
                  item: {
                    "@type": "Product",
                    name: "Smart Lighting",
                    url: "https://www.blessedtwoelectricals.com/category/smart-lighting",
                  },
                },
              ],
            },
          }),
        }}
      />
      {children}
    </main>
  );
}
