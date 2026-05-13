// src/app/(admin)/admin/marketing/draws/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Gift,
  Ticket,
  Users,
  Clock,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Draw, EntryConfig } from "@/types/draws";
import { DrawsService } from "@/lib/services/draws-service";

export default function DrawsAdmin() {
  const { supabase } = useAuth();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [performingDraw, setPerformingDraw] = useState<string | null>(null);

  const drawsService = new DrawsService();

  useEffect(() => {
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    const { data } = await supabase
      .from("draws")
      .select("*")
      .order("created_at", { ascending: false });
    setDraws(data || []);
    setLoading(false);
  };

  const updateDrawStatus = async (id: string, status: string) => {
    await supabase.from("draws").update({ status }).eq("id", id);
    toast.success(`Draw ${status}`);
    await fetchDraws();
  };

  const deleteDraw = async (id: string) => {
    if (confirm("Delete this draw?")) {
      await supabase.from("draws").delete().eq("id", id);
      toast.success("Draw deleted");
      await fetchDraws();
    }
  };

  const runDraw = async (id: string) => {
    setPerformingDraw(id);
    try {
      const result = await drawsService.performDraw(id);
      toast.success(
        `Draw completed! ${result.winners.length} winners selected from ${result.totalTickets} entries`,
      );
      await fetchDraws();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPerformingDraw(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      draft: { label: "Draft", variant: "secondary" },
      open: { label: "Open", variant: "default" },
      closed: { label: "Closed", variant: "warning" as any },
      drawing: { label: "Drawing...", variant: "secondary" },
      completed: { label: "Completed", variant: "outline" },
      cancelled: { label: "Cancelled", variant: "destructive" },
    };
    const c = config[status] || config.draft;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Draws & Giveaways</h1>
          <p className="text-muted-foreground">
            Manage lucky draws with multiple entry methods
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedDraw(null)}>
              <Plus className="h-4 w-4 mr-2" />
              New Draw
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedDraw ? "Edit Draw" : "Create Draw"}
              </DialogTitle>
            </DialogHeader>
            <DrawForm
              initialDraw={selectedDraw}
              onSave={async () => {
                await fetchDraws();
                setDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {draws.map((draw) => (
          <Card key={draw.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {draw.name}
                    {getStatusBadge(draw.status)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {draw.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Prize Info */}
              <div className="flex items-center gap-2 text-sm">
                <Gift className="h-4 w-4 text-purple-500" />
                <span className="font-medium">{draw.prize_name}</span>
                {draw.prize_value && (
                  <Badge variant="outline">
                    KES {draw.prize_value.toLocaleString()}
                  </Badge>
                )}
              </div>

              {/* Timing */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entries Open:</span>
                  <span>
                    {new Date(draw.entry_starts_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entries Close:</span>
                  <span>
                    {new Date(draw.entry_ends_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Draw Date:</span>
                  <span>{new Date(draw.draw_time).toLocaleString()}</span>
                </div>
              </div>

              {/* Entry Methods */}
              <div className="flex flex-wrap gap-1">
                {draw.entry_config.purchase && (
                  <Badge variant="secondary" className="text-xs">
                    Purchase
                  </Badge>
                )}
                {draw.entry_config.referral && (
                  <Badge variant="secondary" className="text-xs">
                    Referral
                  </Badge>
                )}
                {draw.entry_config.social_share && (
                  <Badge variant="secondary" className="text-xs">
                    Social Share
                  </Badge>
                )}
                {draw.entry_config.live_stream && (
                  <Badge variant="secondary" className="text-xs">
                    Live Stream
                  </Badge>
                )}
                {draw.entry_config.loyalty_tier && (
                  <Badge variant="secondary" className="text-xs">
                    Loyalty Bonus
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    window.open(`/draws/live/${draw.id}`, "_blank")
                  }
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Live View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDraw(draw);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteDraw(draw.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Draw Button */}
              {draw.status === "closed" && (
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  onClick={() => runDraw(draw.id)}
                  disabled={performingDraw === draw.id}
                >
                  {performingDraw === draw.id ? (
                    <>Drawing...</>
                  ) : (
                    <>
                      <Trophy className="h-4 w-4 mr-2" />
                      Perform Draw
                    </>
                  )}
                </Button>
              )}

              {/* Status Management */}
              {draw.status === "draft" && (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => updateDrawStatus(draw.id, "open")}
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  Open for Entries
                </Button>
              )}

              {draw.status === "open" && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => updateDrawStatus(draw.id, "closed")}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Close Entries
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Draw Form Component
function DrawForm({
  initialDraw,
  onSave,
}: {
  initialDraw: Draw | null;
  onSave: () => void;
}) {
  const { supabase } = useAuth();
  const [formData, setFormData] = useState<any>(
    initialDraw || {
      name: "",
      slug: "",
      description: "",
      prize_name: "",
      prize_description: "",
      prize_value: "",
      entry_config: {
        purchase: { min_amount: 1000, entries_per_ksh: 1 },
        referral: { entries_per_referral: 5 },
        social_share: { entries_per_share: 2, max_entries_per_day: 10 },
        live_stream: { entries_per_email: 1 },
      },
      max_entries_per_user: null,
      max_entries_total: null,
      entry_starts_at: new Date().toISOString().slice(0, 16),
      entry_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16),
      draw_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3600000)
        .toISOString()
        .slice(0, 16),
      status: "draft",
      theme_color: "#8B5CF6",
      show_entry_ticker: true,
      show_leaderboard: false,
    },
  );

  const updateEntryConfig = (method: string, key: string, value: any) => {
    setFormData({
      ...formData,
      entry_config: {
        ...formData.entry_config,
        [method]: {
          ...formData.entry_config[method],
          [key]: value,
        },
      },
    });
  };

  const toggleEntryMethod = (method: string, enabled: boolean) => {
    const newConfig = { ...formData.entry_config };
    if (enabled) {
      if (method === "purchase")
        newConfig.purchase = { min_amount: 1000, entries_per_ksh: 1 };
      if (method === "referral")
        newConfig.referral = { entries_per_referral: 5 };
      if (method === "social_share")
        newConfig.social_share = {
          entries_per_share: 2,
          max_entries_per_day: 10,
        };
      if (method === "live_stream")
        newConfig.live_stream = { entries_per_email: 1 };
      if (method === "loyalty_tier")
        newConfig.loyalty_tier = {
          bronze: 1,
          silver: 2,
          gold: 5,
          platinum: 10,
        };
    } else {
      delete newConfig[method];
    }
    setFormData({ ...formData, entry_config: newConfig });
  };

  const handleSubmit = async () => {
    const { error } = await supabase.from("draws").upsert(formData).select();

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Draw saved");
      onSave();
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Draw Name</Label>
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

      {/* Prize Info */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Prize Details</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Prize Name</Label>
            <Input
              value={formData.prize_name}
              onChange={(e) =>
                setFormData({ ...formData, prize_name: e.target.value })
              }
              placeholder="e.g., iPhone 15 Pro"
            />
          </div>
          <div>
            <Label>Prize Value (KES)</Label>
            <Input
              type="number"
              value={formData.prize_value}
              onChange={(e) =>
                setFormData({ ...formData, prize_value: e.target.value })
              }
            />
          </div>
        </div>
        <div>
          <Label>Prize Description</Label>
          <Input
            value={formData.prize_description}
            onChange={(e) =>
              setFormData({ ...formData, prize_description: e.target.value })
            }
          />
        </div>
      </div>

      {/* Entry Methods */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Entry Methods</Label>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!formData.entry_config.purchase}
              onChange={(e) => toggleEntryMethod("purchase", e.target.checked)}
            />
            Purchase-based entries
          </label>
          {formData.entry_config.purchase && (
            <div className="ml-6 grid grid-cols-2 gap-4">
              <div>
                <Label>Min. Purchase (KES)</Label>
                <Input
                  type="number"
                  value={formData.entry_config.purchase.min_amount}
                  onChange={(e) =>
                    updateEntryConfig(
                      "purchase",
                      "min_amount",
                      parseFloat(e.target.value),
                    )
                  }
                />
              </div>
              <div>
                <Label>Entries per KSH</Label>
                <Input
                  type="number"
                  value={formData.entry_config.purchase.entries_per_ksh}
                  onChange={(e) =>
                    updateEntryConfig(
                      "purchase",
                      "entries_per_ksh",
                      parseFloat(e.target.value),
                    )
                  }
                />
              </div>
            </div>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!formData.entry_config.referral}
              onChange={(e) => toggleEntryMethod("referral", e.target.checked)}
            />
            Referral-based entries
          </label>
          {formData.entry_config.referral && (
            <div className="ml-6">
              <Label>Entries per referral</Label>
              <Input
                type="number"
                value={formData.entry_config.referral.entries_per_referral}
                onChange={(e) =>
                  updateEntryConfig(
                    "referral",
                    "entries_per_referral",
                    parseInt(e.target.value),
                  )
                }
                className="w-32"
              />
            </div>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!formData.entry_config.social_share}
              onChange={(e) =>
                toggleEntryMethod("social_share", e.target.checked)
              }
            />
            Social share entries
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!formData.entry_config.live_stream}
              onChange={(e) =>
                toggleEntryMethod("live_stream", e.target.checked)
              }
            />
            Live stream email entries
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!formData.entry_config.loyalty_tier}
              onChange={(e) =>
                toggleEntryMethod("loyalty_tier", e.target.checked)
              }
            />
            Loyalty tier bonus entries
          </label>
        </div>
      </div>

      {/* Limits */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Max entries per user (optional)</Label>
          <Input
            type="number"
            value={formData.max_entries_per_user || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                max_entries_per_user: e.target.value
                  ? parseInt(e.target.value)
                  : null,
              })
            }
          />
        </div>
        <div>
          <Label>Max total entries (optional)</Label>
          <Input
            type="number"
            value={formData.max_entries_total || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                max_entries_total: e.target.value
                  ? parseInt(e.target.value)
                  : null,
              })
            }
          />
        </div>
      </div>

      {/* Timing */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Entries Open</Label>
          <Input
            type="datetime-local"
            value={formData.entry_starts_at}
            onChange={(e) =>
              setFormData({ ...formData, entry_starts_at: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Entries Close</Label>
          <Input
            type="datetime-local"
            value={formData.entry_ends_at}
            onChange={(e) =>
              setFormData({ ...formData, entry_ends_at: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Draw Time</Label>
          <Input
            type="datetime-local"
            value={formData.draw_time}
            onChange={(e) =>
              setFormData({ ...formData, draw_time: e.target.value })
            }
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSubmit}>Save Draw</Button>
      </div>
    </div>
  );
}
