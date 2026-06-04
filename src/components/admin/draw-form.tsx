"use client";

import { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { format } from "date-fns";
import { DateTimeInput } from "../ui/date-input";

export function DrawForm({ onSave, initialDraw, groups }: any) {
  const { supabase } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState(() => {
    if (initialDraw) return initialDraw;
    return {
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
      entry_calculation: {
        purchase: {
          enabled: true,
          entries_per_ksh: 0.05,
          min_purchase: 1000,
          max_entries_per_order: 5000,
        },
        referral: {
          enabled: true,
          entries_per_referral: 100,
          bonus_for_first_referral: 50,
        },
        social_share: {
          enabled: true,
          entries_per_share: 10,
        },
        live_stream: {
          enabled: true,
          entries_per_entry: 5,
        },
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
      consolation_points_amount: 0,
      auto_redraw_days: 7,
      max_redraws: 1,
      draw_group_id: "",
    };
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      console.log(
        "Start time:",
        formData.entry_starts_at,
        "End time:",
        formData.entry_ends_at,
        "Draw time:",
        formData.draw_time,
      );
      // Validate required date fields
      if (
        !formData.entry_starts_at ||
        !formData.entry_ends_at ||
        !formData.draw_time
      ) {
        toast.error(
          "Please fill in all date fields (Entries Open, Entries Close, and Draw Time)",
        );
        setLoading(false);
        return;
      }
      const { error } = await supabase
        .from("draws")
        .upsert({
          ...formData,
          slug,
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
      console.error("Error saving draw:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="prize">Prize</TabsTrigger>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Draw Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Draw Group</Label>
              <Select
                value={formData.draw_group_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, draw_group_id: value })
                }
              >
                <SelectTrigger className="w-full max-w-48">
                  <SelectValue placeholder="Select draw group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Draw Group</SelectLabel>
                    {groups?.map((group: any) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(e) => setFormData({ ...formData, status: e })}
              >
                <SelectTrigger className="w-full max-w-48">
                  <SelectValue placeholder="Select draw status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Status</SelectLabel>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Theme Color</Label>
              <Input
                type="color"
                value={formData.theme_color}
                onChange={(e) =>
                  setFormData({ ...formData, theme_color: e.target.value })
                }
                className="w-20 h-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.show_entry_ticker}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, show_entry_ticker: checked })
                }
              />
              <Label>Show Entry Ticker</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.show_leaderboard}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, show_leaderboard: checked })
                }
              />
              <Label>Show Leaderboard</Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="prize" className="space-y-4 mt-4">
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
        </TabsContent>

        <TabsContent value="entries" className="space-y-4 mt-4">
          <div className="space-y-4">
            <h3 className="font-semibold">Entry Methods</h3>

            <div className="flex items-center gap-2">
              <Switch
                checked={!!formData.entry_config.purchase}
                onCheckedChange={(checked) => {
                  const newConfig = { ...formData.entry_config };
                  if (checked)
                    newConfig.purchase = {
                      min_amount: 1000,
                      entries_per_ksh: 1,
                    };
                  else delete newConfig.purchase;
                  setFormData({ ...formData, entry_config: newConfig });
                }}
              />
              <Label>Purchase-based entries</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={!!formData.entry_config.referral}
                onCheckedChange={(checked) => {
                  const newConfig = { ...formData.entry_config };
                  if (checked)
                    newConfig.referral = {
                      entries_per_referral: 5,
                      bonus_for_first_referral: 5,
                    };
                  else delete newConfig.referral;
                  setFormData({ ...formData, entry_config: newConfig });
                }}
              />
              <Label>Referral-based entries</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={!!formData.entry_config.social_share}
                onCheckedChange={(checked) => {
                  const newConfig = { ...formData.entry_config };
                  if (checked)
                    newConfig.social_share = {
                      entries_per_share: 2,
                      max_entries_per_day: 10,
                    };
                  else delete newConfig.social_share;
                  setFormData({ ...formData, entry_config: newConfig });
                }}
              />
              <Label>Social share entries</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={!!formData.entry_config.live_stream}
                onCheckedChange={(checked) => {
                  const newConfig = { ...formData.entry_config };
                  if (checked) newConfig.live_stream = { entries_per_email: 1 };
                  else delete newConfig.live_stream;
                  setFormData({ ...formData, entry_config: newConfig });
                }}
              />
              <Label>Live stream entries</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={!!formData.entry_config.loyalty_tier}
                onCheckedChange={(checked) => {
                  const newConfig = { ...formData.entry_config };
                  if (checked)
                    newConfig.loyalty_tier = {
                      bronze: 1,
                      silver: 2,
                      gold: 5,
                      platinum: 10,
                    };
                  else delete newConfig.loyalty_tier;
                  setFormData({ ...formData, entry_config: newConfig });
                }}
              />
              <Label>Loyalty tier bonus entries</Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
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
                  setFormData({
                    ...formData,
                    max_entries_total: e.target.value,
                  })
                }
                placeholder="Unlimited"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
          {/* Entry Calculation Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Entry Calculation Rules
            </h3>

            {/* Purchase Entries */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-semibold">
                    Purchase-based Entries
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Award entries when customers make purchases
                  </p>
                </div>
                <Switch
                  checked={
                    formData.entry_calculation?.purchase?.enabled ?? true
                  }
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      entry_calculation: {
                        ...formData.entry_calculation,
                        purchase: {
                          ...formData.entry_calculation?.purchase,
                          enabled: checked,
                        },
                      },
                    });
                  }}
                />
              </div>

              {formData.entry_calculation?.purchase?.enabled && (
                <div className="grid grid-cols-3 gap-4 ml-6">
                  <div>
                    <Label>Entries per KSH</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={
                        formData.entry_calculation?.purchase?.entries_per_ksh ??
                        0.05
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          entry_calculation: {
                            ...formData.entry_calculation,
                            purchase: {
                              ...formData.entry_calculation?.purchase,
                              entries_per_ksh: parseFloat(e.target.value),
                            },
                          },
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      e.g., 0.05 = 50 entries per KSH 1000
                    </p>
                  </div>
                  <div>
                    <Label>Min Purchase (KES)</Label>
                    <Input
                      type="number"
                      value={
                        formData.entry_calculation?.purchase?.min_purchase ??
                        1000
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          entry_calculation: {
                            ...formData.entry_calculation,
                            purchase: {
                              ...formData.entry_calculation?.purchase,
                              min_purchase: parseFloat(e.target.value),
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Max Entries per Order</Label>
                    <Input
                      type="number"
                      value={
                        formData.entry_calculation?.purchase
                          ?.max_entries_per_order ?? 5000
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          entry_calculation: {
                            ...formData.entry_calculation,
                            purchase: {
                              ...formData.entry_calculation?.purchase,
                              max_entries_per_order: parseInt(e.target.value),
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Referral Entries */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-semibold">
                    Referral-based Entries
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Award entries when referrals convert
                  </p>
                </div>
                <Switch
                  checked={
                    formData.entry_calculation?.referral?.enabled ?? true
                  }
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      entry_calculation: {
                        ...formData.entry_calculation,
                        referral: {
                          ...formData.entry_calculation?.referral,
                          enabled: checked,
                        },
                      },
                    });
                  }}
                />
              </div>

              {formData.entry_calculation?.referral?.enabled && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div>
                    <Label>Entries per Referral (Signup)</Label>
                    <Input
                      type="number"
                      value={
                        formData.entry_calculation?.referral
                          ?.entries_per_referral ?? 100
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          entry_calculation: {
                            ...formData.entry_calculation,
                            referral: {
                              ...formData.entry_calculation?.referral,
                              entries_per_referral: parseInt(e.target.value),
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Bonus for First Referral</Label>
                    <Input
                      type="number"
                      value={
                        formData.entry_calculation?.referral
                          ?.bonus_for_first_referral ?? 50
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          entry_calculation: {
                            ...formData.entry_calculation,
                            referral: {
                              ...formData.entry_calculation?.referral,
                              bonus_for_first_referral: parseInt(
                                e.target.value,
                              ),
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Entries per Referral (Purchase)</Label>
                    <Input
                      type="number"
                      value={
                        formData.entry_calculation?.referral
                          ?.entries_per_purchase ?? 200
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          entry_calculation: {
                            ...formData.entry_calculation,
                            referral: {
                              ...formData.entry_calculation?.referral,
                              entries_per_purchase: parseInt(e.target.value),
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Entries Open</Label>
              <input
                type="datetime-local"
                value={
                  formData.entry_starts_at
                    ? format(
                        new Date(formData.entry_starts_at),
                        "yyyy-MM-dd'T'HH:mm",
                      )
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    // Convert to ISO string with timezone
                    const date = new Date(value);
                    setFormData({
                      ...formData,
                      entry_starts_at: date.toISOString(),
                    });
                  }
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <Label>Entries Close</Label>
              <input
                type="datetime-local"
                value={
                  formData.entry_ends_at
                    ? format(
                        new Date(formData.entry_ends_at),
                        "yyyy-MM-dd'T'HH:mm",
                      )
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    const date = new Date(value);
                    setFormData({
                      ...formData,
                      entry_ends_at: date.toISOString(),
                    });
                  } else {
                    setFormData({
                      ...formData,
                      entry_ends_at: "",
                    });
                  }
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-pointer disabled:opacity-50"
              />
            </div>
            <div>
              <Label>Draw Time</Label>
              <DateTimeInput
                value={formData.draw_time}
                onChange={(value) =>
                  setFormData({ ...formData, draw_time: value })
                }
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-4">
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
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={() => onSave()}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {initialDraw ? "Update" : "Create"} Draw
        </Button>
      </div>
    </div>
  );
}
