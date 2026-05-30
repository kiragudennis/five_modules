// app/(admin)/admin/marketing/challenges/page.tsx
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
  X,
  Medal,
  Tag,
  Truck,
  Package,
  Gift,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Challenge } from "@/types/challenges";
import { ProductPreviewCard } from "@/components/challenges/product-preview";
import { TriviaHostControls } from "@/components/challenges/TriviaHostControls";

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
    value: "trivia",
    label: "Live Trivia Challenge",
    icon: Brain,
    color: "from-yellow-500 to-orange-500",
    description: "Live quiz show with spinning wheel selections",
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
  const [triviaHostOpen, setTriviaHostOpen] = useState(false);
  const [triviaHostChallenge, setTriviaHostChallenge] =
    useState<Challenge | null>(null);

  // Add function:
  const openTriviaHost = async (challenge: Challenge) => {
    setTriviaHostChallenge(challenge);
    setTriviaHostOpen(true);
  };

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
                      Team • {challenge.min_team_size}-{challenge.max_team_size}{" "}
                      members
                    </span>
                    {challenge.scoring_config?.small_team_category && (
                      <Badge variant="outline" className="text-xs ml-1">
                        Multi-Category
                      </Badge>
                    )}
                  </div>
                )}
                {/* Actions */}
                <div className="flex gap-2 pt-2 overflow-x-auto scrollbar-hide">
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
                  {challenge.challenge_type === "trivia" &&
                    challenge.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"
                        onClick={() => openTriviaHost(challenge)}
                      >
                        <Brain className="h-4 w-4 mr-1" />
                        Host Trivia
                      </Button>
                    )}
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

      <Dialog open={triviaHostOpen} onOpenChange={setTriviaHostOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-yellow-500" />
              Trivia Host Panel - {triviaHostChallenge?.name}
            </DialogTitle>
            <DialogDescription>
              Control the trivia game flow. Select participants, show questions,
              and manage the live experience.
            </DialogDescription>
          </DialogHeader>

          {triviaHostChallenge && (
            <TriviaHostControls
              challenge={triviaHostChallenge}
              onClose={() => setTriviaHostOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Live Controls Dialog */}
      <Dialog open={liveControlsOpen} onOpenChange={setLiveControlsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
        // Streak defaults
        points_per_day: 50,
        days_required: 7,
        bonus_milestones: {}, // {3: 100, 7: 250, 14: 500}
        small_team_category: false,
        // Referral defaults
        points_per_referral: 100,
        min_referrals_to_qualify: 1,
        referral_type: "all",
        first_referral_bonus: 50,
        power_referrer_bonus: 200,
        bonus_for_top_referrer: 500,
        unique_referrals_only: true,
        exclude_self_referrals: true,
        require_active_referrer: false,
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

      // Streak-specific fields
      streak_reset_on_miss: true,
      streak_grace_days: 0,
      require_active_status: false,
      tiebreaker_type: "score",
      streak_action_type: "daily_login",
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
      // Validate prize tiers
      if (formData.prize_tiers && formData.prize_tiers.length > 0) {
        for (const tier of formData.prize_tiers) {
          // Validate discount percentage (0-100)
          if (tier.prize_type === "discount") {
            const discountValue = parseInt(tier.prize_value);
            if (
              isNaN(discountValue) ||
              discountValue < 0 ||
              discountValue > 100
            ) {
              toast.error(
                `Rank ${tier.rank}: Discount must be between 0% and 100%`,
              );
              setSaving(false);
              return;
            }
          }

          // Validate points amount (must be positive)
          if (tier.prize_type === "points") {
            const pointsValue = parseInt(tier.prize_value);
            if (isNaN(pointsValue) || pointsValue < 0) {
              toast.error(
                `Rank ${tier.rank}: Points amount must be a positive number`,
              );
              setSaving(false);
              return;
            }
          }

          // Validate product UUID format (if provided)
          if (tier.prize_type === "product" && tier.product_id) {
            const uuidRegex =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(tier.product_id)) {
              toast.error(`Rank ${tier.rank}: Invalid product UUID format`);
              setSaving(false);
              return;
            }
          }

          // Validate bundle UUID format (if provided)
          if (tier.prize_type === "bundle" && tier.bundle_id) {
            const uuidRegex =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(tier.bundle_id)) {
              toast.error(`Rank ${tier.rank}: Invalid bundle UUID format`);
              setSaving(false);
              return;
            }
          }

          // Validate free shipping minimum purchase (must be positive)
          if (tier.prize_type === "free_shipping") {
            if (!tier.min_purchase) {
              toast.error("Min purchase amount must not be empty");
              return;
            }

            const minPurchase = parseFloat(tier.min_purchase);
            if (isNaN(minPurchase) || minPurchase < 0) {
              toast.error(
                `Rank ${tier.rank}: Minimum purchase amount must be a positive number`,
              );
              setSaving(false);
              return;
            }
          }

          // Validate badge name (if provided)
          if (
            tier.prize_type === "badge" &&
            (!tier.prize_value || tier.prize_value.trim() === "")
          ) {
            toast.error(`Rank ${tier.rank}: Badge name is required`);
            setSaving(false);
            return;
          }
        }
      }

      const slug = formData.slug || generateSlug(formData.name);
      const { error } = await supabase
        .from("challenges")
        .upsert({
          ...formData,
          slug,
          // Ensure streak-specific fields are included
          require_active_status: formData.require_active_status || false,
          tiebreaker_type: formData.tiebreaker_type || "score",
          streak_action_type: formData.streak_action_type || "daily_login",
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

  // Helper to render prize value input based on prize type
  const renderPrizeValueInput = (tier: any, idx: number) => {
    switch (tier.prize_type) {
      case "points":
        return (
          <Input
            type="number"
            placeholder="Points amount"
            value={tier.prize_value}
            onChange={(e) =>
              updatePrizeTier(idx, "prize_value", parseInt(e.target.value))
            }
            className="w-32"
          />
        );

      case "discount":
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Discount %"
              value={tier.prize_value}
              onChange={(e) =>
                updatePrizeTier(idx, "prize_value", parseInt(e.target.value))
              }
              className="w-24"
            />
          </div>
        );

      case "free_shipping":
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min purchase (optional)"
              value={tier.min_purchase || ""}
              onChange={(e) =>
                updatePrizeTier(idx, "min_purchase", parseFloat(e.target.value))
              }
              className="w-32"
            />
          </div>
        );

      case "product":
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Product UUID"
              value={tier.min_purchase || ""}
              onChange={(e) =>
                updatePrizeTier(idx, "product_id", parseFloat(e.target.value))
              }
              className="w-32"
            />
          </div>
        );

      case "bundle":
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Bundle UUID"
              value={tier.min_purchase || ""}
              onChange={(e) =>
                updatePrizeTier(idx, "bundle_id", parseFloat(e.target.value))
              }
              className="w-32"
            />
          </div>
        );

      default:
        return (
          <Input
            placeholder="Value"
            value={tier.prize_value}
            onChange={(e) =>
              updatePrizeTier(idx, "prize_value", e.target.value)
            }
            className="w-32"
          />
        );
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
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Referral Challenge Configuration
                </h4>

                {/* Referral Type Selection */}
                <div>
                  <Label>Referral Type</Label>
                  <Select
                    value={formData.scoring_config.referral_type || "all"}
                    onValueChange={(value) =>
                      updateScoringConfig("referral_type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All Referrals (Signup + Purchase)
                      </SelectItem>
                      <SelectItem value="signup">
                        Signup Referrals Only
                      </SelectItem>
                      <SelectItem value="first_purchase">
                        Purchase Referrals Only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.scoring_config.referral_type === "signup" &&
                      "Counts when referred user's account becomes active (makes first purchase)"}
                    {formData.scoring_config.referral_type ===
                      "first_purchase" &&
                      "Counts when referred user completes their first order payment"}
                    {formData.scoring_config.referral_type === "all" &&
                      "Counts both signup activations and first purchases"}
                  </p>
                </div>

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
                    <p className="text-xs text-muted-foreground mt-1">
                      Base points awarded for each successful referral
                    </p>
                  </div>
                  <div>
                    <Label>Minimum Referrals to Qualify</Label>
                    <Input
                      type="number"
                      value={
                        formData.scoring_config.min_referrals_to_qualify || 1
                      }
                      onChange={(e) =>
                        updateScoringConfig(
                          "min_referrals_to_qualify",
                          parseInt(e.target.value),
                        )
                      }
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Set to 0 for no minimum requirement
                    </p>
                  </div>
                </div>

                {/* Bonus Points */}
                <div className="space-y-3">
                  <Label>Bonus Points Configuration</Label>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">First Referral Bonus</Label>
                      <Input
                        type="number"
                        value={
                          formData.scoring_config.first_referral_bonus || 0
                        }
                        onChange={(e) =>
                          updateScoringConfig(
                            "first_referral_bonus",
                            parseInt(e.target.value),
                          )
                        }
                        placeholder="Optional bonus"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">
                        Power Referrer Bonus (5+)
                      </Label>
                      <Input
                        type="number"
                        value={
                          formData.scoring_config.power_referrer_bonus || 0
                        }
                        onChange={(e) =>
                          updateScoringConfig(
                            "power_referrer_bonus",
                            parseInt(e.target.value),
                          )
                        }
                        placeholder="Bonus at 5+ referrals"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Top 3 Leader Bonus</Label>
                      <Input
                        type="number"
                        value={
                          formData.scoring_config.bonus_for_top_referrer || 0
                        }
                        onChange={(e) =>
                          updateScoringConfig(
                            "bonus_for_top_referrer",
                            parseInt(e.target.value),
                          )
                        }
                        placeholder="Bonus for rank 1-3"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Milestone Multiplier</Label>
                      <Select
                        value={
                          formData.scoring_config.milestone_multiplier || "none"
                        }
                        onValueChange={(value) =>
                          updateScoringConfig("milestone_multiplier", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Multiplier</SelectItem>
                          <SelectItem value="1.5">
                            1.5x at 10 referrals
                          </SelectItem>
                          <SelectItem value="2">2x at 20 referrals</SelectItem>
                          <SelectItem value="3">3x at 50 referrals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Qualification Rules */}
                <div className="space-y-2">
                  <Label>Qualification Rules</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm">
                          Require Unique Customers Only
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Same person can't be referred multiple times
                        </p>
                      </div>
                      <Switch
                        checked={
                          formData.scoring_config.unique_referrals_only || true
                        }
                        onCheckedChange={(checked) =>
                          updateScoringConfig("unique_referrals_only", checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm">Exclude Self-Referrals</span>
                        <p className="text-xs text-muted-foreground">
                          Users can't refer themselves with different emails
                        </p>
                      </div>
                      <Switch
                        checked={
                          formData.scoring_config.exclude_self_referrals || true
                        }
                        onCheckedChange={(checked) =>
                          updateScoringConfig("exclude_self_referrals", checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm">Require Active Referrer</span>
                        <p className="text-xs text-muted-foreground">
                          Only active customers (purchased in 30 days) can
                          participate
                        </p>
                      </div>
                      <Switch
                        checked={
                          formData.scoring_config.require_active_referrer ||
                          false
                        }
                        onCheckedChange={(checked) =>
                          updateScoringConfig(
                            "require_active_referrer",
                            checked,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Referral Challenge Summary */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Referral Challenge Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <p>
                    • Type: {formData.scoring_config.referral_type || "all"}{" "}
                    referrals
                  </p>
                  <p>
                    • {formData.scoring_config.points_per_referral || 100}{" "}
                    points per successful referral
                  </p>
                  <p>
                    • Minimum{" "}
                    {formData.scoring_config.min_referrals_to_qualify || 1}{" "}
                    referral(s) to qualify
                  </p>
                  {formData.scoring_config.first_referral_bonus > 0 && (
                    <p>
                      • +{formData.scoring_config.first_referral_bonus} bonus
                      for first referral
                    </p>
                  )}
                  {formData.scoring_config.power_referrer_bonus > 0 && (
                    <p>
                      • +{formData.scoring_config.power_referrer_bonus} bonus at
                      5+ referrals
                    </p>
                  )}
                  <p>• Top referrers win prizes based on position</p>
                </div>
              </div>
            </div>
          )}

          {formData.challenge_type === "purchase" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Product Purchase Challenge
                </h4>

                <div>
                  <Label>Target Product UUID *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste product UUID from catalogue"
                      value={formData.scoring_config.product_id || ""}
                      onChange={(e) =>
                        updateScoringConfig("product_id", e.target.value)
                      }
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Open product selector or show help
                        toast.info(
                          "Copy UUID from Products > select product > click Copy UUID",
                        );
                      }}
                    >
                      Help
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Copy the product UUID from the Products catalogue dashboard
                  </p>
                </div>

                {/* Product Preview - if UUID is valid */}
                {formData.scoring_config.product_id && (
                  <ProductPreviewCard
                    productId={formData.scoring_config.product_id}
                    supabase={supabase}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Points per Unit Purchased</Label>
                    <Input
                      type="number"
                      value={formData.scoring_config.points_per_unit || 10}
                      onChange={(e) =>
                        updateScoringConfig(
                          "points_per_unit",
                          parseInt(e.target.value),
                        )
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Points awarded for each unit of the product purchased
                    </p>
                  </div>
                  <div>
                    <Label>Minimum Units to Qualify</Label>
                    <Input
                      type="number"
                      value={formData.scoring_config.min_units || 1}
                      onChange={(e) =>
                        updateScoringConfig(
                          "min_units",
                          parseInt(e.target.value),
                        )
                      }
                      min={1}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum units required to appear on leaderboard
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Bonus Points for Top 3 Position</Label>
                    <Input
                      type="number"
                      value={
                        formData.scoring_config.bonus_points_for_leader || 0
                      }
                      onChange={(e) =>
                        updateScoringConfig(
                          "bonus_points_for_leader",
                          parseInt(e.target.value),
                        )
                      }
                      placeholder="Optional"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Extra points when participant reaches top 3
                    </p>
                  </div>
                  <div>
                    <Label>Maximum Units Counted</Label>
                    <Input
                      type="number"
                      value={formData.scoring_config.max_units || 0}
                      onChange={(e) =>
                        updateScoringConfig(
                          "max_units",
                          parseInt(e.target.value),
                        )
                      }
                      placeholder="0 = unlimited"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Limit units per customer (0 = no limit)
                    </p>
                  </div>
                </div>

                {/* Double Points Configuration */}
                <div>
                  <Label>Double Points Schedule</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Weekend Double Points</span>
                      <Switch
                        checked={
                          formData.scoring_config.weekend_double_points || false
                        }
                        onCheckedChange={(checked) =>
                          updateScoringConfig("weekend_double_points", checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        First Purchase Bonus (2x points)
                      </span>
                      <Switch
                        checked={
                          formData.scoring_config.first_purchase_bonus || false
                        }
                        onCheckedChange={(checked) =>
                          updateScoringConfig("first_purchase_bonus", checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        Bulk Purchase Bonus (5+ units)
                      </span>
                      <Switch
                        checked={
                          formData.scoring_config.bulk_purchase_bonus || false
                        }
                        onCheckedChange={(checked) =>
                          updateScoringConfig("bulk_purchase_bonus", checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Challenge Summary */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-green-500" />
                  Purchase Challenge Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <p>
                    • Target Product:{" "}
                    {formData.scoring_config.product_id
                      ? "✓ Selected"
                      : "✗ Not set"}
                  </p>
                  <p>
                    • {formData.scoring_config.points_per_unit || 10} points per
                    unit
                  </p>
                  <p>
                    • Minimum {formData.scoring_config.min_units || 1} unit(s)
                    to qualify
                  </p>
                  {formData.scoring_config.bonus_points_for_leader > 0 && (
                    <p>
                      • +{formData.scoring_config.bonus_points_for_leader} bonus
                      points for top 3
                    </p>
                  )}
                  {formData.scoring_config.max_units > 0 && (
                    <p>
                      • Maximum {formData.scoring_config.max_units} units
                      counted per customer
                    </p>
                  )}
                  <p>• Winner: Customer with most units purchased</p>
                </div>
              </div>
            </div>
          )}

          {formData.challenge_type === "streak" && (
            <div className="space-y-6">
              {/* Basic Streak Configuration */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Streak Configuration
                </h4>

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
                    <p className="text-xs text-muted-foreground mt-1">
                      Base points awarded for each day of streak maintained
                    </p>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Total consecutive days needed to complete the challenge
                    </p>
                  </div>
                </div>

                {/* Streak Action Type */}
                <div>
                  <Label>What counts as a streak day?</Label>
                  <Select
                    value={formData.streak_action_type || "daily_login"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, streak_action_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily_login">Daily Login</SelectItem>
                      <SelectItem value="daily_purchase">
                        Daily Purchase (any amount)
                      </SelectItem>
                      <SelectItem value="custom">Custom Action</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.streak_action_type === "daily_login" &&
                      "Users must visit the site daily to maintain their streak"}
                    {formData.streak_action_type === "daily_purchase" &&
                      "Users must make at least one purchase per day"}
                    {formData.streak_action_type === "custom" &&
                      "Define a custom action that counts towards the streak"}
                  </p>
                </div>

                {/* Custom Action Description (if custom selected) */}
                {formData.streak_action_type === "custom" && (
                  <div>
                    <Label>Custom Action Description</Label>
                    <Input
                      value={
                        formData.scoring_config.custom_action_description || ""
                      }
                      onChange={(e) =>
                        updateScoringConfig(
                          "custom_action_description",
                          e.target.value,
                        )
                      }
                      placeholder="e.g., Post a review, share on social media..."
                    />
                  </div>
                )}

                {/* Milestone Bonuses */}
                <div>
                  <Label>Milestone Bonuses (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Award bonus points when users reach specific streak
                    milestones
                  </p>
                  <div className="space-y-2">
                    {[3, 7, 14, 30].map((milestone) => {
                      const bonus =
                        formData.scoring_config.bonus_milestones?.[milestone] ||
                        0;
                      return (
                        <div
                          key={milestone}
                          className="flex items-center gap-3"
                        >
                          <Label className="w-20 text-sm">
                            Day {milestone}
                          </Label>
                          <Input
                            type="number"
                            placeholder="Bonus points"
                            value={bonus}
                            onChange={(e) => {
                              const newMilestones = {
                                ...(formData.scoring_config.bonus_milestones ||
                                  {}),
                                [milestone]: parseInt(e.target.value) || 0,
                              };
                              updateScoringConfig(
                                "bonus_milestones",
                                newMilestones,
                              );
                            }}
                            className="w-32"
                          />
                          <span className="text-sm text-muted-foreground">
                            points bonus
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Streak Rules
                </h4>

                {/* Reset on Miss */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reset streak on missed day</Label>
                    <p className="text-xs text-muted-foreground">
                      If enabled, missing a day will reset the streak to 0
                    </p>
                  </div>
                  <Switch
                    checked={formData.streak_reset_on_miss}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        streak_reset_on_miss: checked,
                      })
                    }
                  />
                </div>

                {/* Grace Days */}
                <div>
                  <Label>Grace Days</Label>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of days a user can miss without resetting their
                    streak
                    {formData.streak_grace_days > 0 &&
                      ` (Users can miss up to ${formData.streak_grace_days} day(s) and keep their streak)`}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Participation & Eligibility
                </h4>

                {/* Require Active Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Active Customer Status</Label>
                    <p className="text-xs text-muted-foreground">
                      Only customers who've made a purchase in the last 30 days
                      can participate (users.status = 'active')
                    </p>
                  </div>
                  <Switch
                    checked={formData.require_active_status || false}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        require_active_status: checked,
                      })
                    }
                  />
                </div>

                {/* Tiebreaker Configuration */}
                <div>
                  <Label>Tiebreaker Method</Label>
                  <Select
                    value={formData.tiebreaker_type || "score"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tiebreaker_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">Highest Score</SelectItem>
                      <SelectItem value="duration">
                        Longest Site Duration (account age)
                      </SelectItem>
                      <SelectItem value="random">Random Selection</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.tiebreaker_type === "score" &&
                      "When tied, the user with the highest total points wins"}
                    {formData.tiebreaker_type === "duration" &&
                      "When tied, the user who's been registered longer wins (favors loyal customers)"}
                    {formData.tiebreaker_type === "random" &&
                      "When tied, a winner is selected randomly"}
                  </p>
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Streak Challenge Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <p>
                    • Users earn{" "}
                    <strong>
                      {formData.scoring_config.points_per_day || 50} points
                    </strong>{" "}
                    per day
                  </p>
                  <p>
                    • Must maintain streak for{" "}
                    <strong>
                      {formData.scoring_config.days_required || 7} days
                    </strong>
                  </p>
                  <p>
                    • Action required:{" "}
                    <strong>
                      {formData.streak_action_type?.replace("_", " ") ||
                        "daily login"}
                    </strong>
                  </p>
                  {formData.require_active_status && (
                    <p>
                      • Only <strong>active customers</strong> (purchased within
                      30 days) can participate
                    </p>
                  )}
                  {formData.streak_reset_on_miss ? (
                    <p className="text-red-600">
                      • Streak resets on missed day
                    </p>
                  ) : (
                    <p>
                      • {formData.streak_grace_days || 0} grace day(s) allowed
                    </p>
                  )}
                  {Object.entries(
                    formData.scoring_config.bonus_milestones || {},
                  ).length > 0 && (
                    <p>• Milestone bonuses available at specific days</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {formData.challenge_type === "team" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Team Configuration
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Points per KSH Spent</Label>
                    <Input
                      type="number"
                      value={
                        formData.scoring_config.points_per_member_action || 1
                      }
                      onChange={(e) =>
                        updateScoringConfig(
                          "points_per_member_action",
                          parseInt(e.target.value),
                        )
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Points awarded per KSH spent by team members
                    </p>
                  </div>

                  <div>
                    <Label>Bonus for Complete Team</Label>
                    <Input
                      type="number"
                      value={
                        formData.scoring_config.bonus_for_complete_team || 500
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

                <div>
                  <Label>Challenge Duration</Label>
                  <Select
                    value={
                      formData.scoring_config.challenge_duration || "monthly"
                    }
                    onValueChange={(value) =>
                      updateScoringConfig("challenge_duration", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Longer durations give teams more time to accumulate spending
                  </p>
                </div>

                {/* Team Size & Rules */}
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
                    <div className="grid grid-cols-2 gap-4">
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
                          min={2}
                          max={20}
                        />
                      </div>
                      <div>
                        <Label>Min Team Size</Label>
                        <Input
                          type="number"
                          value={formData.min_team_size || 2}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              min_team_size: parseInt(e.target.value),
                            })
                          }
                          min={1}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow Team Switching</Label>
                        <p className="text-xs text-muted-foreground">
                          Members can leave and join other teams during the
                          challenge
                        </p>
                      </div>
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

                    {/* Team Categories */}
                    <div>
                      <Label>Team Categories</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          "competitive",
                          "casual",
                          "newbie_friendly",
                          "high_rollers",
                          "balanced",
                        ].map((category) => (
                          <label
                            key={category}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="checkbox"
                              checked={
                                formData.allowed_team_categories?.includes(
                                  category,
                                ) || false
                              }
                              onChange={(e) => {
                                const current =
                                  formData.allowed_team_categories || [];
                                const updated = e.target.checked
                                  ? [...current, category]
                                  : current.filter(
                                      (c: string) => c !== category,
                                    );
                                setFormData({
                                  ...formData,
                                  allowed_team_categories: updated,
                                });
                              }}
                            />
                            <span className="text-sm capitalize">
                              {category.replace("_", " ")}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Fair Play Rules */}
                    <div className="space-y-2">
                      <Label>Fair Play Categories</Label>
                      <p className="text-xs text-muted-foreground">
                        Create separate winner categories to give smaller teams
                        a chance
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          Small Teams ({formData.min_team_size}-2 members)
                        </span>
                        <Switch
                          checked={
                            formData.scoring_config.small_team_category || false
                          }
                          onCheckedChange={(checked) =>
                            updateScoringConfig("small_team_category", checked)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          New Teams (joined in last 30 days)
                        </span>
                        <Switch
                          checked={
                            formData.scoring_config.new_team_category || false
                          }
                          onCheckedChange={(checked) =>
                            updateScoringConfig("new_team_category", checked)
                          }
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Team Challenge Summary */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-purple-500" />
                  Team Challenge Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <p>
                    • Teams of {formData.min_team_size || 2}-
                    {formData.max_team_size || 5} members
                  </p>
                  <p>
                    • {formData.scoring_config.points_per_member_action || 1}{" "}
                    points per KSH spent
                  </p>
                  <p>
                    • Duration:{" "}
                    {formData.scoring_config.challenge_duration || "monthly"}
                  </p>
                  {formData.scoring_config.small_team_category && (
                    <p>
                      • Separate category for small teams (more chances to win)
                    </p>
                  )}
                  {formData.scoring_config.new_team_category && (
                    <p>• New team bonus category enabled</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {formData.challenge_type === "trivia" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Trivia Challenge Configuration
                </h4>

                {/* Spin Game Integration */}
                <div>
                  <Label>Spin Game for Participant Selection</Label>
                  <Input
                    type="text"
                    value={formData.scoring_config.spin_game_id || ""}
                    placeholder="Enter spin game UUID"
                    onChange={(e) =>
                      updateScoringConfig("spin_game_id", e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The spinning wheel will randomly select participants to
                    answer questions
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Base Points per Question</Label>
                    <Input
                      type="number"
                      value={formData.scoring_config.base_points || 100}
                      onChange={(e) =>
                        updateScoringConfig(
                          "base_points",
                          parseInt(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Time Limit (seconds)</Label>
                    <Input
                      type="number"
                      value={formData.scoring_config.time_limit || 5}
                      onChange={(e) =>
                        updateScoringConfig(
                          "time_limit",
                          parseInt(e.target.value),
                        )
                      }
                      min={3}
                      max={30}
                    />
                  </div>
                </div>

                {/* Speed Bonus */}
                <div className="space-y-2">
                  <Label>Speed Bonus Points</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Lightning (&lt;1s)</Label>
                      <Input
                        type="number"
                        value={
                          formData.scoring_config.speed_bonus_lightning || 50
                        }
                        onChange={(e) =>
                          updateScoringConfig(
                            "speed_bonus_lightning",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Quick (&lt;2s)</Label>
                      <Input
                        type="number"
                        value={formData.scoring_config.speed_bonus_quick || 25}
                        onChange={(e) =>
                          updateScoringConfig(
                            "speed_bonus_quick",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Good (&lt;3s)</Label>
                      <Input
                        type="number"
                        value={formData.scoring_config.speed_bonus_good || 10}
                        onChange={(e) =>
                          updateScoringConfig(
                            "speed_bonus_good",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Streak Bonus */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Streak Bonuses</Label>
                    <p className="text-xs text-muted-foreground">
                      Bonus points for consecutive correct answers (3+ streak =
                      bonus)
                    </p>
                  </div>
                  <Switch
                    checked={
                      formData.scoring_config.streak_bonus_enabled || true
                    }
                    onCheckedChange={(checked) =>
                      updateScoringConfig("streak_bonus_enabled", checked)
                    }
                  />
                </div>

                {/* Question Management */}
                <div className="border-t pt-4">
                  <Label>Trivia Questions</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Add questions with multiple choice answers (up to 4 options)
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast("You need to save the challenge first!")
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Manage Questions ({formData.trivia_questions?.length || 0})
                  </Button>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-yellow-500" />
                  Trivia Challenge Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <p>
                    • {formData.scoring_config.base_points || 100} points per
                    correct answer
                  </p>
                  <p>
                    • {formData.scoring_config.time_limit || 5} second time
                    limit
                  </p>
                  <p>• Speed bonuses for fast answers</p>
                  <p>• Streak bonuses after 3 consecutive correct answers</p>
                  <p>• Participants selected via spinning wheel</p>
                  <p>
                    • Winner: Highest total score (correct answers + bonuses)
                  </p>
                </div>
              </div>
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

        {/* Prizes Tab - Enhanced */}
        <TabsContent value="prizes" className="space-y-4 mt-4">
          <div className="space-y-3">
            {formData.prize_tiers.map((tier: any, idx: number) => (
              <div
                key={idx}
                className="flex flex-wrap gap-3 items-center p-4 border rounded-lg bg-muted/30"
              >
                {/* Rank */}
                <div className="w-16">
                  <div className="flex items-center gap-1">
                    {tier.rank === 1 && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                    {tier.rank === 2 && (
                      <Medal className="h-4 w-4 text-gray-400" />
                    )}
                    {tier.rank === 3 && (
                      <Medal className="h-4 w-4 text-amber-600" />
                    )}
                    <Label className="text-sm">Rank {tier.rank}</Label>
                  </div>
                </div>

                {/* Prize Type */}
                <Select
                  value={tier.prize_type}
                  onValueChange={(value) =>
                    updatePrizeTier(idx, "prize_type", value)
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Points
                      </div>
                    </SelectItem>
                    <SelectItem value="discount">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Discount %
                      </div>
                    </SelectItem>
                    <SelectItem value="free_shipping">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Free Shipping
                      </div>
                    </SelectItem>
                    <SelectItem value="product">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Product
                      </div>
                    </SelectItem>
                    <SelectItem value="bundle">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Bundle
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Prize Value Input (dynamic based on type) */}
                {renderPrizeValueInput(tier, idx)}

                {/* Delete Button */}
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

          {/* Prize Distribution Preview */}
          {formData.prize_tiers.length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-primary/5">
              <h4 className="text-sm font-semibold mb-2">
                Prize Distribution Preview
              </h4>
              <div className="space-y-1">
                {formData.prize_tiers.map((tier: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="font-medium">
                      {tier.rank === 1 && "🥇 "}
                      {tier.rank === 2 && "🥈 "}
                      {tier.rank === 3 && "🥉 "}
                      Rank {tier.rank}
                    </span>
                    <span className="text-muted-foreground">
                      {tier.prize_type === "points" &&
                        `${tier.prize_value} points`}
                      {tier.prize_type === "discount" &&
                        `${tier.prize_value}% off`}
                      {tier.prize_type === "free_shipping" && "Free Shipping"}
                      {tier.prize_type === "product" && tier.prize_value}
                      {tier.prize_type === "bundle" && tier.prize_value}
                      {tier.prize_type === "badge" && tier.prize_value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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

// app/(admin)/admin/marketing/challenges/page.tsx
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
