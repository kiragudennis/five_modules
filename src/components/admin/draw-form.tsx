"use client";

import { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, Save, X } from "lucide-react";
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
import { cn } from "@/lib/utils";

export function DrawForm({ onSave, onCancel, initialDraw, groups }: any) {
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
      entry_starts_at: new Date().toISOString(),
      entry_ends_at: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      draw_time: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000 + 3600000,
      ).toISOString(),
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

  const tabs = [
    { id: "basic", label: "Basic Info", icon: "📝" },
    { id: "prize", label: "Prize", icon: "🎁" },
    { id: "entries", label: "Entry Methods", icon: "🎟️" },
    { id: "calculation", label: "Entry Rules", icon: "🧮" },
    { id: "schedule", label: "Schedule", icon: "📅" },
    { id: "advanced", label: "Advanced", icon: "⚙️" },
  ];

  const currentTabIndex = tabs.findIndex((t) => t.id === activeTab);
  const nextTab = () => {
    if (currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1].id);
    }
  };
  const prevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  };

  const validateCurrentTab = () => {
    if (activeTab === "basic") {
      if (!formData.name.trim()) {
        toast.error("Draw name is required");
        return false;
      }
    }
    if (activeTab === "prize") {
      if (!formData.prize_name.trim()) {
        toast.error("Prize name is required");
        return false;
      }
    }
    if (activeTab === "schedule") {
      if (
        !formData.entry_starts_at ||
        !formData.entry_ends_at ||
        !formData.draw_time
      ) {
        toast.error("All date fields are required");
        return false;
      }
      const now = new Date();
      const entryStarts = new Date(formData.entry_starts_at);
      const entryEnds = new Date(formData.entry_ends_at);
      const drawTime = new Date(formData.draw_time);

      if (entryStarts < now) {
        toast.error("Entry start date cannot be in the past");
        return false;
      }
      if (entryEnds <= entryStarts) {
        toast.error("Entry end date must be after start date");
        return false;
      }
      if (drawTime <= entryEnds) {
        toast.error("Draw time must be after entry end date");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    // Validate all tabs before submit
    if (!formData.name.trim()) {
      toast.error("Draw name is required");
      setActiveTab("basic");
      return;
    }
    if (!formData.prize_name.trim()) {
      toast.error("Prize name is required");
      setActiveTab("prize");
      return;
    }
    if (
      !formData.entry_starts_at ||
      !formData.entry_ends_at ||
      !formData.draw_time
    ) {
      toast.error("All date fields are required");
      setActiveTab("schedule");
      return;
    }

    setLoading(true);
    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

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
      toast.success(
        `Draw ${initialDraw ? "updated" : "created"} successfully! 🎉`,
      );
      onSave();
    } catch (error: any) {
      toast.error(error.message);
      console.error("Error saving draw:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between gap-1">
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 text-center py-2 px-1 rounded-lg transition-all text-xs font-medium",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <span className="hidden sm:inline">{tab.icon} </span>
            {tab.label}
          </button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div>
              <Label>Draw Name *</Label>
              <Input
                placeholder="e.g., Christmas Mega Giveaway"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Draw Group</Label>
                <Select
                  value={formData.draw_group_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, draw_group_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Available Groups</SelectLabel>{" "}
                      {groups?.map((group: any) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(e) => setFormData({ ...formData, status: e })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">📝 Draft</SelectItem>
                    <SelectItem value="open">🎯 Open</SelectItem>
                    <SelectItem value="closed">🔒 Closed</SelectItem>
                    <SelectItem value="completed">✅ Completed</SelectItem>
                    <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe your draw..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Theme Color</Label>
                <Input
                  type="color"
                  value={formData.theme_color}
                  onChange={(e) =>
                    setFormData({ ...formData, theme_color: e.target.value })
                  }
                  className="w-full h-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
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
          </div>
        </TabsContent>

        <TabsContent value="prize" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div>
              <Label>Prize Name *</Label>
              <Input
                placeholder="e.g., iPhone 15 Pro Max"
                value={formData.prize_name}
                onChange={(e) =>
                  setFormData({ ...formData, prize_name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prize Value (KES)</Label>
                <Input
                  type="number"
                  placeholder="150000"
                  value={formData.prize_value}
                  onChange={(e) =>
                    setFormData({ ...formData, prize_value: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Prize Image URL</Label>
                <Input
                  placeholder="https://..."
                  value={formData.prize_image_url}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prize_image_url: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Prize Description</Label>
              <Textarea
                placeholder="Describe the prize..."
                value={formData.prize_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prize_description: e.target.value,
                  })
                }
                rows={2}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="entries" className="space-y-4 mt-4">
          <div className="space-y-4">
            <h3 className="font-semibold">Entry Methods</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  key: "purchase",
                  label: "Purchase-based entries",
                  desc: "Earn entries when customers buy products",
                },
                {
                  key: "referral",
                  label: "Referral-based entries",
                  desc: "Earn entries when referrals sign up",
                },
                {
                  key: "social_share",
                  label: "Social share entries",
                  desc: "Earn entries for sharing on social media",
                },
                {
                  key: "live_stream",
                  label: "Live stream entries",
                  desc: "Earn entries from live stream engagement",
                },
                {
                  key: "loyalty_tier",
                  label: "Loyalty tier bonus",
                  desc: "Bonus entries based on loyalty tier",
                },
              ].map((method) => (
                <div
                  key={method.key}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <Label className="font-medium">{method.label}</Label>
                    <p className="text-xs text-muted-foreground">
                      {method.desc}
                    </p>
                  </div>
                  <Switch
                    checked={!!formData.entry_config[method.key]}
                    onCheckedChange={(checked) => {
                      const newConfig = { ...formData.entry_config };
                      if (checked) {
                        const defaults: any = {
                          purchase: { min_amount: 1000, entries_per_ksh: 1 },
                          referral: {
                            entries_per_referral: 5,
                            bonus_for_first_referral: 5,
                          },
                          social_share: {
                            entries_per_share: 2,
                            max_entries_per_day: 10,
                          },
                          live_stream: { entries_per_email: 1 },
                          loyalty_tier: {
                            bronze: 1,
                            silver: 2,
                            gold: 5,
                            platinum: 10,
                          },
                        };
                        newConfig[method.key] = defaults[method.key];
                      } else {
                        delete newConfig[method.key];
                      }
                      setFormData({ ...formData, entry_config: newConfig });
                    }}
                  />
                </div>
              ))}
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
          </div>
        </TabsContent>

        <TabsContent value="calculation" className="space-y-4 mt-4">
          <div className="space-y-4">
            {/* Purchase Calculation */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <Label className="font-semibold">Purchase Entry Rules</Label>
                <Switch
                  checked={
                    formData.entry_calculation?.purchase?.enabled ?? true
                  }
                  onCheckedChange={(checked) => {
                    setFormData((prev: any) => ({
                      ...prev,
                      entry_calculation: {
                        ...prev.entry_calculation,
                        purchase: {
                          ...prev.entry_calculation?.purchase,
                          enabled: checked,
                          entries_per_ksh:
                            prev.entry_calculation?.purchase?.entries_per_ksh ??
                            0.05,
                          min_purchase:
                            prev.entry_calculation?.purchase?.min_purchase ??
                            1000,
                          max_entries_per_order:
                            prev.entry_calculation?.purchase
                              ?.max_entries_per_order ?? 5000,
                        },
                      },
                    }));
                  }}
                />
              </div>
              {formData.entry_calculation?.purchase?.enabled && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Entries per KSH</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={
                        formData.entry_calculation?.purchase?.entries_per_ksh ??
                        0.05
                      }
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setFormData((prev: any) => ({
                          ...prev,
                          entry_calculation: {
                            ...prev.entry_calculation,
                            purchase: {
                              ...prev.entry_calculation?.purchase,
                              entries_per_ksh: isNaN(value) ? 0 : value,
                            },
                          },
                        }));
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
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
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setFormData((prev: any) => ({
                          ...prev,
                          entry_calculation: {
                            ...prev.entry_calculation,
                            purchase: {
                              ...prev.entry_calculation?.purchase,
                              min_purchase: isNaN(value) ? 0 : value,
                            },
                          },
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label>Max per Order</Label>
                    <Input
                      type="number"
                      value={
                        formData.entry_calculation?.purchase
                          ?.max_entries_per_order ?? 5000
                      }
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setFormData((prev: any) => ({
                          ...prev,
                          entry_calculation: {
                            ...prev.entry_calculation,
                            purchase: {
                              ...prev.entry_calculation?.purchase,
                              max_entries_per_order: isNaN(value) ? 0 : value,
                            },
                          },
                        }));
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Referral Calculation */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <Label className="font-semibold">Referral Entry Rules</Label>
                <Switch
                  checked={
                    formData.entry_calculation?.referral?.enabled ?? true
                  }
                  onCheckedChange={(checked) => {
                    setFormData((prev: any) => ({
                      ...prev,
                      entry_calculation: {
                        ...prev.entry_calculation,
                        referral: {
                          ...prev.entry_calculation?.referral,
                          enabled: checked,
                          entries_per_referral:
                            prev.entry_calculation?.referral
                              ?.entries_per_referral ?? 100,
                          bonus_for_first_referral:
                            prev.entry_calculation?.referral
                              ?.bonus_for_first_referral ?? 50,
                          entries_per_purchase:
                            prev.entry_calculation?.referral
                              ?.entries_per_purchase ?? 200,
                        },
                      },
                    }));
                  }}
                />
              </div>
              {formData.entry_calculation?.referral?.enabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Entries per Signup</Label>
                    <Input
                      type="number"
                      value={
                        formData.entry_calculation?.referral
                          ?.entries_per_referral ?? 100
                      }
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setFormData((prev: any) => ({
                          ...prev,
                          entry_calculation: {
                            ...prev.entry_calculation,
                            referral: {
                              ...prev.entry_calculation?.referral,
                              entries_per_referral: isNaN(value) ? 0 : value,
                            },
                          },
                        }));
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Points awarded when a referred user signs up
                    </p>
                  </div>
                  <div>
                    <Label>First Referral Bonus</Label>
                    <Input
                      type="number"
                      value={
                        formData.entry_calculation?.referral
                          ?.bonus_for_first_referral ?? 50
                      }
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setFormData((prev: any) => ({
                          ...prev,
                          entry_calculation: {
                            ...prev.entry_calculation,
                            referral: {
                              ...prev.entry_calculation?.referral,
                              bonus_for_first_referral: isNaN(value)
                                ? 0
                                : value,
                            },
                          },
                        }));
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Extra points for the first successful referral
                    </p>
                  </div>
                  <div>
                    <Label>Entries per Purchase</Label>
                    <Input
                      type="number"
                      value={
                        formData.entry_calculation?.referral
                          ?.entries_per_purchase ?? 200
                      }
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setFormData((prev: any) => ({
                          ...prev,
                          entry_calculation: {
                            ...prev.entry_calculation,
                            referral: {
                              ...prev.entry_calculation?.referral,
                              entries_per_purchase: isNaN(value) ? 0 : value,
                            },
                          },
                        }));
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Points when a referred user makes a purchase
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Social Share Calculation (add if needed) */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <Label className="font-semibold">Social Share Rules</Label>
                <Switch
                  checked={
                    formData.entry_calculation?.social_share?.enabled ?? true
                  }
                  onCheckedChange={(checked) => {
                    setFormData((prev: any) => ({
                      ...prev,
                      entry_calculation: {
                        ...prev.entry_calculation,
                        social_share: {
                          ...prev.entry_calculation?.social_share,
                          enabled: checked,
                          entries_per_share:
                            prev.entry_calculation?.social_share
                              ?.entries_per_share ?? 10,
                        },
                      },
                    }));
                  }}
                />
              </div>
              {formData.entry_calculation?.social_share?.enabled && (
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label>Entries per Share</Label>
                    <Input
                      type="number"
                      value={
                        formData.entry_calculation?.social_share
                          ?.entries_per_share ?? 10
                      }
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setFormData((prev: any) => ({
                          ...prev,
                          entry_calculation: {
                            ...prev.entry_calculation,
                            social_share: {
                              ...prev.entry_calculation?.social_share,
                              entries_per_share: isNaN(value) ? 0 : value,
                            },
                          },
                        }));
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4">
            <DateTimeInput
              label="Entries Open Date"
              value={formData.entry_starts_at}
              onChange={(value) =>
                setFormData({ ...formData, entry_starts_at: value })
              }
            />
            <DateTimeInput
              label="Entries Close Date"
              value={formData.entry_ends_at}
              onChange={(value) =>
                setFormData({ ...formData, entry_ends_at: value })
              }
            />
            <DateTimeInput
              label="Draw Date & Time"
              value={formData.draw_time}
              onChange={(value) =>
                setFormData({ ...formData, draw_time: value })
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-4">
          <div className="space-y-4">
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
          </div>
        </TabsContent>
      </Tabs>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-2 pt-4 border-t">
        <div>
          {currentTabIndex > 0 && (
            <Button variant="outline" onClick={prevTab} type="button">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} type="button">
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          {currentTabIndex < tabs.length - 1 ? (
            <Button
              onClick={() => validateCurrentTab() && nextTab()}
              type="button"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {initialDraw ? "Update" : "Create"} Draw
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
