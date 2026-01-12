// app/tracking/[trackingNumber]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import TrackingPage from "@/components/tracking-page";
import { supabaseAdmin } from "@/lib/supabase/admin";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.blessedtwo.com";

async function getTrackingData(trackingNumber: string) {
  try {
    // Get orders with this tracking number
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        order_items(
          *,
          products(*)
        ),
        transactions(*)
      `
      )
      .eq("tracking_number", trackingNumber)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tracking data:", error);
      return null;
    }

    // Get tracking history
    const { data: trackingHistory } = await supabaseAdmin
      .from("tracking_history")
      .select("*")
      .eq("tracking_number", trackingNumber)
      .order("created_at", { ascending: false });

    return {
      orders: orders || [],
      trackingHistory: trackingHistory || [],
    };
  } catch (error) {
    console.error("Error in getTrackingData:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trackingNumber: string }>;
}): Promise<Metadata> {
  try {
    const { trackingNumber } = await params;

    return {
      title: `Track Your Order #${trackingNumber} | Blessed Two Electronics`,
      description: `Track your Blessed Two Electronics order with tracking number ${trackingNumber}. Get real-time updates on your shipment.`,
      openGraph: {
        title: `Track Order #${trackingNumber}`,
        description: `Track your Blessed Two Electronics shipment`,
        type: "website",
        siteName: "Blessed Two Electronics",
      },
      twitter: {
        card: "summary",
        title: `Track Order #${trackingNumber}`,
        description: `Track your Blessed Two Electronics shipment`,
      },
    };
  } catch {
    return {
      title: "Track Your Order | Blessed Two Electronics",
      description: "Track your shipment from Blessed Two Electronics",
    };
  }
}

export default async function TrackingDetailPage({
  params,
}: {
  params: Promise<{ trackingNumber: string }>;
}) {
  const { trackingNumber } = await params;
  const data = await getTrackingData(trackingNumber);

  if (!data || data.orders.length === 0) {
    notFound();
  }

  return <TrackingPage trackingData={data} trackingNumber={trackingNumber} />;
}
