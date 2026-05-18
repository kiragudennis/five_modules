// src/lib/services/referral-service.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { DrawsService } from "./draws-service";

export interface ReferralStats {
  total: number;
  pending: number;
  completed: number;
  pointsAwarded: number;
  topReferrers: any[];
}

export class ReferralService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Generate unique referral code for a user
   */
  async generateReferralCode(userId: string): Promise<string> {
    const prefix = userId.slice(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${prefix}${random}`;

    // Check if code exists
    const { data: existing } = await this.supabase
      .from("referrals")
      .select("id")
      .eq("referral_code", code)
      .limit(1);

    if (existing && existing.length > 0) {
      return this.generateReferralCode(userId);
    }

    return code;
  }

  /**
   * Create referral record when user shares their link
   */
  async createReferral(
    referrerId: string,
    referredEmail: string,
    rewardPoints: number = 100,
    rewardTier?: string,
  ): Promise<string> {
    const code = await this.generateReferralCode(referrerId);

    const { data, error } = await this.supabase
      .from("referrals")
      .insert({
        referrer_id: referrerId,
        referred_email: referredEmail,
        referral_code: code,
        status: "pending",
        reward_points: rewardPoints,
        reward_tier: rewardTier,
        metadata: { created_via: "user_share" },
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Track referral click
   */
  async trackReferralClick(
    referralCode: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // Get referrer from the referral code
    const { data: referral } = await this.supabase
      .from("referrals")
      .select("referrer_id")
      .eq("referral_code", referralCode)
      .single();

    await this.supabase.from("referral_clicks").insert({
      referral_code: referralCode,
      referrer_id: referral?.referrer_id,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Process referral when referred user signs up
   */
  async processReferralSignup(
    referredUserId: string,
    referredEmail: string,
    referralCode: string,
  ): Promise<{
    referralId: string;
    pointsAwarded: number;
    drawEntriesAwarded: number;
  }> {
    // Find the referral record
    const { data: referral, error: findError } = await this.supabase
      .from("referrals")
      .select("*")
      .eq("referral_code", referralCode)
      .eq("referred_email", referredEmail)
      .eq("status", "pending")
      .single();

    if (findError || !referral) {
      throw new Error("Invalid or expired referral code");
    }

    // Update referral record
    const { data: updatedReferral, error: updateError } = await this.supabase
      .from("referrals")
      .update({
        referred_user_id: referredUserId,
        status: "joined",
        updated_at: new Date().toISOString(),
        metadata: {
          ...referral.metadata,
          signed_up_at: new Date().toISOString(),
          referred_user_id: referredUserId,
        },
      })
      .eq("id", referral.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Award points to referrer
    let pointsAwarded = 0;
    if (referral.reward_points > 0) {
      const { data: pointsResult } = await this.supabase.rpc(
        "award_referral_points",
        {
          p_referrer_id: referral.referrer_id,
          p_points: referral.reward_points,
          p_referral_id: referral.id,
          p_type: "signup",
        },
      );
      pointsAwarded = referral.reward_points;
    }

    // Award draw entries for active draws
    let drawEntriesAwarded = 0;
    const drawsService = new DrawsService(this.supabase);

    const { data: activeDraws } = await this.supabase
      .from("draws")
      .select("id, entry_config")
      .eq("status", "open")
      .gte("entry_ends_at", new Date().toISOString());

    if (activeDraws && activeDraws.length > 0) {
      for (const draw of activeDraws) {
        if (draw.entry_config?.referral?.enabled !== false) {
          const entriesPerReferral =
            draw.entry_config?.referral?.entries_per_referral || 5;
          await drawsService.addReferralEntries(
            draw.id,
            referredUserId,
            referral.id,
          );
          drawEntriesAwarded += entriesPerReferral;
        }
      }
    }

    // Update referral with draw entries info
    await this.supabase
      .from("referrals")
      .update({
        draw_entries_awarded: true,
        draw_entries_count: drawEntriesAwarded,
        draw_id: activeDraws?.[0]?.id,
      })
      .eq("id", referral.id);

    // Create notifications
    await this.createReferralNotifications(
      referral.referrer_id,
      referredUserId,
      referral.reward_points,
      drawEntriesAwarded,
    );

    return {
      referralId: referral.id,
      pointsAwarded,
      drawEntriesAwarded,
    };
  }

  /**
   * Process referral when referred user makes first purchase
   */
  async processReferralFirstPurchase(
    referredUserId: string,
    orderId: string,
    orderAmount: number,
  ): Promise<{ bonusPointsAwarded: number }> {
    // Find the referral
    const { data: referral } = await this.supabase
      .from("referrals")
      .select("*")
      .eq("referred_user_id", referredUserId)
      .in("status", ["joined", "converted"])
      .single();

    if (!referral || referral.status === "completed") {
      return { bonusPointsAwarded: 0 };
    }

    // Award bonus points for first purchase (configurable, e.g., 200 points)
    const BONUS_POINTS = 200;

    const { data: pointsResult } = await this.supabase.rpc(
      "award_referral_points",
      {
        p_referrer_id: referral.referrer_id,
        p_points: BONUS_POINTS,
        p_referral_id: referral.id,
        p_type: "first_purchase",
        p_metadata: { order_id: orderId, order_amount: orderAmount },
      },
    );

    // Update referral status
    await this.supabase
      .from("referrals")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        conversion_type: "first_purchase",
        conversion_value: orderAmount,
        loyalty_transaction_id: pointsResult,
      })
      .eq("id", referral.id);

    // Create purchase notification for referrer
    await this.createReferralPurchaseNotification(
      referral.referrer_id,
      referredUserId,
      orderAmount,
      BONUS_POINTS,
    );

    return { bonusPointsAwarded: BONUS_POINTS };
  }

  /**
   * Get user's referral stats
   */
  async getUserReferralStats(userId: string): Promise<{
    totalReferrals: number;
    pendingReferrals: number;
    completedReferrals: number;
    pointsEarned: number;
    recentReferrals: any[];
    referralLinks: any[];
    referralCode: string | null;
  }> {
    const { data: referrals, error } = await this.supabase
      .from("referrals")
      .select(
        `
        id,
        referred_email,
        referred_user_id,
        referral_code,
        status,
        reward_points,
        completed_at,
        created_at,
        metadata,
        draw_entries_awarded,
        draw_entries_count,
        conversion_type,
        conversion_value
      `,
      )
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const totalReferrals = referrals?.length || 0;
    const pendingReferrals =
      referrals?.filter((r) => r.status === "pending").length || 0;
    const completedReferrals =
      referrals?.filter((r) => r.status === "completed").length || 0;
    const pointsEarned =
      referrals?.reduce(
        (sum, r) => sum + (r.status === "completed" ? r.reward_points || 0 : 0),
        0,
      ) || 0;
    const referralCode = referrals?.[0]?.referral_code || null;

    // Get active referral links (pending invitations)
    const referralLinks =
      referrals
        ?.filter((r) => r.status === "pending")
        .map((r) => ({
          id: r.id,
          email: r.referred_email,
          code: r.referral_code,
          created_at: r.created_at,
        })) || [];

    return {
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      pointsEarned,
      recentReferrals: referrals?.slice(0, 10) || [],
      referralLinks,
      referralCode,
    };
  }

  /**
   * Get referral leaderboard
   */
  async getReferralLeaderboard(limit: number = 10): Promise<any[]> {
    const { data, error } = await this.supabase.rpc(
      "get_referral_leaderboard",
      {
        limit_count: limit,
      },
    );

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Get referral stats for marketing dashboard
   */
  async getReferralStats(
    timeRangeStart: Date,
    timeRangeEnd: Date,
  ): Promise<ReferralStats> {
    const { data, error } = await this.supabase.rpc("get_marketing_stats", {
      p_time_range_start: timeRangeStart.toISOString(),
      p_time_range_end: timeRangeEnd.toISOString(),
    });

    if (error) throw error;
    return (
      data?.referrals?.user_referrals || {
        total: 0,
        pending: 0,
        completed: 0,
        pointsAwarded: 0,
        topReferrers: [],
      }
    );
  }

  /**
   * Create notifications for referral events
   */
  private async createReferralNotifications(
    referrerId: string,
    referredUserId: string,
    pointsEarned: number,
    drawEntriesAwarded: number,
  ): Promise<void> {
    // Get referred user's name
    const { data: referred } = await this.supabase
      .from("users")
      .select("full_name, email")
      .eq("id", referredUserId)
      .single();

    const userName =
      referred?.full_name || referred?.email?.split("@")[0] || "Someone";

    // Notify referrer
    await this.supabase.rpc("create_notification", {
      p_user_id: referrerId,
      p_type: "referral_success",
      p_title: "🎉 Someone joined using your referral!",
      p_message: `${userName} signed up using your referral link. You earned ${pointsEarned} points and ${drawEntriesAwarded} draw entries!`,
      p_metadata: {
        referred_user_id: referredUserId,
        referred_name: userName,
        points_earned: pointsEarned,
        draw_entries: drawEntriesAwarded,
        referral_type: "signup",
      },
    });

    // Notify referred user
    await this.supabase.rpc("create_notification", {
      p_user_id: referredUserId,
      p_type: "referral_welcome",
      p_title: "🎁 Welcome! You received bonus entries!",
      p_message: `Thanks for joining through a referral! You've received ${drawEntriesAwarded} draw entries to get started.`,
      p_metadata: {
        referrer_id: referrerId,
        draw_entries: drawEntriesAwarded,
      },
    });
  }

  /**
   * Create notification for referral purchase
   */
  private async createReferralPurchaseNotification(
    referrerId: string,
    referredUserId: string,
    orderAmount: number,
    bonusPoints: number,
  ): Promise<void> {
    await this.supabase.rpc("create_notification", {
      p_user_id: referrerId,
      p_type: "referral_purchase",
      p_title: "💰 Your referral made a purchase!",
      p_message: `Someone you referred made their first purchase of KES ${orderAmount.toLocaleString()}. You earned ${bonusPoints} bonus points!`,
      p_metadata: {
        referred_user_id: referredUserId,
        order_amount: orderAmount,
        points_earned: bonusPoints,
      },
    });
  }
}
