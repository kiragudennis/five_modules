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
import {
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  Coins,
  Ticket,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Eye, Search, Filter, Download } from "lucide-react";

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
    product_name?: string | null;
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
  const [activeTab, setActiveTab] = useState<"games" | "results">("games");
  const [spinResults, setSpinResults] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
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
          product_name: "",
        },
      ],
    });
  };

  const updateSegment = (index: number, field: string, value: any) => {
    const segments = [...(editingGame.wheel_config || [])];
    segments[index] = { ...segments[index], [field]: value };

    // If changing type to 'product', set default product_name
    if (field === "type" && value === "product") {
      segments[index] = {
        ...segments[index],
        [field]: value,
        product_name: segments[index].label || "Product Prize",
      };
    } else {
      segments[index] = { ...segments[index], [field]: value };
    }

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

  const fetchSpinResults = async () => {
    try {
      setResultsLoading(true);

      let query = supabase
        .from("spin_results")
        .select(
          `
        *,
        spin_games (name),
        coupons (code, discount_type, discount_value, valid_until, is_used),
        users (email, full_name)
      `,
        )
        .order("created_at", { ascending: false });

      // Apply date filters
      if (dateFilter.from) {
        query = query.gte("created_at", dateFilter.from);
      }
      if (dateFilter.to) {
        query = query.lte("created_at", dateFilter.to);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSpinResults(data || []);
    } catch (error: any) {
      console.error("Error fetching spin results:", error);
      toast.error("Could not load spin results");
    } finally {
      setResultsLoading(false);
    }
  };

  // Add this function to export results to CSV
  const exportToCSV = () => {
    const headers = [
      "Date",
      "User",
      "Email",
      "Game",
      "Prize Type",
      "Prize Label",
      "Prize Value",
      "Coupon Code",
      "Coupon Status",
      "Claimed",
    ];

    const rows = filteredResults.map((result) => [
      format(new Date(result.created_at), "yyyy-MM-dd HH:mm"),
      result.users?.full_name || "N/A",
      result.users?.email || "N/A",
      result.spin_games?.name || "N/A",
      result.prize_type,
      result.prize_value,
      result.loyalty_points_awarded || result.prize_value,
      result.coupons?.code || "N/A",
      result.coupons?.is_used ? "Used" : "Available",
      result.is_claimed ? "Yes" : "No",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spin-results-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  // Filter results based on search
  const filteredResults = spinResults.filter(
    (result) =>
      result.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.users?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      result.coupons?.code?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="container mx-auto px-2 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Spin Games</h1>
          <p className="text-muted-foreground my-2">
            Configure spin wheels and view customer wins
          </p>
          {/* Back to Marketing */}
          <Button variant="link" className="px-0" asChild>
            <Link href={"/admin/marketing"}>Back to Marketing</Link>
          </Button>
        </div>

        <Tabs
          defaultValue="games"
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as "games" | "results");
            if (v === "results") fetchSpinResults();
          }}
          className="space-y-6"
        >
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="games">Game Management</TabsTrigger>
            <TabsTrigger value="results">Spin Results</TabsTrigger>
          </TabsList>

          <TabsContent value="games">
            <div className="flex justify-end mb-4">
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
                      {editingGame.id
                        ? "Edit Spin Game"
                        : "Create New Spin Game"}
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
                        <h3 className="text-lg font-semibold">
                          Basic Information
                        </h3>
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
                          <h3 className="text-lg font-semibold">
                            Wheel Segments *
                          </h3>
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
                              <h4 className="font-medium">
                                Segment {index + 1}
                              </h4>
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
                                    updateSegment(
                                      index,
                                      "label",
                                      e.target.value,
                                    )
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
                                    <SelectItem value="points">
                                      Points
                                    </SelectItem>
                                    <SelectItem value="discount">
                                      Discount %
                                    </SelectItem>
                                    <SelectItem value="product">
                                      Product
                                    </SelectItem>
                                    <SelectItem value="free_shipping">
                                      Free Shipping
                                    </SelectItem>
                                    <SelectItem value="nothing">
                                      Try Again
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {segment.type === "product" && (
                                <>
                                  <div className="space-y-2">
                                    <Label>Product Name</Label>
                                    <Input
                                      value={
                                        segment.product_name || segment.label
                                      }
                                      onChange={(e) =>
                                        updateSegment(
                                          index,
                                          "product_name",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="e.g., Smart LED Bulb - WiFi Enabled"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      This is what the customer will see when
                                      they win
                                    </p>
                                  </div>

                                  {/* Optional: Add a note about quantity available */}
                                  <div className="space-y-2">
                                    <Label>Quantity Available</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={segment.quantity || 1}
                                      onChange={(e) =>
                                        updateSegment(
                                          index,
                                          "quantity",
                                          parseInt(e.target.value),
                                        )
                                      }
                                    />
                                  </div>
                                </>
                              )}
                              <div className="space-y-2">
                                <Label>Value</Label>
                                <Input
                                  value={segment.value}
                                  onChange={(e) =>
                                    updateSegment(
                                      index,
                                      "value",
                                      e.target.value,
                                    )
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
                                    updateSegment(
                                      index,
                                      "color",
                                      e.target.value,
                                    )
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
                            <Button
                              type="button"
                              variant="link"
                              onClick={addSegment}
                            >
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
                            setEditingGame({
                              ...editingGame,
                              rules: e.target.value,
                            })
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
                            setEditingGame({
                              ...editingGame,
                              is_active: checked,
                            })
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
                          <TableCell className="font-medium">
                            {game.name}
                          </TableCell>
                          <TableCell className="capitalize">
                            {game.type}
                          </TableCell>
                          <TableCell>{game.free_spins_per_day}</TableCell>
                          <TableCell>{game.points_per_spin}</TableCell>
                          <TableCell>
                            {game.wheel_config?.length || 0}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={game.is_active ? "default" : "secondary"}
                            >
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
          </TabsContent>
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Customer Spin Results</CardTitle>
                <p className="text-sm text-muted-foreground">
                  View all customer spins, wins, and coupon usage
                </p>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by user or coupon..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="From"
                      value={dateFilter.from}
                      onChange={(e) =>
                        setDateFilter({ ...dateFilter, from: e.target.value })
                      }
                      className="w-[150px]"
                    />
                    <Input
                      type="date"
                      placeholder="To"
                      value={dateFilter.to}
                      onChange={(e) =>
                        setDateFilter({ ...dateFilter, to: e.target.value })
                      }
                      className="w-[150px]"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={fetchSpinResults}
                    className="gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportToCSV}
                    className="gap-2"
                    disabled={spinResults.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>

                {/* Results Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Game</TableHead>
                        <TableHead>Prize</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Coupon</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultsLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : filteredResults.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No spin results found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredResults.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell>
                              {format(
                                new Date(result.created_at),
                                "MMM d, h:mm a",
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {result.users?.full_name || "N/A"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {result.users?.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{result.spin_games?.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {result.prize_type === "points" && (
                                  <Coins className="h-4 w-4 text-yellow-500" />
                                )}
                                {result.prize_type === "discount" && (
                                  <Ticket className="h-4 w-4 text-green-500" />
                                )}
                                {result.prize_type === "product" && (
                                  <Gift className="h-4 w-4 text-purple-500" />
                                )}
                                <span className="capitalize">
                                  {result.prize_type}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {result.prize_type === "points" ? (
                                <Badge variant="secondary">
                                  {result.loyalty_points_awarded} pts
                                </Badge>
                              ) : result.prize_type === "discount" ? (
                                <Badge variant="secondary">
                                  {result.coupons?.discount_type ===
                                  "percentage"
                                    ? `${result.coupons?.discount_value}%`
                                    : `KES ${result.coupons?.discount_value}`}
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  {result.prize_value}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {result.coupons ? (
                                <div className="flex items-center gap-2">
                                  <code className="px-2 py-1 bg-muted rounded text-xs">
                                    {result.coupons.code}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        result.coupons.code,
                                      );
                                      toast.success("Copied!");
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge
                                  variant={
                                    result.is_claimed ? "default" : "outline"
                                  }
                                  className={
                                    result.is_claimed ? "bg-green-500" : ""
                                  }
                                >
                                  {result.is_claimed ? "Claimed" : "Available"}
                                </Badge>
                                {result.coupons?.is_used && (
                                  <Badge variant="destructive" className="ml-1">
                                    Used
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // View full details
                                  toast.info(
                                    `Prize: ${result.prize_label || result.prize_value}`,
                                  );
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">
                        Total Spins
                      </p>
                      <p className="text-2xl font-bold">{spinResults.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Wins</p>
                      <p className="text-2xl font-bold">
                        {
                          spinResults.filter((r) => r.prize_type !== "nothing")
                            .length
                        }
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">
                        Coupons Generated
                      </p>
                      <p className="text-2xl font-bold">
                        {spinResults.filter((r) => r.coupon_id).length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">
                        Points Awarded
                      </p>
                      <p className="text-2xl font-bold">
                        {spinResults.reduce(
                          (sum, r) => sum + (r.loyalty_points_awarded || 0),
                          0,
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
