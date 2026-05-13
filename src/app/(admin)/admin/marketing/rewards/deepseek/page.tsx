// app/admin/marketing/rewards/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Award, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminRewardsPage() {
  const { supabase } = useAuth();
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    const { data } = await supabase
      .from("rewards")
      .select("*")
      .order("created_at", { ascending: false });
    setRewards(data || []);
    setLoading(false);
  };

  const deleteReward = async (id: string) => {
    if (confirm("Delete this reward?")) {
      await supabase.from("rewards").delete().eq("id", id);
      toast.success("Reward deleted");
      await fetchRewards();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">Loading rewards...</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customer Rewards</h1>
          <p className="text-muted-foreground">
            Automatic rewards for customer actions
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Reward
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward) => (
          <Card key={reward.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{reward.name}</span>
                <Badge variant={reward.is_active ? "default" : "secondary"}>
                  {reward.is_active ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>{reward.points_required} points required</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>{reward.usage_limit || "Unlimited"} uses</span>
                </div>
                <div className="flex gap-2 pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReward(reward.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
