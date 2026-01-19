// app/contact/layout.tsx
import { Metadata } from "next";
export const metadata: Metadata = {
  title: {
    default: "Contact Us | Blessed Two Electronics Nairobi",
    template: "%s | Contact",
  },
  description:
    "Get in touch with Blessed Two Electronics for lighting solutions, technical support, bulk orders, and professional installation services in Nairobi and across Kenya.",
  keywords: [
    "contact Blessed Two Electronics",
    "lighting solutions Nairobi",
    "technical support lighting",
    "bulk order lighting",
    "installation services",
    "Duruma Road contact",
    "electrician consultation",
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
    url: "https://www.blessedtwo.com/contact",
    title: "Contact Blessed Two Electronics | Lighting Solutions Nairobi",
    description:
      "Contact our lighting experts for consultations, technical support, and installation services.",
    images: [
      {
        url: "/contact/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Contact Blessed Two Electronics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Blessed Two Electronics",
    description: "Get expert lighting advice and support from our team.",
    images: ["/contact/twitter-image.jpg"],
  },
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main>{children}</main>;
}
