// app/(admin)/admin/marketing/challenges/[challengeId]/live-controls/page.tsx

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { ChallengesService } from "@/lib/services/challenges-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  Users,
  Flame,
  Play,
  Pause,
  Flag,
  Edit,
  Loader2,
  Eye,
  Radio,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Clock,
  Calendar,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { Challenge } from "@/types/challenges";

interface Participant {
  id: string;
  user_id: string;
  current_score: number;
  current_rank: number;
  current_streak: number;
  users?: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
  team_name?: string;
}

interface SuspiciousActivity {
  id: string;
  user_id: string;
  user_name: string;
  action_type: string;
  points_awarded: number;
  created_at: string;
  reason: string;
}

export default function ChallengeLiveControls() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const { supabase } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<
    SuspiciousActivity[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [extendingDays, setExtendingDays] = useState(1);
  const [adjustingScore, setAdjustingScore] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [liveStats, setLiveStats] = useState({
    totalParticipants: 0,
    totalPointsAwarded: 0,
    activeInLastHour: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const challengesService = new ChallengesService(supabase);

  const loadData = useCallback(async () => {
    if (!challengeId) return;

    // Load challenge details
    const { data: challengeData } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single();
    setChallenge(challengeData);

    // Load leaderboard
    const board = await challengesService.getLeaderboard(challengeId, 50);
    setLeaderboard(board);
    setParticipants(board);

    // Calculate stats
    const { data: actions } = await supabase
      .from("challenge_actions")
      .select("points_awarded, created_at")
      .eq("challenge_id", challengeId);

    const totalPoints =
      actions?.reduce((sum, a) => sum + (a.points_awarded || 0), 0) || 0;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const activeLastHour =
      actions?.filter((a) => a.created_at > oneHourAgo).length || 0;

    setLiveStats({
      totalParticipants: board.length,
      totalPointsAwarded: totalPoints,
      activeInLastHour: activeLastHour,
    });

    setLoading(false);
  }, [challengeId, supabase, challengesService]);

  useEffect(() => {
    loadData();

    // Real-time updates
    const channel = supabase
      .channel(`challenge-controls-${challengeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenge_participants",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => {
          loadData();
          if (isSoundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [challengeId, supabase, loadData, isSoundEnabled]);

  const updateChallengeStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from("challenges")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", challengeId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Challenge ${newStatus}`);
      loadData();
    }
  };

  const extendChallenge = async () => {
    if (!challenge) return;

    const newEndDate = new Date(challenge.ends_at);
    newEndDate.setDate(newEndDate.getDate() + extendingDays);

    const { error } = await supabase
      .from("challenges")
      .update({
        ends_at: newEndDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", challengeId);

    if (error) {
      toast.error("Failed to extend challenge");
    } else {
      toast.success(`Challenge extended by ${extendingDays} days`);
      loadData();
    }
  };

  const adjustScore = async () => {
    if (!selectedUserId || adjustmentValue === 0) return;

    setAdjustingScore(true);
    try {
      await challengesService.adminAdjustScore(
        challengeId,
        selectedUserId,
        adjustmentValue,
        adjustmentReason,
      );
      toast.success(
        `Score adjusted by ${adjustmentValue > 0 ? "+" : ""}${adjustmentValue}`,
      );
      setAdjustmentValue(0);
      setAdjustmentReason("");
      setSelectedUserId(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAdjustingScore(false);
    }
  };

  const sendAnnouncement = async () => {
    if (!announcementMessage.trim()) return;

    setSendingAnnouncement(true);
    try {
      // Add to live ticker
      await supabase.from("challenge_live_ticker").insert({
        challenge_id: challengeId,
        user_name: "Admin",
        action_text: `ANNOUNCEMENT: ${announcementMessage}`,
        points_awarded: 0,
      });

      toast.success("Announcement sent to live display");
      setAnnouncementMessage("");
    } catch (error) {
      toast.error("Failed to send announcement");
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const flagSuspiciousActivity = async (
    participant: Participant,
    reason: string,
  ) => {
    // Log suspicious activity
    await supabase.from("challenge_suspicious_activities").insert({
      challenge_id: challengeId,
      user_id: participant.user_id,
      user_name: participant.users?.full_name,
      reason,
      flagged_at: new Date().toISOString(),
    });

    toast.warning(
      `Flagged ${participant.users?.full_name || "participant"} for review`,
    );
  };

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Challenge Not Found</h2>
        <p className="text-muted-foreground">
          The challenge you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950"
    >
      {/* Audio for real-time updates */}
      <audio ref={audioRef} src="/sounds/update-chime.mp3" preload="auto" />

      {/* Header */}
      <div className="sticky top-0 z-20 border-b backdrop-blur-sm bg-purple-950/80 border-purple-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-mono">
                  LIVE CONTROL PANEL
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">
                {challenge.name}
              </h1>
              <p className="text-sm text-purple-300">{challenge.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5 text-white" />
                ) : (
                  <Maximize2 className="h-5 w-5 text-white" />
                )}
              </button>
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
              >
                {isSoundEnabled ? (
                  <Volume2 className="h-5 w-5 text-white" />
                ) : (
                  <VolumeX className="h-5 w-5 text-white" />
                )}
              </button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/challenges/live/${challenge.id}`} target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  Open Live Display
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Live Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-purple-900/30 border-purple-500/30">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {liveStats.totalParticipants}
              </p>
              <p className="text-xs text-purple-300">Total Participants</p>
            </CardContent>
          </Card>
          <Card className="bg-green-900/30 border-green-500/30">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {liveStats.totalPointsAwarded.toLocaleString()}
              </p>
              <p className="text-xs text-green-300">Points Awarded</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-900/30 border-yellow-500/30">
            <CardContent className="p-4 text-center">
              <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {liveStats.activeInLastHour}
              </p>
              <p className="text-xs text-yellow-300">Active in Last Hour</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-900/30 border-blue-500/30">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">
                {format(new Date(challenge.ends_at), "MMM d, h:mm a")}
              </p>
              <p className="text-xs text-blue-300">End Time</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="controls" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
          </TabsList>

          {/* Controls Tab */}
          <TabsContent value="controls" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Challenge Status Controls */}
              <Card className="bg-black/30 backdrop-blur border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Challenge Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3 flex-wrap">
                    <Button
                      variant={
                        challenge.status === "active" ? "default" : "outline"
                      }
                      onClick={() => updateChallengeStatus("active")}
                      className="gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Activate
                    </Button>
                    <Button
                      variant={
                        challenge.status === "paused" ? "default" : "outline"
                      }
                      onClick={() => updateChallengeStatus("paused")}
                      className="gap-2"
                    >
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => updateChallengeStatus("ended")}
                      className="gap-2"
                    >
                      <Flag className="h-4 w-4" />
                      End Early
                    </Button>
                  </div>
                  <div className="pt-3 border-t border-purple-500/30">
                    <p className="text-sm text-purple-300 mb-2">
                      Current Status:
                    </p>
                    <Badge
                      className={cn(
                        "text-lg px-4 py-2",
                        challenge.status === "active"
                          ? "bg-green-500"
                          : challenge.status === "paused"
                            ? "bg-yellow-500"
                            : challenge.status === "ended"
                              ? "bg-red-500"
                              : "bg-gray-500",
                      )}
                    >
                      {challenge.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Extend Challenge */}
              <Card className="bg-black/30 backdrop-blur border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Extend Challenge</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-purple-300">Extend by (days)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        value={extendingDays}
                        onChange={(e) =>
                          setExtendingDays(parseInt(e.target.value))
                        }
                        className="w-32"
                        min="1"
                        max="30"
                      />
                      <Button onClick={extendChallenge}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Extend
                      </Button>
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm text-purple-300">Current End Date:</p>
                    <p className="text-white font-mono">
                      {format(new Date(challenge.ends_at), "PPP 'at' h:mm a")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Manual Score Adjustment */}
              <Card className="bg-black/30 backdrop-blur border-purple-500/30 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white">
                    Manual Score Adjustment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-purple-300">
                        Select Participant
                      </Label>
                      <select
                        className="w-full rounded-lg border bg-background p-2 mt-1"
                        value={selectedUserId || ""}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                      >
                        <option value="">Select a participant...</option>
                        {participants.map((p) => (
                          <option key={p.user_id} value={p.user_id}>
                            {p.users?.full_name || "Anonymous"} -{" "}
                            {p.current_score} pts
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-purple-300">
                        Adjustment (+/-)
                      </Label>
                      <Input
                        type="number"
                        value={adjustmentValue}
                        onChange={(e) =>
                          setAdjustmentValue(parseInt(e.target.value))
                        }
                        placeholder="+100 or -50"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-purple-300">Reason</Label>
                      <Input
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        placeholder="e.g., Bonus for top performer, Penalty for violation"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={adjustScore}
                    disabled={
                      !selectedUserId || adjustmentValue === 0 || adjustingScore
                    }
                    className="w-full"
                  >
                    {adjustingScore ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Edit className="h-4 w-4 mr-2" />
                    )}
                    Apply Adjustment
                  </Button>
                </CardContent>
              </Card>

              {/* Live Announcement */}
              <Card className="bg-black/30 backdrop-blur border-purple-500/30 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white">
                    Live Announcement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                    placeholder="Type an announcement to display on the live ticker..."
                    rows={3}
                  />
                  <Button
                    onClick={sendAnnouncement}
                    disabled={
                      !announcementMessage.trim() || sendingAnnouncement
                    }
                    className="w-full"
                  >
                    {sendingAnnouncement ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Radio className="h-4 w-4 mr-2" />
                    )}
                    Send to Live Display
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4">
            <Card className="bg-black/30 backdrop-blur border-purple-500/30">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-purple-500/30">
                        <th className="text-left p-4 text-purple-300">Rank</th>
                        <th className="text-left p-4 text-purple-300">
                          Participant
                        </th>
                        <th className="text-right p-4 text-purple-300">
                          Score
                        </th>
                        <th className="text-center p-4 text-purple-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((participant, idx) => (
                        <tr
                          key={participant.id}
                          className="border-b border-purple-500/20 hover:bg-white/5"
                        >
                          <td className="p-4 font-mono font-bold text-white">
                            #{idx + 1}
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-white">
                                {participant.users?.full_name || "Anonymous"}
                              </p>
                              <p className="text-xs text-purple-300">
                                {participant.users?.email}
                              </p>
                            </div>
                          </td>
                          <td className="p-4 text-right font-bold text-white">
                            {participant.current_score.toLocaleString()}
                          </td>
                          <td className="p-4 text-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Flag Suspicious Activity
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <p className="text-sm">
                                    Participant:{" "}
                                    <strong>
                                      {participant.users?.full_name}
                                    </strong>
                                  </p>
                                  <Textarea
                                    placeholder="Reason for flagging..."
                                    id="flagReason"
                                  />
                                  <Button
                                    onClick={() => {
                                      const reason = (
                                        document.getElementById(
                                          "flagReason",
                                        ) as HTMLTextAreaElement
                                      )?.value;
                                      if (reason) {
                                        flagSuspiciousActivity(
                                          participant,
                                          reason,
                                        );
                                      }
                                    }}
                                  >
                                    Submit Flag
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-4">
            <Card className="bg-black/30 backdrop-blur border-purple-500/30">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {participants.map((participant, idx) => (
                    <div
                      key={participant.id}
                      className="flex flex-wrap items-center justify-between p-3 rounded-lg bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-purple-300 w-8">#{idx + 1}</span>
                        <div>
                          <p className="font-medium text-white">
                            {participant.users?.full_name || "Anonymous"}
                          </p>
                          <p className="text-xs text-purple-300">
                            {participant.users?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          {participant.current_score} pts
                        </Badge>
                        {participant.current_streak > 0 && (
                          <Badge className="bg-orange-500/20 text-orange-400">
                            <Flame className="h-3 w-3 mr-1" />
                            {participant.current_streak} day streak
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
