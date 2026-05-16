// src/lib/services/spinning-wheel-service.ts
// This service handles all interactions with the spinning wheel game, including fetching available games, checking user eligibility, performing spins, and managing the live ticker.
// It abstracts away the database interactions and business logic related to the spin game.
import { createClient } from "@/lib/supabase/server";
import {
  SpinGame,
  PrizeSegment,
  SpinAttempt,
  UserSpinAllocation,
} from "@/types/spinning_wheel";
import { PointsService } from "./points-service";
import { SupabaseClient } from "@supabase/supabase-js";

export class SpinningWheelService {
  private supabase: SupabaseClient | null = null;

  // Explicitly define constructor with no parameters
  constructor() {
    // No context needed for App Router
  }

  /**
   * Get or create Supabase client (async for server components)
   */
  private async getSupabase(): Promise<SupabaseClient> {
    if (!this.supabase) {
      this.supabase = await createClient();
    }
    return this.supabase as SupabaseClient;
  }
  /**
   * Get all active games available to a user
   */
  async getAvailableGames(userId: string): Promise<SpinGame[]> {
    const now = new Date().toISOString();
    const supabase = await this.getSupabase();

    const { data: games, error } = await supabase
      .from("spin_games")
      .select("*")
      .eq("is_active", true)
      .lte("starts_at", now)
      .gte("ends_at", now)
      .order("game_type", { ascending: true });

    if (error) throw error;

    // Filter based on user eligibility
    const userTier = await this.getUserTier(userId);
    const userPurchaseCount = await this.getUserPurchaseCount(userId);
    const isNewCustomer = await this.isNewCustomer(userId);

    return (games || []).filter((game: SpinGame) => {
      // Tier check
      if (
        game.eligible_tiers.length &&
        !game.eligible_tiers.includes(userTier)
      ) {
        return false;
      }
      // Purchase count check
      if (
        game.requires_purchase_count &&
        userPurchaseCount < game.requires_purchase_count
      ) {
        return false;
      }
      // New customer check
      if (game.new_customer_only && !isNewCustomer) {
        return false;
      }
      // Single prize already claimed
      if (game.is_single_prize && game.single_prize_claimed) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get user's spin allocation for a specific game
   */
  // src/lib/services/spining-wheel-service.client.ts

  async getUserAllocation(userId: string, gameId: string) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase.rpc("get_user_allocation", {
      p_user_id: userId,
      p_game_id: gameId,
    });

    // Handle null/undefined response
    if (error || !data) {
      // Return default allocation
      return {
        spins_used_today: 0,
        spins_used_this_week: 0,
        spins_used_total: 0,
        free_spins_remaining_today: 0,
        free_spins_remaining_week: 0,
        free_spins_remaining_total: 0,
        can_spin_free: true,
        can_spin_paid: false,
        points_required_for_paid: 0,
      };
    }

    return data;
  }

  /**
   * Perform a spin
   */
  async spin(
    userId: string,
    gameId: string,
    spinType: "free" | "points" | "purchase" | "bonus",
  ): Promise<SpinAttempt & { prizeDisplay: string }> {
    // Get game with prize config
    const supabase = await this.getSupabase();
    const { data: game, error: gameError } = await supabase
      .from("spin_games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (gameError) throw gameError;

    // Check single prize not already claimed
    if (game.is_single_prize && game.single_prize_claimed) {
      throw new Error("This prize has already been won");
    }

    // Check spin eligibility
    const allocation = await this.getUserAllocation(userId, gameId);

    if (spinType === "free" && !allocation.can_spin_free) {
      throw new Error("No free spins remaining");
    }

    if (spinType === "points") {
      const userPoints = await PointsService.getBalance(supabase, userId);
      if (userPoints < game.points_per_paid_spin) {
        throw new Error("Insufficient points");
      }
      // Spend points
      await PointsService.spend(
        supabase,
        userId,
        game.points_per_paid_spin,
        "spin_payment",
        gameId,
      );
    }

    // Calculate spin result based on probabilities
    const selectedSegment = this.selectPrizeByProbability(game.prize_config);
    const segmentIndex = game.prize_config.findIndex(
      (p: any) => p.label === selectedSegment.label,
    );

    // Award prize
    let pointsAwarded = 0;
    let prizeDisplay = "";

    switch (selectedSegment.type) {
      case "points":
        pointsAwarded = parseInt(selectedSegment.value as string);
        await PointsService.award(
          supabase,
          userId,
          pointsAwarded,
          "spin_win",
          gameId,
        );
        prizeDisplay = `${pointsAwarded} points`;
        break;
      case "discount":
        prizeDisplay = `${selectedSegment.value}% off`;
        break;
      case "free_shipping":
        prizeDisplay = "Free Shipping";
        break;
      case "product":
        prizeDisplay = `Free ${selectedSegment.value}`;
        break;
      case "bundle":
        prizeDisplay = `Free ${selectedSegment.value} Bundle`;
        break;
    }

    // Record spin attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("spin_attempts")
      .insert({
        game_id: gameId,
        user_id: userId,
        spin_type: spinType,
        prize_type: selectedSegment.type,
        prize_value: selectedSegment.value as string,
        points_awarded: pointsAwarded,
        points_spent: spinType === "points" ? game.points_per_paid_spin : 0,
        segment_index: segmentIndex,
        landed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    // Update allocation
    await this.updateAllocation(userId, gameId, spinType);

    // Update single prize if claimed
    if (game.is_single_prize && spinType !== "points") {
      await supabase
        .from("spin_games")
        .update({
          single_prize_claimed: true,
          single_prize_winner_id: userId,
        })
        .eq("id", gameId);
    }

    // Add to live ticker
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    await supabase.from("spin_live_ticker").insert({
      game_id: gameId,
      user_name: userProfile?.full_name || "Customer",
      prize_text: prizeDisplay,
    });

    return {
      ...attempt,
      prizeDisplay,
    };
  }

  /**
   * Select prize based on probability distribution
   */
  private selectPrizeByProbability(prizes: PrizeSegment[]): PrizeSegment {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const prize of prizes) {
      cumulative += prize.probability;
      if (random <= cumulative) {
        return prize;
      }
    }
    return prizes[0];
  }

  /**
   * Get live ticker items for broadcast
   */
  async getLiveTicker(gameId: string, limit: number = 20) {
    const supabase = await this.getSupabase();
    const { data } = await supabase
      .from("spin_live_ticker")
      .select("user_name, prize_text, created_at")
      .eq("game_id", gameId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return data || [];
  }

  // Helper methods
  private async getUserTier(userId: string): Promise<string> {
    const supabase = await this.getSupabase();
    const { data } = await supabase
      .from("loyalty_points")
      .select("tier")
      .eq("user_id", userId)
      .single();
    return data?.tier || "bronze";
  }

  private async getUserPurchaseCount(userId: string): Promise<number> {
    const supabase = await this.getSupabase();
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed");
    return count || 0;
  }

  private async isNewCustomer(userId: string): Promise<boolean> {
    const supabase = await this.getSupabase();
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    return (count || 0) === 0;
  }

  private async updateAllocation(
    userId: string,
    gameId: string,
    spinType: string,
  ) {
    const today = new Date().toISOString().split("T")[0];
    const supabase = await this.getSupabase();

    // Upsert allocation increment
    await supabase.rpc("increment_spin_usage", {
      p_user_id: userId,
      p_game_id: gameId,
      p_date: today,
    });
  }

  private getWeekStart(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split("T")[0];
  }
}
