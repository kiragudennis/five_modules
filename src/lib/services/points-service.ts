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
}

