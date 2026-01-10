import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Finest Uniform Store",
  description:
    "Sign in to access your account and explore exclusive uniform offers.",
  openGraph: {
    title: "Login | Finest Uniform Store",
    description: "Join our store to access exclusinve uniform offers",
    url: "/login",
    siteName: "store.worldsamma.org",
    images: [
      {
        url: "/ownyourbrand.jpg",
        width: 1200,
        height: 630,
        alt: "Finest Uniform Store Login",
      },
    ],
    type: "website",
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
