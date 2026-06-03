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
import { StreakTrackerProvider } from "@/components/challenges/providers/StreakTrackProvider";

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
    default: "Northwind Systems - Enterprise Engagement Suite",
    template: "%s | Northwind Systems",
  },
  description:
    "Complete e-commerce system with 5 gamified engagement modules. Build customer loyalty with Spin Wheel, Live Challenges, Lucky Draws, Mystery Bundles, and Flash Deals — all integrated with real-time broadcast displays and unified points economy.",
  keywords: [
    "Northwind Systems",
    "e-commerce engagement platform",
    "customer retention software",
    "gamified e-commerce",
    "live shopping platform",
    "loyalty program software",
    "customer engagement modules",
    "spin to win ecommerce",
    "live trivia shopping",
    "mystery bundles ecommerce",
    "flash deals platform",
    "points loyalty system",
    "community building platform",
    "enterprise e-commerce",
    "customer acquisition tools",
  ],
  authors: [
    {
      name: "Northwind Systems",
      url: "https://ns.yunobase.com",
    },
  ],
  creator: "Northwind Systems",
  publisher: "Northwind Systems",
  formatDetection: {
    email: false,
    address: false,
    telephone: true,
  },
  metadataBase: new URL("https://ns.yunobase.com"),
  alternates: {
    canonical: "/",
    languages: {
      "en-KE": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://ns.yunobase.com",
    siteName: "Northwind Systems",
    title: "Northwind Systems | Build Customer Community Through Engagement",
    description:
      "Complete e-commerce system with 5 engagement modules that transform casual buyers into loyal brand advocates. Real-time broadcasts, points economy, and live community building.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Northwind Systems - Enterprise Engagement Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Northwind Systems | Engagement-First E-commerce",
    description:
      "Spin wheels, live challenges, lucky draws, mystery bundles, and flash deals. All integrated with your checkout and loyalty points system.",
    creator: "@northwind",
    site: "@northwind",
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
  category: "E-commerce Platform",
  other: {
    "theme-color": "#2563eb",
    "msapplication-TileColor": "#2563eb",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Northwind Systems",
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
            <StreakTrackerProvider>
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
            </StreakTrackerProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
