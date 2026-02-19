// app/admin/marketing/rewards/page.tsx
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Gift,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Crown,
  Coins,
  Calendar,
  Award,
  PartyPopper,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  type: "anniversary" | "birthday" | "milestone" | "vip" | "welcome";
  trigger_type:
    | "account_age_days"
    | "order_count"
    | "total_spent"
    | "tier_reached"
    | "date_based";
  trigger_value: number;
  reward_points: number;
  reward_tier_upgrade: string | null;
  reward_details: any;
  is_recurring: boolean;
  recurring_interval: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export default function AdminRewardsPage() {
  const { supabase, profile } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReward, setEditingReward] = useState<Partial<Reward>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tiers, setTiers] = useState<any[]>([]);
  // Get create param from URL to open dialog in create mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "true") {
      setDialogOpen(true);
    }
  }, []);

  useEffect(() => {
    if (profile?.role !== "admin") return;
    fetchRewards();
    fetchTiers();
  }, [profile]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRewards(data || []);
    } catch (error: any) {
      console.error("Error fetching rewards:", error);
      toast.error("Could not load rewards");
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

  const handleSaveReward = async () => {
    try {
      setSaving(true);

      if (
        !editingReward.name ||
        !editingReward.type ||
        !editingReward.trigger_type
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      const rewardData = {
        ...editingReward,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editingReward.id) {
        ({ error } = await supabase
          .from("rewards")
          .update(rewardData)
          .eq("id", editingReward.id));
      } else {
        rewardData.created_by = profile?.id;
        ({ error } = await supabase.from("rewards").insert([rewardData]));
      }

      if (error) throw error;

      toast.success(
        `Reward ${editingReward.id ? "updated" : "created"} successfully`,
      );
      setDialogOpen(false);
      setEditingReward({});
      fetchRewards();
    } catch (error: any) {
      console.error("Error saving reward:", error);
      toast.error("Could not save reward");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reward?")) return;

    try {
      const { error } = await supabase.from("rewards").delete().eq("id", id);

      if (error) throw error;

      toast.success("Reward deleted successfully");
      fetchRewards();
    } catch (error: any) {
      console.error("Error deleting reward:", error);
      toast.error("Could not delete reward");
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "birthday":
        return <PartyPopper className="h-4 w-4" />;
      case "anniversary":
        return <Calendar className="h-4 w-4" />;
      case "milestone":
        return <Award className="h-4 w-4" />;
      case "vip":
        return <Crown className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Rewards</h1>
          <p className="text-muted-foreground my-2">
            Configure automatic rewards for customers
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
                setEditingReward({
                  type: "welcome",
                  trigger_type: "account_age_days",
                  trigger_value: 0,
                  reward_points: 100,
                  is_active: true,
                  is_recurring: false,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReward.id ? "Edit Reward" : "Create New Reward"}
              </DialogTitle>
              <DialogDescription>
                {editingReward.id
                  ? "Modify the settings of your reward and save to update."
                  : "Configure the details of your new reward and save to create."}
              </DialogDescription>
            </DialogHeader>

            {editingReward && (
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Reward Name *</Label>
                      <Input
                        id="name"
                        value={editingReward.name || ""}
                        onChange={(e) =>
                          setEditingReward({
                            ...editingReward,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g., Birthday Bonus"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reward Type *</Label>
                      <Select
                        value={editingReward.type || "birthday"}
                        onValueChange={(value: any) =>
                          setEditingReward({ ...editingReward, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="welcome">Welcome</SelectItem>
                          <SelectItem value="birthday">Birthday</SelectItem>
                          <SelectItem value="anniversary">
                            Anniversary
                          </SelectItem>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editingReward.description || ""}
                      onChange={(e) =>
                        setEditingReward({
                          ...editingReward,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe the reward..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Trigger */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Trigger</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Trigger Type *</Label>
                      <Select
                        value={editingReward.trigger_type || "account_age_days"}
                        onValueChange={(value: any) =>
                          setEditingReward({
                            ...editingReward,
                            trigger_type: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="account_age_days">
                            Account Age (Days)
                          </SelectItem>
                          <SelectItem value="order_count">
                            Order Count
                          </SelectItem>
                          <SelectItem value="total_spent">
                            Total Spent
                          </SelectItem>
                          <SelectItem value="tier_reached">
                            Tier Reached
                          </SelectItem>
                          <SelectItem value="date_based">Date Based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Trigger Value</Label>
                      <Input
                        type="number"
                        value={editingReward.trigger_value || 0}
                        onChange={(e) =>
                          setEditingReward({
                            ...editingReward,
                            trigger_value: parseInt(e.target.value),
                          })
                        }
                        placeholder="e.g., 365 for anniversary"
                      />
                    </div>
                  </div>
                </div>

                {/* Reward Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Reward Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Points to Award</Label>
                      <Input
                        type="number"
                        value={editingReward.reward_points || 0}
                        onChange={(e) =>
                          setEditingReward({
                            ...editingReward,
                            reward_points: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tier Upgrade</Label>
                      <Select
                        value={editingReward.reward_tier_upgrade || "none"}
                        onValueChange={(value) =>
                          setEditingReward({
                            ...editingReward,
                            reward_tier_upgrade: value || null,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="No upgrade" />
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

                  {/* Coupon Option */}
                  <div className="space-y-2 p-4 border rounded-lg">
                    <Label className="text-base">Optional Coupon</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Discount Type</Label>
                        <Select
                          value={
                            editingReward.reward_details?.coupon
                              ?.discount_type || "percentage"
                          }
                          onValueChange={(value) =>
                            setEditingReward({
                              ...editingReward,
                              reward_details: {
                                ...editingReward.reward_details,
                                coupon: {
                                  ...editingReward.reward_details?.coupon,
                                  discount_type: value,
                                },
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">
                              Percentage
                            </SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Discount Value</Label>
                        <Input
                          type="number"
                          value={
                            editingReward.reward_details?.coupon
                              ?.discount_value || ""
                          }
                          onChange={(e) =>
                            setEditingReward({
                              ...editingReward,
                              reward_details: {
                                ...editingReward.reward_details,
                                coupon: {
                                  ...editingReward.reward_details?.coupon,
                                  discount_value: parseFloat(e.target.value),
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recurring */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_recurring"
                      checked={editingReward.is_recurring || false}
                      onCheckedChange={(checked) =>
                        setEditingReward({
                          ...editingReward,
                          is_recurring: checked,
                        })
                      }
                    />
                    <Label htmlFor="is_recurring">Recurring Reward</Label>
                  </div>

                  {editingReward.is_recurring && (
                    <div className="space-y-2">
                      <Label>Recurring Interval</Label>
                      <Select
                        value={editingReward.recurring_interval || ""}
                        onValueChange={(value) =>
                          setEditingReward({
                            ...editingReward,
                            recurring_interval: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Schedule */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Schedule</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="datetime-local"
                        value={editingReward.start_date?.slice(0, 16) || ""}
                        onChange={(e) =>
                          setEditingReward({
                            ...editingReward,
                            start_date: e.target.value || null,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="datetime-local"
                        value={editingReward.end_date?.slice(0, 16) || ""}
                        onChange={(e) =>
                          setEditingReward({
                            ...editingReward,
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
                    checked={editingReward.is_active || false}
                    onCheckedChange={(checked) =>
                      setEditingReward({ ...editingReward, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Reward Active</Label>
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
                  <Button onClick={handleSaveReward} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingReward.id ? "Update" : "Create"} Reward
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
                <TableHead>Trigger</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead>Status</TableHead>
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
              ) : rewards.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No rewards found. Create your first reward!
                  </TableCell>
                </TableRow>
              ) : (
                rewards.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getRewardIcon(reward.type)}
                        {reward.name}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{reward.type}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="capitalize">
                          {reward.trigger_type.replace(/_/g, " ")}
                        </span>
                        <br />
                        <span className="text-muted-foreground">
                          Value: {reward.trigger_value}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {reward.reward_points > 0 && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 w-fit"
                          >
                            <Coins className="h-3 w-3" />
                            {reward.reward_points} pts
                          </Badge>
                        )}
                        {reward.reward_tier_upgrade && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 w-fit"
                          >
                            <Crown className="h-3 w-3" />
                            {reward.reward_tier_upgrade}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reward.is_recurring ? (
                        <Badge variant="outline">
                          {reward.recurring_interval}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          One-time
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={reward.is_active ? "default" : "secondary"}
                      >
                        {reward.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingReward(reward);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReward(reward.id)}
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
