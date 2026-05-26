// app/(store)/draws/[drawId]/claim/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Trophy, Gift, CheckCircle, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface ClaimData {
  draw_id: string;
  draw_name: string;
  prize_name: string;
  prize_description: string;
  prize_value: number;
  prize_image_url: string;
  winner_name: string;
  winner_email: string;
  winner_phone: string;
  expires_at: string;
  claim_status: string;
}

export default function DrawClaimPage() {
  const { drawId } = useParams<{ drawId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [claimData, setClaimData] = useState<ClaimData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    county: "",
    postal_code: "",
    special_instructions: "",
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Verify winner and load claim data
  useEffect(() => {
    const loadClaimData = async () => {
      if (!profile?.id) {
        router.push("/login");
        return;
      }

      // Check if user is actually a winner
      const { data: winner, error: winnerError } = await supabase
        .from("draw_winners")
        .select(
          `
          *,
          draws!inner (
            id,
            name,
            prize_name,
            prize_description,
            prize_value,
            prize_image_url
          )
        `,
        )
        .eq("draw_id", drawId)
        .eq("user_id", profile.id)
        .eq("claim_status", "pending")
        .single();

      if (winnerError || !winner) {
        toast.error(
          "You are not a winner of this draw or prize already claimed",
        );
        router.push(`/draws/${drawId}`);
        return;
      }

      setClaimData({
        draw_id: winner.draw_id,
        draw_name: winner.draws.name,
        prize_name: winner.prize_name,
        prize_description: winner.draws.prize_description,
        prize_value: winner.prize_value,
        prize_image_url: winner.draws.prize_image_url,
        winner_name: profile.full_name || "",
        winner_email: profile.email || "",
        winner_phone: profile.phone || "",
        expires_at: winner.expires_at,
        claim_status: winner.claim_status,
      });

      // Pre-fill form with user data
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        county: profile.country || "",
        postal_code: profile.postal_code || "",
        special_instructions: "",
      });

      setLoading(false);
    };

    loadClaimData();
  }, [drawId, profile, supabase, router]);

  // Countdown timer for expiry
  useEffect(() => {
    if (!claimData?.expires_at) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(claimData.expires_at).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [claimData?.expires_at]);

  const handleSubmitClaim = async () => {
    if (!formData.full_name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      // Update the winner record with claim details
      const { error: updateError } = await supabase
        .from("draw_winners")
        .update({
          claim_status: "claimed",
          claimed_at: new Date().toISOString(),
          claim_details: {
            shipping_address: formData.address,
            shipping_city: formData.city,
            shipping_county: formData.county,
            shipping_postal_code: formData.postal_code,
            shipping_phone: formData.phone,
            special_instructions: formData.special_instructions,
            claimed_at: new Date().toISOString(),
            ip_address: window.location.hostname,
          },
        })
        .eq("draw_id", drawId)
        .eq("user_id", profile?.id);

      if (updateError) throw updateError;

      // Trigger confetti celebration
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#8B5CF6", "#EC4899", "#FBBF24"],
      });

      setStep(3);
      toast.success("Prize claimed successfully!");
    } catch (error) {
      console.error("Error claiming prize:", error);
      toast.error("Failed to claim prize. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!claimData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Prize Found</h2>
          <p className="text-muted-foreground mb-4">
            You don't have a pending prize to claim.
          </p>
          <Button onClick={() => router.push("/draws")}>Browse Draws</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-orange-600/10 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="inline-block"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Trophy className="h-10 w-10 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Congratulations! 🎉
          </h1>
          <p className="text-muted-foreground">
            You've won an amazing prize! Complete the form below to claim it.
          </p>
        </div>

        {/* Expiry Warning */}
        <Card className="mb-6 border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Claim Expires In:</span>
              </div>
              <div className="flex gap-3 font-mono font-bold">
                <div className="text-center">
                  <span className="text-xl">
                    {String(timeLeft.days).padStart(2, "0")}
                  </span>
                  <span className="text-xs ml-1">d</span>
                </div>
                <span className="text-xl">:</span>
                <div className="text-center">
                  <span className="text-xl">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className="text-xs ml-1">h</span>
                </div>
                <span className="text-xl">:</span>
                <div className="text-center">
                  <span className="text-xl">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-xs ml-1">m</span>
                </div>
                <span className="text-xl">:</span>
                <div className="text-center">
                  <span className="text-xl text-red-500">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-xs ml-1">s</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Don't wait! Unclaimed prizes may be redrawn after expiration.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Prize Summary Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6 p-6">
            <div className="w-32 h-32 mx-auto md:mx-0 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              {claimData.prize_image_url ? (
                <img
                  src={claimData.prize_image_url}
                  alt={claimData.prize_name}
                  className="w-24 h-24 object-contain rounded-full"
                />
              ) : (
                <Gift className="h-12 w-12 text-purple-500" />
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <Badge className="mb-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                🏆 GRAND PRIZE WINNER
              </Badge>
              <h2 className="text-2xl font-bold">{claimData.prize_name}</h2>
              <p className="text-muted-foreground mt-1">
                {claimData.prize_description}
              </p>
              {claimData.prize_value > 0 && (
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10">
                  <span className="text-green-600 font-semibold">
                    {formatPrice(claimData.prize_value)}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center md:text-right">
              <div className="text-sm text-muted-foreground">Draw Name</div>
              <p className="font-medium">{claimData.draw_name}</p>
            </div>
          </div>
        </Card>

        {/* Claim Steps */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Verify Your Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label>Email Address *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="2547XXXXXXXX"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setStep(2)}>
                    Continue to Shipping →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Street Address *</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Street address"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>City *</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label>County</Label>
                    <Input
                      value={formData.county}
                      onChange={(e) =>
                        setFormData({ ...formData, county: e.target.value })
                      }
                      placeholder="County"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Postal Code</Label>
                    <Input
                      value={formData.postal_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          postal_code: e.target.value,
                        })
                      }
                      placeholder="Postal code"
                    />
                  </div>
                  <div>
                    <Label>Phone (for delivery) *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="Delivery contact"
                    />
                  </div>
                </div>
                <div>
                  <Label>Special Instructions (Optional)</Label>
                  <Textarea
                    value={formData.special_instructions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        special_instructions: e.target.value,
                      })
                    }
                    placeholder="Delivery instructions, gate code, etc."
                    rows={3}
                  />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={handleSubmitClaim} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Claim My Prize
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Prize Claimed Successfully! 🎉
                </h2>
                <p className="text-muted-foreground mb-4">
                  Thank you for claiming your prize. Our team will contact you
                  within 48 hours to arrange delivery.
                </p>
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium mb-2">What happens next?</p>
                  <ul className="text-sm text-muted-foreground space-y-2 text-left">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Our team will verify your claim
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      You'll receive a confirmation email
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Delivery will be arranged within 5-7 business days
                    </li>
                  </ul>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button asChild variant="outline">
                    <Link href={`/draws/${drawId}`}>View Draw Details</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/draws">Browse More Draws</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
