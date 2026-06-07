// app/admin/marketing/draws/page.tsx - Complete Enhanced Version

"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { DrawsService } from "@/lib/services/draws-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Ticket, LayoutGrid, List, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Draw } from "@/types/draws";
import { DrawForm } from "@/components/admin/draw-form";
import { DrawCard } from "@/components/admin/draw-card";
import { DrawListItem } from "@/components/admin/draw-list";

export default function AdminDrawsPage() {
  const { supabase } = useAuth();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [drawStats, setDrawStats] = useState<Record<string, any>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDraw, setEditingDraw] = useState<Draw | null>(null);

  const drawsService = new DrawsService(supabase);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Single RPC call for all draws with stats
      const drawsWithStats = await drawsService.getDrawsWithStats(
        selectedGroup || undefined,
      );

      if (drawsWithStats.length === 0) {
        setDraws([]);
        setGroups([]);
        setDrawStats({});
        setLoading(false);
        return;
      }

      // Extract draws and build stats object
      const drawsData = drawsWithStats.map((item: any) => {
        const {
          total_entries,
          total_participants,
          total_winners,
          total_claimed_winners,
          ...draw
        } = item;
        return draw;
      });

      // Build stats object
      const stats: Record<string, any> = {};
      drawsWithStats.forEach((draw: any) => {
        stats[draw.id] = {
          entries: draw.total_entries || 0,
          participants: draw.total_participants || 0,
          winners: draw.total_winners || 0,
          claimed_winners: draw.total_claimed_winners || 0,
        };
      });

      // Get draw groups separately (this is a separate query)
      const groupsData = await drawsService.getDrawGroups();

      setDraws(drawsData);
      setGroups(groupsData);
      setDrawStats(stats);
    } catch (error) {
      console.error("Error fetching draws:", error);
      toast.error("Failed to load draws");
    } finally {
      setLoading(false);
    }
  }, [drawsService, selectedGroup]);

  // Add a manual refresh button instead
  const handleRefresh = useCallback(() => {
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
        `Draw completed! ${result.winners.length} winners selected`,
      );
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-2 py-8">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading draws...</p>
        </div>
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
          {/* Create Draw Button */}
          <Button
            variant="default"
            onClick={() => {
              setEditingDraw(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Draw
          </Button>

          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
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

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingDraw ? "Edit Draw" : "Create New Draw"}
                </DialogTitle>
                <DialogDescription>
                  {editingDraw
                    ? "Update your draw details across all sections"
                    : "Fill in the details across all sections to create your draw"}
                </DialogDescription>
              </DialogHeader>
              <DrawForm
                initialDraw={editingDraw}
                groups={groups}
                onSave={() => {
                  fetchData();
                  setDialogOpen(false);
                  setEditingDraw(null);
                }}
                onCancel={() => {
                  setDialogOpen(false);
                  setEditingDraw(null);
                }}
              />
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
              onEdit={() => {
                setEditingDraw(draw);
                setDialogOpen(true);
              }}
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
              onEdit={() => {
                setEditingDraw(draw);
                setDialogOpen(true);
              }}
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
              <Button onClick={() => setDialogOpen(true)}>
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
