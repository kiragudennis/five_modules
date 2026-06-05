// app/(store)/challenges/[challengeId]/teams/discover/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  Search,
  Star,
  TrendingUp,
  Calendar,
  Clock,
  DollarSign,
  Activity,
  Shield,
  Crown,
  MessageSquare,
  Target,
  Loader2,
  ArrowRight,
  Check,
  X,
  Filter,
  Zap,
  Award,
  UserCheck,
  UserX,
  ShoppingBag,
  BarChart3,
  Flame,
  Trophy,
  HandshakeIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { RecruitProfile, TeamProfile } from "@/types/challenges";

export default function TeamDiscoveryPage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const router = useRouter();
  const { supabase, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<TeamProfile[]>([]);
  const [recruits, setRecruits] = useState<RecruitProfile[]>([]);
  const [activeTab, setActiveTab] = useState("teams");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [minSpendFilter, setMinSpendFilter] = useState(0);

  // My team info
  const [myTeam, setMyTeam] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  // Dialog states
  const [selectedTeam, setSelectedTeam] = useState<TeamProfile | null>(null);
  const [selectedRecruit, setSelectedRecruit] = useState<RecruitProfile | null>(
    null,
  );
  const [teamDetailOpen, setTeamDetailOpen] = useState(false);
  const [recruitDetailOpen, setRecruitDetailOpen] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [sending, setSending] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load teams
      const { data: teamsData } = await supabase
        .from("challenge_teams")
        .select(
          `
          *,
          leader:team_leader_id(id, full_name),
          participants:challenge_participants(
            user_id,
            users:user_id(full_name, status),
            joined_at
          ),
          achievements:challenge_team_achievements(*)
        `,
        )
        .eq("challenge_id", challengeId)
        .order("current_score", { ascending: false });

      // Enrich team data with spending info
      const enrichedTeams = await Promise.all(
        (teamsData || []).map(async (team) => {
          const { data: spending } = await supabase
            .from("challenge_team_spending")
            .select("amount_spent")
            .eq("team_id", team.id);

          const { data: recentSpending } = await supabase
            .from("challenge_team_spending")
            .select("amount_spent")
            .eq("team_id", team.id)
            .gte(
              "spending_date",
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            );

          const totalSpending =
            spending?.reduce((sum, s) => sum + s.amount_spent, 0) || 0;
          const weekSpending =
            recentSpending?.reduce((sum, s) => sum + s.amount_spent, 0) || 0;

          return {
            team,
            leader: team.leader,
            members: team.participants || [],
            achievements: team.achievements || [],
            recent_spending: weekSpending,
            avg_member_spend:
              team.participants?.length > 0
                ? totalSpending / team.participants.length
                : 0,
          };
        }),
      );

      setTeams(enrichedTeams);

      // Load recruiting profiles
      const { data: profiles } = await supabase
        .from("challenge_team_profiles")
        .select(
          `
          *,
          users:user_id(
            full_name,
            email,
            status,
            metadata
          )
        `,
        )
        .eq("challenge_id", challengeId)
        .eq("is_seeking_team", true);

      // Enrich profiles with order stats
      const enrichedProfiles = await Promise.all(
        (profiles || []).map(async (prof) => {
          const { data: orders } = await supabase
            .from("orders")
            .select("total_amount, created_at")
            .eq("user_id", prof.user_id)
            .eq("payment_status", "completed")
            .order("created_at", { ascending: false });

          return {
            ...prof,
            full_name: prof.users?.full_name,
            email: prof.users?.email,
            status: prof.users?.status,
            total_orders: orders?.length || 0,
            total_spent:
              orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0,
            avg_order_value:
              orders && orders?.length > 0
                ? orders.reduce((sum, o) => sum + o.total_amount, 0) /
                  orders.length
                : 0,
            last_order_date: orders?.[0]?.created_at,
          };
        }),
      );

      setRecruits(enrichedProfiles);

      // Load my team if joined
      if (profile?.id) {
        const { data: participant } = await supabase
          .from("challenge_participants")
          .select("team_id")
          .eq("challenge_id", challengeId)
          .eq("user_id", profile.id)
          .single();

        if (participant?.team_id) {
          const { data: team } = await supabase
            .from("challenge_teams")
            .select("*")
            .eq("id", participant.team_id)
            .single();
          setMyTeam(team);
        }

        // Load pending requests
        const { data: requests } = await supabase
          .from("challenge_team_invitations")
          .select(
            `
            *,
            team:team_id(team_name),
            sender:sender_id(full_name),
            recipient:recipient_id(full_name)
          `,
          )
          .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
          .eq("challenge_id", challengeId)
          .eq("status", "pending");

        setMyRequests(requests || []);
      }
    } catch (error) {
      console.error("Error loading team data:", error);
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  }, [challengeId, supabase, profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`team-discovery-${challengeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenge_team_invitations",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => loadData(),
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [challengeId, supabase, loadData]);

  const handleInviteToTeam = async (recruitId: string) => {
    if (!myTeam || !profile?.id) {
      toast.error("You need to be in a team first!");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from("challenge_team_invitations")
        .insert({
          challenge_id: challengeId,
          team_id: myTeam.id,
          sender_id: profile.id,
          recipient_id: recruitId,
          invitation_type: "team_invite",
          message: inviteMessage,
        });

      if (error) throw error;

      toast.success("Invitation sent!");
      setInviteMessage("");
      setRecruitDetailOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const handleRequestToJoin = async (teamId: string) => {
    if (!profile?.id) {
      router.push("/login");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from("challenge_team_invitations")
        .insert({
          challenge_id: challengeId,
          team_id: teamId,
          sender_id: profile.id,
          recipient_id: (
            await supabase
              .from("challenge_teams")
              .select("team_leader_id")
              .eq("id", teamId)
              .single()
          ).data?.team_leader_id,
          invitation_type: "join_request",
          message: inviteMessage,
        });

      if (error) throw error;

      toast.success("Join request sent!");
      setInviteMessage("");
      setTeamDetailOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("challenge_team_invitations")
        .update({
          status: "accepted",
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitationId);

      if (error) throw error;

      // Join the team
      const invitation = myRequests.find((r) => r.id === invitationId);
      if (invitation) {
        await supabase
          .from("challenge_participants")
          .update({ team_id: invitation.team_id })
          .eq("challenge_id", challengeId)
          .eq("user_id", profile?.id);

        // Update team member count
        await supabase.rpc("increment_team_score", {
          p_team_id: invitation.team_id,
          p_points: 0,
        });
      }

      toast.success("Joined team successfully!");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await supabase
        .from("challenge_team_invitations")
        .update({
          status: "rejected",
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitationId);

      toast.success("Invitation declined");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getCategoryBadge = (category: string) => {
    const categories: Record<string, { label: string; color: string }> = {
      competitive: { label: "Competitive", color: "bg-red-100 text-red-700" },
      casual: { label: "Casual", color: "bg-green-100 text-green-700" },
      newbie_friendly: {
        label: "Newbie Friendly",
        color: "bg-blue-100 text-blue-700",
      },
      high_rollers: {
        label: "High Rollers",
        color: "bg-purple-100 text-purple-700",
      },
      balanced: { label: "Balanced", color: "bg-yellow-100 text-yellow-700" },
    };
    return categories[category] || categories.balanced;
  };

  const getStatusBadge = (status: string) => {
    return status === "active"
      ? {
          icon: UserCheck,
          label: "Active",
          color: "bg-green-100 text-green-700",
        }
      : { icon: UserX, label: "Inactive", color: "bg-gray-100 text-gray-700" };
  };

  const filteredTeams = teams.filter(
    (team) =>
      (categoryFilter === "all" ||
        team.team.team_category === categoryFilter) &&
      team.avg_member_spend >= minSpendFilter &&
      (team.team.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.team.team_description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        team.team.tags?.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        )),
  );

  const filteredRecruits = recruits.filter(
    (recruit) =>
      recruit.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recruit.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recruit.preferred_role?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Team Discovery</h1>
        <p className="text-muted-foreground">
          Find the perfect team or recruit members to compete together
        </p>
      </div>

      {/* My Team Status */}
      {myTeam && (
        <Card className="mb-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Your Team: {myTeam.team_name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Team Code:{" "}
                  <span className="font-mono font-bold">
                    {myTeam.team_code}
                  </span>
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  /* Open team management */
                }}
              >
                Manage Team
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      {myRequests.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">
              Pending Invitations ({myRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium">
                    {request.invitation_type === "team_invite"
                      ? `${request.sender?.full_name} invited you to ${request.team?.team_name}`
                      : `You requested to join ${request.team?.team_name}`}
                  </p>
                  {request.message && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {request.message}
                    </p>
                  )}
                </div>
                {request.invitation_type === "team_invite" &&
                  request.recipient_id === profile?.id && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptInvitation(request.id)}
                      >
                        <Check className="h-4 w-4 mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineInvitation(request.id)}
                      >
                        <X className="h-4 w-4 mr-1" /> Decline
                      </Button>
                    </div>
                  )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="teams">
            <Users className="h-4 w-4 mr-2" />
            Browse Teams ({teams.length})
          </TabsTrigger>
          <TabsTrigger value="recruits">
            <UserPlus className="h-4 w-4 mr-2" />
            Find Members ({recruits.length})
          </TabsTrigger>
          {!myTeam && (
            <TabsTrigger value="create">
              <Star className="h-4 w-4 mr-2" />
              Create Team
            </TabsTrigger>
          )}
        </TabsList>

        {/* Search & Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                activeTab === "teams" ? "Search teams..." : "Search members..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {activeTab === "teams" && (
            <>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-44">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="competitive">Competitive</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="newbie_friendly">
                    Newbie Friendly
                  </SelectItem>
                  <SelectItem value="high_rollers">High Rollers</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={minSpendFilter.toString()}
                onValueChange={(v) => setMinSpendFilter(parseInt(v))}
              >
                <SelectTrigger className="w-44">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Min Spend" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No Minimum</SelectItem>
                  <SelectItem value="1000">1,000+ KSH</SelectItem>
                  <SelectItem value="5000">5,000+ KSH</SelectItem>
                  <SelectItem value="10000">10,000+ KSH</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        {/* Teams Tab */}
        <TabsContent value="teams">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((teamProfile) => (
              <Card
                key={teamProfile.team.id}
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => {
                  setSelectedTeam(teamProfile);
                  setTeamDetailOpen(true);
                }}
              >
                <CardContent className="p-6">
                  {/* Team Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">
                        {teamProfile.team.team_name}
                      </h3>
                      <Badge
                        className={cn(
                          "mt-1",
                          getCategoryBadge(teamProfile.team.team_category)
                            .color,
                        )}
                      >
                        {getCategoryBadge(teamProfile.team.team_category).label}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">
                        #{teams.indexOf(teamProfile) + 1}
                      </p>
                      <p className="text-xs text-muted-foreground">Rank</p>
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-lg font-bold">
                        {teamProfile.team.member_count}
                      </p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-lg font-bold">
                        {teamProfile.team.current_score?.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Points</p>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-lg font-bold">
                        KSH{" "}
                        {teamProfile.team.total_team_spending?.toLocaleString() ||
                          0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Spent
                      </p>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-lg font-bold">
                        KSH {teamProfile.recent_spending?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">This Week</p>
                    </div>
                  </div>

                  {/* Team Tags */}
                  {teamProfile.team.tags &&
                    teamProfile.team.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {teamProfile.team.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                  {/* Team Members Preview */}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {teamProfile.members.slice(0, 3).map((member, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center border-2 border-white"
                          title={member.full_name}
                        >
                          <span className="text-xs font-bold text-purple-700">
                            {member.full_name?.[0] || "?"}
                          </span>
                        </div>
                      ))}
                      {teamProfile.members.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white">
                          <span className="text-xs font-bold text-gray-600">
                            +{teamProfile.members.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recruits Tab */}
        <TabsContent value="recruits">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecruits.map((recruit) => {
              const StatusIcon = getStatusBadge(recruit.status).icon;
              const statusColor = getStatusBadge(recruit.status).color;

              return (
                <Card
                  key={recruit.user_id}
                  className="hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedRecruit(recruit);
                    setRecruitDetailOpen(true);
                  }}
                >
                  <CardContent className="p-6">
                    {/* Recruit Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-purple-700">
                          {recruit.full_name?.[0] || "?"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{recruit.full_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn("text-xs", statusColor)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {getStatusBadge(recruit.status).label}
                          </Badge>
                          {recruit.preferred_role && (
                            <Badge variant="outline" className="text-xs">
                              {recruit.preferred_role}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recruit Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 rounded bg-muted/50">
                        <p className="font-bold">{recruit.total_orders}</p>
                        <p className="text-xs text-muted-foreground">Orders</p>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/50">
                        <p className="font-bold">
                          KSH {recruit.total_spent?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/50">
                        <p className="font-bold">
                          KSH{" "}
                          {Math.round(
                            recruit.avg_order_value,
                          )?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Avg</p>
                      </div>
                    </div>

                    {/* Account Info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{recruit.account_age_days}d old</span>
                      </div>
                      {recruit.last_order_date && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Active{" "}
                            {formatDistanceToNow(
                              new Date(recruit.last_order_date),
                            )}{" "}
                            ago
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    {recruit.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {recruit.bio}
                      </p>
                    )}

                    {/* Action Button */}
                    {myTeam && recruit.user_id !== profile?.id && (
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInviteToTeam(recruit.user_id);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite to Team
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Create Team Tab */}
        <TabsContent value="create">
          <CreateTeamForm
            challengeId={challengeId}
            onCreated={() => {
              loadData();
              setActiveTab("teams");
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Team Detail Dialog */}
      <Dialog open={teamDetailOpen} onOpenChange={setTeamDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedTeam && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTeam.team.team_name}</DialogTitle>
                <DialogDescription>
                  Team details and member information
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Team Description */}
                {selectedTeam.team.team_description && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm">
                      {selectedTeam.team.team_description}
                    </p>
                  </div>
                )}

                {/* Team Stats Detailed */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-purple-50">
                    <Trophy className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-xl font-bold">
                      {selectedTeam.team.current_score?.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total Points
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50">
                    <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-1" />
                    <p className="text-xl font-bold">
                      KSH{" "}
                      {selectedTeam.team.total_team_spending?.toLocaleString() ||
                        0}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-50">
                    <TrendingUp className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-xl font-bold">
                      KSH {selectedTeam.recent_spending?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </div>
                </div>

                {/* Achievements */}
                {selectedTeam.achievements &&
                  selectedTeam.achievements.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Team Achievements
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedTeam.achievements.map((achievement, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="justify-start"
                          >
                            <Star className="h-3 w-3 mr-1 text-yellow-500" />
                            {achievement.achievement_type.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Members List */}
                <div>
                  <h4 className="font-semibold mb-3">
                    Members ({selectedTeam.members.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedTeam.members.map((member) => (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                            <span className="font-bold text-purple-700">
                              {member.full_name?.[0] || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined{" "}
                              {formatDistanceToNow(new Date(member.joined_at))}{" "}
                              ago
                            </p>
                          </div>
                        </div>
                        {member.user_id === selectedTeam.leader?.id && (
                          <Badge className="bg-yellow-100 text-yellow-700">
                            <Crown className="h-3 w-3 mr-1" />
                            Leader
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Join Request */}
                {!myTeam && profile?.id && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Write a message to the team leader..."
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      onClick={() => handleRequestToJoin(selectedTeam.team.id)}
                      disabled={sending}
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <HandshakeIcon className="h-4 w-4 mr-2" />
                      )}
                      Request to Join Team
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Recruit Detail Dialog */}
      <Dialog open={recruitDetailOpen} onOpenChange={setRecruitDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedRecruit && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRecruit.full_name}</DialogTitle>
                <DialogDescription>
                  Member profile and statistics
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Status & Role */}
                <div className="flex gap-2">
                  <Badge
                    className={getStatusBadge(selectedRecruit.status).color}
                  >
                    {getStatusBadge(selectedRecruit.status).label}
                  </Badge>
                  {selectedRecruit.preferred_role && (
                    <Badge variant="outline">
                      {selectedRecruit.preferred_role}
                    </Badge>
                  )}
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <ShoppingBag className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-xl font-bold">
                      {selectedRecruit.total_orders}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total Orders
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-1" />
                    <p className="text-xl font-bold">
                      KSH {selectedRecruit.total_spent?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <BarChart3 className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-xl font-bold">
                      KSH{" "}
                      {Math.round(
                        selectedRecruit.avg_order_value,
                      )?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Order</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <Clock className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                    <p className="text-xl font-bold">
                      {selectedRecruit.account_age_days}d
                    </p>
                    <p className="text-xs text-muted-foreground">Account Age</p>
                  </div>
                </div>

                {/* Bio */}
                {selectedRecruit.bio && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">About</h4>
                    <p className="text-sm">{selectedRecruit.bio}</p>
                  </div>
                )}

                {/* Invite to Team */}
                {myTeam && selectedRecruit.user_id !== profile?.id && (
                  <div className="space-y-3">
                    <Label>Send a message with your invitation</Label>
                    <Textarea
                      placeholder="Hey! I think you'd be a great addition to our team..."
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      onClick={() =>
                        handleInviteToTeam(selectedRecruit.user_id)
                      }
                      disabled={sending}
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Invite to Your Team
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create Team Form Component
function CreateTeamForm({
  challengeId,
  onCreated,
}: {
  challengeId: string;
  onCreated: () => void;
}) {
  const { supabase, profile } = useAuth();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    team_name: "",
    team_description: "",
    team_category: "balanced",
    is_recruiting: true,
    min_spend_requirement: 0,
    tags: [] as string[],
  });

  const handleCreate = async () => {
    if (!profile?.id) {
      router.push("/login");
      return;
    }

    if (!formData.team_name.trim()) {
      toast.error("Team name is required");
      return;
    }

    setCreating(true);
    try {
      // Create team
      const { data: team, error: teamError } = await supabase
        .from("challenge_teams")
        .insert({
          challenge_id: challengeId,
          team_leader_id: profile.id,
          team_name: formData.team_name,
          team_description: formData.team_description,
          team_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          team_category: formData.team_category,
          is_recruiting: formData.is_recruiting,
          min_spend_requirement: formData.min_spend_requirement,
          tags: formData.tags,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Join as first member
      await supabase.from("challenge_participants").upsert({
        challenge_id: challengeId,
        user_id: profile.id,
        team_id: team.id,
      });

      toast.success("Team created successfully!");
      onCreated();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Your Team</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Team Name *</Label>
          <Input
            placeholder="Enter a unique team name"
            value={formData.team_name}
            onChange={(e) =>
              setFormData({ ...formData, team_name: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            placeholder="Describe your team's goals and what kind of members you're looking for"
            value={formData.team_description}
            onChange={(e) =>
              setFormData({ ...formData, team_description: e.target.value })
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Team Category</Label>
            <Select
              value={formData.team_category}
              onValueChange={(v) =>
                setFormData({ ...formData, team_category: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="competitive">Competitive</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="newbie_friendly">Newbie Friendly</SelectItem>
                <SelectItem value="high_rollers">High Rollers</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Min Spend Requirement (KSH)</Label>
            <Input
              type="number"
              placeholder="0 = no minimum"
              value={formData.min_spend_requirement}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  min_spend_requirement: parseInt(e.target.value),
                })
              }
            />
          </div>
        </div>
        <div>
          <Label>Tags (comma-separated)</Label>
          <Input
            placeholder="e.g., daily-shoppers, big-spenders, friendly"
            onChange={(e) =>
              setFormData({
                ...formData,
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
        <Button onClick={handleCreate} disabled={creating} className="w-full">
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Star className="h-4 w-4 mr-2" />
          )}
          Create Team
        </Button>
      </CardContent>
    </Card>
  );
}
