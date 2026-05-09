// app/bundles/live/[bundleId]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { LiveDisplayShell } from "@/components/live/live-display-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/context/AuthContext";
import { usePolling } from "@/hooks/usePolling";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

type BundleRow = {
  id: string;
  name: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  current_purchases: number;
  total_purchases_allowed: number | null;
  products: { product_id: string; quantity: number }[];
};

type LiveConfigRow = {
  bundle_type: "mystery" | "tiered" | "build_your_own";
  is_mystery_revealed: boolean;
  live_stock_total: number;
  live_stock_claimed: number;
};

export default function BundleLivePage() {
  const { bundleId } = useParams<{ bundleId: string }>();
  const { supabase } = useAuth();
  const [bundle, setBundle] = useState<BundleRow | null>(null);
  const [liveConfig, setLiveConfig] = useState<LiveConfigRow | null>(null);
  const [claims, setClaims] = useState<string[]>([]);
  const [productNames, setProductNames] = useState<string[]>([]);

  const load = async () => {
    const [{ data: b }, { data: cfg }, { data: claimRows }] = await Promise.all([
      supabase.from("mistry_bundles").select("*").eq("id", bundleId).single(),
      supabase
        .from("bundle_live_config")
        .select(
          "bundle_type,is_mystery_revealed,live_stock_total,live_stock_claimed",
        )
        .eq("bundle_id", bundleId)
        .maybeSingle(),
      supabase
        .from("bundle_purchases")
        .select("users:user_id(full_name,email)")
        .eq("bundle_id", bundleId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const bundleData = (b || null) as BundleRow | null;
    setBundle(bundleData);
    setLiveConfig((cfg || null) as LiveConfigRow | null);
    setClaims(
      (claimRows || []).map(
        (row: any) => row.users?.full_name || row.users?.email || "Customer",
      ),
    );

    if (!bundleData?.products?.length) {
      setProductNames([]);
      return;
    }

    const ids = bundleData.products.map((p) => p.product_id);
    const { data: products } = await supabase
      .from("products")
      .select("id,name")
      .in("id", ids);
    const namesMap = new Map((products || []).map((p: any) => [p.id, p.name]));
    setProductNames(bundleData.products.map((p) => namesMap.get(p.product_id) || "Item"));
  };

  useEffect(() => {
    void load();
  }, [bundleId]);

  usePolling(load, { intervalMs: 2500 });
  useSupabaseRealtime({
    supabase,
    channelName: `bundle-live-${bundleId}`,
    tables: [
      { table: "mistry_bundles", filter: `id=eq.${bundleId}` },
      { table: "bundle_purchases", filter: `bundle_id=eq.${bundleId}` },
      { table: "bundle_live_config", filter: `bundle_id=eq.${bundleId}` },
    ],
    onEvent: () => {
      void load();
    },
    enabled: Boolean(bundleId),
  });

  const stockTotal =
    liveConfig?.live_stock_total || bundle?.total_purchases_allowed || 0;
  const stockClaimed =
    liveConfig?.live_stock_claimed || bundle?.current_purchases || 0;
  const stockPct = stockTotal > 0 ? Math.round((stockClaimed / stockTotal) * 100) : 0;
  const isMystery = liveConfig?.bundle_type === "mystery";
  const hidden = isMystery && !liveConfig?.is_mystery_revealed;

  const savingsLabel = useMemo(() => {
    if (!bundle) return "";
    if (bundle.discount_type === "percentage") return `${bundle.discount_value}% OFF`;
    return `KES ${bundle.discount_value} OFF`;
  }, [bundle]);

  return (
    <LiveDisplayShell
      title={bundle?.name || "Bundle Live Drop"}
      subtitle={hidden ? "Mystery Reveal Pending" : `Savings: ${savingsLabel}`}
      activeCount={claims.length}
      tickerItems={claims.map((name) => `${name} claimed this bundle`)}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900 md:col-span-2">
          <CardContent className="pt-6">
            <p className="mb-2 text-sm text-slate-400">Bundle contents</p>
            {hidden ? (
              <div className="rounded border border-slate-700 bg-slate-800/50 p-6 text-center">
                <p className="text-3xl font-black tracking-widest blur-sm">
                  MYSTERY BUNDLE
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Reveal controlled by admin live switch.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {productNames.slice(0, 8).map((name, index) => (
                  <div key={`${name}-${index}`} className="rounded border border-slate-800 p-3 text-sm">
                    {name}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Badge>{savingsLabel}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-slate-400">Stock depletion</p>
            <div className="h-3 rounded bg-slate-700">
              <div className="h-3 rounded bg-emerald-500" style={{ width: `${stockPct}%` }} />
            </div>
            <p className="text-xs text-slate-300">
              {stockClaimed}/{stockTotal || "∞"} claimed
            </p>
            <p className="text-xs text-slate-400">
              OBS URL ready: use this page directly in browser source.
            </p>
          </CardContent>
        </Card>
      </div>
    </LiveDisplayShell>
  );
}

