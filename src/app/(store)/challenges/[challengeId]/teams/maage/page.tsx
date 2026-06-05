// app/(store)/challenges/[challengeId]/teams/manage/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Crown,
  MessageSquare,
  Send,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  Target,
  Trophy,
  Activity,
  UserPlus,
  UserX,
  Settings,
  Shield,
  Star,
  Zap,
  Flame,
  ArrowUp,
  ArrowDown,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  BarChart3,
  ShoppingBag,
  Gift,
  AlertTriangle,
  Bell,
  Megaphone,
  Swords,
  Medal,
  Eye,
  Lock,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface TeamMember {
  user_id: string;
  full_name: string;
  email: string;
  status: string;
  total_spent: number;
  total_orders: number;
  joined_at: string;
  current_streak: number;
  last_purchase_date: string;
  contribution_percentage: number;
  role: "leader" | "member";
}

interface TeamStats {
  total_spending: number;
  weekly_spending: number;
  daily_spending: number;
  member_count: number;
  avg_spend_per_member: number;
  rank: number;
  points: number;
  points_to_next_rank: number;
  next_rank_team: string;
}

interface TeamMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  message_type: string;
  created_at: string;
  is_system: boolean;
}

interface CompetitorTeam {
  team_id: string;
  team_name: string;
  total_spending: number;
  member_count: number;
  rank: number;
  spending_difference: number;
  trend: "up" | "down" | "stable";
}

const COLORS = [
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EF4444",
];

export default function TeamManagementPage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const router = useRouter();
  const { supabase, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorTeam[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);

  // Chart data
  const [spendingHistory, setSpendingHistory] = useState<any[]>([]);
  const [memberContributions, setMemberContributions] = useState<any[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState("overview");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [teamSettings, setTeamSettings] = useState({
    is_recruiting: true,
    team_description: "",
    min_spend_requirement: 0,
    tags: [] as string[],
    is_private: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const isTeamLeader = team?.team_leader_id === profile?.id;

  const loadTeamData = useCallback(async () => {
    if (!profile?.id || !challengeId) return;

    try {
      // Get team info
      const { data: participant } = await supabase
        .from("challenge_participants")
        .select("team_id")
        .eq("challenge_id", challengeId)
        .eq("user_id", profile.id)
        .single();

      if (!participant?.team_id) {
        router.push(`/challenges/${challengeId}/teams/discover`);
        return;
      }

      // Load team details
      const { data: teamData } = await supabase
        .from("challenge_teams")
        .select(
          `
          *,
          leader:team_leader_id(id, full_name, email)
        `,
        )
        .eq("id", participant.team_id)
        .single();

      setTeam(teamData);
      setTeamSettings({
        is_recruiting: teamData.is_recruiting,
        team_description: teamData.team_description || "",
        min_spend_requirement: teamData.min_spend_requirement || 0,
        tags: teamData.tags || [],
        is_private: teamData.is_private || false,
      });

      // Load members with spending stats
      const { data: membersData } = await supabase
        .from("challenge_participants")
        .select(
          `
          user_id,
          joined_at,
          current_streak,
          users:user_id(full_name, email, status)
        `,
        )
        .eq("team_id", participant.team_id);

      // Enrich member data
      const enrichedMembers = await Promise.all(
        (membersData || []).map(async (member) => {
          // Get spending stats
          const { data: spending } = await supabase
            .from("challenge_team_spending")
            .select("amount_spent, spending_date")
            .eq("team_id", participant.team_id)
            .eq("user_id", member.user_id);

          const { data: orders } = await supabase
            .from("orders")
            .select("created_at")
            .eq("user_id", member.user_id)
            .eq("payment_status", "completed")
            .order("created_at", { ascending: false })
            .limit(1);

          const totalSpent =
            spending?.reduce((sum, s) => sum + s.amount_spent, 0) || 0;
          const totalTeamSpent = membersData?.reduce(async (acc, m) => {
            const { data: s } = await supabase
              .from("challenge_team_spending")
              .select("amount_spent")
              .eq("team_id", participant.team_id)
              .eq("user_id", m.user_id);
            return (
              acc + (s?.reduce((sum, sp) => sum + sp.amount_spent, 0) || 0)
            );
          }, Promise.resolve(0));

          return {
            ...member,
            full_name: member.users?.full_name,
            email: member.users?.email,
            status: member.users?.status,
            total_spent: totalSpent,
            total_orders: spending?.length || 0,
            last_purchase_date: orders?.[0]?.created_at,
            contribution_percentage: 0, // Will calculate after
            role:
              member.user_id === teamData?.team_leader_id ? "leader" : "member",
          };
        }),
      );

      // Calculate percentages
      const teamTotal = enrichedMembers.reduce(
        (sum, m) => sum + m.total_spent,
        0,
      );
      enrichedMembers.forEach((member) => {
        member.contribution_percentage =
          teamTotal > 0 ? (member.total_spent / teamTotal) * 100 : 0;
      });

      setMembers(enrichedMembers);

      // Set chart data
      setMemberContributions(
        enrichedMembers.map((m, i) => ({
          name: m.full_name,
          value: m.total_spent,
          color: COLORS[i % COLORS.length],
        })),
      );

      // Load team stats
      await loadTeamStats(participant.team_id);

      // Load competitors
      await loadCompetitors(participant.team_id);

      // Load pending invites
      const { data: invites } = await supabase
        .from("challenge_team_invitations")
        .select(
          `
          *,
          sender:sender_id(full_name),
          recipient:recipient_id(full_name)
        `,
        )
        .eq("team_id", participant.team_id)
        .eq("status", "pending");

      setPendingInvites(invites || []);

      // Load spending history for charts
      await loadSpendingHistory(participant.team_id);

      // Load messages
      await loadMessages(participant.team_id);
    } catch (error) {
      console.error("Error loading team data:", error);
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  }, [challengeId, supabase, profile?.id, router]);

  const loadTeamStats = async (teamId: string) => {
    // Get total spending
    const { data: allSpending } = await supabase
      .from("challenge_team_spending")
      .select("amount_spent, spending_date")
      .eq("team_id", teamId);

    const totalSpending =
      allSpending?.reduce((sum, s) => sum + s.amount_spent, 0) || 0;

    // Weekly spending
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklySpending =
      allSpending
        ?.filter((s) => new Date(s.spending_date) >= weekAgo)
        .reduce((sum, s) => sum + s.amount_spent, 0) || 0;

    // Daily spending
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dailySpending =
      allSpending
        ?.filter((s) => new Date(s.spending_date) >= dayStart)
        .reduce((sum, s) => sum + s.amount_spent, 0) || 0;

    // Get rank
    const { data: allTeams } = await supabase
      .from("challenge_teams")
      .select("id, team_name, current_score, total_team_spending")
      .eq("challenge_id", challengeId)
      .order("total_team_spending", { ascending: false });

    const rank = (allTeams?.findIndex((t) => t.id === teamId) ?? -1) + 1;
    const nextTeam = rank > 1 ? allTeams?.[rank - 2] : null;
    const pointsToNext = nextTeam
      ? (nextTeam.total_team_spending || 0) - totalSpending
      : 0;

    setStats({
      total_spending: totalSpending,
      weekly_spending: weeklySpending,
      daily_spending: dailySpending,
      member_count: members.length,
      avg_spend_per_member:
        members.length > 0 ? totalSpending / members.length : 0,
      rank,
      points: totalSpending,
      points_to_next_rank: pointsToNext,
      next_rank_team: nextTeam?.team_name || "N/A",
    });
  };

  const loadCompetitors = async (teamId: string) => {
    const { data: allTeams } = await supabase
      .from("challenge_teams")
      .select(
        `
        id,
        team_name,
        total_team_spending,
        member_count,
        current_score
      `,
      )
      .eq("challenge_id", challengeId)
      .neq("id", teamId)
      .order("total_team_spending", { ascending: false })
      .limit(5);

    const competitors: CompetitorTeam[] = (allTeams || []).map((t, i) => ({
      team_id: t.id,
      team_name: t.team_name,
      total_spending: t.total_team_spending || 0,
      member_count: t.member_count,
      rank: i + 1,
      spending_difference:
        (stats?.total_spending || 0) - (t.total_team_spending || 0),
      trend:
        t.total_team_spending > (t.total_team_spending || 0) ? "up" : "stable",
    }));

    setCompetitors(competitors);
  };

  const loadSpendingHistory = async (teamId: string) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { data: spending } = await supabase
      .from("challenge_team_spending")
      .select("amount_spent, spending_date")
      .eq("team_id", teamId)
      .gte("spending_date", thirtyDaysAgo.toISOString())
      .order("spending_date", { ascending: true });

    // Group by date
    const dailyTotals = (spending || []).reduce((acc: any, s) => {
      const date = format(new Date(s.spending_date), "MMM dd");
      acc[date] = (acc[date] || 0) + s.amount_spent;
      return acc;
    }, {});

    const chartData = Object.entries(dailyTotals).map(([date, amount]) => ({
      date,
      amount,
    }));

    setSpendingHistory(chartData);
  };

  const loadMessages = async (teamId: string) => {
    const { data: msgs } = await supabase
      .from("challenge_team_messages")
      .select(
        `
        *,
        sender:sender_id(full_name)
      `,
      )
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(50);

    setMessages(
      (msgs || []).reverse().map((m) => ({
        id: m.id,
        sender_id: m.sender_id,
        sender_name: m.sender?.full_name || "System",
        message: m.message,
        message_type: m.message_type,
        created_at: m.created_at,
        is_system: m.message_type === "system",
      })),
    );
  };

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!team?.id) return;

    const messageChannel = supabase
      .channel(`team-chat-${team.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "challenge_team_messages",
          filter: `team_id=eq.${team.id}`,
        },
        (payload) => {
          loadMessages(team.id);
          if (activeTab !== "chat") {
            setUnreadMessages((prev) => prev + 1);
            // Show notification
            toast.message("New team message", {
              description: `${payload.new.sender?.full_name}: ${payload.new.message}`,
            });
          }
        },
      )
      .subscribe();

    const spendingChannel = supabase
      .channel(`team-spending-${team.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "challenge_team_spending",
          filter: `team_id=eq.${team.id}`,
        },
        () => {
          loadTeamStats(team.id);
          loadSpendingHistory(team.id);
          loadCompetitors(team.id);
        },
      )
      .subscribe();

    return () => {
      messageChannel.unsubscribe();
      spendingChannel.unsubscribe();
    };
  }, [team?.id, supabase, activeTab]);

  // Auto-scroll chat
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !profile?.id) return;

    setSending(true);
    try {
      const { error } = await supabase.from("challenge_team_messages").insert({
        challenge_id: challengeId,
        team_id: team.id,
        sender_id: profile.id,
        message: newMessage,
        message_type: "text",
      });

      if (error) throw error;

      setNewMessage("");
      loadMessages(team.id);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const { error } = await supabase
        .from("challenge_teams")
        .update({
          ...teamSettings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", team.id);

      if (error) throw error;

      toast.success("Team settings updated!");
      setShowSettings(false);
      loadTeamData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await supabase
        .from("challenge_participants")
        .update({ team_id: null })
        .eq("challenge_id", challengeId)
        .eq("user_id", userId);

      // Send system message
      await supabase.from("challenge_team_messages").insert({
        challenge_id: challengeId,
        team_id: team.id,
        message: `${members.find((m) => m.user_id === userId)?.full_name} has been removed from the team`,
        message_type: "system",
      });

      toast.success("Member removed");
      loadTeamData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLeaveTeam = async () => {
    if (
      !confirm(
        "Are you sure you want to leave the team? Your contributions will be lost.",
      )
    )
      return;

    try {
      await supabase
        .from("challenge_participants")
        .update({ team_id: null })
        .eq("challenge_id", challengeId)
        .eq("user_id", profile?.id);

      toast.success("You've left the team");
      router.push(`/challenges/${challengeId}/teams/discover`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const copyTeamCode = () => {
    navigator.clipboard.writeText(team?.team_code || "");
    toast.success("Team code copied!");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Team Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-6 w-6" />
              <Badge className="bg-white/20 text-white">
                Rank #{stats?.rank || "?"}
              </Badge>
              {team?.is_recruiting && (
                <Badge className="bg-green-500/20 text-green-200">
                  <UserPlus className="h-3 w-3 mr-1" />
                  Recruiting
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold">{team?.team_name}</h1>
            <p className="text-white/80 mt-1">{team?.team_description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span>
                Code:{" "}
                <span className="font-mono font-bold">{team?.team_code}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={copyTeamCode}
              >
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            {isTeamLeader && (
              <Button variant="secondary" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Team Settings
              </Button>
            )}
            {!isTeamLeader && (
              <Button variant="destructive" onClick={handleLeaveTeam}>
                Leave Team
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              KSH {stats?.total_spending?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-muted-foreground">Total Team Spending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              KSH {stats?.weekly_spending?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.member_count || 0}</p>
            <p className="text-xs text-muted-foreground">Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              KSH {stats?.avg_spend_per_member?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-muted-foreground">Avg Per Member</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(tab) => {
          setActiveTab(tab);
          if (tab === "chat") setUnreadMessages(0);
        }}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="competition">
            <Swords className="h-4 w-4 mr-2" />
            Competition
          </TabsTrigger>
          <TabsTrigger value="chat" className="relative">
            <MessageSquare className="h-4 w-4 mr-2" />
            Team Chat
            {unreadMessages > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                {unreadMessages}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Spending Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Spending History (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={spendingHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: "#8B5CF6" }}
                    name="KSH Spent"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Member Contributions */}
            <Card>
              <CardHeader>
                <CardTitle>Member Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={memberContributions}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} (${(percent || 0 * 100).toFixed(0)}%)`
                      }
                    >
                      {memberContributions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Rank Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Rank Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-600">
                    #{stats?.rank}
                  </p>
                  <p className="text-sm text-muted-foreground">Current Rank</p>
                </div>

                {stats?.points_to_next_rank && stats.points_to_next_rank > 0 ? (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Next: {stats.next_rank_team}</span>
                      <span>
                        +KSH {stats.points_to_next_rank.toLocaleString()} needed
                      </span>
                    </div>
                    <Progress
                      value={
                        (stats.total_spending /
                          (stats.total_spending + stats.points_to_next_rank)) *
                        100
                      }
                    />
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                    <p className="font-bold">You're in 1st place!</p>
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  <h4 className="font-semibold text-sm">Quick Actions</h4>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push("/shop")}
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Shop to Contribute
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setActiveTab("competition")}
                  >
                    <Swords className="h-4 w-4 mr-2" />
                    View Competitors
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Team Members ({members.length})</CardTitle>
                {isTeamLeader && (
                  <Button
                    onClick={() =>
                      router.push(
                        `/challenges/${challengeId}/teams/discover?tab=recruits`,
                      )
                    }
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Members
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => (
                  <Card key={member.user_id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center">
                              <span className="text-lg font-bold text-purple-700">
                                {member.full_name?.[0] || "?"}
                              </span>
                            </div>
                            {member.role === "leader" && (
                              <Crown className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold">{member.full_name}</h4>
                              {member.role === "leader" && (
                                <Badge className="bg-yellow-100 text-yellow-700">
                                  Team Leader
                                </Badge>
                              )}
                              <Badge
                                className={cn(
                                  member.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700",
                                )}
                              >
                                {member.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Spent</p>
                                <p className="font-bold">
                                  KSH {member.total_spent?.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Orders</p>
                                <p className="font-bold">
                                  {member.total_orders}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Contribution
                                </p>
                                <p className="font-bold">
                                  {member.contribution_percentage?.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                            {member.last_purchase_date && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Last purchase:{" "}
                                {formatDistanceToNow(
                                  new Date(member.last_purchase_date),
                                )}{" "}
                                ago
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Contribution Bar */}
                        <div className="w-full md:w-48">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Contribution</span>
                            <span>
                              {member.contribution_percentage?.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={member.contribution_percentage} />
                        </div>

                        {/* Actions */}
                        {isTeamLeader && member.role !== "leader" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Pending Invitations</h4>
                  <div className="space-y-2">
                    {pendingInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">
                            {invite.sender?.full_name} invited{" "}
                            {invite.recipient?.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(invite.created_at))}{" "}
                            ago
                          </p>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competition Tab */}
        <TabsContent value="competition">
          <div className="space-y-6">
            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="h-5 w-5" />
                  Team Competition Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competitors.map((competitor, idx) => {
                    const isAhead = competitor.spending_difference > 0;
                    const diff = Math.abs(competitor.spending_difference);

                    return (
                      <div
                        key={competitor.team_id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg",
                          competitor.team_id === team?.id
                            ? "bg-purple-50 border border-purple-200"
                            : "bg-muted/30",
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-muted-foreground w-8">
                            {idx === 0
                              ? "🥇"
                              : idx === 1
                                ? "🥈"
                                : idx === 2
                                  ? "🥉"
                                  : `#${idx + 1}`}
                          </div>
                          <div>
                            <h4 className="font-bold">
                              {competitor.team_name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {competitor.member_count} members
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold">
                            KSH {competitor.total_spending?.toLocaleString()}
                          </p>
                          {competitor.team_id !== team?.id && (
                            <p
                              className={cn(
                                "text-sm",
                                isAhead ? "text-green-600" : "text-red-600",
                              )}
                            >
                              {isAhead ? (
                                <span className="flex items-center gap-1">
                                  <ArrowUp className="h-3 w-3" />
                                  Ahead by KSH {diff.toLocaleString()}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <ArrowDown className="h-3 w-3" />
                                  Behind by KSH {diff.toLocaleString()}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Competition Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          name: "Your Team",
                          spending: stats?.total_spending || 0,
                        },
                        ...competitors.slice(0, 4).map((c) => ({
                          name: c.team_name,
                          spending: c.total_spending,
                        })),
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="spending"
                        fill="#8B5CF6"
                        name="Total Spending (KSH)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Competitive Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats && competitors.length > 0 && (
                    <>
                      <div className="p-3 rounded-lg bg-green-50">
                        <p className="font-medium text-green-700">
                          Your Advantage
                        </p>
                        <p className="text-sm text-green-600">
                          {stats.avg_spend_per_member >
                          (competitors[0]?.total_spending || 0) /
                            (competitors[0]?.member_count || 1)
                            ? "Your team has higher average spending per member!"
                            : "Focus on increasing individual member contributions"}
                        </p>
                      </div>

                      {stats.points_to_next_rank > 0 &&
                        stats.points_to_next_rank < 5000 && (
                          <div className="p-3 rounded-lg bg-yellow-50 animate-pulse">
                            <p className="font-medium text-yellow-700">
                              <Zap className="h-4 w-4 inline mr-1" />
                              Close to overtaking!
                            </p>
                            <p className="text-sm text-yellow-600">
                              Just KSH{" "}
                              {stats.points_to_next_rank.toLocaleString()} to
                              reach next rank
                            </p>
                          </div>
                        )}

                      <Button
                        className="w-full"
                        onClick={() => router.push("/shop")}
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Shop Now to Gain Rank
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Team Chat
                </CardTitle>
                <Badge variant="outline">{messages.length} messages</Badge>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      msg.sender_id === profile?.id
                        ? "justify-end"
                        : "justify-start",
                    )}
                  >
                    {msg.sender_id !== profile?.id && (
                      <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-purple-700">
                          {msg.sender_name?.[0] || "?"}
                        </span>
                      </div>
                    )}

                    <div
                      className={cn("max-w-[70%]", msg.is_system && "w-full")}
                    >
                      {msg.is_system ? (
                        <div className="text-center py-2">
                          <Badge variant="secondary" className="text-xs">
                            {msg.message}
                          </Badge>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "rounded-lg p-3",
                            msg.sender_id === profile?.id
                              ? "bg-purple-600 text-white"
                              : "bg-muted",
                          )}
                        >
                          {msg.sender_id !== profile?.id && (
                            <p className="text-xs font-bold text-purple-600 mb-1">
                              {msg.sender_name}
                            </p>
                          )}
                          <p className="text-sm">{msg.message}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              msg.sender_id === profile?.id
                                ? "text-purple-200"
                                : "text-muted-foreground",
                            )}
                          >
                            {format(new Date(msg.created_at), "h:mm a")}
                          </p>
                        </div>
                      )}
                    </div>

                    {msg.sender_id === profile?.id && (
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {profile?.full_name?.[0] || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {!autoScroll && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setAutoScroll(true);
                    messagesEndRef.current?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                >
                  Scroll to latest
                </Button>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Team Settings</DialogTitle>
            <DialogDescription>
              Configure your team's preferences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Open for Recruitment</Label>
                <p className="text-xs text-muted-foreground">
                  Allow new members to find and request to join
                </p>
              </div>
              <Button
                variant={teamSettings.is_recruiting ? "default" : "outline"}
                onClick={() =>
                  setTeamSettings({
                    ...teamSettings,
                    is_recruiting: !teamSettings.is_recruiting,
                  })
                }
              >
                {teamSettings.is_recruiting ? (
                  <Unlock className="h-4 w-4 mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                {teamSettings.is_recruiting ? "Open" : "Closed"}
              </Button>
            </div>

            <div>
              <Label>Team Description</Label>
              <Textarea
                value={teamSettings.team_description}
                onChange={(e) =>
                  setTeamSettings({
                    ...teamSettings,
                    team_description: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Minimum Spend Requirement (KSH)</Label>
              <Input
                type="number"
                value={teamSettings.min_spend_requirement}
                onChange={(e) =>
                  setTeamSettings({
                    ...teamSettings,
                    min_spend_requirement: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <Label>Tags</Label>
              <Input
                placeholder="e.g., competitive, friendly, daily-shoppers"
                value={teamSettings.tags.join(", ")}
                onChange={(e) =>
                  setTeamSettings({
                    ...teamSettings,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Private Team</Label>
                <p className="text-xs text-muted-foreground">
                  Only show team to members and invitees
                </p>
              </div>
              <Button
                variant={teamSettings.is_private ? "default" : "outline"}
                onClick={() =>
                  setTeamSettings({
                    ...teamSettings,
                    is_private: !teamSettings.is_private,
                  })
                }
              >
                {teamSettings.is_private ? (
                  <Eye className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {teamSettings.is_private ? "Private" : "Public"}
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSettings}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
