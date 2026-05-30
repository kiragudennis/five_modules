// components/challenges/TeamLiveTicker.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  TrendingUp,
  ShoppingBag,
  Users,
  Trophy,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface TickerEvent {
  id: string;
  team_name: string;
  user_name: string;
  action_text: string;
  points_awarded: number;
  created_at: string;
  event_type: "purchase" | "join" | "achievement" | "milestone";
}

export function TeamLiveTicker({ challengeId }: { challengeId: string }) {
  const { supabase } = useAuth();
  const [events, setEvents] = useState<TickerEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<TickerEvent | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial events
    const loadEvents = async () => {
      const { data } = await supabase
        .from("challenge_live_ticker")
        .select("*")
        .eq("challenge_id", challengeId)
        .not("team_name", "is", null)
        .order("created_at", { ascending: false })
        .limit(30);

      setEvents(data || []);
    };

    loadEvents();

    // Real-time subscription
    const channel = supabase
      .channel(`team-ticker-${challengeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "challenge_live_ticker",
          filter: `challenge_id=eq.${challengeId}`,
        },
        (payload) => {
          const newEvent = payload.new as TickerEvent;
          setEvents((prev) => [newEvent, ...prev.slice(0, 29)]);
          setLatestEvent(newEvent);

          // Play sound for purchases
          if (newEvent.event_type === "purchase" && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }

          // Auto-hide latest event after 5 seconds
          setTimeout(() => setLatestEvent(null), 5000);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [challengeId, supabase]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "purchase":
        return ShoppingBag;
      case "join":
        return Users;
      case "achievement":
        return Trophy;
      case "milestone":
        return TrendingUp;
      default:
        return Zap;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "purchase":
        return "border-green-500/30 bg-green-500/5";
      case "join":
        return "border-blue-500/30 bg-blue-500/5";
      case "achievement":
        return "border-yellow-500/30 bg-yellow-500/5";
      case "milestone":
        return "border-purple-500/30 bg-purple-500/5";
      default:
        return "";
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/sounds/coin-collect.mp3" preload="auto" />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Team Live Feed</h3>
            <Badge variant="outline" className="ml-auto">
              {events.length} events
            </Badge>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {events.map((event, idx) => {
              const Icon = getEventIcon(event.event_type);

              return (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border animate-in fade-in slide-in-from-right",
                    getEventColor(event.event_type),
                  )}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-purple-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-bold">{event.team_name}</span>
                      {" • "}
                      <span>{event.user_name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.action_text}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(event.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  <Badge variant="secondary" className="flex-shrink-0">
                    +{event.points_awarded}
                  </Badge>
                </div>
              );
            })}
            <div ref={eventsEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Floating notification for latest event */}
      {latestEvent && (
        <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <CardContent className="p-3 flex items-center gap-3">
              <DollarSign className="h-5 w-5" />
              <div>
                <p className="font-bold text-sm">{latestEvent.team_name}</p>
                <p className="text-xs opacity-90">
                  {latestEvent.user_name}: {latestEvent.action_text}
                </p>
              </div>
              <Badge className="bg-white/20 text-white">
                +{latestEvent.points_awarded} pts
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
