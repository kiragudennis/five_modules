// src/lib/services/points-service.ts
"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

export type PointsConfig = {
  pointsPerKsh: number;
  minRedeemPoints: number;
};

export type PointsHistoryRow = {
  id: string;
  points_change: number;
  current_points: number;
  transaction_type: string;
  description: string;
  created_at: string;
  order_id?: string | null;
};

const DEFAULT_CONFIG: PointsConfig = {
  pointsPerKsh: 10,
  minRedeemPoints: 100,
};

export class PointsService {
  static async getConfig(supabase: SupabaseClient): Promise<PointsConfig> {
    const { data, error } = await supabase
      .from("points_config")
      .select("points_per_ksh,min_redeem_points")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return DEFAULT_CONFIG;

    return {
      pointsPerKsh: data.points_per_ksh || DEFAULT_CONFIG.pointsPerKsh,
      minRedeemPoints: data.min_redeem_points || DEFAULT_CONFIG.minRedeemPoints,
    };
  }

  static async updateConfig(
    supabase: SupabaseClient,
    next: PointsConfig,
  ): Promise<void> {
    const { error } = await supabase.from("points_config").upsert(
      {
        id: 1,
        points_per_ksh: next.pointsPerKsh,
        min_redeem_points: next.minRedeemPoints,
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  static async getBalance(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from("loyalty_points")
      .select("points,points_earned,points_redeemed,tier")
      .eq("user_id", userId)
      .single();
    if (error) throw error;
    return data;
  }

  static async getHistory(
    supabase: SupabaseClient,
    userId: string,
    limit = 20,
  ): Promise<PointsHistoryRow[]> {
    const { data, error } = await supabase
      .from("loyalty_transactions")
      .select(
        "id,points_change,current_points,transaction_type,description,created_at,order_id",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as PointsHistoryRow[];
  }

  static async redeemForCheckout(
    supabase: SupabaseClient,
    userId: string,
    pointsToRedeem: number,
    description = "Points redeemed for checkout discount",
  ) {
    const { data, error } = await supabase.rpc(
      "redeem_loyalty_points_for_checkout",
      {
        p_user_id: userId,
        p_points_to_redeem: pointsToRedeem,
        p_description: description,
      },
    );

    if (error) throw error;
    return data;
  }

  static async award(
    supabase: SupabaseClient,
    userId: string,
    points: number,
    transactionType: string,
    referenceId: string | null = null,
    description = "",
  ) {
    // Get current balance first
    const balance = await this.getBalance(supabase, userId);
    const currentPoints = balance.points || 0;
    const newBalance = currentPoints + points;

    // Insert transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("loyalty_transactions")
      .insert({
        user_id: userId,
        points_change: points,
        current_points: newBalance,
        transaction_type: transactionType,
        description: description || `Points awarded via ${transactionType}`,
        order_id: referenceId,
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Update user's loyalty points balance
    const { error: updateError } = await supabase
      .from("loyalty_points")
      .update({
        points: newBalance,
        points_earned: balance.points_earned + points,
        last_activity_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    return transaction;
  }

  /**
   * Spend points from a user's balance
   * @param supabase - Supabase client instance
   * @param userId - User ID
   * @param points - Points to spend (positive number)
   * @param transactionType - Type of transaction (e.g., 'spin_payment', 'deal_revival', 'early_access')
   * @param referenceId - Optional reference ID (e.g., deal_id, game_id)
   * @param description - Optional description of the transaction
   * @returns The created transaction record
   */
  static async spend(
    supabase: SupabaseClient,
    userId: string,
    points: number,
    transactionType: string,
    referenceId: string | null = null,
    description = "",
  ) {
    if (points <= 0) {
      throw new Error("Points to spend must be greater than 0");
    }

    // Get current balance first
    const balance = await this.getBalance(supabase, userId);
    const currentPoints = balance.points || 0;

    // Check if user has enough points
    if (currentPoints < points) {
      throw new Error(
        `Insufficient points. Required: ${points}, Available: ${currentPoints}`,
      );
    }

    const newBalance = currentPoints - points;

    // Insert transaction record (negative points_change for spending)
    const { data: transaction, error: transactionError } = await supabase
      .from("loyalty_transactions")
      .insert({
        user_id: userId,
        points_change: -points, // Negative for spending
        current_points: newBalance,
        transaction_type: transactionType,
        description: description || `Points spent via ${transactionType}`,
        order_id: referenceId,
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Update user's loyalty points balance
    const { error: updateError } = await supabase
      .from("loyalty_points")
      .update({
        points: newBalance,
        points_redeemed: (balance.points_redeemed || 0) + points,
        last_activity_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    return transaction;
  }

  /**
   * Check if a user has sufficient points for a spend operation
   * @param supabase - Supabase client instance
   * @param userId - User ID
   * @param requiredPoints - Points required
   * @returns Boolean indicating if user has sufficient points
   */
  static async hasSufficientPoints(
    supabase: SupabaseClient,
    userId: string,
    requiredPoints: number,
  ): Promise<boolean> {
    try {
      const balance = await this.getBalance(supabase, userId);
      return (balance.points || 0) >= requiredPoints;
    } catch {
      return false;
    }
  }

  /**
   * Get available points balance for a user
   * @param supabase - Supabase client instance
   * @param userId - User ID
   * @returns Current points balance
   */
  static async getAvailablePoints(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<number> {
    try {
      const balance = await this.getBalance(supabase, userId);
      return balance.points || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Transfer points between users
   * @param supabase - Supabase client instance
   * @param fromUserId - Sender user ID
   * @param toUserId - Recipient user ID
   * @param points - Points to transfer
   * @param transactionType - Type of transaction
   * @param description - Optional description
   */
  static async transfer(
    supabase: SupabaseClient,
    fromUserId: string,
    toUserId: string,
    points: number,
    transactionType: string,
    description = "",
  ) {
    if (points <= 0) {
      throw new Error("Points to transfer must be greater than 0");
    }

    // Check sender has enough points
    const hasEnough = await this.hasSufficientPoints(
      supabase,
      fromUserId,
      points,
    );
    if (!hasEnough) {
      throw new Error(
        `Sender has insufficient points for transfer of ${points}`,
      );
    }

    // Deduct from sender
    await this.spend(
      supabase,
      fromUserId,
      points,
      `${transactionType}_sent`,
      null,
      description || `Transferred ${points} points to user ${toUserId}`,
    );

    // Add to recipient
    await this.award(
      supabase,
      toUserId,
      points,
      `${transactionType}_received`,
      null,
      description || `Received ${points} points from user ${fromUserId}`,
    );

    return true;
  }
}
