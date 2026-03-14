// app/(store)/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Blessed Two Electricals - Quality Lighting Solutions Nairobi",
    template: "%s | Blessed Two Electricals Nairobi",
  },
  description:
    "Leading lighting solutions provider in Nairobi offering LED bulbs, solar lighting, security lights, smart lighting systems, and professional installation services. Shop quality electrical products with 2-year warranty and same-day delivery.",
  keywords: [
    "LED bulbs Nairobi",
    "solar lighting Kenya",
    "security lights",
    "smart lighting systems",
    "electrical products Nairobi",
    "lighting solutions",
    "Duruma Road Electricals",
    "professional installation",
    "energy saving lights",
    "commercial lighting",
  ],
  authors: [{ name: "Blessed Two Electricals" }],
  creator: "Blessed Two Electricals",
  publisher: "Blessed Two Electricals",
  formatDetection: {
    email: false,
    address: false,
    telephone: true,
  },
  metadataBase: new URL("https://www.blessedtwoElectricals.com"),
  alternates: {
    canonical: "/",
    languages: {
      "en-KE": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://www.blessedtwoelectricals.com",
    title: "Blessed Two Electricals - Premium Lighting Solutions",
    description:
      "Your trusted partner for quality lighting solutions in Nairobi. LED bulbs, solar systems, security lights, and professional installation.",
    siteName: "Blessed Two Electricals",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Blessed Two Electricals - Lighting Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blessed Two Electricals - Quality Lighting Nairobi",
    description:
      "LED bulbs, solar lighting, security systems & professional installation in Nairobi.",
    images: ["/twitter-image.jpg"],
    creator: "@blessedtwoElectricals",
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
  category: "Electricals",
};

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      {/* Structured Data for Local Business */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Blessed Two Electricals",
            image: "https://www.blessedtwoelectricals.com/logo.jpg",
            "@id": "https://www.blessedtwoelectricals.com",
            url: "https://www.blessedtwoelectricals.com",
            telephone: "+254727833691",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Duruma Road",
              addressLocality: "Nairobi",
              addressRegion: "Nairobi",
              addressCountry: "KE",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: -1.286389,
              longitude: 36.817223,
            },
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ],
                opens: "08:00",
                closes: "18:00",
              },
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: "Sunday",
                opens: "10:00",
                closes: "16:00",
              },
            ],
            priceRange: "KES 200 - KES 500,000",
            description:
              "Leading lighting solutions provider in Nairobi offering LED bulbs, solar lighting, security lights, and professional installation services.",
            sameAs: [
              "https://www.tiktok.com/@blessed_2_electricals",
              "https://www.facebook.com/blessedtwoelectricals",
              "https://www.instagram.com/blessedtwoelectricals",
              "https://twitter.com/blessedtwoelectricals",
            ],
          }),
        }}
      />

      {/* Structured Data for Website */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Blessed Two Electricals",
            url: "https://blessedtwoelectricals.com",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate:
                  "https://blessedtwoelectricals.com/search?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      {children}
    </main>
  );
}
