import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard | Samma Shop",
    template: "%s | Admin | Samma Shop",
  },
  description: "Admin dashboard for Samma Shop.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
