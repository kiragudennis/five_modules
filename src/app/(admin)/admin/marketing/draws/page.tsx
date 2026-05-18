// app/admin/marketing/draws/page.tsx (Enhanced Unified Admin Panel)
// This page lists all draws with key stats and quick actions for admins to manage and perform draws.
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { DrawsService } from "@/lib/services/draws-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Eye,
  Trophy,
  Ticket,
  Users,
  Calendar,
  Gift,
  Crown,
  Clock,
  Play,
  Loader2,
  Target,
  Share2,
  X,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";

interface Draw {
  id: string;
  name: string;
  slug: string;
  description: string;
  prize_name: string;
  prize_description: string;
  prize_value: number;
  prize_image_url: string;
  entry_config: any;
  max_entries_total: number | null;
  max_entries_per_user: number | null;
  entry_starts_at: string;
  entry_ends_at: string;
  draw_time: string;
  status: string;
  winner_id: string | null;
  winner_announced_at: string | null;
  winner_claim_expires_at: string | null;
  consolation_points_awarded: boolean;
  consolation_points_amount: number;
  auto_redraw_days: number;
  redraw_count: number;
  max_redraws: number;
  theme_color: string;
  show_entry_ticker: boolean;
  show_leaderboard: boolean;
  created_at: string;
  draw_group_id: string | null;
}

export default function AdminDrawsPage() {
  const { supabase } = useAuth();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [drawStats, setDrawStats] = useState<Record<string, any>>({});

  const drawsService = new DrawsService(supabase);

  const fetchData = useCallback(async () => {
    try {
      const [drawsData, groupsData] = await Promise.all([
        drawsService.getDraws({ groupId: selectedGroup || undefined }),
        drawsService.getDrawGroups(),
      ]);
      setDraws(drawsData);
      setGroups(groupsData);

      // Fetch stats for each draw
      const stats: Record<string, any> = {};
      for (const draw of drawsData) {
        const [entriesCount, participantsCount, winnersCount] =
          await Promise.all([
            drawsService.getTotalEntries(draw.id),
            supabase
              .from("draw_entries")
              .select("user_id", { count: "exact" })
              .eq("draw_id", draw.id),
            supabase
              .from("draw_winners")
              .select("id", { count: "exact" })
              .eq("draw_id", draw.id),
          ]);
        stats[draw.id] = {
          entries: entriesCount,
          participants: participantsCount.count || 0,
          winners: winnersCount.count || 0,
        };
      }
      setDrawStats(stats);
    } catch (error) {
      console.error("Error fetching draws:", error);
      toast.error("Failed to load draws");
    } finally {
      setLoading(false);
    }
  }, [supabase, drawsService, selectedGroup]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateDrawStatus = async (drawId: string, newStatus: string) => {
    try {
      await drawsService.updateDrawPhase(drawId, newStatus);
      toast.success(`Draw ${newStatus}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const performDraw = async (drawId: string) => {
    try {
      const result = await drawsService.performDraw(drawId);
      toast.success(
        `Draw completed! ${result.winners.length} winners selected from ${result.totalTickets} entries`,
      );
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
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
      draft: { label: "Draft", variant: "secondary", icon: FileText },
      open: { label: "Open", variant: "default", icon: Ticket },
      closed: { label: "Entries Closed", variant: "secondary", icon: Clock },
      drawing: { label: "Drawing...", variant: "secondary", icon: Loader2 },
      completed: { label: "Completed", variant: "outline", icon: Trophy },
      cancelled: { label: "Cancelled", variant: "destructive", icon: X },
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

  const getEntryProgress = (draw: Draw) => {
    const totalEntries = drawStats[draw.id]?.entries || 0;
    if (!draw.max_entries_total) return null;
    return (totalEntries / draw.max_entries_total) * 100;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Draws & Giveaways</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage lucky draws with multiple entry methods
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? (
              <List className="h-4 w-4" />
            ) : (
              <LayoutGrid className="h-4 w-4" />
            )}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Draw
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Draw</DialogTitle>
              </DialogHeader>
              <DrawForm onSave={fetchData} groups={groups} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Group Filter Tabs */}
      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge
            variant={selectedGroup === null ? "default" : "outline"}
            className="cursor-pointer px-4 py-2"
            onClick={() => setSelectedGroup(null)}
          >
            All Draws
          </Badge>
          {groups.map((group) => (
            <Badge
              key={group.id}
              variant={selectedGroup === group.id ? "default" : "outline"}
              className="cursor-pointer px-4 py-2"
              onClick={() => setSelectedGroup(group.id)}
            >
              {group.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Draws Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {draws.map((draw) => (
            <DrawCard
              key={draw.id}
              draw={draw}
              stats={drawStats[draw.id]}
              onUpdateStatus={updateDrawStatus}
              onPerformDraw={performDraw}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {draws.map((draw) => (
            <DrawListItem
              key={draw.id}
              draw={draw}
              stats={drawStats[draw.id]}
              onUpdateStatus={updateDrawStatus}
              onPerformDraw={performDraw}
            />
          ))}
        </div>
      )}

      {draws.length === 0 && (
        <Card className="p-12 text-center">
          <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No draws yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first draw to get started
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Draw
              </Button>
            </DialogTrigger>
          </Dialog>
        </Card>
      )}
    </div>
  );
}

// Draw Card Component
function DrawCard({ draw, stats, onUpdateStatus, onPerformDraw }: any) {
  const isEntryOpen =
    new Date(draw.entry_starts_at) <= new Date() &&
    new Date(draw.entry_ends_at) >= new Date();
  const isDrawTime = new Date(draw.draw_time) <= new Date();
  const progress = draw.max_entries_total
    ? (stats?.entries / draw.max_entries_total) * 100
    : null;

  return (
    <Card className="relative overflow-hidden">
      {/* Progress bar at top */}
      {progress !== null && (
        <div className="absolute top-0 left-0 right-0">
          <Progress value={progress} className="h-1 rounded-none" />
        </div>
      )}

      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {draw.name}
              {getStatusBadge(draw.status)}
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {draw.description}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Prize Info */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5">
          <Gift className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="font-medium">{draw.prize_name}</p>
            {draw.prize_value && (
              <p className="text-sm text-muted-foreground">
                KES {draw.prize_value.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{stats?.entries || 0}</p>
            <p className="text-xs text-muted-foreground">Entries</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{stats?.participants || 0}</p>
            <p className="text-xs text-muted-foreground">Participants</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{stats?.winners || 0}</p>
            <p className="text-xs text-muted-foreground">Winners</p>
          </div>
        </div>

        {/* Entry Methods */}
        <div className="flex flex-wrap gap-1">
          {draw.entry_config?.purchase && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Target className="h-3 w-3" />
              Purchase
            </Badge>
          )}
          {draw.entry_config?.referral && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Users className="h-3 w-3" />
              Referral
            </Badge>
          )}
          {draw.entry_config?.social_share && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Share2 className="h-3 w-3" />
              Social Share
            </Badge>
          )}
          {draw.entry_config?.live_stream && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Radio className="h-3 w-3" />
              Live Stream
            </Badge>
          )}
          {draw.entry_config?.loyalty_tier && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Crown className="h-3 w-3" />
              Loyalty Bonus
            </Badge>
          )}
        </div>

        {/* Timing */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entries Open:</span>
            <span>
              {format(new Date(draw.entry_starts_at), "MMM d, HH:mm")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entries Close:</span>
            <span>{format(new Date(draw.entry_ends_at), "MMM d, HH:mm")}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span className="text-muted-foreground">Draw Time:</span>
            <span>{format(new Date(draw.draw_time), "MMM d, HH:mm")}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/draws/live/${draw.id}`} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Live View
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/admin/marketing/draws/${draw.id}/control`}>
              <Trophy className="h-4 w-4 mr-2" />
              Control
            </Link>
          </Button>
        </div>

        {/* Status-specific actions */}
        {draw.status === "draft" && isEntryOpen && (
          <Button
            className="w-full"
            onClick={() => onUpdateStatus(draw.id, "open")}
          >
            <Ticket className="h-4 w-4 mr-2" />
            Open for Entries
          </Button>
        )}

        {draw.status === "open" &&
          new Date(draw.entry_ends_at) < new Date() && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => onUpdateStatus(draw.id, "closed")}
            >
              <Clock className="h-4 w-4 mr-2" />
              Close Entries
            </Button>
          )}

        {draw.status === "closed" && isDrawTime && (
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
            onClick={() => onPerformDraw(draw.id)}
          >
            <Play className="h-4 w-4 mr-2" />
            Perform Draw
          </Button>
        )}

        {draw.status === "completed" && draw.winner_id && (
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/admin/draws/${draw.id}/winners`}>
              <Trophy className="h-4 w-4 mr-2" />
              View Winners
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Draw List Item Component
function DrawListItem({ draw, stats, onUpdateStatus, onPerformDraw }: any) {
  const isDrawTime = new Date(draw.draw_time) <= new Date();
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{draw.name}</h3>
              {getStatusBadge(draw.status)}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Gift className="h-3 w-3" />
                {draw.prize_name}
              </span>
              <span className="flex items-center gap-1">
                <Ticket className="h-3 w-3" />
                {stats?.entries || 0} entries
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Draw: {format(new Date(draw.draw_time), "MMM d, HH:mm")}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/draws/live/${draw.id}`} target="_blank">
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/draws/${draw.id}/control`}>
                <Trophy className="h-4 w-4" />
              </Link>
            </Button>
            {draw.status === "closed" && isDrawTime && (
              <Button size="sm" onClick={() => onPerformDraw(draw.id)}>
                <Play className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Draw Form Component
function DrawForm({ onSave, initialDraw, groups }: any) {
  const { supabase } = useAuth();
  const [formData, setFormData] = useState(
    initialDraw || {
      name: "",
      description: "",
      prize_name: "",
      prize_description: "",
      prize_value: "",
      prize_image_url: "",
      entry_config: {
        purchase: { min_amount: 1000, entries_per_ksh: 1 },
        referral: { entries_per_referral: 5, bonus_for_first_referral: 5 },
        social_share: { entries_per_share: 2, max_entries_per_day: 10 },
        live_stream: { entries_per_email: 1 },
        loyalty_tier: { bronze: 1, silver: 2, gold: 5, platinum: 10 },
      },
      max_entries_per_user: "",
      max_entries_total: "",
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
      consolation_points_amount: 50,
      auto_redraw_days: 7,
      max_redraws: 1,
      draw_group_id: "",
    },
  );

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("draws")
        .upsert({
          ...formData,
          slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          prize_value: formData.prize_value
            ? parseFloat(formData.prize_value)
            : null,
          max_entries_per_user: formData.max_entries_per_user
            ? parseInt(formData.max_entries_per_user)
            : null,
          max_entries_total: formData.max_entries_total
            ? parseInt(formData.max_entries_total)
            : null,
        })
        .select();

      if (error) throw error;
      toast.success("Draw saved successfully");
      onSave();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
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
          <Label>Draw Group (optional)</Label>
          <select
            className="w-full border rounded-lg p-2"
            value={formData.draw_group_id}
            onChange={(e) =>
              setFormData({ ...formData, draw_group_id: e.target.value })
            }
          >
            <option value="">No Group</option>
            {groups?.map((group: any) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
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
        />
      </div>

      {/* Prize Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Prize Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Prize Name *</Label>
            <Input
              value={formData.prize_name}
              onChange={(e) =>
                setFormData({ ...formData, prize_name: e.target.value })
              }
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
        <div>
          <Label>Prize Image URL</Label>
          <Input
            value={formData.prize_image_url}
            onChange={(e) =>
              setFormData({ ...formData, prize_image_url: e.target.value })
            }
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Timing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Schedule</h3>
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
      </div>

      {/* Limits */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Entry Limits</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Max Entries Per User</Label>
            <Input
              type="number"
              value={formData.max_entries_per_user}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_entries_per_user: e.target.value,
                })
              }
              placeholder="Unlimited"
            />
          </div>
          <div>
            <Label>Max Total Entries</Label>
            <Input
              type="number"
              value={formData.max_entries_total}
              onChange={(e) =>
                setFormData({ ...formData, max_entries_total: e.target.value })
              }
              placeholder="Unlimited"
            />
          </div>
        </div>
      </div>

      {/* Winner Management */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          Winner Management
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Auto Redraw Days</Label>
            <Input
              type="number"
              value={formData.auto_redraw_days}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  auto_redraw_days: parseInt(e.target.value),
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Days after which unclaimed prizes are redrawn
            </p>
          </div>
          <div>
            <Label>Max Redraws</Label>
            <Input
              type="number"
              value={formData.max_redraws}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_redraws: parseInt(e.target.value),
                })
              }
            />
          </div>
        </div>
        <div>
          <Label>Consolation Points</Label>
          <Input
            type="number"
            value={formData.consolation_points_amount}
            onChange={(e) =>
              setFormData({
                ...formData,
                consolation_points_amount: parseInt(e.target.value),
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Points awarded to all non-winners
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={() => onSave()}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Draw"}
        </Button>
      </div>
    </div>
  );
}

// Helper function for status badge
function getStatusBadge(status: string) {
  const config: Record<string, any> = {
    draft: { label: "Draft", variant: "secondary", icon: FileText },
    open: { label: "Open", variant: "default", icon: Ticket },
    closed: { label: "Closed", variant: "secondary", icon: Clock },
    drawing: { label: "Drawing", variant: "secondary", icon: Loader2 },
    completed: { label: "Completed", variant: "outline", icon: Trophy },
    cancelled: { label: "Cancelled", variant: "destructive", icon: X },
  };
  const c = config[status] || config.draft;
  const Icon = c.icon;
  return (
    <Badge variant={c.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {c.label}
    </Badge>
  );
}

// Missing imports
import { FileText } from "lucide-react";
import { Radio } from "lucide-react";
