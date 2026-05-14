// app/admin/live/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MonitorPlay, Copy, Eye, Tv, Radio, Check } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminLivePage() {
  const { supabase } = useAuth();
  const [activeDisplays, setActiveDisplays] = useState<any[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveDisplays();
    const interval = setInterval(fetchActiveDisplays, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveDisplays = async () => {
    // Fetch all active live displays
    const [bundles, spins, challenges, draws, deals] = await Promise.all([
      supabase
        .from("bundle_live_config")
        .select("bundle_id, is_stream_active")
        .eq("is_stream_active", true),
      supabase
        .from("spin_games")
        .select("id, name, is_active")
        .eq("is_active", true),
      supabase
        .from("challenges")
        .select("id, name, status")
        .eq("status", "active"),
      supabase
        .from("draws")
        .select("id, name, status")
        .in("status", ["open", "drawing"]),
      supabase.from("deals").select("id, name, status").eq("status", "active"),
    ]);

    const displays: any = [];

    bundles.data?.forEach((b: any) => {
      displays.push({
        id: b.bundle_id,
        name: `Bundle ${b.bundle_id.slice(0, 8)}`,
        type: "bundle",
        url: `${window.location.origin}/bundles/live/${b.bundle_id}`,
        status: "live",
      });
    });

    spins.data?.forEach((s: any) => {
      displays.push({
        id: s.id,
        name: s.name,
        type: "spin",
        url: `${window.location.origin}/spin/live/${s.id}`,
        status: "live",
      });
    });

    setActiveDisplays(displays);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast.success("URL copied to clipboard");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <MonitorPlay className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Live Control Room</h1>
        </div>
        <p className="text-muted-foreground">
          Manage all active broadcast displays
        </p>
      </div>

      {/* OBS Instructions */}
      <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
        <CardContent className="pt-6">
          <h3 className="font-bold mb-2">📺 OBS Studio Setup</h3>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>
              Add a new <strong>Browser Source</strong> in OBS
            </li>
            <li>Paste any live display URL below</li>
            <li>
              Set dimensions to <strong>1280x720</strong> or{" "}
              <strong>1920x1080</strong>
            </li>
            <li>
              Enable <strong>Refresh browser when scene becomes active</strong>
            </li>
          </ol>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeDisplays.map((display) => (
          <Card key={`${display.type}-${display.id}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                  {display.name}
                </span>
                <Badge variant="destructive">LIVE</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Tv className="h-4 w-4" />
                  <span className="capitalize">{display.type}</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={display.url}
                    readOnly
                    className="text-xs font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyUrl(display.url)}
                  >
                    {copiedUrl === display.url ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Link href={display.url} target="_blank">
                  <Button variant="default" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Display
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
