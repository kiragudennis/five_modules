// src/app/(store)/challenges/live/[challengeId]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LiveDisplayShell from "@/components/live/live-display-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/context/AuthContext";
import { usePolling } from "@/hooks/usePolling";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { ChallengesService } from "@/lib/services/challenges-service";
import {
  Trophy,
  TrendingUp,
  Users,
  Flame,
  Crown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function ChallengeLivePage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const { supabase } = useAuth();
  const [challenge, setChallenge] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [tickerItems, setTickerItems] = useState<string[]>([]);
  const [phase, setPhase] = useState<
    "countdown" | "active" | "final_hour" | "ended"
  >("active");

  const challengesService = new ChallengesService();

  const load = async () => {
    // Get challenge details
    const { data: challengeData } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single();
    setChallenge(challengeData);

    // Get leaderboard
    const leaderboardData = await challengesService.getLeaderboard(
      challengeId as string,
      20,
    );
    setLeaderboard(leaderboardData);

    // Get ticker
    const ticker = await challengesService.getLiveTicker(
      challengeId as string,
      30,
    );
    setTickerItems(
      ticker.map((t) =>
        t.team_name
          ? `${t.user_name} (${t.team_name}) ${t.action_text} +${t.points_awarded}`
          : `${t.user_name} ${t.action_text} +${t.points_awarded}`,
      ),
    );

    // Determine phase based on time remaining
    if (challengeData) {
      const now = new Date();
      const end = new Date(challengeData.ends_at);
      const hoursLeft = (end.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (now < new Date(challengeData.starts_at)) {
        setPhase("countdown");
      } else if (hoursLeft <= 1 && hoursLeft > 0) {
        setPhase("final_hour");
      } else if (now >= end) {
        setPhase("ended");
      } else {
        setPhase("active");
      }
    }
  };

  useEffect(() => {
    void load();
  }, [challengeId]);

  usePolling(load, { intervalMs: 3000 });
  useSupabaseRealtime({
    supabase,
    channelName: `challenge-live-${challengeId}`,
    tables: [
      {
        table: "challenge_participants",
        filter: `challenge_id=eq.${challengeId}`,
      },
      { table: "challenge_actions", filter: `challenge_id=eq.${challengeId}` },
      {
        table: "challenge_live_ticker",
        filter: `challenge_id=eq.${challengeId}`,
      },
    ],
    onEvent: () => void load(),
    enabled: Boolean(challengeId),
  });

  const getPhaseStyles = () => {
    switch (phase) {
      case "final_hour":
        return {
          bg: "bg-red-900/50",
          border: "border-red-500",
          text: "text-red-400",
          animation: "animate-pulse",
        };
      case "ended":
        return {
          bg: "bg-slate-800",
          border: "border-slate-700",
          text: "text-slate-400",
        };
      default:
        return {
          bg: "bg-slate-900",
          border: "border-slate-800",
          text: "text-white",
        };
    }
  };

  const phaseStyles = getPhaseStyles();

  return (
    <LiveDisplayShell
      title={challenge?.name || "Challenge Live"}
      subtitle={
        phase === "countdown"
          ? "Starting Soon..."
          : phase === "final_hour"
            ? "🔥 FINAL HOUR - DOUBLE POINTS 🔥"
            : phase === "ended"
              ? "Challenge Complete - Winners Below"
              : `${leaderboard.length} participants competing`
      }
      activeCount={leaderboard.length}
      tickerItems={tickerItems}
    >
      {/* Phase banner */}
      {phase === "final_hour" && (
        <div
          className={`${phaseStyles.bg} border-2 ${phaseStyles.border} rounded-lg p-4 mb-4 text-center ${phaseStyles.animation}`}
        >
          <p className="text-2xl font-bold text-red-500">⏰ FINAL HOUR ⏰</p>
          <p className="text-sm text-red-400">
            Points are DOUBLED until the challenge ends!
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {/* Top 3 Podium */}
        <Card
          className={`${phaseStyles.bg} ${phaseStyles.border} md:col-span-2`}
        >
          <CardContent className="pt-6">
            <p className="text-sm text-slate-400 mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Leaderboard (Top 10)
            </p>
            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((participant, idx) => (
                <div
                  key={participant.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    idx < 3
                      ? "bg-yellow-500/10 border border-yellow-500/30"
                      : "bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold w-8 text-center ${
                        idx === 0
                          ? "text-yellow-500 text-xl"
                          : idx === 1
                            ? "text-gray-400 text-lg"
                            : idx === 2
                              ? "text-amber-600 text-lg"
                              : "text-slate-500"
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-medium">
                        {participant.profiles?.full_name || "Anonymous"}
                      </p>
                      {participant.team_name && (
                        <p className="text-xs text-slate-400">
                          Team: {participant.team_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg">
                      {participant.current_score}
                    </span>
                    {idx > 0 && idx <= 5 && (
                      <div className="flex items-center gap-1 text-xs">
                        {Math.random() > 0.5 ? (
                          <ArrowUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-slate-400">
                          {Math.floor(Math.random() * 50) + 1}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Challenge Info & Prize Tiers */}
        <Card className={`${phaseStyles.bg} ${phaseStyles.border}`}>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-2">Prize Tiers</p>
              <div className="space-y-2">
                {challenge?.prize_tiers?.map((tier: any) => (
                  <div
                    key={tier.rank}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {tier.rank === 1 && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      <span>Rank {tier.rank}</span>
                    </div>
                    <Badge variant="outline">
                      {tier.prize_type === "points" &&
                        `${tier.prize_value} points`}
                      {tier.prize_type === "discount" &&
                        `${tier.prize_value}% off`}
                      {tier.prize_type === "badge" && tier.prize_value}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <p className="text-sm text-slate-400 mb-2">Statistics</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Participants:</span>
                  <span className="font-bold">{leaderboard.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Challenge Type:</span>
                  <Badge variant="secondary" className="capitalize">
                    {challenge?.challenge_type}
                  </Badge>
                </div>
                {phase === "final_hour" && (
                  <div className="mt-3 p-2 bg-red-500/20 rounded text-center">
                    <p className="text-xs text-red-400">
                      🏆 Double points active 🏆
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase-specific footer */}
      {phase === "ended" && challenge?.prize_tiers && (
        <Card className="mt-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50">
          <CardContent className="py-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="font-bold text-lg">Challenge Complete!</p>
            <p className="text-sm">
              Winners have been notified and prizes distributed.
            </p>
          </CardContent>
        </Card>
      )}
    </LiveDisplayShell>
  );
}
