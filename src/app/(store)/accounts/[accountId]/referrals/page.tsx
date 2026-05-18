// app/account/referrals/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { ReferralService } from "@/lib/services/referral-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Share2,
  Copy,
  Check,
  Users,
  Coins,
  Ticket,
  Trophy,
  Link2,
  Mail,
  Twitter,
  Facebook,
  Smartphone,
  Gift,
} from "lucide-react";
import { toast } from "sonner";

export default function ReferralsPage() {
  const { supabase, profile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [referralLink, setReferralLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const referralService = new ReferralService(supabase);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;

    const [statsData, leaderboardData] = await Promise.all([
      referralService.getUserReferralStats(profile.id),
      referralService.getReferralLeaderboard(10),
    ]);

    setStats(statsData);
    setLeaderboard(leaderboardData);
    setReferralLink(
      `${window.location.origin}/signup?ref=${statsData.referralCode}`,
    );
    setLoading(false);
  }, [profile?.id, referralService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnSocial = (platform: string) => {
    const text = `Join me on ${process.env.NEXT_PUBLIC_STORE_NAME}! Use my referral link to get bonus points:`;
    const url = referralLink;

    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=Join me on ${process.env.NEXT_PUBLIC_STORE_NAME}&body=${encodeURIComponent(text + "\n\n" + url)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Referral Program</h1>
        <p className="text-muted-foreground">
          Invite friends and earn points & draw entries for every successful
          referral
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                <p className="text-xs text-muted-foreground">Total Referrals</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {stats.successfulReferrals}
                </p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Coins className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.pointsEarned}</p>
                <p className="text-xs text-muted-foreground">Points Earned</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Ticket className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.pendingReferrals}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
          </div>

          {/* Referral Link Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Your Referral Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="flex-1" />
                <Button onClick={copyToClipboard} variant="outline">
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnSocial("facebook")}
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnSocial("twitter")}
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnSocial("whatsapp")}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnSocial("email")}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Referrals */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentReferrals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No referrals yet. Share your link to get started!
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.recentReferrals.map((referral: any) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {referral.referred?.full_name ||
                              referral.referred?.email?.split("@")[0] ||
                              "Someone"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {referral.converted_at
                              ? `Joined ${new Date(referral.converted_at).toLocaleDateString()}`
                              : "Pending verification"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          referral.status === "converted"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {referral.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* How it Works */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Share Your Link</p>
                  <p className="text-sm text-muted-foreground">
                    Share your unique referral link with friends
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Friend Signs Up</p>
                  <p className="text-sm text-muted-foreground">
                    They create an account using your link
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Both Get Rewards</p>
                  <p className="text-sm text-muted-foreground">
                    You both earn points and draw entries instantly
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium">Bonus on First Purchase</p>
                  <p className="text-sm text-muted-foreground">
                    When they make their first purchase, you earn extra points!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Referrers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((user, idx) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 text-center">
                          {idx === 0 && (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          )}
                          {idx === 1 && (
                            <Trophy className="h-4 w-4 text-gray-400" />
                          )}
                          {idx === 2 && (
                            <Trophy className="h-4 w-4 text-amber-600" />
                          )}
                          {idx > 2 && (
                            <span className="text-xs text-muted-foreground">
                              #{idx + 1}
                            </span>
                          )}
                        </div>
                        <span className="text-sm truncate max-w-[120px]">
                          {user.full_name || "Anonymous"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          {user.successful_referrals} referrals
                        </span>
                        <Badge variant="outline">
                          {user.referral_points_earned} pts
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Promo Card */}
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardContent className="p-6 text-center">
              <Gift className="h-10 w-10 mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-1">Refer & Earn More!</h3>
              <p className="text-sm opacity-90 mb-3">
                The more friends you invite, the more you earn!
              </p>
              <p className="text-xs opacity-75">
                No limit on referrals. Start sharing today!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
