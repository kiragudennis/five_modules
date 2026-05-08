"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminSpinCreatePage() {
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    free_spins_per_day: 3,
    points_per_spin: 20,
    start_date: "",
    end_date: "",
    target_groups: "all-customers",
  });

  const handleSubmit = async () => {
    if (!profile?.id) return;
    if (!form.name.trim()) {
      toast.error("Game name is required.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("spin_games").insert({
      name: form.name,
      description: form.description,
      free_spins_per_day: form.free_spins_per_day,
      points_per_spin: form.points_per_spin,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      target_groups: [form.target_groups],
      is_active: true,
      created_by: profile.id,
      wheel_config: [
        { label: "20 Points", value: "20", type: "points", probability: 0.5, color: "#45B7D1", quantity: 9999 },
        { label: "5% Off", value: "5", type: "discount", probability: 0.3, color: "#96CEB4", quantity: 9999 },
        { label: "Try Again", value: "0", type: "nothing", probability: 0.2, color: "#FF6B6B", quantity: 9999 },
      ],
      segment_colors: ["#45B7D1", "#96CEB4", "#FF6B6B"],
    });

    setSaving(false);

    if (error) {
      toast.error("Could not create spin game.");
      return;
    }

    toast.success("Spin game created.");
    router.push("/admin/spin/manage");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Create Spin Game</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Game name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Weekend Wheel"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Live campaign details..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Free spins/day</Label>
              <Input
                type="number"
                value={form.free_spins_per_day}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    free_spins_per_day: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Points per paid spin</Label>
              <Input
                type="number"
                value={form.points_per_spin}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    points_per_spin: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start</Label>
              <Input
                type="datetime-local"
                value={form.start_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, start_date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>End</Label>
              <Input
                type="datetime-local"
                value={form.end_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, end_date: e.target.value }))
                }
              />
            </div>
          </div>
          <Button onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? "Saving..." : "Create game"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
