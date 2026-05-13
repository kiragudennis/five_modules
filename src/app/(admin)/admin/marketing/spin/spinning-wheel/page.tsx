// src/app/(admin)/admin/marketing/spinning-wheel/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Trophy,
  Users,
  Calendar,
  Settings,
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
    const { data } = await supabase
      .from("spin_games")
      .select("*")
      .order("created_at", { ascending: false });
    setGames(data || []);
    setLoading(false);
  };

  const saveGame = async (game: Partial<SpinGame>) => {
    if (selectedGame?.id) {
      const { error } = await supabase
        .from("spin_games")
        .update(game)
        .eq("id", selectedGame.id);
      if (error) throw error;
      toast.success("Game updated");
    } else {
      const { error } = await supabase.from("spin_games").insert(game);
      if (error) throw error;
      toast.success("Game created");
    }
    await fetchGames();
    setDialogOpen(false);
    setSelectedGame(null);
  };

  const deleteGame = async (id: string) => {
    if (confirm("Delete this game?")) {
      await supabase.from("spin_games").delete().eq("id", id);
      toast.success("Game deleted");
      await fetchGames();
    }
  };

  const toggleGameStatus = async (id: string, currentStatus: boolean) => {
    await supabase
      .from("spin_games")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    toast.success(`Game ${!currentStatus ? "activated" : "deactivated"}`);
    await fetchGames();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Spinning Wheel Games</h1>
          <p className="text-muted-foreground">
            Manage multi-game spin-to-win experiences
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedGame(null)}>
              <Plus className="h-4 w-4 mr-2" />
              New Game
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedGame ? "Edit Game" : "Create New Game"}
              </DialogTitle>
            </DialogHeader>
            <GameForm initialGame={selectedGame} onSave={saveGame} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <Card key={game.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {game.name}
                    {game.game_type === "vip" && (
                      <Trophy className="h-4 w-4 text-yellow-500" />
                    )}
                    {game.game_type === "new_customer" && (
                      <Users className="h-4 w-4 text-blue-500" />
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {game.description}
                  </p>
                </div>
                <Badge variant={game.is_active ? "default" : "secondary"}>
                  {game.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="capitalize font-medium">
                    {game.game_type}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Free spins:</span>
                  <span>
                    {game.free_spins_per_day}/day, {game.free_spins_total} total
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid spin:</span>
                  <span>{game.points_per_paid_spin} points</span>
                </div>
                {game.is_single_prize && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Grand prize:</span>
                    <Badge variant="outline" className="text-yellow-600">
                      {game.single_prize_claimed ? "Claimed" : "Available"}
                    </Badge>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      window.open(`/spin/live/${game.id}`, "_blank")
                    }
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Live View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedGame(game);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteGame(game.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant={game.is_active ? "destructive" : "default"}
                  size="sm"
                  className="w-full"
                  onClick={() => toggleGameStatus(game.id, game.is_active)}
                >
                  {game.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Game Form Component
function GameForm({
  initialGame,
  onSave,
}: {
  initialGame: SpinGame | null;
  onSave: (game: any) => void;
}) {
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
          label: "50 Points",
          type: "points",
          value: 50,
          color: "#FF6B6B",
          probability: 30,
        },
        {
          label: "100 Points",
          type: "points",
          value: 100,
          color: "#4ECDC4",
          probability: 20,
        },
        {
          label: "10% Off",
          type: "discount",
          value: 10,
          color: "#45B7D1",
          probability: 15,
        },
        {
          label: "Free Shipping",
          type: "free_shipping",
          value: "free",
          color: "#96CEB4",
          probability: 10,
        },
        {
          label: "Try Again",
          type: "points",
          value: 0,
          color: "#DDA0DD",
          probability: 25,
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
          label: "New Prize",
          type: "points",
          value: 0,
          color: "#98D8C8",
          probability: 0,
        },
      ],
    });
  };

  const updatePrize = (index: number, field: string, value: any) => {
    const newPrizes = [...formData.prize_config];
    newPrizes[index][field] = value;
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Game Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
          />
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Input
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Game Type</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={formData.game_type}
            onChange={(e) =>
              setFormData({ ...formData, game_type: e.target.value })
            }
          >
            <option value="standard">Standard</option>
            <option value="vip">VIP</option>
            <option value="new_customer">New Customer</option>
            <option value="weekend">Weekend Special</option>
            <option value="flash">Flash Game</option>
          </select>
        </div>
        <div>
          <Label>Eligible Tiers (comma-separated)</Label>
          <Input
            value={formData.eligible_tiers.join(",")}
            onChange={(e) =>
              setFormData({
                ...formData,
                eligible_tiers: e.target.value.split(",").filter(Boolean),
              })
            }
            placeholder="bronze,silver,gold"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Free Spins Per Day</Label>
          <Input
            type="number"
            value={formData.free_spins_per_day}
            onChange={(e) =>
              setFormData({
                ...formData,
                free_spins_per_day: parseInt(e.target.value),
              })
            }
          />
        </div>
        <div>
          <Label>Free Spins Per Week</Label>
          <Input
            type="number"
            value={formData.free_spins_per_week}
            onChange={(e) =>
              setFormData({
                ...formData,
                free_spins_per_week: parseInt(e.target.value),
              })
            }
          />
        </div>
        <div>
          <Label>Free Spins Total (Lifetime)</Label>
          <Input
            type="number"
            value={formData.free_spins_total}
            onChange={(e) =>
              setFormData({
                ...formData,
                free_spins_total: parseInt(e.target.value),
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
              points_per_paid_spin: parseInt(e.target.value),
            })
          }
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <Label>Prize Configuration (must sum to 100%)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addPrize}>
            <Plus className="h-4 w-4 mr-2" />
            Add Prize
          </Button>
        </div>
        <div className="space-y-3">
          {formData.prize_config.map((prize: PrizeSegment, idx: number) => (
            <div key={idx} className="flex gap-2 items-center">
              <Input
                placeholder="Label"
                value={prize.label}
                onChange={(e) => updatePrize(idx, "label", e.target.value)}
                className="flex-1"
              />
              <select
                value={prize.type}
                onChange={(e) => updatePrize(idx, "type", e.target.value)}
                className="rounded-md border px-2 py-1"
              >
                <option value="points">Points</option>
                <option value="discount">Discount %</option>
                <option value="free_shipping">Free Shipping</option>
                <option value="product">Product</option>
                <option value="bundle">Bundle</option>
              </select>
              <Input
                placeholder="Value"
                value={prize.value}
                onChange={(e) => updatePrize(idx, "value", e.target.value)}
                className="w-24"
              />
              <Input
                type="number"
                placeholder="Prob %"
                value={prize.probability}
                onChange={(e) =>
                  updatePrize(idx, "probability", parseInt(e.target.value))
                }
                className="w-20"
              />
              <input
                type="color"
                value={prize.color}
                onChange={(e) => updatePrize(idx, "color", e.target.value)}
                className="w-10 h-10 rounded border"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removePrize(idx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_single_prize}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_single_prize: checked })
              }
            />
            <Label>Single Prize Mode (auto-lock when won)</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.show_confetti}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, show_confetti: checked })
              }
            />
            <Label>Confetti on Win</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.play_sounds}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, play_sounds: checked })
              }
            />
            <Label>Sound Effects</Label>
          </div>
        </div>
      </div>

      <Button
        onClick={() => {
          if (validateProbabilities()) {
            onSave(formData);
          }
        }}
      >
        Save Game
      </Button>
    </div>
  );
}
