// src/components/live/live-display-shell.tsx
// Full-featured live display shell using only Supabase Realtime (no WebSocket server)

"use client";

import { ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Radio,
  Users,
  Volume2,
  VolumeX,
  Tv,
  Eye,
  Share2,
  Sparkles,
  Heart,
  MessageCircle,
  Maximize2,
  Minimize2,
  Clock,
} from "lucide-react";

export interface LiveDisplayShellProps {
  // Core content
  title: string;
  subtitle?: string;
  children: ReactNode;

  // Stats (all work with Supabase Realtime)
  activeCount?: number; // Active players/spinners
  viewerCount?: number; // Live viewers watching
  likeCount?: number; // Social likes
  shareCount?: number; // Social shares

  // Ticker
  tickerItems?: string[];
  tickerSpeed?: number;

  // Display options
  theme?: "dark" | "light" | "broadcast";
  showHeader?: boolean;
  showTicker?: boolean;
  showSocialStats?: boolean;

  // Module info (for Supabase Realtime subscriptions)
  moduleType?: "spin" | "challenge" | "draw" | "bundle" | "deal";
  moduleId?: string;

  // Events
  onShare?: () => void;
  onLike?: () => void;

  // OBS mode
  obsMode?: boolean;
  className?: string;
}

// Theme configurations
const THEMES = {
  dark: {
    background: "bg-slate-900",
    text: "text-white",
    subtext: "text-slate-400",
    card: "bg-slate-800 border-slate-700",
    accent: "text-purple-400",
    border: "border-slate-700",
    tickerBg: "bg-slate-800/90",
  },
  light: {
    background: "bg-white",
    text: "text-slate-900",
    subtext: "text-slate-600",
    card: "bg-slate-100 border-slate-200",
    accent: "text-purple-600",
    border: "border-slate-200",
    tickerBg: "bg-slate-100/90",
  },
  broadcast: {
    background: "bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950",
    text: "text-white",
    subtext: "text-slate-300",
    card: "bg-slate-900/80 border-purple-500/30 backdrop-blur-sm",
    accent: "text-purple-400",
    border: "border-purple-500/20",
    tickerBg: "bg-purple-950/80",
  },
};

// Cache for user names to avoid repeated fetches
const userNameCache = new Map<string, string>();

async function getUserName(supabase: any, userId: string): Promise<string> {
  if (!userId) return "Someone";

  // Check cache
  if (userNameCache.has(userId)) {
    return userNameCache.get(userId)!;
  }

  try {
    const { data } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", userId)
      .single();

    const name = data?.full_name || "Someone";
    userNameCache.set(userId, name);
    return name;
  } catch (error) {
    return "Someone";
  }
}

export default function LiveDisplayShell({
  // Core
  title,
  subtitle,
  children,

  // Stats
  activeCount = 0,
  viewerCount = 0,
  likeCount = 0,
  shareCount = 0,

  // Ticker
  tickerItems: initialTickerItems = [],
  tickerSpeed = 3,

  // Display
  theme = "broadcast",
  showHeader = true,
  showTicker = true,
  showSocialStats = false,

  // Module
  moduleType,
  moduleId,

  // Events
  onShare,
  onLike,

  // OBS
  obsMode = false,
  className,
}: LiveDisplayShellProps) {
  const { supabase } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [liveTicker, setLiveTicker] = useState<string[]>(initialTickerItems);
  const [liveActiveCount, setLiveActiveCount] = useState(activeCount);
  const [liveViewerCount, setLiveViewerCount] = useState(viewerCount);
  const [liveLikeCount, setLiveLikeCount] = useState(likeCount);
  const [liveShareCount, setLiveShareCount] = useState(shareCount);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const style = THEMES[theme];

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Supabase Realtime subscription for live updates
  useEffect(() => {
    if (!supabase || !moduleId || !moduleType) return;

    const channel = supabase.channel(`live-${moduleType}-${moduleId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: "viewer-status" },
      },
    });

    // Subscribe to table changes based on module type
    if (moduleType === "spin") {
      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "spin_attempts",
            filter: `game_id=eq.${moduleId}`,
          },
          async (payload) => {
            const newRecord = payload.new;
            if (newRecord.points_awarded > 0 || newRecord.prize_value) {
              // Fetch user name from users table
              const userName = await getUserName(supabase, newRecord.user_id);
              const prizeText =
                newRecord.prize_type === "points"
                  ? `${newRecord.points_awarded} points`
                  : newRecord.prize_value;

              setLiveTicker((prev) => [
                `${userName} won ${prizeText}!`,
                ...prev.slice(0, 19),
              ]);
              setLiveShareCount((prev) => prev + 1);
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "spin_games",
            filter: `id=eq.${moduleId}`,
          },
          async (payload) => {
            if (
              payload.new.single_prize_claimed &&
              !payload.old.single_prize_claimed
            ) {
              // Fetch winner name from users table
              const winnerName = await getUserName(
                supabase,
                payload.new.single_prize_winner_id,
              );
              setLiveTicker((prev) => [
                `🎉 GRAND PRIZE WINNER: ${winnerName}! 🎉`,
                ...prev.slice(0, 19),
              ]);
            }
          },
        );
    }

    if (moduleType === "bundle") {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bundle_purchases",
          filter: `bundle_id=eq.${moduleId}`,
        },
        async (payload) => {
          const userName = await getUserName(supabase, payload.new.user_id);
          setLiveTicker((prev) => [
            `${userName} claimed ${payload.new.bundle_name}`,
            ...prev.slice(0, 19),
          ]);
          setLiveShareCount((prev) => prev + 1);
        },
      );
    }

    if (moduleType === "challenge") {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "challenge_actions",
          filter: `challenge_id=eq.${moduleId}`,
        },
        async (payload) => {
          const userName = await getUserName(supabase, payload.new.user_id);
          setLiveTicker((prev) => [
            `${userName} ${payload.new.action_text} +${payload.new.points_awarded} pts`,
            ...prev.slice(0, 19),
          ]);
        },
      );
    }

    if (moduleType === "draw") {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "draw_entries",
          filter: `draw_id=eq.${moduleId}`,
        },
        async (payload) => {
          const userName = await getUserName(supabase, payload.new.user_id);
          setLiveTicker((prev) => [
            `${userName} entered the draw (${payload.new.entry_count} entries)`,
            ...prev.slice(0, 19),
          ]);
        },
      );
    }

    if (moduleType === "deal") {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deal_claims",
          filter: `deal_id=eq.${moduleId}`,
        },
        async (payload) => {
          const userName = await getUserName(supabase, payload.new.user_id);
          setLiveTicker((prev) => [
            `${userName} claimed the deal!`,
            ...prev.slice(0, 19),
          ]);
          setLiveShareCount((prev) => prev + 1);
        },
      );
    }

    // Presence tracking for active viewers
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const viewerCount = Object.keys(state).length;
      setLiveViewerCount(viewerCount);
      setLiveActiveCount(viewerCount);
    });

    // Broadcast channel for announcements
    channel.on("broadcast", { event: "announcement" }, ({ payload }) => {
      setLiveTicker((prev) => [
        `📢 ANNOUNCEMENT: ${payload.message}`,
        ...prev.slice(0, 19),
      ]);
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true);
        console.log(
          `✅ Live broadcast connected for ${moduleType}:${moduleId}`,
        );

        // Track this viewer
        await channel.track({
          user_id: "viewer",
          online_at: new Date().toISOString(),
          user_agent:
            typeof window !== "undefined" ? navigator.userAgent : "server",
        });
      } else if (status === "CHANNEL_ERROR") {
        setIsConnected(false);
        console.error("Channel error");
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, moduleId, moduleType]);

  // Auto-rotate ticker animation
  const tickerAnimationDuration = Math.max(20, liveTicker.length * 1.5);

  // OBS mode - minimal version for screen capture
  if (obsMode) {
    return (
      <div
        className={cn("min-h-screen font-mono", style.background, className)}
      >
        <div
          className="hidden obs-metadata"
          data-title={title}
          data-module={moduleType}
          data-id={moduleId}
        />

        {showHeader && (
          <div
            className="text-center py-4 border-b"
            style={{ borderColor: style.border }}
          >
            <h1 className={cn("text-2xl font-bold", style.text)}>{title}</h1>
            {subtitle && (
              <p className={cn("text-sm mt-1", style.subtext)}>{subtitle}</p>
            )}
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className={cn("text-xs", style.subtext)}>LIVE</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span className={cn("text-xs", style.subtext)}>
                  {liveViewerCount} watching
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-4">{children}</div>

        {showTicker && liveTicker.length > 0 && (
          <div
            className={cn(
              "fixed bottom-0 left-0 right-0 py-2 overflow-hidden border-t",
              style.tickerBg,
              style.border,
            )}
          >
            <div
              className="whitespace-nowrap animate-scroll-x"
              style={{ animationDuration: `${tickerAnimationDuration}s` }}
            >
              {liveTicker.map((item, idx) => (
                <span key={idx} className="inline-block mx-4 text-sm">
                  🎉 {item} 🎉
                </span>
              ))}
              {liveTicker.map((item, idx) => (
                <span key={`dup-${idx}`} className="inline-block mx-4 text-sm">
                  🎉 {item} 🎉
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full interactive mode
  return (
    <div
      ref={containerRef}
      className={cn("min-h-screen", style.background, className)}
    >
      {/* Header */}
      {showHeader && (
        <div
          className={cn(
            "sticky top-0 z-20 border-b backdrop-blur-sm",
            style.border,
            style.tickerBg,
          )}
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              {/* Title Section */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    className={cn(
                      "text-2xl md:text-3xl font-bold truncate",
                      style.text,
                    )}
                  >
                    {title}
                  </h1>
                  {isConnected && (
                    <Badge
                      variant="default"
                      className="bg-green-500 gap-1 animate-pulse"
                    >
                      <Radio className="h-3 w-3" />
                      LIVE
                    </Badge>
                  )}
                </div>
                {subtitle && (
                  <p className={cn("text-sm mt-1 truncate", style.subtext)}>
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Stats Section */}
              <div className="flex items-center gap-4">
                {/* Active Count (players/spinners) */}
                {liveActiveCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span className={cn("text-sm font-medium", style.text)}>
                      {liveActiveCount}
                    </span>
                    <span
                      className={cn("text-xs hidden sm:inline", style.subtext)}
                    >
                      active
                    </span>
                  </div>
                )}

                {/* Viewer Count (live viewers watching) */}
                {liveViewerCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-purple-400" />
                    <span className={cn("text-sm font-medium", style.text)}>
                      {liveViewerCount}
                    </span>
                    <span
                      className={cn("text-xs hidden sm:inline", style.subtext)}
                    >
                      watching
                    </span>
                  </div>
                )}

                {/* Time */}
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span className={cn("text-xs font-mono", style.subtext)}>
                    {currentTime.toLocaleTimeString()}
                  </span>
                </div>

                {/* Control Buttons */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                  className="h-8 w-8 p-0"
                >
                  {isSoundEnabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="h-8 w-8 p-0"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Social Stats Row */}
            {showSocialStats && (liveLikeCount > 0 || liveShareCount > 0) && (
              <div
                className="flex items-center gap-4 mt-3 pt-2 border-t"
                style={{ borderColor: style.border }}
              >
                {liveLikeCount > 0 && (
                  <button
                    onClick={onLike}
                    className="flex items-center gap-1 hover:opacity-80 transition"
                  >
                    <Heart className="h-4 w-4 text-red-400" />
                    <span className={cn("text-sm", style.text)}>
                      {liveLikeCount.toLocaleString()}
                    </span>
                  </button>
                )}
                {liveShareCount > 0 && (
                  <button
                    onClick={onShare}
                    className="flex items-center gap-1 hover:opacity-80 transition"
                  >
                    <Share2 className="h-4 w-4 text-green-400" />
                    <span className={cn("text-sm", style.text)}>
                      {liveShareCount.toLocaleString()}
                    </span>
                  </button>
                )}
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShare}
                  className="h-8 gap-1"
                >
                  <Share2 className="h-3 w-3" />
                  <span className="text-xs">Share</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">{children}</div>

      {/* Footer Ticker */}
      {showTicker && liveTicker.length > 0 && (
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 py-2 overflow-hidden border-t",
            style.tickerBg,
            style.border,
          )}
        >
          <div className="relative">
            <div
              className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-current to-transparent pointer-events-none"
              style={{ color: style.tickerBg }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-current to-transparent pointer-events-none"
              style={{ color: style.tickerBg }}
            />
            <div
              className="whitespace-nowrap animate-scroll-x px-4"
              style={{ animationDuration: `${tickerAnimationDuration}s` }}
            >
              {liveTicker.map((item, idx) => (
                <span key={idx} className="inline-block mx-3 text-sm">
                  <Sparkles className="inline h-3 w-3 mr-1 text-yellow-400" />
                  {item}
                </span>
              ))}
              {liveTicker.map((item, idx) => (
                <span key={`dup-${idx}`} className="inline-block mx-3 text-sm">
                  <Sparkles className="inline h-3 w-3 mr-1 text-yellow-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes scroll-x {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll-x {
          animation: scroll-x linear infinite;
        }
      `}</style>
    </div>
  );
}
