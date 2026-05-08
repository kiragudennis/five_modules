// app/admin/marketing/challenges/page.tsx
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
  Target,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Crown,
  Coins,
  Users,
  ShoppingBag,
  Star,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";

interface Challenge {
  id: string;
  name: string;
  description: string | null;
  type: "referral" | "purchase" | "review" | "social" | "custom";
  trigger_event: string;
  requirements: any;
  reward_points: number;
  reward_tier_upgrade: string | null;
  reward_details: any;
  max_rewards_per_user: number | null;
  max_total_rewards: number | null;
  current_rewards_count: number;
  badge_image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export default function AdminChallengesPage() {
  const { supabase, profile } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChallenge, setEditingChallenge] = useState<Partial<Challenge>>(
    {},
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tiers, setTiers] = useState<any[]>([]);

  // Get create param from URL to open dialog in create mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("create") === "true") {
      setDialogOpen(true);
    }
  }, []);

  useEffect(() => {
    if (profile?.role !== "admin") return;
    fetchChallenges();
    fetchTiers();
  }, [profile]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error: any) {
      console.error("Error fetching challenges:", error);
      toast.error("Could not load challenges");
    } finally {
      setLoading(false);
    }
  };

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from("loyalty_tiers")
        .select("tier")
        .order("min_points");

      if (error) throw error;
      setTiers(data || []);
    } catch (error: any) {
      console.error("Error fetching tiers:", error);
    }
  };

  const handleSaveChallenge = async () => {
    try {
      setSaving(true);

      if (!editingChallenge.name || !editingChallenge.type) {
        toast.error("Please fill in all required fields");
        return;
      }

      const challengeData = {
        ...editingChallenge,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editingChallenge.id) {
        ({ error } = await supabase
          .from("challenges")
          .update(challengeData)
          .eq("id", editingChallenge.id));
      } else {
        challengeData.created_by = profile?.id;
        challengeData.current_rewards_count = 0;
        ({ error } = await supabase.from("challenges").insert([challengeData]));
      }

      if (error) throw error;

      toast.success(
        `Challenge ${editingChallenge.id ? "updated" : "created"} successfully`,
      );
      setDialogOpen(false);
      setEditingChallenge({});
      fetchChallenges();
    } catch (error: any) {
      console.error("Error saving challenge:", error);
      toast.error("Could not save challenge");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm("Are you sure you want to delete this challenge?")) return;

    try {
      const { error } = await supabase.from("challenges").delete().eq("id", id);

      if (error) throw error;

      toast.success("Challenge deleted successfully");
      fetchChallenges();
    } catch (error: any) {
      console.error("Error deleting challenge:", error);
      toast.error("Could not delete challenge");
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case "referral":
        return <Users className="h-4 w-4" />;
      case "purchase":
        return <ShoppingBag className="h-4 w-4" />;
      case "review":
        return <Star className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Challenges</h1>
          <p className="text-muted-foreground my-2">
            Create challenges for customers to earn rewards
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
                setEditingChallenge({
                  type: "referral",
                  reward_points: 100,
                  is_active: true,
                  max_rewards_per_user: 1,
                  requirements: {},
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingChallenge.id
                  ? "Edit Challenge"
                  : "Create New Challenge"}
              </DialogTitle>
              <DialogDescription>
                {editingChallenge.id
                  ? "Modify the settings of your challenge and save to update."
                  : "Configure the details of your new challenge and save to create."}
              </DialogDescription>
            </DialogHeader>

            {editingChallenge && (
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Challenge Name *</Label>
                      <Input
                        id="name"
                        value={editingChallenge.name || ""}
                        onChange={(e) =>
                          setEditingChallenge({
                            ...editingChallenge,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g., Refer a Friend"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Challenge Type *</Label>
                      <Select
                        value={editingChallenge.type || "referral"}
                        onValueChange={(value: any) =>
                          setEditingChallenge({
                            ...editingChallenge,
                            type: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="purchase">Purchase</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="social">Social Share</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editingChallenge.description || ""}
                      onChange={(e) =>
                        setEditingChallenge({
                          ...editingChallenge,
                          description: e.target.value,
                        })
                      }
                      placeholder="Explain what users need to do..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Trigger Event</Label>
                    <Input
                      value={editingChallenge.trigger_event || ""}
                      onChange={(e) =>
                        setEditingChallenge({
                          ...editingChallenge,
                          trigger_event: e.target.value,
                        })
                      }
                      placeholder="e.g., user_signup, first_purchase"
                    />
                  </div>
                </div>

                {/* Requirements */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Requirements</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min Purchase Amount</Label>
                      <Input
                        type="number"
                        value={
                          editingChallenge.requirements?.min_purchase_amount ||
                          ""
                        }
                        onChange={(e) =>
                          setEditingChallenge({
                            ...editingChallenge,
                            requirements: {
                              ...editingChallenge.requirements,
                              min_purchase_amount:
                                parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Product Category</Label>
                      <Input
                        value={
                          editingChallenge.requirements?.product_category || ""
                        }
                        onChange={(e) =>
                          setEditingChallenge({
                            ...editingChallenge,
                            requirements: {
                              ...editingChallenge.requirements,
                              product_category: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g., solar"
                      />
                    </div>
                  </div>
                </div>

                {/* Rewards */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Rewards</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Reward Points</Label>
                      <Input
                        type="number"
                        value={editingChallenge.reward_points || 0}
                        onChange={(e) =>
                          setEditingChallenge({
                            ...editingChallenge,
                            reward_points: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tier Upgrade</Label>
                      <Select
                        value={editingChallenge.reward_tier_upgrade || "none"}
                        onValueChange={(value) =>
                          setEditingChallenge({
                            ...editingChallenge,
                            reward_tier_upgrade: value || null,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="No tier upgrade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {tiers.map((tier) => (
                            <SelectItem key={tier.tier} value={tier.tier}>
                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4" />
                                {tier.tier}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Limits */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Limits</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Per User</Label>
                      <Input
                        type="number"
                        value={editingChallenge.max_rewards_per_user || ""}
                        onChange={(e) =>
                          setEditingChallenge({
                            ...editingChallenge,
                            max_rewards_per_user:
                              parseInt(e.target.value) || null,
                          })
                        }
                        placeholder="Unlimited"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Max</Label>
                      <Input
                        type="number"
                        value={editingChallenge.max_total_rewards || ""}
                        onChange={(e) =>
                          setEditingChallenge({
                            ...editingChallenge,
                            max_total_rewards: parseInt(e.target.value) || null,
                          })
                        }
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Schedule</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="datetime-local"
                        value={editingChallenge.start_date?.slice(0, 16) || ""}
                        onChange={(e) =>
                          setEditingChallenge({
                            ...editingChallenge,
                            start_date: e.target.value || null,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="datetime-local"
                        value={editingChallenge.end_date?.slice(0, 16) || ""}
                        onChange={(e) =>
                          setEditingChallenge({
                            ...editingChallenge,
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
                    checked={editingChallenge.is_active || false}
                    onCheckedChange={(checked) =>
                      setEditingChallenge({
                        ...editingChallenge,
                        is_active: checked,
                      })
                    }
                  />
                  <Label htmlFor="is_active">Challenge Active</Label>
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
                  <Button onClick={handleSaveChallenge} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingChallenge.id ? "Update" : "Create"} Challenge
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
                <TableHead>Reward</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : challenges.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No challenges found. Create your first challenge!
                  </TableCell>
                </TableRow>
              ) : (
                challenges.map((challenge) => (
                  <TableRow key={challenge.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getChallengeIcon(challenge.type)}
                        {challenge.name}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {challenge.type}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {challenge.reward_points > 0 && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 w-fit"
                          >
                            <Coins className="h-3 w-3" />
                            {challenge.reward_points} pts
                          </Badge>
                        )}
                        {challenge.reward_tier_upgrade && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 w-fit"
                          >
                            <Crown className="h-3 w-3" />
                            {challenge.reward_tier_upgrade}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {challenge.current_rewards_count || 0}
                      {challenge.max_total_rewards && (
                        <span className="text-muted-foreground text-sm">
                          {" "}
                          / {challenge.max_total_rewards}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={challenge.is_active ? "default" : "secondary"}
                      >
                        {challenge.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {challenge.start_date ? (
                        <div className="text-sm">
                          {format(new Date(challenge.start_date), "MMM d")}
                          {challenge.end_date &&
                            ` → ${format(new Date(challenge.end_date), "MMM d")}`}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Always
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/challenges/${challenge.id}/leaderboard`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/challenges/${challenge.id}/live`} target="_blank">
                          <Target className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingChallenge(challenge);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteChallenge(challenge.id)}
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
