// This is the admin page for switching between live displays for different games during demos.
// It polls the database for recently active games and shows their status and links to open them on a second monitor.
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MonitorPlay } from "lucide-react";
import { usePolling } from "@/hooks/usePolling";

type LiveDisplay = {
  id: string;
  name: string;
  type: "spin" | "draw" | "challenge" | "deal" | "bundle";
  href: string;
  status: "active" | "scheduled";
};

export default function AdminLiveSwitcherPage() {
  const { supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [displays, setDisplays] = useState<LiveDisplay[]>([]);

  const loadDisplays = async () => {
    const next: LiveDisplay[] = [];

    const { data: spinGames } = await supabase
      .from("spin_games")
      .select("id, name, is_active")
      .order("created_at", { ascending: false })
      .limit(10);

    for (const spin of spinGames || []) {
      next.push({
        id: spin.id,
        name: spin.name || "Spin game",
        type: "spin",
        href: `/spin/live/${spin.id}`,
        status: spin.is_active ? "active" : "scheduled",
      });
    }

    const { data: draws } = await supabase
      .from("draws")
      .select("id,name,status")
      .order("created_at", { ascending: false })
      .limit(10);

    for (const draw of draws || []) {
      next.push({
        id: draw.id,
        name: draw.name || "Draw",
        type: "draw",
        href: `/draws/live/${draw.id}`,
        status:
          draw.status === "active" || draw.status === "entry_collection"
            ? "active"
            : "scheduled",
      });
    }

    const { data: deals } = await supabase
      .from("deals")
      .select("id,name,status")
      .order("created_at", { ascending: false })
      .limit(10);

    for (const deal of deals || []) {
      next.push({
        id: deal.id,
        name: deal.name || "Deal",
        type: "deal",
        href: `/deals/live/${deal.id}`,
        status: deal.status === "active" ? "active" : "scheduled",
      });
    }

    const { data: bundles } = await supabase
      .from("mistry_bundles")
      .select("id,name,status")
      .order("created_at", { ascending: false })
      .limit(10);

    for (const bundle of bundles || []) {
      next.push({
        id: bundle.id,
        name: bundle.name || "Bundle",
        type: "bundle",
        href: `/bundles/live/${bundle.id}`,
        status: bundle.status === "active" ? "active" : "scheduled",
      });
    }

    setDisplays(next);
    setLoading(false);
  };

  useEffect(() => {
    void loadDisplays();
  }, []);

  usePolling(loadDisplays, { intervalMs: 4000 });

  const grouped = useMemo(() => {
    return displays.reduce<Record<string, LiveDisplay[]>>((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {});
  }, [displays]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <MonitorPlay className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Live Display Switcher</h1>
      </div>
      <p className="mb-8 text-muted-foreground">
        Open any active live screen on your second monitor during demos.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">
          Loading live displays...
        </p>
      ) : (
        <div className="grid gap-6">
          {Object.keys(grouped).length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No live displays found yet.
              </CardContent>
            </Card>
          ) : null}

          {Object.entries(grouped).map(([type, items]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="capitalize">{type} displays</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((display) => (
                  <div
                    key={display.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{display.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {display.href}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          display.status === "active" ? "default" : "secondary"
                        }
                      >
                        {display.status}
                      </Badge>
                      <Button asChild size="sm" variant="outline">
                        <Link href={display.href} target="_blank">
                          Open
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
