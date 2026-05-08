"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AdminCreateDrawPage() {
  const { supabase, profile } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    prize_name: "",
    prize_image: "",
    draw_at: "",
    purchase_above: 0,
    entries_per_qualifying_purchase: 1,
    referral_entries: 1,
    visibility: "public",
    notes: "",
  });

  const submit = async () => {
    if (!profile?.id) return;
    if (!form.name || !form.prize_name) {
      toast.error("Name and prize are required.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("draws").insert({
      name: form.name,
      prize_name: form.prize_name,
      prize_image: form.prize_image || null,
      draw_at: form.draw_at || null,
      status: "entry_collection",
      visibility: form.visibility,
      notes: form.notes || null,
      entry_rules: {
        purchase_above: form.purchase_above,
        entries_per_qualifying_purchase: form.entries_per_qualifying_purchase,
        referral_entries: form.referral_entries,
      },
      created_by: profile.id,
    });
    setSaving(false);

    if (error) {
      toast.error("Could not create draw.");
      return;
    }

    toast.success("Draw created.");
    router.push("/admin/draws/manage");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Create Draw</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Draw name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Samsung Mega Draw"
              />
            </div>
            <div className="space-y-2">
              <Label>Prize name</Label>
              <Input
                value={form.prize_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, prize_name: e.target.value }))
                }
                placeholder="Samsung S24 Ultra"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Prize image URL</Label>
            <Input
              value={form.prize_image}
              onChange={(e) =>
                setForm((p) => ({ ...p, prize_image: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Draw schedule</Label>
            <Input
              type="datetime-local"
              value={form.draw_at}
              onChange={(e) => setForm((p) => ({ ...p, draw_at: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Purchase above</Label>
              <Input
                type="number"
                value={form.purchase_above}
                onChange={(e) =>
                  setForm((p) => ({ ...p, purchase_above: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Entries per purchase</Label>
              <Input
                type="number"
                value={form.entries_per_qualifying_purchase}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    entries_per_qualifying_purchase: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Entries per referral</Label>
              <Input
                type="number"
                value={form.referral_entries}
                onChange={(e) =>
                  setForm((p) => ({ ...p, referral_entries: Number(e.target.value) }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving ? "Saving..." : "Create draw"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
