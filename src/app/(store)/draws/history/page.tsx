// app/(store)/draws/history/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Gift,
  Trophy,
  Calendar,
  Users,
  Ticket,
  CheckCircle,
  Clock,
  ChevronRight,
  Star,
  Filter,
  Search,
  TrendingUp,
  Award,
  Crown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface DrawHistory {
  id: string;
  name: string;
  description: string;
  prize_name: string;
  prize_value: number;
  prize_image_url: string;
  draw_time: string;
  status: string;
  winner_id: string | null;
  winner_name: string | null;
  winner_announced_at: string | null;
  total_entries: number;
  total_participants: number;
  consolation_points_amount: number;
}

interface Winner {
  id: string;
  draw_id: string;
  user_id: string;
  winner_name: string;
  winner_rank: number;
  prize_name: string;
  prize_value: number;
  claim_status: string;
  claimed_at: string | null;
}

export default function DrawHistoryPage() {
  const { supabase } = useAuth();
  const [completedDraws, setCompletedDraws] = useState<DrawHistory[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedPrize, setSelectedPrize] = useState<string>("all");

  // Fetch completed draws
  const fetchCompletedDraws = useCallback(async () => {
    const { data, error } = await supabase
      .from("draws")
      .select(
        `
        id,
        name,
        description,
        prize_name,
        prize_value,
        prize_image_url,
        draw_time,
        status,
        winner_id,
        winner_announced_at,
        consolation_points_amount,
        draw_entries:draw_entries(count),
        draw_participants:draw_entries(user_id)
      `,
      )
      .eq("status", "completed")
      .not("winner_id", "is", null)
      .order("draw_time", { ascending: false });

    if (error) {
      console.error("Error fetching draws:", error);
      return;
    }

    // Transform data
    const drawsWithStats = await Promise.all(
      (data || []).map(async (draw: any) => {
        // Get total entries count
        const totalEntries = draw.draw_entries?.[0]?.count || 0;

        // Get unique participants count
        const uniqueParticipants = draw.draw_participants
          ? new Set(draw.draw_participants.map((p: any) => p.user_id)).size
          : 0;

        // Get winner name
        let winnerName = null;
        if (draw.winner_id) {
          const { data: winner } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", draw.winner_id)
            .single();
          winnerName = winner?.full_name || "Anonymous";
        }

        return {
          ...draw,
          total_entries: totalEntries,
          total_participants: uniqueParticipants,
          winner_name: winnerName,
        };
      }),
    );

    setCompletedDraws(drawsWithStats);
  }, [supabase]);

  // Fetch all winners for leaderboard
  const fetchWinners = useCallback(async () => {
    const { data, error } = await supabase
      .from("draw_winners")
      .select(
        `
        id,
        draw_id,
        user_id,
        winner_rank,
        prize_name,
        prize_value,
        claim_status,
        claimed_at,
        draws!inner (
          name,
          draw_time
        ),
        users!inner (
          full_name
        )
      `,
      )
      .eq("winner_rank", 1)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching winners:", error);
      return;
    }

    setWinners(
      (data || []).map((winner: any) => ({
        id: winner.id,
        draw_id: winner.draw_id,
        user_id: winner.user_id,
        winner_name: winner.users?.full_name || "Anonymous",
        winner_rank: winner.winner_rank,
        prize_name: winner.prize_name,
        prize_value: winner.prize_value,
        claim_status: winner.claim_status,
        claimed_at: winner.claimed_at,
        draw_name: winner.draws?.name,
        draw_time: winner.draws?.draw_time,
      })),
    );
  }, [supabase]);

  useEffect(() => {
    Promise.all([fetchCompletedDraws(), fetchWinners()]).finally(() => {
      setLoading(false);
    });
  }, [fetchCompletedDraws, fetchWinners]);

  // Filter draws
  const filteredDraws = completedDraws.filter((draw) => {
    const matchesSearch =
      draw.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      draw.prize_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear =
      selectedYear === "all" ||
      new Date(draw.draw_time).getFullYear().toString() === selectedYear;
    const matchesPrize =
      selectedPrize === "all" ||
      draw.prize_name.toLowerCase().includes(selectedPrize.toLowerCase());
    return matchesSearch && matchesYear && matchesPrize;
  });

  // Get unique years from draws
  const availableYears = [
    ...new Set(
      completedDraws.map((draw) =>
        new Date(draw.draw_time).getFullYear().toString(),
      ),
    ),
  ]
    .sort()
    .reverse();

  // Get unique prize categories
  const prizeCategories = [
    ...new Set(completedDraws.map((draw) => draw.prize_name)),
  ].slice(0, 10);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Draw History</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            See all our past draws, winners, and prizes. Real people, real wins.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Draws List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search draws or prizes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 rounded-lg border bg-background text-sm"
                >
                  <option value="all">All Years</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedPrize}
                  onChange={(e) => setSelectedPrize(e.target.value)}
                  className="px-3 py-2 rounded-lg border bg-background text-sm max-w-[150px]"
                >
                  <option value="all">All Prizes</option>
                  {prizeCategories.map((prize) => (
                    <option key={prize} value={prize}>
                      {prize}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Draws List */}
            {filteredDraws.length === 0 ? (
              <Card className="p-12 text-center">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No draws found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ||
                  selectedYear !== "all" ||
                  selectedPrize !== "all"
                    ? "Try adjusting your filters"
                    : "No completed draws yet. Check back soon!"}
                </p>
              </Card>
            ) : (
              filteredDraws.map((draw) => (
                <Card
                  key={draw.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Prize Image */}
                    <div className="md:w-48 h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center p-4">
                      {draw.prize_image_url ? (
                        <img
                          src={draw.prize_image_url}
                          alt={draw.prize_name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Gift className="h-12 w-12 text-purple-400" />
                      )}
                    </div>

                    {/* Draw Details */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                        <div>
                          <h3 className="text-xl font-semibold">{draw.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {draw.description}
                          </p>
                        </div>
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </div>

                      {/* Prize Info */}
                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">{draw.prize_name}</span>
                          {draw.prize_value > 0 && (
                            <Badge variant="outline">
                              {formatPrice(draw.prize_value)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(draw.draw_time), "PPP")}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Ticket className="h-4 w-4 text-blue-500" />
                          <span>
                            {draw.total_entries.toLocaleString()} entries
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-green-500" />
                          <span>
                            {draw.total_participants.toLocaleString()}{" "}
                            participants
                          </span>
                        </div>
                        {draw.consolation_points_amount > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>
                              {draw.consolation_points_amount} pts consolation
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Winner */}
                      <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <span className="font-medium">Winner:</span>
                            <span>{draw.winner_name || "Anonymous"}</span>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/draws/${draw.id}`}>
                              View Details
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Winners Leaderboard */}
            <Card>
              <div className="p-4 border-b">
                <h2 className="font-semibold flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Recent Winners
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Latest grand prize winners
                </p>
              </div>
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {winners.slice(0, 20).map((winner, idx) => (
                  <div
                    key={winner.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 text-center">
                      {idx === 0 && (
                        <Trophy className="h-5 w-5 text-yellow-500 mx-auto" />
                      )}
                      {idx === 1 && (
                        <Award className="h-5 w-5 text-gray-400 mx-auto" />
                      )}
                      {idx === 2 && (
                        <Award className="h-5 w-5 text-amber-600 mx-auto" />
                      )}
                      {idx > 2 && (
                        <span className="text-xs text-muted-foreground">
                          #{idx + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {winner.winner_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {winner.prize_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {winner.claim_status === "claimed"
                          ? "Claimed"
                          : "Pending"}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(winner.draw_time), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {winners.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No winners yet
                  </p>
                )}
              </div>
            </Card>

            {/* Stats Summary */}
            <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <div className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-1">Total Giveaways</h3>
                <p className="text-3xl font-bold">{completedDraws.length}</p>
                <p className="text-sm opacity-90 mt-2">
                  {completedDraws
                    .reduce((sum, d) => sum + d.total_participants, 0)
                    .toLocaleString()}{" "}
                  participants
                </p>
                <p className="text-xs opacity-75 mt-1">
                  {completedDraws
                    .reduce((sum, d) => sum + d.total_entries, 0)
                    .toLocaleString()}{" "}
                  total entries
                </p>
              </div>
            </Card>

            {/* Trust Badges */}
            <Card>
              <div className="p-4">
                <h3 className="font-semibold mb-3">Why Trust Our Draws?</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Transparent Winners</p>
                      <p className="text-xs text-muted-foreground">
                        All winners are publicly displayed with draw details
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Random Selection</p>
                      <p className="text-xs text-muted-foreground">
                        Winners are randomly selected using verifiable methods
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Real Prizes</p>
                      <p className="text-xs text-muted-foreground">
                        All prizes are delivered to verified winners
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Consolation Points</p>
                      <p className="text-xs text-muted-foreground">
                        Every participant receives loyalty points
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
              <div className="p-4 text-center">
                <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <h3 className="font-semibold">Want to be a winner?</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Check out our active draws and enter to win!
                </p>
                <Button asChild className="w-full">
                  <Link href="/draws">
                    View Active Draws
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
