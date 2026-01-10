import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Samma Shop",
    template: "%s | Samma Shop",
  },
  description: "Quality martial arts gear for every practitioner.",
};

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
