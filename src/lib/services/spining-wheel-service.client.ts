// src/lib/services/spinning-wheel-service.client.ts
import { getSupabaseClient } from "@/lib/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";

export class SpinningWheelClientService {
  private supabase: SupabaseClient;

  // Accept the client from AuthContext in constructor
  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Get user allocation for a game
   */
  async getUserAllocation(userId: string, gameId: string) {
    const { data, error } = await this.supabase.rpc("get_user_allocation", {
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
   * Get complete user spin state (points + allocation)
   */
  async getUserSpinState(gameId: string) {
    const { data, error } = await this.supabase.rpc("get_user_spin_state", {
      p_game_id: gameId,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Perform a spin
   */
  async spin(
    gameId: string,
    spinType: "free" | "points" | "purchase" | "bonus",
  ) {
    const { data, error } = await this.supabase.rpc("perform_spin", {
      p_game_id: gameId,
      p_spin_type: spinType,
    });

    if (error) {
      console.error("RPC Error:", error);
      throw new Error(error.message);
    }

    return data;
  }

  // /**
  //  * Get recent winners for live ticker
  //  */
  // async getRecentWinners(gameId: string, limit: number = 10) {
  //   const { data, error } = await this.supabase
  //     .from("spin_attempts")
  //     .select(
  //       `
  //       prize_type,
  //       prize_value,
  //       points_awarded,
  //       created_at,
  //       profiles:user_id (full_name)
  //     `,
  //     )
  //     .eq("game_id", gameId)
  //     .not("prize_value", "is", null)
  //     .gt("points_awarded", 0)
  //     .order("created_at", { ascending: false })
  //     .limit(limit);

  //   if (error) throw error;

  //   return data.map((item: any) => ({
  //     name: item.profiles?.full_name || "Anonymous",
  //     prize:
  //       item.prize_type === "points"
  //         ? `${item.points_awarded} Points`
  //         : item.prize_value,
  //     time: item.created_at,
  //   }));
  // }

  /**
   * Get live ticker feed
   */
  async getLiveTicker(gameId: string, limit: number = 20) {
    const { data, error } = await this.supabase
      .from("spin_live_ticker")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Get total spins today and active players
   */
  async getGameStats(gameId: string) {
    const today = new Date().toISOString().split("T")[0];
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const [{ count: totalSpins }, { count: activePlayers }] = await Promise.all(
      [
        this.supabase
          .from("spin_attempts")
          .select("id", { count: "exact", head: true })
          .eq("game_id", gameId)
          .gte("created_at", today),
        this.supabase
          .from("spin_attempts")
          .select("user_id", { count: "exact", head: true })
          .eq("game_id", gameId)
          .gte("created_at", fiveMinsAgo),
      ],
    );

    return {
      total_spins_today: totalSpins || 0,
      active_players: activePlayers || 0,
    };
  }

  // src/lib/services/spinning-wheel-service.client.ts

  /**
   * Get participant count and statistics using RPC
   */
  async getParticipantStats(gameId: string) {
    try {
      const { data, error } = await this.supabase.rpc(
        "get_game_participant_stats",
        {
          p_game_id: gameId,
        },
      );

      if (error) {
        console.error("RPC get_game_participant_stats error:", error);
        return { total_participants: 0, total_spins: 0 };
      }

      // Return data with fallback defaults
      return data || { total_participants: 0, total_spins: 0 };
    } catch (error) {
      console.error("Error in getParticipantStats:", error);
      return { total_participants: 0, total_spins: 0 };
    }
  }

  /**
   * Get all participants using RPC
   */
  async getAllParticipants(gameId: string, limit: number = 50) {
    try {
      const { data, error } = await this.supabase.rpc("get_game_participants", {
        p_game_id: gameId,
        p_limit: limit,
      });

      if (error) {
        console.error("RPC get_game_participants error:", error);
        return [];
      }

      // Return data or empty array
      return data || [];
    } catch (error) {
      console.error("Error in getAllParticipants:", error);
      return [];
    }
  }

  /**
   * Get game details - also handle errors
   */
  async getGame(gameId: string) {
    try {
      const { data, error } = await this.supabase
        .from("spin_games")
        .select("*")
        .eq("id", gameId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 0 row errors

      if (error) {
        console.error("Error fetching game:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in getGame:", error);
      throw error;
    }
  }

  /**
   * Get recent winners for live ticker
   */
  async getRecentWinners(gameId: string, limit: number = 10) {
    try {
      const { data, error } = await this.supabase
        .from("spin_attempts")
        .select(
          `
        prize_type,
        prize_value,
        points_awarded,
        created_at,
        users!spin_attempts_user_id_fkey (
          full_name
        )
      `,
        )
        .eq("game_id", gameId)
        .not("prize_value", "is", null)
        .gt("points_awarded", 0)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching winners:", error);
        return [];
      }

      return (data || []).map((item: any) => ({
        name: item.users?.full_name || "Anonymous",
        prize:
          item.prize_type === "points"
            ? `${item.points_awarded} Points`
            : item.prize_value,
        time: item.created_at,
        timestamp: item.created_at,
      }));
    } catch (error) {
      console.error("Error in getRecentWinners:", error);
      return [];
    }
  }

  /**
   * Subscribe to real-time participant updates
   * Returns an unsubscribe function
   */
  subscribeToParticipants(
    gameId: string,
    onNewParticipant: (participant: any) => void,
  ) {
    const channel = this.supabase
      .channel(`participants-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "spin_attempts",
          filter: `game_id=eq.${gameId}`,
        },
        async (payload) => {
          // Fetch user details for the new participant
          const { data: userData } = await this.supabase
            .from("users")
            .select("id, full_name")
            .eq("id", payload.new.user_id)
            .single();

          if (userData) {
            onNewParticipant({
              id: userData.id,
              name: userData.full_name || "Anonymous",
              avatar: (userData.full_name?.charAt(0) || "?").toUpperCase(),
              first_spin_at: payload.new.created_at,
              spin_count: 1,
            });
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }
}
