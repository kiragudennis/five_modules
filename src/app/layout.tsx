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
    default: "Finest Shop | Premium Apparel Demo",
    template: "%s | Finest Shop Demo",
  },
  description:
    "An example e-commerce store showcasing modern shopping features. This demo includes product catalog, cart functionality, and checkout process.",
  keywords: [
    "e-commerce demo",
    "online shop example",
    "apparel store",
    "shopping cart",
  ],

  // Social media example
  openGraph: {
    title: "Finest Shop | An Online Store Example",
    description: "A modern e-commerce shop demonstration",
    type: "website",
    images: ["/images/demo-store-preview.jpg"],
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
