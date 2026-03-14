import { Metadata } from "next";
import { notFound } from "next/navigation";
import TrackingPage from "@/components/tracking-page";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function getTrackingData(trackingNumber: string) {
  try {
    // Get orders with this tracking number using new structure
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        items:order_items(
          id,
          product_id,
          product_name,
          product_title,
          product_sku,
          product_category,
          product_image,
          unit_price,
          wholesale_price,
          wholesale_min_quantity,
          has_wholesale,
          applied_price,
          quantity,
          total_price,
          metadata,
          created_at
        )
      `,
      )
      .eq("tracking_number", trackingNumber)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tracking data:", error);
      return null;
    }

    // Get tracking history if you have a tracking_history table
    // If not, we can use order status updates from metadata or a separate table
    let trackingHistory = [];

    try {
      const { data: historyData } = await supabaseAdmin
        .from("tracking_history")
        .select("*")
        .eq("tracking_number", trackingNumber)
        .order("created_at", { ascending: false });

      trackingHistory = historyData || [];
    } catch (historyError) {
      console.log("No tracking_history table or error:", historyError);

      // Fallback: Use order metadata for tracking updates if available
      if (orders && orders.length > 0 && orders[0].metadata?.status_updates) {
        trackingHistory = orders[0].metadata.status_updates.map(
          (update: any, index: number) => ({
            id: `update-${index}`,
            status: update.to || update.status,
            description: update.notes || `Status changed to ${update.to}`,
            location: update.location || "Nairobi Warehouse",
            created_at: update.at || new Date().toISOString(),
          }),
        );
      }
    }

    // Also get transactions for payment info
    const orderIds = orders?.map((order) => order.id) || [];
    let transactions: any[] = [];

    if (orderIds.length > 0) {
      const { data: txData } = await supabaseAdmin
        .from("transactions")
        .select("*")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false });

      transactions = txData || [];
    }

    return {
      orders: orders || [],
      trackingHistory: trackingHistory,
      transactions: transactions,
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
      title: `Track Your Order - ${trackingNumber} | Blessed Two Electricals`,
      description: `Track your Blessed Two Electricals order with tracking number ${trackingNumber}. Get real-time updates on your shipment.`,
      openGraph: {
        title: `Track Order #${trackingNumber}`,
        description: `Track your Blessed Two Electricals shipment`,
        type: "website",
        siteName: "Blessed Two Electricals",
      },
      twitter: {
        card: "summary",
        title: `Track Order #${trackingNumber}`,
        description: `Track your Blessed Two Electricals shipment`,
      },
    };
  } catch {
    return {
      title: "Track Your Order | Blessed Two Electricals",
      description: "Track your shipment from Blessed Two Electricals",
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
