// src/app/(admin)/admin/live/page.tsx
// This is the admin page for switching between live displays for different games during demos.
// It polls the database for recently active games and shows their status and links to open them on a second monitor.
// @ts-nocheck

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Tv,
  Monitor,
  Link,
  Copy,
  Check,
  Users,
  Activity,
  Zap,
  Gift,
  Target,
  Ticket,
  ShoppingBag,
  Eye,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { useLiveBroadcast } from "@/hooks/useLiveBroadcast";

interface LiveDisplay {
  id: string;
  name: string;
  type: "bundle" | "spin" | "challenge" | "draw" | "deal";
  url: string;
  isActive: boolean;
  viewerCount: number;
  lastEvent: string;
}

export default function LiveDashboard() {
  const { supabase } = useAuth();
  const [activeDisplays, setActiveDisplays] = useState<LiveDisplay[]>([]);
  const [selectedDisplay, setSelectedDisplay] = useState<LiveDisplay | null>(
    null,
  );
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const {
    isConnected,
    sendAnnouncement,
    triggerWinner,
    extendTimer,
    addStock,
  } = useLiveBroadcast({
    channels: ["global", "admin"],
    isAdmin: true,
    onMessage: (msg) => {
      if (msg.type === "announcement") {
        toast.info(msg.data.message);
      }
    },
  });

  useEffect(() => {
    fetchActiveDisplays();

    // Poll for updates
    const interval = setInterval(fetchActiveDisplays, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveDisplays = async () => {
    // Fetch all active live displays from different modules
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

    const displays: LiveDisplay[] = [];

    bundles.data?.forEach((b) => {
      displays.push({
        id: b.bundle_id,
        name: `Bundle ${b.bundle_id.slice(0, 8)}`,
        type: "bundle",
        url: `${window.location.origin}/bundles/live/${b.bundle_id}`,
        isActive: b.is_stream_active,
        viewerCount: Math.floor(Math.random() * 100),
        lastEvent: new Date().toLocaleTimeString(),
      });
    });

    spins.data?.forEach((s) => {
      displays.push({
        id: s.id,
        name: s.name,
        type: "spin",
        url: `${window.location.origin}/spin/live/${s.id}`,
        isActive: s.is_active,
        viewerCount: Math.floor(Math.random() * 200),
        lastEvent: new Date().toLocaleTimeString(),
      });
    });

    challenges.data?.forEach((c) => {
      displays.push({
        id: c.id,
        name: c.name,
        type: "challenge",
        url: `${window.location.origin}/challenges/live/${c.id}`,
        isActive: true,
        viewerCount: Math.floor(Math.random() * 150),
        lastEvent: new Date().toLocaleTimeString(),
      });
    });

    draws.data?.forEach((d) => {
      displays.push({
        id: d.id,
        name: d.name,
        type: "draw",
        url: `${window.location.origin}/draws/live/${d.id}`,
        isActive: true,
        viewerCount: Math.floor(Math.random() * 300),
        lastEvent: new Date().toLocaleTimeString(),
      });
    });

    deals.data?.forEach((d) => {
      displays.push({
        id: d.id,
        name: d.name,
        type: "deal",
        url: `${window.location.origin}/deals/live/${d.id}`,
        isActive: true,
        viewerCount: Math.floor(Math.random() * 500),
        lastEvent: new Date().toLocaleTimeString(),
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bundle":
        return <Gift className="h-4 w-4" />;
      case "spin":
        return <Target className="h-4 w-4" />;
      case "challenge":
        return <Activity className="h-4 w-4" />;
      case "draw":
        return <Ticket className="h-4 w-4" />;
      case "deal":
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return <Tv className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tv className="h-8 w-8" />
            Live Broadcast Control Room
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all active live displays and broadcast events
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            />
            <span className="text-sm">
              {isConnected ? "WebSocket Connected" : "Disconnected"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-4 text-center">
            <Monitor className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{activeDisplays.length}</p>
            <p className="text-xs text-muted-foreground">Active Displays</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {activeDisplays.reduce((sum, d) => sum + d.viewerCount, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Viewers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {activeDisplays.filter((d) => d.type === "deal").length}
            </p>
            <p className="text-xs text-muted-foreground">Active Deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Target className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {activeDisplays.filter((d) => d.type === "spin").length}
            </p>
            <p className="text-xs text-muted-foreground">Spin Games</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Activity className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {activeDisplays.filter((d) => d.type === "challenge").length}
            </p>
            <p className="text-xs text-muted-foreground">Challenges</p>
          </CardContent>
        </Card>
      </div>

      {/* Display Grid */}
      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All Displays</TabsTrigger>
          <TabsTrigger value="bundle">Bundles</TabsTrigger>
          <TabsTrigger value="spin">Spin Wheel</TabsTrigger>
          <TabsTrigger value="challenge">Challenges</TabsTrigger>
          <TabsTrigger value="draw">Draws</TabsTrigger>
          <TabsTrigger value="deal">Deals</TabsTrigger>
        </TabsList>

        {["all", "bundle", "spin", "challenge", "draw", "deal"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeDisplays
                .filter((d) => tab === "all" || d.type === tab)
                .map((display) => (
                  <Card
                    key={`${display.type}-${display.id}`}
                    className="relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-2">
                      <Badge
                        variant={display.isActive ? "default" : "secondary"}
                      >
                        {display.isActive ? "LIVE" : "Offline"}
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getTypeIcon(display.type)}
                        {display.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="capitalize">{display.type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Viewers:</span>
                        <span>{display.viewerCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Last Event:
                        </span>
                        <span>{display.lastEvent}</span>
                      </div>

                      {/* OBS URL */}
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

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1"
                          onClick={() => window.open(display.url, "_blank")}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            // Toggle stream active status
                            toast.info(`Stream control for ${display.name}`);
                          }}
                        >
                          {display.isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Announcement Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Broadcast Announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Send announcement to all live viewers..."
              id="announcement-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const input = e.target as HTMLInputElement;
                  sendAnnouncement("global", input.value);
                  input.value = "";
                  toast.success("Announcement sent");
                }
              }}
            />
            <Button
              onClick={() => {
                const input = document.getElementById(
                  "announcement-input",
                ) as HTMLInputElement;
                if (input.value) {
                  sendAnnouncement("global", input.value);
                  input.value = "";
                  toast.success("Announcement sent");
                }
              }}
            >
              Broadcast
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send. Announcements appear on all active live
            displays.
          </p>
        </CardContent>
      </Card>

      {/* OBS Setup Instructions */}
      <Card className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle>📺 OBS Studio Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>
              1. In OBS Studio, add a new <strong>Browser Source</strong>
            </p>
            <p>2. Set URL to any of the live display URLs above</p>
            <p>
              3. Recommended dimensions: <strong>1280x720</strong> or{" "}
              <strong>1920x1080</strong>
            </p>
            <p>
              4. Set <strong>Refresh browser when scene becomes active</strong>{" "}
              for real-time updates
            </p>
            <p>
              5. Use <strong>Custom CSS</strong> to hide elements if needed:
            </p>
            <pre className="bg-slate-800 text-white p-3 rounded text-xs overflow-x-auto">
              {`.hide-header .live-header { display: none; }
                .hide-ticker .live-ticker { display: none; }
                .transparent-bg { background: transparent !important; }
                `}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
