"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { PointsService, type PointsConfig } from "@/lib/services/points-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminPointsConfigPage() {
  const { supabase, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PointsConfig>({
    pointsPerKsh: 10,
    minRedeemPoints: 100,
  });

  useEffect(() => {
    if (profile?.role !== "admin") {
      router.push("/login");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const next = await PointsService.getConfig(supabase);
        setConfig(next);
      } catch (error) {
        toast.error("Failed to load points settings");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [profile?.role, supabase, router]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await PointsService.updateConfig(supabase, config);
      toast.success("Points settings updated");
    } catch (error) {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-2 py-8">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Points Economy Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centralized conversion settings used across modules.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Conversion & Redemption</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="pointsPerKsh">Points per KSH</Label>
              <Input
                id="pointsPerKsh"
                type="number"
                min={1}
                value={config.pointsPerKsh}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    pointsPerKsh: Number(e.target.value || 1),
                  }))
                }
                disabled={loading || saving}
              />
              <p className="text-xs text-muted-foreground">
                Example: 10 means 100 points = 10 KSH.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minRedeemPoints">Minimum Redeem Points</Label>
              <Input
                id="minRedeemPoints"
                type="number"
                min={1}
                value={config.minRedeemPoints}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    minRedeemPoints: Number(e.target.value || 1),
                  }))
                }
                disabled={loading || saving}
              />
            </div>

            <div className="rounded border p-3 text-sm">
              <p>
                <span className="font-medium">Preview:</span> {config.minRedeemPoints}{" "}
                points redeem for KSH{" "}
                {(config.minRedeemPoints / config.pointsPerKsh).toFixed(2)}
              </p>
            </div>

            <Button onClick={handleSave} disabled={loading || saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

