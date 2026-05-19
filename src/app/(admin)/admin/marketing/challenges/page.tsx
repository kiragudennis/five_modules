// app/(admin)/admin/marketing/challenges/page.tsx (Enhanced Version)

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Trophy,
  Users,
  ShoppingBag,
  Share2,
  Flame,
  UsersRound,
  Sparkles,
  Crown,
  Coins,
  Calendar,
  Clock,
  Target,
  Zap,
  Loader2,
  ExternalLink,
  Play,
  Pause,
  Flag,
  TrendingUp,
  Award,
  Heart,
  Save,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Challenge } from "@/types/challenges";

const CHALLENGE_TYPES = [
  {
    value: "referral",
    label: "Referral Challenge",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
    description: "Earn points for successful referrals",
  },
  {
    value: "purchase",
    label: "Purchase Challenge",
    icon: ShoppingBag,
    color: "from-green-500 to-emerald-500",
    description: "Earn points based on spending",
  },
  {
    value: "share",
    label: "Social Share Challenge",
    icon: Share2,
    color: "from-purple-500 to-pink-500",
    description: "Earn points for social shares",
  },
  {
    value: "streak",
    label: "Daily Streak Challenge",
    icon: Flame,
    color: "from-orange-500 to-red-500",
    description: "Maintain daily streaks for points",
  },
  {
    value: "team",
    label: "Team Challenge",
    icon: UsersRound,
    color: "from-indigo-500 to-purple-500",
    description: "Compete as a team",
  },
  {
    value: "combo",
    label: "Combo Challenge",
    icon: Sparkles,
    color: "from-yellow-500 to-orange-500",
    description: "Combine multiple actions for bonuses",
  },
  {
    value: "social",
    label: "Social Hashtag Challenge",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    description: "Earn points for hashtag usage",
  },
];

export default function AdminChallengesPage() {
  const { supabase } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [liveControlsOpen, setLiveControlsOpen] = useState(false);
  const [selectedLiveChallenge, setSelectedLiveChallenge] =
    useState<Challenge | null>(null);
  const [participantStats, setParticipantStats] = useState<any>(null);

  const fetchChallenges = useCallback(async () => {
    const { data } = await supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false });
    setChallenges(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const updateChallengeStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("challenges")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Challenge ${status}`);
      fetchChallenges();
    }
  };

  const deleteChallenge = async (id: string) => {
    if (confirm("Delete this challenge? This action cannot be undone.")) {
      const { error } = await supabase.from("challenges").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete challenge");
      } else {
        toast.success("Challenge deleted");
        fetchChallenges();
      }
    }
  };

  const openLiveControls = async (challenge: Challenge) => {
    setSelectedLiveChallenge(challenge);

    // Fetch participant stats
    const { data: participants } = await supabase
      .from("challenge_participants")
      .select("id")
      .eq("challenge_id", challenge.id);

    const { data: actions } = await supabase
      .from("challenge_actions")
      .select("points_awarded")
      .eq("challenge_id", challenge.id);

    const totalPoints =
      actions?.reduce((sum, a) => sum + (a.points_awarded || 0), 0) || 0;

    setParticipantStats({
      total_participants: participants?.length || 0,
      total_points_awarded: totalPoints,
    });

    setLiveControlsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: any;
      }
    > = {
      draft: { label: "Draft", variant: "secondary", icon: Eye },
      active: { label: "Active", variant: "default", icon: Play },
      paused: { label: "Paused", variant: "outline", icon: Pause },
      ended: { label: "Ended", variant: "secondary", icon: Flag },
      archived: { label: "Archived", variant: "destructive", icon: Archive },
    };
    const c = config[status] || config.draft;
    const Icon = c.icon;
    return (
      <Badge variant={c.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {c.label}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const found = CHALLENGE_TYPES.find((t) => t.value === type);
    if (found) {
      const Icon = found.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <Target className="h-4 w-4" />;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Challenges</h1>
          <p className="text-muted-foreground mt-1">
            Create competitions that drive engagement and reward customer
            actions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedChallenge(null)}>
              <Plus className="h-4 w-4 mr-2" />
              New Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedChallenge ? "Edit Challenge" : "Create New Challenge"}
              </DialogTitle>
              <DialogDescription>
                Configure your challenge details, scoring, and prizes
              </DialogDescription>
            </DialogHeader>
            <ChallengeForm
              initialChallenge={selectedChallenge}
              onSave={() => {
                fetchChallenges();
                setDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => {
          const isActive = challenge.status === "active";
          const isEnded = new Date(challenge.ends_at) < new Date();
          const isStarting = new Date(challenge.starts_at) > new Date();
          const typeConfig = CHALLENGE_TYPES.find(
            (t) => t.value === challenge.challenge_type,
          );

          return (
            <Card
              key={challenge.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {/* Header with gradient */}
              <div
                className={cn(
                  "h-32 bg-gradient-to-r p-4 text-white relative",
                  typeConfig?.color || "from-purple-500 to-pink-500",
                )}
              >
                <div className="absolute top-4 right-4">
                  {getStatusBadge(challenge.status)}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(challenge.challenge_type)}
                  <span className="text-sm opacity-90 capitalize">
                    {challenge.challenge_type}
                  </span>
                </div>
                <h3 className="text-xl font-bold">{challenge.name}</h3>
              </div>

              <CardContent className="p-4 space-y-4">
                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {challenge.description}
                </p>

                {/* Prize Tiers Preview */}
                <div className="flex flex-wrap gap-1">
                  {challenge.prize_tiers?.slice(0, 3).map((tier, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tier.rank === 1 && <Crown className="h-3 w-3 mr-1" />}
                      {tier.prize_type === "points" &&
                        `${tier.prize_value} pts`}
                      {tier.prize_type === "discount" &&
                        `${tier.prize_value}% off`}
                      {tier.prize_type === "badge" && tier.prize_value}
                    </Badge>
                  ))}
                  {(challenge.prize_tiers?.length || 0) > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{challenge.prize_tiers.length - 3} more
                    </Badge>
                  )}
                </div>

                {/* Schedule */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Starts:</span>
                    <span className="font-medium">
                      {isStarting
                        ? format(new Date(challenge.starts_at), "MMM d, h:mm a")
                        : "Now"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ends:</span>
                    <span
                      className={cn(isEnded ? "text-red-500" : "font-medium")}
                    >
                      {format(new Date(challenge.ends_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                </div>

                {/* Teams Indicator */}
                {challenge.allow_teams && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <UsersRound className="h-3 w-3" />
                    <span>
                      Team challenge • Max {challenge.max_team_size} per team
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link
                      href={`/challenges/live/${challenge.id}`}
                      target="_blank"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Live
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openLiveControls(challenge)}
                  >
                    <Target className="h-4 w-4 mr-1" />
                    Control
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedChallenge(challenge);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteChallenge(challenge.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick Status Actions */}
                {challenge.status === "draft" && (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() =>
                      updateChallengeStatus(challenge.id, "active")
                    }
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Activate Challenge
                  </Button>
                )}
                {challenge.status === "active" && !isEnded && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      updateChallengeStatus(challenge.id, "paused")
                    }
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Challenge
                  </Button>
                )}
                {challenge.status === "paused" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      updateChallengeStatus(challenge.id, "active")
                    }
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume Challenge
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {challenges.length === 0 && (
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No challenges yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first challenge to start engaging customers
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </DialogTrigger>
          </Dialog>
        </Card>
      )}

      {/* Live Controls Dialog */}
      <Dialog open={liveControlsOpen} onOpenChange={setLiveControlsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Live Controls: {selectedLiveChallenge?.name}
            </DialogTitle>
            <DialogDescription>
              Real-time challenge management during live streams
            </DialogDescription>
          </DialogHeader>

          {selectedLiveChallenge && (
            <LiveControls
              challenge={selectedLiveChallenge}
              stats={participantStats}
              onRefresh={() => {
                fetchChallenges();
                if (selectedLiveChallenge) {
                  openLiveControls(selectedLiveChallenge);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Challenge Form Component (Setup Wizard)
function ChallengeForm({
  initialChallenge,
  onSave,
}: {
  initialChallenge: Challenge | null;
  onSave: () => void;
}) {
  const { supabase } = useAuth();
  const [formData, setFormData] = useState<any>(() => {
    if (initialChallenge) return initialChallenge;

    const now = new Date();
    return {
      name: "",
      slug: "",
      description: "",
      challenge_type: "purchase",
      scoring_config: {
        points_per_ksh: 1,
        min_spend: 0,
      },
      prize_tiers: [
        { rank: 1, prize_type: "points", prize_value: 5000, badge: "champion" },
        { rank: 2, prize_type: "points", prize_value: 2500 },
        { rank: 3, prize_type: "points", prize_value: 1000 },
      ],
      starts_at: new Date(now.setHours(now.getHours() + 1))
        .toISOString()
        .slice(0, 16),
      ends_at: new Date(now.setDate(now.getDate() + 7))
        .toISOString()
        .slice(0, 16),
      status: "draft",
      allow_teams: false,
      max_team_size: 5,
      allow_team_switching: false,
      streak_reset_on_miss: true,
      streak_grace_days: 0,
      cover_image_url: "",
      theme_color: "#3B82F6",
      show_leaderboard: true,
      show_ticker: true,
      participation_points: 0,
    };
  });

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const updateScoringConfig = (key: string, value: any) => {
    setFormData({
      ...formData,
      scoring_config: { ...formData.scoring_config, [key]: value },
    });
  };

  const addPrizeTier = () => {
    const newRank = formData.prize_tiers.length + 1;
    setFormData({
      ...formData,
      prize_tiers: [
        ...formData.prize_tiers,
        { rank: newRank, prize_type: "points", prize_value: 500 },
      ],
    });
  };

  const removePrizeTier = (index: number) => {
    const newTiers = formData.prize_tiers.filter(
      (_: any, i: number) => i !== index,
    );
    newTiers.forEach((tier: any, idx: number) => (tier.rank = idx + 1));
    setFormData({ ...formData, prize_tiers: newTiers });
  };

  const updatePrizeTier = (index: number, field: string, value: any) => {
    const newTiers = [...formData.prize_tiers];
    newTiers[index][field] = value;
    setFormData({ ...formData, prize_tiers: newTiers });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const slug = formData.slug || generateSlug(formData.name);
      const { error } = await supabase
        .from("challenges")
        .upsert({
          ...formData,
          slug,
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      toast.success(
        initialChallenge ? "Challenge updated" : "Challenge created",
      );
      onSave();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const typeConfig = CHALLENGE_TYPES.find(
    (t) => t.value === formData.challenge_type,
  );

  return (
    <div className="space-y-6 py-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="prizes">Prizes</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Challenge Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  })
                }
                placeholder="e.g., Summer Sales Challenge"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="auto-generated"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              placeholder="Describe the challenge and what participants need to do..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Challenge Type *</Label>
              <Select
                value={formData.challenge_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, challenge_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CHALLENGE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {typeConfig && (
            <div
              className={cn(
                "p-4 rounded-lg bg-gradient-to-r text-white",
                typeConfig.color,
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <typeConfig.icon className="h-5 w-5" />
                <span className="font-semibold">{typeConfig.label}</span>
              </div>
              <p className="text-sm opacity-90">{typeConfig.description}</p>
            </div>
          )}
        </TabsContent>

        {/* Scoring Tab */}
        <TabsContent value="scoring" className="space-y-4 mt-4">
          {formData.challenge_type === "referral" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Points per Referral</Label>
                  <Input
                    type="number"
                    value={formData.scoring_config.points_per_referral || 100}
                    onChange={(e) =>
                      updateScoringConfig(
                        "points_per_referral",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Bonus for Top Referrer</Label>
                  <Input
                    type="number"
                    value={formData.scoring_config.bonus_for_top_referrer || 0}
                    onChange={(e) =>
                      updateScoringConfig(
                        "bonus_for_top_referrer",
                        parseInt(e.target.value),
                      )
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.challenge_type === "purchase" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Points per KSH Spent</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.scoring_config.points_per_ksh || 1}
                    onChange={(e) =>
                      updateScoringConfig(
                        "points_per_ksh",
                        parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Minimum Spend to Qualify</Label>
                  <Input
                    type="number"
                    value={formData.scoring_config.min_spend || 0}
                    onChange={(e) =>
                      updateScoringConfig(
                        "min_spend",
                        parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Double Points Hours (comma-separated, 0-23)</Label>
                <Input
                  placeholder="e.g., 18,19,20"
                  value={
                    formData.scoring_config.double_points_hours?.join(",") || ""
                  }
                  onChange={(e) =>
                    updateScoringConfig(
                      "double_points_hours",
                      e.target.value.split(",").map(Number),
                    )
                  }
                />
              </div>
            </div>
          )}

          {formData.challenge_type === "streak" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Points per Day</Label>
                  <Input
                    type="number"
                    value={formData.scoring_config.points_per_day || 50}
                    onChange={(e) =>
                      updateScoringConfig(
                        "points_per_day",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Days Required for Full Streak</Label>
                  <Input
                    type="number"
                    value={formData.scoring_config.days_required || 7}
                    onChange={(e) =>
                      updateScoringConfig(
                        "days_required",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Reset streak on missed day</Label>
                <Switch
                  checked={formData.streak_reset_on_miss}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, streak_reset_on_miss: checked })
                  }
                />
              </div>

              <div>
                <Label>Grace Days (days allowed to miss without reset)</Label>
                <Input
                  type="number"
                  value={formData.streak_grace_days || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      streak_grace_days: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          )}

          {formData.challenge_type === "team" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Points per Member Action</Label>
                  <Input
                    type="number"
                    value={
                      formData.scoring_config.points_per_member_action || 50
                    }
                    onChange={(e) =>
                      updateScoringConfig(
                        "points_per_member_action",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Bonus for Complete Team</Label>
                  <Input
                    type="number"
                    value={
                      formData.scoring_config.bonus_for_complete_team || 200
                    }
                    onChange={(e) =>
                      updateScoringConfig(
                        "bonus_for_complete_team",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Allow Teams</Label>
                <Switch
                  checked={formData.allow_teams}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allow_teams: checked })
                  }
                />
              </div>

              {formData.allow_teams && (
                <>
                  <div>
                    <Label>Max Team Size</Label>
                    <Input
                      type="number"
                      value={formData.max_team_size || 5}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_team_size: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Allow Team Switching</Label>
                    <Switch
                      checked={formData.allow_team_switching}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          allow_team_switching: checked,
                        })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {formData.challenge_type === "combo" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Referral Weight</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.scoring_config.weights?.referral || 2}
                    onChange={(e) =>
                      updateScoringConfig("weights", {
                        ...formData.scoring_config.weights,
                        referral: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Purchase Weight</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.scoring_config.weights?.purchase || 1}
                    onChange={(e) =>
                      updateScoringConfig("weights", {
                        ...formData.scoring_config.weights,
                        purchase: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Share Weight</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.scoring_config.weights?.share || 1.5}
                    onChange={(e) =>
                      updateScoringConfig("weights", {
                        ...formData.scoring_config.weights,
                        share: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Combo Multiplier</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.scoring_config.combo_multiplier || 1.5}
                    onChange={(e) =>
                      updateScoringConfig(
                        "combo_multiplier",
                        parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {formData.challenge_type === "social" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Points per Hashtag Post</Label>
                  <Input
                    type="number"
                    value={formData.scoring_config.points_per_hashtag || 75}
                    onChange={(e) =>
                      updateScoringConfig(
                        "points_per_hashtag",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Bonus for Verified Posts</Label>
                  <Input
                    type="number"
                    value={formData.scoring_config.bonus_for_verified || 25}
                    onChange={(e) =>
                      updateScoringConfig(
                        "bonus_for_verified",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Target Hashtag</Label>
                <Input
                  value={formData.scoring_config.target_hashtag || ""}
                  onChange={(e) =>
                    updateScoringConfig("target_hashtag", e.target.value)
                  }
                  placeholder="#SummerSaleChallenge"
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Label>Participation Points (for all participants)</Label>
            <Input
              type="number"
              value={formData.participation_points || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  participation_points: parseInt(e.target.value),
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Points awarded to everyone who participates, win or lose
            </p>
          </div>
        </TabsContent>

        {/* Prizes Tab */}
        <TabsContent value="prizes" className="space-y-4 mt-4">
          <div className="space-y-3">
            {formData.prize_tiers.map((tier: any, idx: number) => (
              <div
                key={idx}
                className="flex gap-3 items-center p-3 border rounded-lg"
              >
                <div className="w-16">
                  <Label className="text-sm">Rank {tier.rank}</Label>
                </div>
                <Select
                  value={tier.prize_type}
                  onValueChange={(value) =>
                    updatePrizeTier(idx, "prize_type", value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Points</SelectItem>
                    <SelectItem value="discount">Discount %</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                    <SelectItem value="badge">Badge</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Value"
                  value={tier.prize_value}
                  onChange={(e) =>
                    updatePrizeTier(idx, "prize_value", e.target.value)
                  }
                  className="w-32"
                />
                {tier.prize_type === "badge" && (
                  <Input
                    placeholder="Badge name"
                    value={tier.badge}
                    onChange={(e) =>
                      updatePrizeTier(idx, "badge", e.target.value)
                    }
                    className="flex-1"
                  />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePrizeTier(idx)}
                  disabled={formData.prize_tiers.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPrizeTier}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Prize Tier
            </Button>
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.starts_at?.slice(0, 16) || ""}
                onChange={(e) =>
                  setFormData({ ...formData, starts_at: e.target.value })
                }
              />
            </div>
            <div>
              <Label>End Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.ends_at?.slice(0, 16) || ""}
                onChange={(e) =>
                  setFormData({ ...formData, ends_at: e.target.value })
                }
              />
            </div>
          </div>
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display" className="space-y-4 mt-4">
          <div>
            <Label>Cover Image URL</Label>
            <Input
              value={formData.cover_image_url || ""}
              onChange={(e) =>
                setFormData({ ...formData, cover_image_url: e.target.value })
              }
              placeholder="https://..."
            />
          </div>
          <div>
            <Label>Theme Color</Label>
            <Input
              type="color"
              value={formData.theme_color || "#3B82F6"}
              onChange={(e) =>
                setFormData({ ...formData, theme_color: e.target.value })
              }
              className="w-20 h-10"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Show Leaderboard</Label>
            <Switch
              checked={formData.show_leaderboard}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, show_leaderboard: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Show Live Ticker</Label>
            <Switch
              checked={formData.show_ticker}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, show_ticker: checked })
              }
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={() => onSave()}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {initialChallenge ? "Update" : "Create"} Challenge
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Live Controls Component
function LiveControls({
  challenge,
  stats,
  onRefresh,
}: {
  challenge: Challenge;
  stats: any;
  onRefresh: () => void;
}) {
  const { supabase } = useAuth();
  const [adjusting, setAdjusting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [participants, setParticipants] = useState<any[]>([]);
  const [adjustmentValue, setAdjustmentValue] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const loadParticipants = useCallback(async () => {
    const { data } = await supabase
      .from("challenge_participants")
      .select("*, users!user_id(full_name, email)")
      .eq("challenge_id", challenge.id)
      .order("current_score", { ascending: false })
      .limit(50);
    setParticipants(data || []);
  }, [supabase, challenge.id]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  const handleAdjustScore = async () => {
    if (!selectedUserId || adjustmentValue === 0) return;

    setAdjusting(true);
    try {
      const { error } = await supabase.rpc("admin_adjust_challenge_score", {
        p_challenge_id: challenge.id,
        p_user_id: selectedUserId,
        p_adjustment: adjustmentValue,
        p_reason: adjustmentReason,
      });

      if (error) throw error;

      toast.success(
        `Score adjusted by ${adjustmentValue > 0 ? "+" : ""}${adjustmentValue}`,
      );
      setAdjustmentValue(0);
      setAdjustmentReason("");
      setSelectedUserId(null);
      loadParticipants();
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAdjusting(false);
    }
  };

  const handleEndEarly = async () => {
    if (confirm("Are you sure you want to end this challenge early?")) {
      const { error } = await supabase
        .from("challenges")
        .update({ status: "ended", ends_at: new Date().toISOString() })
        .eq("id", challenge.id);

      if (error) {
        toast.error("Failed to end challenge");
      } else {
        toast.success("Challenge ended");
        onRefresh();
      }
    }
  };

  const filteredParticipants = participants.filter(
    (p) =>
      p.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-muted text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold">{stats?.total_participants || 0}</p>
          <p className="text-xs text-muted-foreground">Participants</p>
        </div>
        <div className="p-3 rounded-lg bg-muted text-center">
          <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
          <p className="text-2xl font-bold">
            {stats?.total_points_awarded || 0}
          </p>
          <p className="text-xs text-muted-foreground">Points Awarded</p>
        </div>
        <div className="p-3 rounded-lg bg-muted text-center">
          <Calendar className="h-5 w-5 mx-auto mb-1 text-purple-500" />
          <p className="text-sm font-medium">
            {format(new Date(challenge.ends_at), "MMM d, h:mm a")}
          </p>
          <p className="text-xs text-muted-foreground">End Time</p>
        </div>
      </div>

      {/* Score Adjustment */}
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3">Manual Score Adjustment</h4>
        <div className="space-y-3">
          <div>
            <Label>Select Participant</Label>
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
              {filteredParticipants.map((p) => (
                <div
                  key={p.user_id}
                  className={cn(
                    "p-2 cursor-pointer hover:bg-muted transition-colors",
                    selectedUserId === p.user_id && "bg-primary/10",
                  )}
                  onClick={() => setSelectedUserId(p.user_id)}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {p.users?.full_name || "Anonymous"}
                    </span>
                    <span className="text-sm font-bold">
                      {p.current_score} pts
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.users?.email}
                  </p>
                </div>
              ))}
              {filteredParticipants.length === 0 && (
                <p className="p-3 text-center text-muted-foreground text-sm">
                  No participants found
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Adjustment Amount</Label>
              <Input
                type="number"
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(parseInt(e.target.value))}
                placeholder="+100 or -50"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="e.g., Bonus for top performer"
              />
            </div>
          </div>

          <Button
            onClick={handleAdjustScore}
            disabled={!selectedUserId || adjustmentValue === 0 || adjusting}
            className="w-full"
          >
            {adjusting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Apply Adjustment"
            )}
          </Button>
        </div>
      </div>

      {/* Challenge Actions */}
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3">Challenge Actions</h4>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/challenges/live/${challenge.id}`} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Open Live Display
            </Link>
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleEndEarly}
          >
            <Flag className="h-4 w-4 mr-2" />
            End Challenge Early
          </Button>
        </div>
      </div>
    </div>
  );
}
