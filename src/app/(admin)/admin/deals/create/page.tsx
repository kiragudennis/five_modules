"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AdminDealCreatePage() {
  const { supabase, profile } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    deal_type: "flash",
    product_name: "",
    product_slug: "",
    original_price: 0,
    deal_price: 0,
    stock_total: 100,
    starts_at: "",
    ends_at: "",
    mystery_label: "",
  });

  const save = async () => {
    if (!profile?.id) return;
    setSaving(true);
    const { error } = await supabase.from("deals").insert({
      ...form,
      status: "scheduled",
      stock_claimed: 0,
      created_by: profile.id,
      mystery_revealed: false,
    });
    setSaving(false);
    if (error) {
      toast.error("Could not create deal.");
      return;
    }
    toast.success("Deal created.");
    router.push("/admin/deals/manage");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Create Deal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Deal name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Deal type</Label>
              <Input
                value={form.deal_type}
                onChange={(e) => setForm((p) => ({ ...p, deal_type: e.target.value }))}
                placeholder="daily|flash|quantity_drop|bogo|free_gift"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product name</Label>
              <Input
                value={form.product_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, product_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Product slug (for override)</Label>
              <Input
                value={form.product_slug}
                onChange={(e) =>
                  setForm((p) => ({ ...p, product_slug: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Original price</Label>
              <Input
                type="number"
                value={form.original_price}
                onChange={(e) =>
                  setForm((p) => ({ ...p, original_price: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Deal price</Label>
              <Input
                type="number"
                value={form.deal_price}
                onChange={(e) =>
                  setForm((p) => ({ ...p, deal_price: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Stock total</Label>
              <Input
                type="number"
                value={form.stock_total}
                onChange={(e) =>
                  setForm((p) => ({ ...p, stock_total: Number(e.target.value) }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Starts at</Label>
              <Input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) =>
                  setForm((p) => ({ ...p, starts_at: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Ends at</Label>
              <Input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mystery label (optional)</Label>
            <Textarea
              value={form.mystery_label}
              onChange={(e) =>
                setForm((p) => ({ ...p, mystery_label: e.target.value }))
              }
              placeholder="Mystery deal text before reveal"
            />
          </div>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? "Saving..." : "Create deal"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
