// app/admin/marketing/spin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Plus, Edit, Trash2, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";

interface SpinGame {
  id: string;
  name: string;
  description: string | null;
  type: "daily" | "weekly" | "special";
  free_spins_per_day: number;
  points_per_spin: number;
  max_spins_per_day: number;
  wheel_config: Array<{
    label: string;
    value: string;
    type: string;
    quantity: number;
    probability: number;
    color: string;
  }>;
  segment_colors: string[];
  rules: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export default function AdminSpinPage() {
  const { supabase, profile } = useAuth();
  const [games, setGames] = useState<SpinGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGame, setEditingGame] = useState<Partial<SpinGame>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  // Get create param from URL to open dialog in create mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "true") {
      setDialogOpen(true);
    }
  }, []);

  useEffect(() => {
    if (profile?.role !== "admin") return;
    fetchGames();
  }, [profile]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("spin_games")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (error: any) {
      console.error("Error fetching spin games:", error);
      toast.error("Could not load spin games");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGame = async () => {
    try {
      setSaving(true);

      if (!editingGame.name || !editingGame.wheel_config?.length) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Ensure probabilities sum to 1
      const totalProb = editingGame.wheel_config.reduce(
        (sum, seg) => sum + seg.probability,
        0,
      );
      if (Math.abs(totalProb - 1) > 0.01) {
        toast.error("Segment probabilities must sum to 1 (100%)");
        return;
      }

      const gameData = {
        ...editingGame,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editingGame.id) {
        ({ error } = await supabase
          .from("spin_games")
          .update(gameData)
          .eq("id", editingGame.id));
      } else {
        gameData.created_by = profile?.id;
        ({ error } = await supabase.from("spin_games").insert([gameData]));
      }

      if (error) throw error;

      toast.success(
        `Spin game ${editingGame.id ? "updated" : "created"} successfully`,
      );
      setDialogOpen(false);
      setEditingGame({});
      fetchGames();
    } catch (error: any) {
      console.error("Error saving spin game:", error);
      toast.error("Could not save spin game");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGame = async (id: string) => {
    if (!confirm("Are you sure you want to delete this spin game?")) return;

    try {
      const { error } = await supabase.from("spin_games").delete().eq("id", id);

      if (error) throw error;

      toast.success("Spin game deleted successfully");
      fetchGames();
    } catch (error: any) {
      console.error("Error deleting spin game:", error);
      toast.error("Could not delete spin game");
    }
  };

  const addSegment = () => {
    const segments = editingGame.wheel_config || [];
    const colors = editingGame.segment_colors || [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
    ];

    setEditingGame({
      ...editingGame,
      wheel_config: [
        ...segments,
        {
          label: `Prize ${segments.length + 1}`,
          value: "10",
          type: "points",
          quantity: 1,
          probability: 0.1,
          color: colors[segments.length % colors.length],
        },
      ],
    });
  };

  const updateSegment = (index: number, field: string, value: any) => {
    const segments = [...(editingGame.wheel_config || [])];
    segments[index] = { ...segments[index], [field]: value };

    // Rebalance probabilities if needed
    if (field === "probability") {
      const otherSegments = segments.filter((_, i) => i !== index);
      const otherTotal = otherSegments.reduce(
        (sum, seg) => sum + seg.probability,
        0,
      );
      if (otherTotal + value > 1) {
        // Scale down others
        const scale = (1 - value) / otherTotal;
        otherSegments.forEach((seg, i) => {
          const originalIndex = segments.findIndex(
            (s) => s.label === seg.label,
          );
          if (originalIndex !== -1) {
            segments[originalIndex].probability *= scale;
          }
        });
      }
    }

    setEditingGame({ ...editingGame, wheel_config: segments });
  };

  const removeSegment = (index: number) => {
    const segments =
      editingGame.wheel_config?.filter((_, i) => i !== index) || [];
    setEditingGame({ ...editingGame, wheel_config: segments });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Spin Games</h1>
          <p className="text-muted-foreground my-2">
            Configure daily spin wheels and prizes
          </p>
          {/* Back to Marketing */}
          <Button variant="link" className="px-0" asChild>
            <Link href={"/admin/marketing"}>Back to Marketing</Link>
          </Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() =>
                setEditingGame({
                  type: "daily",
                  free_spins_per_day: 1,
                  points_per_spin: 100,
                  max_spins_per_day: 3,
                  wheel_config: [],
                  segment_colors: [
                    "#FF6B6B",
                    "#4ECDC4",
                    "#45B7D1",
                    "#96CEB4",
                    "#FFEAA7",
                    "#DDA0DD",
                    "#98D8C8",
                    "#F7DC6F",
                  ],
                  is_active: true,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Spin Game
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGame.id ? "Edit Spin Game" : "Create New Spin Game"}
              </DialogTitle>
              <DialogDescription>
                {editingGame.id
                  ? "Modify the settings of your spin game and save to update."
                  : "Configure the details of your new spin game and save to create."}
              </DialogDescription>
            </DialogHeader>

            {editingGame && (
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Game Name *</Label>
                      <Input
                        id="name"
                        value={editingGame.name || ""}
                        onChange={(e) =>
                          setEditingGame({
                            ...editingGame,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g., Daily Lucky Spin"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Game Type</Label>
                      <Select
                        value={editingGame.type}
                        onValueChange={(value: any) =>
                          setEditingGame({ ...editingGame, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="special">Special</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editingGame.description || ""}
                      onChange={(e) =>
                        setEditingGame({
                          ...editingGame,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe the spin game rules and prizes"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Spin Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Spin Settings</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Free Spins Per Day</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editingGame.free_spins_per_day || 1}
                        onChange={(e) =>
                          setEditingGame({
                            ...editingGame,
                            free_spins_per_day: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Points Per Spin</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editingGame.points_per_spin || 100}
                        onChange={(e) =>
                          setEditingGame({
                            ...editingGame,
                            points_per_spin: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Spins Per Day</Label>
                      <Input
                        type="number"
                        min="1"
                        value={editingGame.max_spins_per_day || 3}
                        onChange={(e) =>
                          setEditingGame({
                            ...editingGame,
                            max_spins_per_day: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Wheel Segments */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Wheel Segments *</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSegment}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Segment
                    </Button>
                  </div>

                  {editingGame.wheel_config?.map((segment, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Segment {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSegment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Label</Label>
                          <Input
                            value={segment.label}
                            onChange={(e) =>
                              updateSegment(index, "label", e.target.value)
                            }
                            placeholder="e.g., 100 Points"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Prize Type</Label>
                          <Select
                            value={segment.type}
                            onValueChange={(value) =>
                              updateSegment(index, "type", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="points">Points</SelectItem>
                              <SelectItem value="discount">
                                Discount %
                              </SelectItem>
                              <SelectItem value="product">Product</SelectItem>
                              <SelectItem value="free_shipping">
                                Free Shipping
                              </SelectItem>
                              <SelectItem value="nothing">Try Again</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Value</Label>
                          <Input
                            value={segment.value}
                            onChange={(e) =>
                              updateSegment(index, "value", e.target.value)
                            }
                            placeholder={
                              segment.type === "points" ? "100" : "10"
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Probability (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={segment.probability * 100}
                            onChange={(e) =>
                              updateSegment(
                                index,
                                "probability",
                                parseFloat(e.target.value) / 100,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Color</Label>
                          <Input
                            type="color"
                            value={segment.color || "#000000"}
                            onChange={(e) =>
                              updateSegment(index, "color", e.target.value)
                            }
                            className="h-10"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!editingGame.wheel_config ||
                    editingGame.wheel_config.length === 0) && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        No segments added yet
                      </p>
                      <Button type="button" variant="link" onClick={addSegment}>
                        Add your first segment
                      </Button>
                    </div>
                  )}
                </div>

                {/* Rules */}
                <div className="space-y-2">
                  <Label htmlFor="rules">Rules & Instructions</Label>
                  <Textarea
                    id="rules"
                    value={editingGame.rules || ""}
                    onChange={(e) =>
                      setEditingGame({ ...editingGame, rules: e.target.value })
                    }
                    placeholder="Explain how the spin game works..."
                    rows={3}
                  />
                </div>

                {/* Schedule */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Schedule</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="datetime-local"
                        value={editingGame.start_date?.slice(0, 16) || ""}
                        onChange={(e) =>
                          setEditingGame({
                            ...editingGame,
                            start_date: e.target.value || null,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="datetime-local"
                        value={editingGame.end_date?.slice(0, 16) || ""}
                        onChange={(e) =>
                          setEditingGame({
                            ...editingGame,
                            end_date: e.target.value || null,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={editingGame.is_active || false}
                    onCheckedChange={(checked) =>
                      setEditingGame({ ...editingGame, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Game Active</Label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveGame} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingGame.id ? "Update" : "Create"} Game
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Free Spins</TableHead>
                <TableHead>Points/Spin</TableHead>
                <TableHead>Segments</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : games.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No spin games found. Create your first spin game!
                  </TableCell>
                </TableRow>
              ) : (
                games.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell className="font-medium">{game.name}</TableCell>
                    <TableCell className="capitalize">{game.type}</TableCell>
                    <TableCell>{game.free_spins_per_day}</TableCell>
                    <TableCell>{game.points_per_spin}</TableCell>
                    <TableCell>{game.wheel_config?.length || 0}</TableCell>
                    <TableCell>
                      <Badge variant={game.is_active ? "default" : "secondary"}>
                        {game.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {game.start_date ? (
                        <div className="text-sm">
                          {format(new Date(game.start_date), "MMM d")}
                          {game.end_date &&
                            ` → ${format(new Date(game.end_date), "MMM d")}`}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Always
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingGame(game);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGame(game.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
