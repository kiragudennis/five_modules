// app/(store)/draws/[drawId]/page.tsx
// This is the public draw details page where users can view draw info and enter
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { DrawsService } from "@/lib/services/draws-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Gift,
  Ticket,
  Users,
  Clock,
  Trophy,
  Coins,
  Crown,
  Share2,
  ShoppingBag,
  Radio,
  Star,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  TrendingUp,
  Zap,
  Heart,
  Twitter,
  Facebook,
  Instagram,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Draw, UserDrawStatus } from "@/types/draws";

export default function DrawDetailPage() {
  const { drawId } = useParams<{ drawId: string }>();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [draw, setDraw] = useState<Draw | null>(null);
  const [userStatus, setUserStatus] = useState<UserDrawStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [socialPlatform, setSocialPlatform] = useState<
    "facebook" | "twitter" | "whatsapp"
  >("facebook");
  const [liveEmail, setLiveEmail] = useState("");
  const [liveName, setLiveName] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);

  const drawsService = new DrawsService(supabase);

  const loadData = useCallback(async () => {
    if (!drawId) return;

    try {
      const [drawData, statusData] = await Promise.all([
        drawsService.getDraw(drawId, profile?.id),
        profile?.id ? drawsService.getUserDrawStatus(drawId, profile.id) : null,
      ]);

      setDraw(drawData);
      setUserStatus(statusData);

      // Check if user is a winner
      if (profile?.id && drawData?.status === "completed") {
        const { data: winner } = await supabase
          .from("draw_winners")
          .select("*, users!user_id(full_name)")
          .eq("draw_id", drawId)
          .eq("user_id", profile.id)
          .single();

        if (winner && winner.claim_status === "pending") {
          setWinnerInfo(winner);
        }
      }
    } catch (error) {
      console.error("Error loading draw:", error);
      toast.error("Could not load draw details");
    } finally {
      setLoading(false);
    }
  }, [drawId, profile?.id, supabase, drawsService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Single consolidated real-time subscription
  useEffect(() => {
    if (!drawId) return;

    let isMounted = true;
    let channel: any = null;

    const setupSubscription = () => {
      try {
        channel = supabase
          .channel(`draw-detail-${drawId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "draw_entries",
              filter: `draw_id=eq.${drawId}`,
            },
            () => {
              if (isMounted) loadData();
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "draws",
              filter: `id=eq.${drawId}`,
            },
            () => {
              if (isMounted) loadData();
            },
          )
          .subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              console.log("✅ Draw detail subscription active");
            }
          });
      } catch (error) {
        console.warn("Failed to setup subscription:", error);
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (channel) {
        try {
          channel.unsubscribe();
        } catch (e) {
          console.warn("Error unsubscribing:", e);
        }
      }
    };
  }, [drawId, supabase, loadData]);

  const handlePurchaseEntry = async () => {
    if (!profile) {
      toast.error("Please login to enter");
      router.push("/login");
      return;
    }

    setEntering(true);
    try {
      // Redirect to shop with draw context
      router.push(`/shop?draw=${drawId}&entry=purchase`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setEntering(false);
    }
  };

  const handleReferralEntry = async () => {
    if (!profile) {
      toast.error("Please login to enter");
      router.push("/login");
      return;
    }

    if (!referralCode.trim()) {
      toast.error("Please enter a referral code");
      return;
    }

    setEntering(true);
    try {
      // Find user by referral code
      const { data: referredUser } = await supabase
        .from("users")
        .select("id")
        .eq("referral_code", referralCode)
        .single();

      if (!referredUser) {
        toast.error("Invalid referral code");
        return;
      }

      await drawsService.addReferralEntries(
        drawId,
        profile.id,
        referredUser.id,
      );
      toast.success("Referral entries added!");
      setReferralCode("");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setEntering(false);
    }
  };

  const handleSocialShare = async () => {
    if (!profile) {
      toast.error("Please login to enter");
      router.push("/login");
      return;
    }

    setEntering(true);
    try {
      const shareUrl = `${window.location.origin}/draws/${drawId}`;
      const shareText = `Check out this amazing draw: ${draw?.name}! Prize: ${draw?.prize_name}`;

      let shareLink = "";
      switch (socialPlatform) {
        case "facebook":
          shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
          break;
        case "twitter":
          shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
          break;
        case "whatsapp":
          shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
          break;
      }

      window.open(shareLink, "_blank");

      await drawsService.addSocialShareEntry(
        drawId,
        profile.id,
        socialPlatform,
        "draw",
      );
      toast.success("Social share entries added!");
      setShowShareDialog(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setEntering(false);
    }
  };

  const handleLiveStreamEntry = async () => {
    if (!liveEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setEntering(true);
    try {
      await drawsService.addLiveStreamEntry(drawId, liveEmail, liveName);
      toast.success("Live stream entries added! Check your email.");
      setLiveEmail("");
      setLiveName("");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setEntering(false);
    }
  };

  const handleClaimPrize = async () => {
    if (!profile) return;

    setClaiming(true);
    try {
      await drawsService.claimPrize(drawId, profile.id);
      toast.success("Prize claimed successfully! We'll contact you shortly.");
      setWinnerInfo(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setClaiming(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isEntryOpen =
    draw?.status === "open" &&
    new Date(draw.entry_starts_at) <= new Date() &&
    new Date(draw.entry_ends_at) >= new Date();

  const isDrawCompleted = draw?.status === "completed";
  const timeRemaining = draw?.entry_ends_at
    ? formatDistanceToNow(new Date(draw.entry_ends_at), { addSuffix: true })
    : null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!draw) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Draw Not Found</h2>
        <p className="text-muted-foreground">
          This draw doesn't exist or has been removed.
        </p>
        <Button className="mt-4" onClick={() => router.push("/draws")}>
          Browse Draws
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Winner Claim Banner */}
      {winnerInfo && (
        <Card className="mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold mb-2">
              Congratulations! You Won!
            </h2>
            <p className="text-muted-foreground mb-4">
              You've won {winnerInfo.prize_name}! Claim your prize before it
              expires.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleClaimPrize} disabled={claiming}>
                {claiming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Claim Prize"
                )}
              </Button>
              <Button variant="outline" onClick={() => router.push("/contact")}>
                Contact Support
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Expires: {format(new Date(winnerInfo.expires_at), "PPP")}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Prize Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prize Card */}
          <Card className="overflow-hidden">
            <div
              className={cn(
                "bg-gradient-to-r p-6 text-white",
                `from-purple-600 to-pink-600`,
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {draw.status === "open"
                    ? "Open for Entries"
                    : draw.status === "completed"
                      ? "Completed"
                      : "Closed"}
                </Badge>
                {isEntryOpen && timeRemaining && (
                  <Badge
                    variant="secondary"
                    className="bg-green-500/20 text-white"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {timeRemaining}
                  </Badge>
                )}
              </div>
              <div className="flex items-start gap-6">
                {draw.prize_image_url ? (
                  <img
                    src={draw.prize_image_url}
                    alt={draw.prize_name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-32 h-32 bg-white/20 rounded-lg flex items-center justify-center">
                    <Gift className="h-12 w-12" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold">{draw.prize_name}</h1>
                  <p className="opacity-90 mt-1">{draw.prize_description}</p>
                  {draw && draw?.prize_value! > 0 && (
                    <div className="mt-2 text-2xl font-bold">
                      {formatPrice(draw?.prize_value!)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Draw Info */}
          <Card>
            <CardHeader>
              <CardTitle>About This Draw</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{draw.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Entries Open:</span>
                  <p className="font-medium">
                    {format(new Date(draw.entry_starts_at), "PPP 'at' h:mm a")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Entries Close:</span>
                  <p className="font-medium">
                    {format(new Date(draw.entry_ends_at), "PPP 'at' h:mm a")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Draw Date:</span>
                  <p className="font-medium">
                    {format(new Date(draw.draw_time), "PPP 'at' h:mm a")}
                  </p>
                </div>
                {draw.max_entries_total && (
                  <div>
                    <span className="text-muted-foreground">Max Entries:</span>
                    <p className="font-medium">
                      {draw.max_entries_total.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Your Entry Status */}
          {profile && userStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Your Entry Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-primary/5">
                    <p className="text-2xl font-bold">
                      {userStatus.total_entries}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total Entries
                    </p>
                  </div>
                  {draw.max_entries_per_user && (
                    <div className="text-center p-3 rounded-lg bg-primary/5">
                      <p className="text-2xl font-bold">
                        {userStatus.remaining_entries_allowed ?? 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Remaining Allowed
                      </p>
                    </div>
                  )}
                </div>

                {Object.keys(userStatus.entry_methods_used).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Entries by Method:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(userStatus.entry_methods_used).map(
                        ([method, count]) => (
                          <Badge key={method} variant="secondary">
                            {method.replace("_", " ")}: {count}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Entry Methods */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enter to Win</CardTitle>
              <CardDescription>
                Choose how you want to earn entries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEntryOpen && !isDrawCompleted && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                  <Clock className="h-5 w-5 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm">Entry period has not started yet</p>
                </div>
              )}

              {isDrawCompleted && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-2" />
                  <p className="text-sm">
                    This draw has ended. Check back for new draws!
                  </p>
                </div>
              )}

              {isEntryOpen && (
                <Tabs defaultValue="purchase" className="w-full">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="purchase">Purchase</TabsTrigger>
                    <TabsTrigger value="referral">Referral</TabsTrigger>
                    <TabsTrigger value="social">Social</TabsTrigger>
                  </TabsList>

                  <TabsContent value="purchase" className="space-y-4 mt-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm">
                        Make a qualifying purchase to earn entries.
                        {draw.entry_config?.purchase?.entries_per_ksh && (
                          <>
                            {" "}
                            You earn{" "}
                            {draw.entry_config.purchase.entries_per_ksh} entry
                            per KSH spent.
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handlePurchaseEntry}
                      disabled={entering}
                    >
                      {entering ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShoppingBag className="h-4 w-4 mr-2" />
                      )}
                      Shop & Earn Entries
                    </Button>
                  </TabsContent>

                  <TabsContent value="referral" className="space-y-4 mt-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm">
                        Refer a friend to earn{" "}
                        {draw.entry_config?.referral?.entries_per_referral || 5}{" "}
                        entries per successful referral.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Friend's Referral Code</Label>
                      <Input
                        placeholder="Enter referral code"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleReferralEntry}
                      disabled={entering || !referralCode}
                    >
                      {entering ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Users className="h-4 w-4 mr-2" />
                      )}
                      Submit Referral
                    </Button>
                  </TabsContent>

                  <TabsContent value="social" className="space-y-4 mt-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm">
                        Share this draw on social media to earn{" "}
                        {draw.entry_config?.social_share?.entries_per_share ||
                          2}{" "}
                        entries per share.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSocialPlatform("facebook");
                          setShowShareDialog(true);
                        }}
                      >
                        <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                        Facebook
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSocialPlatform("twitter");
                          setShowShareDialog(true);
                        }}
                      >
                        <Twitter className="h-4 w-4 mr-2 text-sky-500" />
                        Twitter
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSocialPlatform("whatsapp");
                          setShowShareDialog(true);
                        }}
                      >
                        <div className="h-4 w-4 mr-2 text-green-500">📱</div>
                        WhatsApp
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Live Stream Entry */}
          {draw.entry_config?.live_stream && isEntryOpen && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-red-500" />
                  Live Stream Entry
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your email during the live broadcast to earn entries.
                </p>
                <div className="space-y-2">
                  <Input
                    placeholder="Your name"
                    value={liveName}
                    onChange={(e) => setLiveName(e.target.value)}
                  />
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={liveEmail}
                    onChange={(e) => setLiveEmail(e.target.value)}
                  />
                  <Button
                    className="w-full"
                    onClick={handleLiveStreamEntry}
                    disabled={entering}
                  >
                    {entering ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Radio className="h-4 w-4 mr-2" />
                    )}
                    Join Live Stream
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Referral Link (for existing users) */}
          {profile && isEntryOpen && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Your Referral Link
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Share your unique link and earn entries when friends join!
                </p>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/signup?ref=${profile.id}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/signup?ref=${profile.id}`,
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Consolation Points Info */}
          {draw && draw.consolation_points_amount! > 0 && (
            <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <CardContent className="p-4 text-center">
                <Heart className="h-5 w-5 text-pink-500 mx-auto mb-2" />
                <p className="text-sm">
                  Everyone gets {draw.consolation_points_amount} loyalty points
                  just for participating!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share on {socialPlatform}</DialogTitle>
            <DialogDescription>
              You'll earn{" "}
              {draw.entry_config?.social_share?.entries_per_share || 2} entries
              for sharing!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">
              Share this amazing draw with your friends:
            </p>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium">{draw.name}</p>
              <p className="text-sm text-muted-foreground">
                Prize: {draw.prize_name}
              </p>
            </div>
            <Button className="w-full" onClick={handleSocialShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
