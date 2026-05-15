// src/app/(admin)/admin/marketing/spin/page.tsx

"use client";

import { useState, useEffect, JSX } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Trophy,
  Users,
  Gift,
  Percent,
  Truck,
  Package,
  Sparkles,
  Coins,
  RotateCcw,
  Volume2,
  VolumeX,
  Palette,
  Hash,
  Clock,
  Calendar,
  UserPlus,
  ShoppingBag,
  Crown,
  Zap,
  AlertCircle,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { SpinGame, PrizeSegment } from "@/types/spinning_wheel";

const PRIZE_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E2",
];

const GAME_TYPES = [
  {
    value: "standard",
    label: "Standard",
    icon: <RotateCcw className="h-4 w-4" />,
    color: "bg-blue-500",
  },
  {
    value: "vip",
    label: "VIP",
    icon: <Crown className="h-4 w-4" />,
    color: "bg-yellow-500",
  },
  {
    value: "new_customer",
    label: "New Customer",
    icon: <UserPlus className="h-4 w-4" />,
    color: "bg-green-500",
  },
  {
    value: "weekend",
    label: "Weekend Special",
    icon: <Calendar className="h-4 w-4" />,
    color: "bg-purple-500",
  },
  {
    value: "flash",
    label: "Flash Game",
    icon: <Zap className="h-4 w-4" />,
    color: "bg-red-500",
  },
];

const PRIZE_TYPES = [
  {
    value: "points",
    label: "Points",
    icon: <Coins className="h-4 w-4" />,
    placeholder: "points amount",
    unit: "pts",
  },
  {
    value: "discount",
    label: "Discount %",
    icon: <Percent className="h-4 w-4" />,
    placeholder: "discount percentage",
    unit: "%",
  },
  {
    value: "free_shipping",
    label: "Free Shipping",
    icon: <Truck className="h-4 w-4" />,
    placeholder: "free",
    unit: "",
  },
  {
    value: "product",
    label: "Product",
    icon: <Package className="h-4 w-4" />,
    placeholder: "select product",
    unit: "",
  },
  {
    value: "bundle",
    label: "Bundle",
    icon: <Gift className="h-4 w-4" />,
    placeholder: "select bundle",
    unit: "",
  },
];

export default function SpinningWheelAdmin() {
  const { supabase } = useAuth();
  const [games, setGames] = useState<SpinGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<SpinGame | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("spin_games")
      .select("*")
      .order("created_at", { ascending: false });
    setGames(data || []);
    setLoading(false);
  };

  const saveGame = async (game: Partial<SpinGame>) => {
    try {
      if (selectedGame?.id) {
        const { error } = await supabase
          .from("spin_games")
          .update(game)
          .eq("id", selectedGame.id);
        if (error) throw error;
        toast.success("Game updated successfully");
      } else {
        const { error } = await supabase.from("spin_games").insert(game);
        if (error) throw error;
        toast.success("Game created successfully");
      }
      await fetchGames();
      setDialogOpen(false);
      setSelectedGame(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save game");
    }
  };

  const deleteGame = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this game? This action cannot be undone.",
      )
    ) {
      const { error } = await supabase.from("spin_games").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete game");
      } else {
        toast.success("Game deleted");
        await fetchGames();
      }
    }
  };

  const toggleGameStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("spin_games")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update game status");
    } else {
      toast.success(`Game ${!currentStatus ? "activated" : "deactivated"}`);
      await fetchGames();
    }
  };

  const getGameTypeIcon = (type: string) => {
    return (
      GAME_TYPES.find((t) => t.value === type)?.icon || (
        <RotateCcw className="h-4 w-4" />
      )
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
            Spinning Wheel Games
          </h1>
          <p className="text-muted-foreground">
            Create and manage interactive spin-to-win experiences
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedGame(null)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Game
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedGame ? "Edit Spin Game" : "Create New Spin Game"}
              </DialogTitle>
              <DialogDescription>
                Configure your spin wheel game with custom prizes and rules
              </DialogDescription>
            </DialogHeader>
            <GameForm
              initialGame={selectedGame}
              onSave={saveGame}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Games Grid - Active Games Section */}
      {games.filter((g) => g.is_active).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-lg font-semibold">Active Games</h2>
            <Badge variant="secondary">
              {games.filter((g) => g.is_active).length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games
              .filter((g) => g.is_active)
              .map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onEdit={() => {
                    setSelectedGame(game);
                    setDialogOpen(true);
                  }}
                  onDelete={() => deleteGame(game.id)}
                  onToggleStatus={() =>
                    toggleGameStatus(game.id, game.is_active)
                  }
                  onLiveView={() =>
                    window.open(`/spin/live/${game.id}`, "_blank")
                  }
                  getGameTypeIcon={getGameTypeIcon}
                />
              ))}
          </div>
        </div>
      )}

      {/* Inactive Games Section */}
      {games.filter((g) => !g.is_active).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4 mt-8">
            <div className="h-2 w-2 rounded-full bg-gray-400" />
            <h2 className="text-lg font-semibold">Inactive Games</h2>
            <Badge variant="secondary">
              {games.filter((g) => !g.is_active).length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games
              .filter((g) => !g.is_active)
              .map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onEdit={() => {
                    setSelectedGame(game);
                    setDialogOpen(true);
                  }}
                  onDelete={() => deleteGame(game.id)}
                  onToggleStatus={() =>
                    toggleGameStatus(game.id, game.is_active)
                  }
                  onLiveView={() =>
                    window.open(`/spin/live/${game.id}`, "_blank")
                  }
                  getGameTypeIcon={getGameTypeIcon}
                />
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {games.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <RotateCcw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No spin games yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first spin wheel game to engage customers
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Game
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Game Card Component
function GameCard({
  game,
  onEdit,
  onDelete,
  onToggleStatus,
  onLiveView,
  getGameTypeIcon,
}: {
  game: SpinGame;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onLiveView: () => void;
  getGameTypeIcon: (type: string) => JSX.Element;
}) {
  const totalProbability = game.prize_config.reduce(
    (sum, p) => sum + (p.probability || 0),
    0,
  );
  const isValidProbability = Math.abs(totalProbability - 100) <= 1;

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all group">
      {/* Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge variant={game.is_active ? "default" : "secondary"}>
          {game.is_active ? (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Active
            </span>
          ) : (
            "Inactive"
          )}
        </Badge>
      </div>

      {/* Probability Warning */}
      {!isValidProbability && (
        <div className="absolute top-3 left-3 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Probabilities sum to {totalProbability}% (should be 100%)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg ${GAME_TYPES.find((t) => t.value === game.game_type)?.color || "bg-blue-500"} bg-opacity-10`}
          >
            {getGameTypeIcon(game.game_type)}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{game.name}</CardTitle>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {game.description || "No description"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Prize Preview */}
        <div className="flex flex-wrap gap-1">
          {game.prize_config.slice(0, 6).map((prize, idx) => (
            <TooltipProvider key={idx}>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm transition-transform hover:scale-110"
                    style={{ backgroundColor: prize.color }}
                  >
                    {prize.type === "points" && <Coins className="h-3 w-3" />}
                    {prize.type === "discount" && (
                      <Percent className="h-3 w-3" />
                    )}
                    {prize.type === "product" && (
                      <Package className="h-3 w-3" />
                    )}
                    {prize.type === "free_shipping" && (
                      <Truck className="h-3 w-3" />
                    )}
                    {prize.type === "bundle" && <Gift className="h-3 w-3" />}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{prize.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {prize.probability}% chance
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {game.prize_config.length > 6 && (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
              +{game.prize_config.length - 6}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Free spins:</span>
            <span className="font-medium">{game.free_spins_per_day}/day</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paid spin:</span>
            <span className="font-medium">{game.points_per_paid_spin} pts</span>
          </div>
          {game.game_type === "vip" && (
            <div className="flex justify-between col-span-2">
              <span className="text-muted-foreground">Access:</span>
              <Badge variant="outline" className="text-xs">
                VIP Only (Gold+)
              </Badge>
            </div>
          )}
          {game.is_single_prize && (
            <div className="flex justify-between col-span-2">
              <span className="text-muted-foreground">Grand prize:</span>
              <Badge
                variant={game.single_prize_claimed ? "secondary" : "default"}
                className="text-xs"
              >
                {game.single_prize_claimed ? "Claimed" : "Available"}
              </Badge>
            </div>
          )}
          {game.ends_at &&
            new Date(game.ends_at) < new Date() &&
            game.is_active && (
              <div className="flex justify-between col-span-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="destructive" className="text-xs">
                  Expired
                </Badge>
              </div>
            )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={onLiveView}
          >
            <Eye className="h-3 w-3" />
            Live View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={onEdit}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <Button
          variant={game.is_active ? "destructive" : "default"}
          size="sm"
          className="w-full"
          onClick={onToggleStatus}
        >
          {game.is_active ? "Deactivate" : "Activate"}
        </Button>
      </CardContent>
    </Card>
  );
}

// Game Form Component
function GameForm({
  initialGame,
  onSave,
  onCancel,
}: {
  initialGame: SpinGame | null;
  onSave: (game: any) => void;
  onCancel: () => void;
}) {
  const { supabase } = useAuth();
  const [activeTab, setActiveTab] = useState("basic");
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<any>(
    initialGame || {
      name: "",
      slug: "",
      description: "",
      game_type: "standard",
      eligible_tiers: [],
      min_points_required: 0,
      requires_purchase_count: 0,
      new_customer_only: false,
      free_spins_per_day: 1,
      free_spins_per_week: 5,
      free_spins_total: 3,
      points_per_paid_spin: 50,
      prize_config: [
        {
          id: "1",
          label: "50 Points",
          type: "points",
          value: "50",
          color: "#FF6B6B",
          probability: 30,
          product_id: null,
          bundle_id: null,
        },
        {
          id: "2",
          label: "100 Points",
          type: "points",
          value: "100",
          color: "#4ECDC4",
          probability: 20,
          product_id: null,
          bundle_id: null,
        },
        {
          id: "3",
          label: "10% Off",
          type: "discount",
          value: "10",
          color: "#45B7D1",
          probability: 15,
          product_id: null,
          bundle_id: null,
        },
        {
          id: "4",
          label: "Free Shipping",
          type: "free_shipping",
          value: "free",
          color: "#96CEB4",
          probability: 10,
          product_id: null,
          bundle_id: null,
        },
        {
          id: "5",
          label: "Try Again",
          type: "points",
          value: "0",
          color: "#DDA0DD",
          probability: 25,
          product_id: null,
          bundle_id: null,
        },
      ],
      is_single_prize: false,
      starts_at: null,
      ends_at: null,
      is_active: true,
      live_theme: "default",
      show_confetti: true,
      play_sounds: true,
    },
  );

  const addPrize = () => {
    setFormData({
      ...formData,
      prize_config: [
        ...formData.prize_config,
        {
          id: Date.now().toString(),
          label: "New Prize",
          type: "points",
          value: 0,
          color:
            PRIZE_COLORS[formData.prize_config.length % PRIZE_COLORS.length],
          probability: 0,
          product_id: null,
          bundle_id: null,
        },
      ],
    });
  };

  const updatePrize = (index: number, field: string, value: any) => {
    const newPrizes = [...formData.prize_config];
    newPrizes[index][field] = value;

    // Auto-generate label based on prize type and value (without fetching)
    if (
      field === "type" ||
      field === "value" ||
      field === "product_id" ||
      field === "bundle_id"
    ) {
      const prize = newPrizes[index];
      if (prize.type === "points") {
        prize.label = `${prize.value} Points`;
      } else if (prize.type === "discount") {
        prize.label = `${prize.value}% Off`;
      } else if (prize.type === "free_shipping") {
        prize.label = "Free Shipping";
      } else if (prize.type === "product" && prize.product_id) {
        prize.label = `Product (${prize.product_id.slice(0, 8)}...)`;
        prize.value = prize.product_id;
      } else if (prize.type === "bundle" && prize.bundle_id) {
        prize.label = `Bundle (${prize.bundle_id.slice(0, 8)}...)`;
        prize.value = prize.bundle_id;
      }
    }

    setFormData({ ...formData, prize_config: newPrizes });
  };

  const removePrize = (index: number) => {
    const newPrizes = formData.prize_config.filter(
      (_: any, i: number) => i !== index,
    );
    setFormData({ ...formData, prize_config: newPrizes });
  };

  const validateProbabilities = () => {
    const total = formData.prize_config.reduce(
      (sum: number, p: any) => sum + (p.probability || 0),
      0,
    );
    if (Math.abs(total - 100) > 1) {
      toast.error(`Probabilities sum to ${total}%, must be 100%`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateProbabilities()) return;

    setSaving(true);
    try {
      // Clean up data before saving
      const saveData = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
        description: formData.description,
        game_type: formData.game_type,
        eligible_tiers: formData.eligible_tiers,
        min_points_required: formData.min_points_required,
        requires_purchase_count: formData.requires_purchase_count,
        new_customer_only: formData.new_customer_only,
        free_spins_per_day: formData.free_spins_per_day,
        free_spins_per_week: formData.free_spins_per_week,
        free_spins_total: formData.free_spins_total,
        points_per_paid_spin: formData.points_per_paid_spin,
        prize_config: formData.prize_config.map((p: any) => ({
          label: p.label,
          type: p.type,
          value: p.value,
          color: p.color,
          probability: p.probability,
        })),
        is_single_prize: formData.is_single_prize,
        starts_at: formData.starts_at,
        ends_at: formData.ends_at,
        is_active: formData.is_active,
        live_theme: formData.live_theme,
        show_confetti: formData.show_confetti,
        play_sounds: formData.play_sounds,
      };
      await onSave(saveData);
    } finally {
      setSaving(false);
    }
  };

  const totalProbability = formData.prize_config.reduce(
    (s: number, p: any) => s + (p.probability || 0),
    0,
  );
  const isProbabilityValid = Math.abs(totalProbability - 100) <= 1;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="prizes">
          Prizes
          {!isProbabilityValid && (
            <AlertCircle className="h-3 w-3 ml-1 text-yellow-500" />
          )}
        </TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>

      {/* Basic Info Tab */}
      <TabsContent value="basic" className="space-y-6 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Game Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Weekend Wonder Wheel"
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={formData.slug}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                })
              }
              placeholder="weekend-wonder-wheel"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL-friendly identifier
            </p>
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <Input
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe your spin game..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Game Type</Label>
            <Select
              value={formData.game_type}
              onValueChange={(value) =>
                setFormData({ ...formData, game_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GAME_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      {type.icon}
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Eligible Tiers</Label>
            <Select
              value={formData.eligible_tiers.join(",")}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  eligible_tiers: value ? value.split(",") : [],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all tiers">All tiers</SelectItem>
                <SelectItem value="bronze,silver,gold,platinum">
                  All (Bronze+)
                </SelectItem>
                <SelectItem value="silver,gold,platinum">Silver+</SelectItem>
                <SelectItem value="gold,platinum">Gold+</SelectItem>
                <SelectItem value="platinum">Platinum only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Free Spins / Day</Label>
            <Input
              type="number"
              value={formData.free_spins_per_day}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  free_spins_per_day: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
          <div>
            <Label>Free Spins / Week</Label>
            <Input
              type="number"
              value={formData.free_spins_per_week}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  free_spins_per_week: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
          <div>
            <Label>Free Spins (Lifetime)</Label>
            <Input
              type="number"
              value={formData.free_spins_total}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  free_spins_total: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>

        <div>
          <Label>Points Per Paid Spin</Label>
          <Input
            type="number"
            value={formData.points_per_paid_spin}
            onChange={(e) =>
              setFormData({
                ...formData,
                points_per_paid_spin: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.new_customer_only}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, new_customer_only: checked })
              }
            />
            <Label>New Customers Only</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_single_prize}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_single_prize: checked })
              }
            />
            <Label>Single Prize Mode</Label>
          </div>
        </div>
      </TabsContent>

      {/* Prizes Tab - Same as before */}
      <TabsContent value="prizes" className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <div>
            <Label>Prize Configuration</Label>
            <p
              className={`text-xs ${isProbabilityValid ? "text-muted-foreground" : "text-yellow-500"}`}
            >
              Probabilities sum to {totalProbability}%{" "}
              {!isProbabilityValid && "(must be 100%)"}
            </p>
          </div>
          <Button type="button" size="sm" onClick={addPrize}>
            <Plus className="h-4 w-4 mr-1" />
            Add Prize
          </Button>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {formData.prize_config.map((prize: any, idx: number) => (
            <Card key={prize.id || idx} className="p-4">
              <div className="space-y-3">
                <div className="flex gap-3 flex-wrap">
                  <input
                    type="color"
                    value={prize.color}
                    onChange={(e) => updatePrize(idx, "color", e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border"
                  />
                  <div className="flex-1 min-w-[120px]">
                    <Select
                      value={prize.type}
                      onValueChange={(value) => updatePrize(idx, "type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIZE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              {type.icon}
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Prize Value / Selection */}
                  <div className="flex-1 min-w-[150px]">
                    {prize.type === "product" ? (
                      <div className="flex gap-2">
                        <Input
                          value={prize.product_id || ""}
                          onChange={(e) =>
                            updatePrize(idx, "product_id", e.target.value)
                          }
                          placeholder="Product UUID"
                          className="flex-1 font-mono text-xs"
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 px-2"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    prize.product_id || "",
                                  );
                                  toast.success("Product ID copied");
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy ID</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ) : prize.type === "bundle" ? (
                      <div className="flex gap-2">
                        <Input
                          value={prize.bundle_id || ""}
                          onChange={(e) =>
                            updatePrize(idx, "bundle_id", e.target.value)
                          }
                          placeholder="Bundle UUID"
                          className="flex-1 font-mono text-xs"
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 px-2"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    prize.bundle_id || "",
                                  );
                                  toast.success("Bundle ID copied");
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy ID</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ) : (
                      <Input
                        type={prize.type === "points" ? "number" : "text"}
                        value={prize.value}
                        onChange={(e) =>
                          updatePrize(idx, "value", e.target.value)
                        }
                        placeholder={
                          PRIZE_TYPES.find((t) => t.value === prize.type)
                            ?.placeholder
                        }
                      />
                    )}
                  </div>
                  <div className="w-24">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={prize.probability}
                        onChange={(e) =>
                          updatePrize(
                            idx,
                            "probability",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        placeholder="%"
                        className="text-center"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePrize(idx)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: prize.color }}
                  />
                  <span className="text-sm font-medium">{prize.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {prize.probability}% chance
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* Advanced Tab */}
      <TabsContent value="advanced" className="space-y-6 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date (Optional)</Label>
            <Input
              type="datetime-local"
              value={formData.starts_at || ""}
              onChange={(e) =>
                setFormData({ ...formData, starts_at: e.target.value || null })
              }
            />
          </div>
          <div>
            <Label>End Date (Optional)</Label>
            <Input
              type="datetime-local"
              value={formData.ends_at || ""}
              onChange={(e) =>
                setFormData({ ...formData, ends_at: e.target.value || null })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Min Points Required</Label>
            <Input
              type="number"
              value={formData.min_points_required}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  min_points_required: parseInt(e.target.value) || 0,
                })
              }
              placeholder="0 = no requirement"
            />
          </div>
          <div>
            <Label>Min Purchases Required</Label>
            <Input
              type="number"
              value={formData.requires_purchase_count}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requires_purchase_count: parseInt(e.target.value) || 0,
                })
              }
              placeholder="0 = no requirement"
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label>Display Settings</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <Label>Show Confetti on Win</Label>
              </div>
              <Switch
                checked={formData.show_confetti}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, show_confetti: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {formData.play_sounds ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
                <Label>Sound Effects</Label>
              </div>
              <Switch
                checked={formData.play_sounds}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, play_sounds: checked })
                }
              />
            </div>
          </div>
        </div>

        <div>
          <Label>Theme Color</Label>
          <div className="flex items-center gap-2 mt-1">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <Input
              value={formData.live_theme}
              onChange={(e) =>
                setFormData({ ...formData, live_theme: e.target.value })
              }
              placeholder="default, dark, colorful"
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label>Active (visible to customers)</Label>
          </div>
        </div>
      </TabsContent>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : initialGame ? "Update Game" : "Create Game"}
        </Button>
      </div>
    </Tabs>
  );
}
