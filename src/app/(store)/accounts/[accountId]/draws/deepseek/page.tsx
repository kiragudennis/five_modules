// src/app/(store)/accounts/[accountId]/draws/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Gift,
  Ticket,
  Users,
  Share2,
  Tv,
  Info,
  Clock,
  CheckCircle,
  ShoppingBag,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { DrawsService } from "@/lib/services/draws-service";
import { Draw } from "@/types/draws";

export default function DrawsPage() {
  const { accountId } = useParams();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEntries, setUserEntries] = useState<Record<string, number>>({});

  const drawsService = new DrawsService();

  useEffect(() => {
    if (!profile || profile.id !== accountId) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [accountId, profile]);

  const fetchData = async () => {
    const openDraws = await drawsService.getOpenDraws(accountId as string);
    setDraws(openDraws);

    // Fetch user entries for each draw
    const entriesMap: Record<string, number> = {};
    for (const draw of openDraws) {
      const { count } = await supabase
        .from("draw_entries")
        .select("id", { count: "exact", head: true })
        .eq("draw_id", draw.id)
        .eq("user_id", accountId);
      entriesMap[draw.id] = count || 0;
    }
    setUserEntries(entriesMap);
    setLoading(false);
  };

  const getEntryMethodIcons = (config: any) => {
    const icons = [];
    if (config.purchase)
      icons.push(<ShoppingBag key="purchase" className="h-4 w-4" />);
    if (config.referral)
      icons.push(<Users key="referral" className="h-4 w-4" />);
    if (config.social_share)
      icons.push(<Share2 key="social" className="h-4 w-4" />);
    if (config.live_stream) icons.push(<Tv key="live" className="h-4 w-4" />);
    return icons;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        Loading draws...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Lucky Draws
          </h1>
          <p className="text-muted-foreground mt-2">
            Enter for a chance to win amazing prizes
          </p>
        </div>

        {draws.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">No Active Draws</h2>
              <p className="text-muted-foreground">
                Check back soon for new opportunities!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {draws.map((draw) => {
              const userEntryCount = userEntries[draw.id] || 0;
              const progressPercent = draw.max_entries_per_user
                ? (userEntryCount / draw.max_entries_per_user) * 100
                : 0;

              return (
                <Card
                  key={draw.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{draw.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {draw.description}
                        </p>
                      </div>
                      <Badge variant="default" className="bg-green-500">
                        Open
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Prize */}
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Gift className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">{draw.prize_name}</p>
                        {draw.prize_value && (
                          <p className="text-sm text-purple-600">
                            Value: KES {draw.prize_value.toLocaleString()}
                          </p>
                        )}
                      </div>
                      {draw.prize_image_url && (
                        <img
                          src={draw.prize_image_url}
                          alt={draw.prize_name}
                          className="h-16 w-16 object-cover rounded"
                        />
                      )}
                    </div>

                    {/* Entry Methods */}
                    <div>
                      <p className="text-sm font-medium mb-2">How to enter:</p>
                      <div className="flex flex-wrap gap-3">
                        {draw.entry_config.purchase && (
                          <Badge variant="outline" className="gap-1">
                            <ShoppingBag className="h-3 w-3" />
                            Spend KES {draw.entry_config.purchase.min_amount}+
                          </Badge>
                        )}
                        {draw.entry_config.referral && (
                          <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            Refer a friend
                          </Badge>
                        )}
                        {draw.entry_config.social_share && (
                          <Badge variant="outline" className="gap-1">
                            <Share2 className="h-3 w-3" />
                            Share on social
                          </Badge>
                        )}
                        {draw.entry_config.live_stream && (
                          <Badge variant="outline" className="gap-1">
                            <Tv className="h-3 w-3" />
                            Live stream entry
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* User Progress */}
                    {draw.max_entries_per_user && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Your entries</span>
                          <span>
                            {userEntryCount} / {draw.max_entries_per_user}
                          </span>
                        </div>
                        <Progress value={progressPercent} />
                      </div>
                    )}

                    {/* Timing */}
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Entries close:{" "}
                        {new Date(draw.entry_ends_at).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        Draw: {new Date(draw.draw_time).toLocaleString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                        onClick={() =>
                          router.push(
                            `/accounts/${accountId}/draws/${draw.slug}`,
                          )
                        }
                      >
                        <Ticket className="h-4 w-4 mr-2" />
                        View & Enter
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(`/draws/live/${draw.id}`, "_blank")
                        }
                      >
                        <Tv className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
