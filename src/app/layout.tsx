import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/context/AuthContext";
import { StoreProvider } from "@/lib/context/StoreContext";
import { Toaster } from "sonner";
import { GlobalLoader } from "@/components/GlobalLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Blessed Two Electronics | Quality Lighting Solutions Nairobi",
    template: "%s | Blessed Two Electronics Nairobi",
  },
  description:
    "Nairobi's premier lighting solutions provider. Shop premium LED bulbs, solar lighting, security lights, smart lighting systems, and commercial lighting with 2-year warranty, same-day delivery, and professional installation.",
  keywords: [
    "LED bulbs Nairobi",
    "solar lighting Kenya",
    "security lights installation",
    "smart lighting systems",
    "commercial lighting solutions",
    "lighting store Duruma Road",
    "energy saving lights",
    "professional lighting installation",
    "2-year warranty lighting",
    "Nairobi lighting solutions",
    "electric lighting products",
    "lighting fixtures Kenya",
  ],
  authors: [
    {
      name: "Blessed Two Electronics",
      url: "https://www.blessedtwoelectronics.com",
    },
  ],
  creator: "Blessed Two Electronics",
  publisher: "Blessed Two Electronics",
  formatDetection: {
    email: false,
    address: false,
    telephone: true,
  },
  metadataBase: new URL("https://www.blessedtwoelectronics.com"),
  alternates: {
    canonical: "/",
    languages: {
      "en-KE": "/",
      "sw-KE": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://www.blessedtwoelectronics.com",
    siteName: "Blessed Two Electronics",
    title: "Blessed Two Electronics | Premium Lighting Solutions Nairobi",
    description:
      "Nairobi's trusted lighting solutions provider offering quality LED bulbs, solar lighting, security systems, and professional installation services.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Blessed Two Electronics - Quality Lighting Solutions in Nairobi",
      },
      {
        url: "/og-image-products.jpg",
        width: 1200,
        height: 630,
        alt: "LED Bulbs, Solar Lighting & Security Lights in Nairobi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blessed Two Electronics | Lighting Solutions Nairobi",
    description:
      "Quality lighting solutions with 2-year warranty, same-day delivery, and professional installation in Nairobi.",
    creator: "@blessedtwo",
    site: "@blessedtwo",
    images: ["/twitter-image.jpg"],
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
  category: "Electronics & Lighting",
  other: {
    "theme-color": "#1e40af",
    "msapplication-TileColor": "#1e40af",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Blessed Two Electronics",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Basic favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />

        {/* Modern browsers */}
        <link
          rel="icon"
          href="/favicon-32x32.png"
          type="image/png"
          sizes="32x32"
        />
        <link
          rel="icon"
          href="/favicon-16x16.png"
          type="image/png"
          sizes="16x16"
        />

        {/* Apple Touch Icon */}
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          type="image/png"
          sizes="180x180"
        />

        {/* Android Chrome */}
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <StoreProvider>
              <div className="flex flex-col min-h-screen w-full">
                <Header />
                <main className="flex-grow">
                  {children}
                  <GlobalLoader /> {/* shows on every route transition */}
                  <Toaster position="top-right" richColors closeButton />
                </main>
                <Footer />
              </div>
            </StoreProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
