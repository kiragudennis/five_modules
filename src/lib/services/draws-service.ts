// src/lib/services/draws-service.ts (Enhanced Version)
import { Draw, EntryConfig, UserDrawStatus } from "@/types/draws";
import { SupabaseClient } from "@supabase/supabase-js";

export interface EntryMethod {
  type:
    | "purchase"
    | "referral"
    | "social_share"
    | "live_stream_entry"
    | "loyalty_bonus"
    | "points_redeem"
    | "product_review"
    | "newsletter_signup";
  enabled: boolean;
  config: any;
}

export interface DrawPhase {
  status: "draft" | "open" | "closed" | "drawing" | "completed" | "cancelled";
  phase: "entry_collection" | "entries_locked" | "winner_reveal" | "completed";
}

export class DrawsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all draws (with optional filtering by group or status)
   */
  async getDraws(options?: {
    groupId?: string;
    status?: string[];
    active?: boolean;
  }): Promise<any[]> {
    let query = this.supabase.from("draws").select("*");

    if (options?.groupId) {
      query = query.eq("draw_group_id", options.groupId);
    }
    if (options?.status && options.status.length > 0) {
      query = query.in("status", options.status);
    }
    if (options?.active) {
      const now = new Date().toISOString();
      query = query
        .eq("status", "open")
        .lte("entry_starts_at", now)
        .gte("entry_ends_at", now);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) throw error;
    return data || [];
  }

  /**
   * Get draw groups (for managing multiple concurrent draws)
   */
  async getDrawGroups(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("draw_groups")
      .select("*, draws!draw_group_id(id, name, status, prize_name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get user's entry status for a draw
   */
  async getUserDrawStatus(
    drawId: string,
    userId: string,
  ): Promise<UserDrawStatus> {
    try {
      const { data: entries, error } = await this.supabase
        .from("draw_entries")
        .select("entry_count, entry_method")
        .eq("draw_id", drawId)
        .eq("user_id", userId);

      if (error) throw error;

      const totalEntries =
        entries?.reduce((sum, e) => sum + e.entry_count, 0) || 0;

      const entryMethodsUsed: Record<string, number> = {};
      entries?.forEach((e) => {
        entryMethodsUsed[e.entry_method] =
          (entryMethodsUsed[e.entry_method] || 0) + e.entry_count;
      });

      const { data: draw, error: drawError } = await this.supabase
        .from("draws")
        .select("max_entries_per_user, entry_starts_at")
        .eq("id", drawId)
        .single();

      if (drawError) throw drawError;

      const remainingAllowed = draw?.max_entries_per_user
        ? Math.max(0, draw.max_entries_per_user - totalEntries)
        : null;

      // Check eligibility for different entry methods
      const { data: orders } = await this.supabase
        .from("orders")
        .select("total_amount")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("created_at", draw?.entry_starts_at || "2000-01-01");

      const totalSpent =
        orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

      return {
        total_entries: totalEntries,
        remaining_entries_allowed: remainingAllowed,
        entry_methods_used: entryMethodsUsed,
        can_enter_purchase: totalSpent > 0,
        can_enter_referral: true,
        can_enter_social: true,
        can_enter_live: true,
      };
    } catch (error) {
      console.error("Error in getUserDrawStatus:", error);
      // Return default status
      return {
        total_entries: 0,
        remaining_entries_allowed: null,
        entry_methods_used: {},
        can_enter_purchase: true,
        can_enter_referral: true,
        can_enter_social: true,
        can_enter_live: true,
      };
    }
  }

  /**
   * Create or update a draw group
   */
  async saveDrawGroup(
    id: string | null,
    name: string,
    description?: string,
  ): Promise<string> {
    if (id) {
      await this.supabase
        .from("draw_groups")
        .update({ name, description })
        .eq("id", id);
      return id;
    } else {
      const { data, error } = await this.supabase
        .from("draw_groups")
        .insert({ name, description })
        .select()
        .single();
      if (error) throw error;
      return data.id;
    }
  }

  /**
   * Add social share entry
   */
  async addSocialShareEntry(
    drawId: string,
    userId: string,
    platform: string,
    shareType: string,
    referenceId?: string,
  ): Promise<{ entries: number; alreadyEarned: boolean }> {
    // Check if already earned for this draw/platform
    const { data: existing } = await this.supabase
      .from("draw_social_shares")
      .select("id")
      .eq("draw_id", drawId)
      .eq("user_id", userId)
      .eq("platform", platform)
      .eq("share_type", shareType)
      .maybeSingle();

    if (existing) {
      return { entries: 0, alreadyEarned: true };
    }

    // Record the share
    await this.supabase.from("draw_social_shares").insert({
      draw_id: drawId,
      user_id: userId,
      platform,
      share_type: shareType,
      reference_id: referenceId,
    });

    // Get draw config
    const { data: draw } = await this.supabase
      .from("draws")
      .select("entry_config")
      .eq("id", drawId)
      .single();

    const entries = draw?.entry_config?.social_share?.entries_per_share || 1;

    // Add entries
    const { data: entry } = await this.supabase
      .from("draw_entries")
      .insert({
        draw_id: drawId,
        user_id: userId,
        entry_count: entries,
        entry_method: "social_share",
        metadata: {
          platform,
          share_type: shareType,
          reference_id: referenceId,
        },
      })
      .select()
      .single();

    await this.createTickets(drawId, userId, entry.id, entries);

    // Add to live ticker
    const { data: profile } = await this.supabase
      .from("users")
      .select("full_name")
      .eq("id", userId)
      .single();

    await this.supabase.from("draw_live_ticker").insert({
      draw_id: drawId,
      user_name: profile?.full_name || "Customer",
      entry_count: entries,
      entry_method: `social_share_${platform}`,
    });

    return { entries, alreadyEarned: false };
  }

  /**
   * Add live stream email entry
   */
  async addLiveStreamEntry(
    drawId: string,
    email: string,
    name?: string,
  ): Promise<{ entries: number; userCreated: boolean; userId?: string }> {
    // Check if already entered
    const { data: existing } = await this.supabase
      .from("draw_live_entries")
      .select("id, user_id, is_converted")
      .eq("draw_id", drawId)
      .eq("email", email)
      .maybeSingle();

    if (existing?.is_converted) {
      return { entries: 0, userCreated: false };
    }

    // Find or create user
    let userId: string | null = existing?.user_id || null;
    let userCreated = false;

    if (!userId) {
      const { data: existingUser } = await this.supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create temporary user (will need to complete registration later)
        const { data: newUser, error } =
          await this.supabase.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { full_name: name || email.split("@")[0] },
          });
        if (error) throw error;
        userId = newUser.user.id;
        userCreated = true;
      }
    }

    // Record live entry
    await this.supabase.from("draw_live_entries").upsert(
      {
        draw_id: drawId,
        email,
        full_name: name,
        user_id: userId,
        entered_at: new Date().toISOString(),
      },
      { onConflict: "draw_id,email" },
    );

    // Get draw config
    const { data: draw } = await this.supabase
      .from("draws")
      .select("entry_config")
      .eq("id", drawId)
      .single();

    const entries = draw?.entry_config?.live_stream?.entries_per_email || 1;

    // Add entries
    const { data: entry } = await this.supabase
      .from("draw_entries")
      .insert({
        draw_id: drawId,
        user_id: userId,
        entry_count: entries,
        entry_method: "live_stream_entry",
        metadata: { email, source: "live_broadcast" },
      })
      .select()
      .single();

    await this.createTickets(drawId, userId!, entry.id, entries);

    // Add to live ticker
    await this.supabase.from("draw_live_ticker").insert({
      draw_id: drawId,
      user_name: name || email.split("@")[0],
      entry_count: entries,
      entry_method: "live_stream",
    });

    return { entries, userCreated, userId: userId! };
  }

  /**
   * Add loyalty tier bonus entries
   */
  async addLoyaltyBonusEntries(
    drawId: string,
    userId: string,
  ): Promise<number> {
    // Get user's tier
    const { data: loyalty } = await this.supabase
      .from("loyalty_points")
      .select("tier")
      .eq("user_id", userId)
      .single();

    const userTier = loyalty?.tier || "bronze";

    // Get draw config
    const { data: draw } = await this.supabase
      .from("draws")
      .select("entry_config, max_entries_per_user")
      .eq("id", drawId)
      .single();

    const tierConfig = draw?.entry_config?.loyalty_tier;
    if (!tierConfig) return 0;

    const bonusEntries = tierConfig[userTier] || tierConfig.bronze || 1;

    // Check per-user limit
    if (draw.max_entries_per_user) {
      const { count: userEntries } = await this.supabase
        .from("draw_entries")
        .select("id", { count: "exact", head: true })
        .eq("draw_id", drawId)
        .eq("user_id", userId);

      const remaining = draw.max_entries_per_user - (userEntries || 0);
      if (bonusEntries > remaining) return 0;
    }

    // Add entries
    const { data: entry } = await this.supabase
      .from("draw_entries")
      .insert({
        draw_id: drawId,
        user_id: userId,
        entry_count: bonusEntries,
        entry_method: "loyalty_bonus",
        metadata: { tier: userTier },
      })
      .select()
      .single();

    await this.createTickets(drawId, userId, entry.id, bonusEntries);

    return bonusEntries;
  }

  /**
   * Get entry leaderboard for live display
   */
  async getEntryLeaderboard(drawId: string, limit: number = 20) {
    const { data } = await this.supabase
      .from("draw_entries")
      .select("user_id, profiles!user_id(full_name), entry_count")
      .eq("draw_id", drawId)
      .order("entry_count", { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Update draw phase with logging
   */
  async updateDrawPhase(
    drawId: string,
    newStatus: string,
    triggeredBy?: string,
  ): Promise<void> {
    const { data: old } = await this.supabase
      .from("draws")
      .select("status")
      .eq("id", drawId)
      .single();

    await this.supabase.from("draw_phase_logs").insert({
      draw_id: drawId,
      phase_from: old?.status,
      phase_to: newStatus,
      triggered_by: triggeredBy,
      triggered_at: new Date().toISOString(),
    });

    await this.supabase
      .from("draws")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", drawId);
  }

  /**
   * Redraw if winner doesn't claim
   */
  async redrawUnclaimed(
    drawId: string,
    triggeredBy?: string,
  ): Promise<{ newWinner: any; oldWinner: any }> {
    // Get unclaimed winner
    const { data: unclaimedWinner } = await this.supabase
      .from("draw_winners")
      .select("*, profiles!user_id(full_name, email)")
      .eq("draw_id", drawId)
      .eq("claim_status", "pending")
      .lt("expires_at", new Date().toISOString())
      .single();

    if (!unclaimedWinner) {
      throw new Error("No unclaimed winners found");
    }

    // Mark as expired
    await this.supabase
      .from("draw_winners")
      .update({ claim_status: "expired" })
      .eq("id", unclaimedWinner.id);

    // Remove winner's tickets
    await this.supabase
      .from("draw_tickets")
      .update({ is_winner: false, winner_rank: null })
      .eq("draw_id", drawId)
      .eq("user_id", unclaimedWinner.user_id);

    // Update draw redraw count
    const { data: draw } = await this.supabase
      .from("draws")
      .select("redraw_count, max_redraws, prize_name, prize_value")
      .eq("id", drawId)
      .single();

    if (draw?.redraw_count >= draw?.max_redraws) {
      await this.updateDrawPhase(drawId, "completed", triggeredBy);
      return { newWinner: null, oldWinner: unclaimedWinner };
    }

    // Re-run draw for remaining tickets
    await this.supabase
      .from("draws")
      .update({ redraw_count: draw?.redraw_count + 1 })
      .eq("id", drawId);

    // Get remaining tickets
    const { data: remainingTickets } = await this.supabase
      .from("draw_tickets")
      .select("id, user_id, profiles!user_id(full_name, email)")
      .eq("draw_id", drawId)
      .eq("is_winner", false);

    if (!remainingTickets || remainingTickets.length === 0) {
      return { newWinner: null, oldWinner: unclaimedWinner };
    }

    // Select new winner
    const shuffled = [...remainingTickets];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const newWinner = shuffled[0];

    // Record new winner
    await this.supabase
      .from("draw_tickets")
      .update({ is_winner: true, winner_rank: 1 })
      .eq("id", newWinner.id);

    await this.supabase.from("draw_winners").insert({
      draw_id: drawId,
      user_id: newWinner.user_id,
      winner_rank: 1,
      prize_name: draw?.prize_name,
      prize_value: draw?.prize_value,
      claim_status: "pending",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Record redraw history
    await this.supabase.from("draw_redraw_history").insert({
      draw_id: drawId,
      previous_winner_id: unclaimedWinner.user_id,
      new_winner_id: newWinner.user_id,
      reason: "unclaimed",
      redrawn_at: new Date().toISOString(),
    });

    // Update draw status
    await this.supabase
      .from("draws")
      .update({
        winner_id: newWinner.user_id,
        winner_announced_at: new Date().toISOString(),
      })
      .eq("id", drawId);

    return { newWinner, oldWinner: unclaimedWinner };
  }

  /**
   * Award consolation points to all participants
   */
  async awardConsolationPoints(drawId: string): Promise<number> {
    const { data: draw } = await this.supabase
      .from("draws")
      .select("consolation_points_amount, consolation_points_awarded")
      .eq("id", drawId)
      .single();

    if (draw?.consolation_points_awarded) {
      return 0;
    }

    // Get all participants who didn't win
    const { data: winners } = await this.supabase
      .from("draw_winners")
      .select("user_id")
      .eq("draw_id", drawId);

    const winnerIds = winners?.map((w) => w.user_id) || [];

    const { data: participants } = await this.supabase
      .from("draw_entries")
      .select("user_id")
      .eq("draw_id", drawId)
      .not("user_id", "in", `(${winnerIds.join(",")})`);

    const uniqueParticipants = [
      ...new Map(participants?.map((p) => [p.user_id, p])).values(),
    ];

    // Award points
    for (const participant of uniqueParticipants) {
      await this.awardPoints(
        participant.user_id,
        draw?.consolation_points_amount,
        `draw_consolation_${drawId}`,
      );
    }

    // Mark as awarded
    await this.supabase
      .from("draws")
      .update({ consolation_points_awarded: true })
      .eq("id", drawId);

    return uniqueParticipants.length * draw?.consolation_points_amount;
  }

  // Referral entries are added when a referral is marked as converted, so
  // this function is called from the referrals service after marking a referral as converted.
  // It checks the draw config for referral entries, awards them if applicable, and records the
  // entries and tickets.
  async addReferralEntries(
    drawId: string,
    userId: string,
    referralId: string,
  ): Promise<number> {
    const { data: draw } = await this.supabase
      .from("draws")
      .select("entry_config, status")
      .eq("id", drawId)
      .single();

    if (draw?.status !== "open") return 0;

    const config = draw.entry_config as EntryConfig;
    const referralConfig = config.referral;

    if (!referralConfig) return 0;

    let entries = referralConfig.entries_per_referral || 5;

    // Check if first referral
    const { count: existingReferrals } = await this.supabase
      .from("draw_entries")
      .select("id", { count: "exact", head: true })
      .eq("draw_id", drawId)
      .eq("user_id", userId)
      .eq("entry_method", "referral");

    if (existingReferrals === 0 && referralConfig.bonus_for_first_referral) {
      entries += referralConfig.bonus_for_first_referral;
    }

    // Record entries
    const { data: entry } = await this.supabase
      .from("draw_entries")
      .insert({
        draw_id: drawId,
        user_id: userId,
        entry_count: entries,
        entry_method: "referral",
        source_id: referralId,
        metadata: { referral_id: referralId },
      })
      .select()
      .single();

    await this.createTickets(drawId, userId, entry.id, entries);

    // Update referral record to mark draw entries awarded
    await this.supabase
      .from("referrals")
      .update({
        draw_entries_awarded: true,
        draw_entries_count: entries,
        draw_id: drawId,
      })
      .eq("id", referralId);

    // Add to live ticker
    const { data: profile } = await this.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    await this.supabase.from("draw_live_ticker").insert({
      draw_id: drawId,
      user_name: profile?.full_name || "Customer",
      entry_count: entries,
      entry_method: "referral",
    });

    return entries;
  }

  private async createTickets(
    drawId: string,
    userId: string,
    entryId: string,
    count: number,
  ): Promise<void> {
    const tickets = [];
    const { data: lastTicket } = await this.supabase
      .from("draw_tickets")
      .select("ticket_number")
      .eq("draw_id", drawId)
      .order("ticket_number", { ascending: false })
      .limit(1)
      .single();

    let nextNumber = (lastTicket?.ticket_number || 0) + 1;

    for (let i = 0; i < count; i++) {
      tickets.push({
        draw_id: drawId,
        user_id: userId,
        entry_id: entryId,
        ticket_number: nextNumber + i,
      });
    }

    await this.supabase.from("draw_tickets").insert(tickets);
  }

  /**
   * Get all open draws
   */
  async getOpenDraws(userId?: string): Promise<Draw[]> {
    const now = new Date().toISOString();
    let query = this.supabase
      .from("draws")
      .select("*")
      .eq("status", "open")
      .lte("entry_starts_at", now)
      .gte("entry_ends_at", now)
      .order("draw_time", { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    // If userId provided, augment with user's entry count
    if (userId && data) {
      for (const draw of data) {
        const { count } = await this.supabase
          .from("draw_entries")
          .select("id", { count: "exact", head: true })
          .eq("draw_id", draw.id)
          .eq("user_id", userId);
        (draw as any).user_entry_count = count || 0;
      }
    }

    return data || [];
  }

  /**
   * Get draw by ID with user entry status
   */
  async getDraw(
    drawId: string,
    userId?: string,
  ): Promise<Draw & { userEntries?: number; userTickets?: number }> {
    const { data: draw, error } = await this.supabase
      .from("draws")
      .select("*")
      .eq("id", drawId)
      .single();

    if (error) throw error;

    if (userId) {
      const { count: entriesCount } = await this.supabase
        .from("draw_entries")
        .select("id", { count: "exact", head: true })
        .eq("draw_id", drawId)
        .eq("user_id", userId);

      const { count: ticketsCount } = await this.supabase
        .from("draw_tickets")
        .select("id", { count: "exact", head: true })
        .eq("draw_id", drawId)
        .eq("user_id", userId);

      return {
        ...draw,
        userEntries: entriesCount || 0,
        userTickets: ticketsCount || 0,
      };
    }

    return draw;
  }

  /**
   * Get entry stats for live display
   */
  async getEntryStats(drawId: string): Promise<Record<string, number>> {
    const { data } = await this.supabase
      .from("draw_entries")
      .select("entry_method, entry_count")
      .eq("draw_id", drawId);

    const stats: Record<string, number> = {};
    data?.forEach((entry) => {
      stats[entry.entry_method] =
        (stats[entry.entry_method] || 0) + entry.entry_count;
    });

    return stats;
  }

  /**
   * Get total entries count
   */
  async getTotalEntries(drawId: string): Promise<number> {
    const { count } = await this.supabase
      .from("draw_entries")
      .select("id", { count: "exact", head: true })
      .eq("draw_id", drawId);
    return count || 0;
  }

  /**
   * Get live ticker items
   */
  async getLiveTicker(drawId: string, limit: number = 30) {
    const { data } = await this.supabase
      .from("draw_live_ticker")
      .select("*")
      .eq("draw_id", drawId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Add entry via purchase (to be called from order completion)
   */
  async addPurchaseEntries(
    drawId: string,
    userId: string,
    orderId: string,
    orderAmount: number,
  ): Promise<number> {
    const { data: draw, error: drawError } = await this.supabase
      .from("draws")
      .select("entry_config, max_entries_per_user, max_entries_total, status")
      .eq("id", drawId)
      .single();

    if (drawError) throw drawError;
    if (draw.status !== "open") throw new Error("Draw is not open for entries");

    const config = draw.entry_config as EntryConfig;
    const purchaseConfig = config.purchase;

    if (!purchaseConfig) return 0;
    if (orderAmount < (purchaseConfig.min_amount || 0)) return 0;

    // Calculate entries based on amount spent
    let entries = Math.floor(
      orderAmount * (purchaseConfig.entries_per_ksh || 1),
    );

    // Check per-user limit
    if (draw.max_entries_per_user) {
      const { count: userEntries } = await this.supabase
        .from("draw_entries")
        .select("id", { count: "exact", head: true })
        .eq("draw_id", drawId)
        .eq("user_id", userId);

      const remaining = draw.max_entries_per_user - (userEntries || 0);
      entries = Math.min(entries, remaining);
    }

    // Check global limit
    if (draw.max_entries_total) {
      const { count: totalEntries } = await this.supabase
        .from("draw_entries")
        .select("id", { count: "exact", head: true })
        .eq("draw_id", drawId);

      const remainingGlobal = draw.max_entries_total - (totalEntries || 0);
      entries = Math.min(entries, remainingGlobal);
    }

    if (entries <= 0) return 0;

    // Record entries
    const { data: entry, error: entryError } = await this.supabase
      .from("draw_entries")
      .insert({
        draw_id: drawId,
        user_id: userId,
        entry_count: entries,
        entry_method: "purchase",
        source_id: orderId,
        metadata: { order_amount: orderAmount },
      })
      .select()
      .single();

    if (entryError) throw entryError;

    // Create individual tickets
    await this.createTickets(drawId, userId, entry.id, entries);

    // Add to live ticker
    const { data: profile } = await this.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    await this.supabase.from("draw_live_ticker").insert({
      draw_id: drawId,
      user_name: profile?.full_name || "Customer",
      entry_count: entries,
      entry_method: "purchase",
    });

    return entries;
  }

  /**
   * Perform the draw and select winners
   */
  async performDraw(
    drawId: string,
  ): Promise<{ winners: any[]; totalTickets: number }> {
    // Check draw status
    const { data: draw, error: drawError } = await this.supabase
      .from("draws")
      .select("*")
      .eq("id", drawId)
      .single();

    if (drawError) throw drawError;
    if (draw.status !== "closed" && draw.status !== "open") {
      throw new Error("Draw is not ready for drawing");
    }

    // Update status to drawing
    await this.supabase
      .from("draws")
      .update({ status: "drawing" })
      .eq("id", drawId);

    // Get all tickets with user profiles
    const { data: tickets, error: ticketsError } = await this.supabase
      .from("draw_tickets")
      .select("id, user_id, ticket_number, profiles:user_id(full_name, email)")
      .eq("draw_id", drawId)
      .order("ticket_number");

    if (ticketsError) throw ticketsError;

    const totalTickets = tickets.length;
    if (totalTickets === 0) {
      await this.supabase
        .from("draws")
        .update({ status: "completed" })
        .eq("id", drawId);
      return { winners: [], totalTickets: 0 };
    }

    // Shuffle and select winners
    const shuffled = [...tickets];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Select top 3 as winners
    const winners = shuffled.slice(0, Math.min(3, shuffled.length));

    // Record winners
    for (let i = 0; i < winners.length; i++) {
      const winner = winners[i];
      const rank = i + 1;

      await this.supabase
        .from("draw_tickets")
        .update({ is_winner: true, winner_rank: rank })
        .eq("id", winner.id);

      await this.supabase.from("draw_winners").insert({
        draw_id: drawId,
        user_id: winner.user_id,
        winner_rank: rank,
        prize_name:
          rank === 1 ? draw.prize_name : `${draw.prize_name} - Runner Up`,
        prize_value:
          rank === 1
            ? draw.prize_value
            : draw.prize_value
              ? draw.prize_value * 0.3
              : null,
        claim_status: "pending",
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });
    }

    // After recording winners, send notifications using the existing system
    for (let i = 0; i < winners.length; i++) {
      const winner = winners[i];
      const rank = i + 1;

      // Get user details
      const { data: user } = await this.supabase
        .from("users")
        .select("email, full_name")
        .eq("id", winner.user_id)
        .single();

      if (user) {
        const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL}/draws/${drawId}/claim?winner=${winner.id}`;
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Create in-app notification
        await this.supabase.rpc("create_notification", {
          p_user_id: winner.user_id,
          p_type: rank === 1 ? "draw_win" : "draw_runner_up",
          p_title:
            rank === 1
              ? `🎉 Congratulations! You won ${draw.name}!`
              : `🎉 You're a runner-up in ${draw.name}!`,
          p_message:
            rank === 1
              ? `You've won ${draw.prize_name}! Click to claim your prize before ${expiresAt.toLocaleDateString()}.`
              : `You've won ${draw.prize_name} as a runner-up! Click to claim your prize.`,
          p_metadata: {
            draw_id: drawId,
            draw_name: draw.name,
            prize_name: draw.prize_name,
            prize_value: draw.prize_value,
            winner_rank: rank,
            claim_url: claimUrl,
            expires_at: expiresAt.toISOString(),
          },
        });

        // Queue email notification
        await this.queueEmailNotification(
          user.email,
          user.full_name,
          draw,
          rank,
          claimUrl,
          expiresAt,
        );
      }
    }

    // Award consolation points and send notifications to non-winners
    if (draw.consolation_points_amount > 0) {
      const { data: allParticipants } = await this.supabase
        .from("draw_entries")
        .select("user_id")
        .eq("draw_id", drawId);

      const winnerIds = winners.map((w) => w.user_id);
      const nonWinners = (allParticipants || [])
        .map((p) => p.user_id)
        .filter((id) => !winnerIds.includes(id));

      // Deduplicate
      const uniqueNonWinners = [...new Set(nonWinners)];

      for (const userId of uniqueNonWinners) {
        // Award points
        await this.awardPoints(
          userId,
          draw.consolation_points_amount,
          `draw_consolation_${drawId}`,
        );

        // Send consolation notification
        await this.supabase.rpc("create_notification", {
          p_user_id: userId,
          p_type: "draw_consolation",
          p_title: `💝 Thanks for participating in ${draw.name}!`,
          p_message: `You've received ${draw.consolation_points_amount} loyalty points for being part of the draw.`,
          p_metadata: {
            draw_id: drawId,
            draw_name: draw.name,
            points_awarded: draw.consolation_points_amount,
          },
        });
      }
    }

    // Update draw status
    await this.supabase
      .from("draws")
      .update({
        status: "completed",
        winner_id: winners[0]?.user_id,
        winner_announced_at: new Date().toISOString(),
        winner_claim_expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      })
      .eq("id", drawId);

    return { winners, totalTickets };
  }

  /**
   * Claim a prize
   */
  async claimPrize(drawId: string, userId: string): Promise<void> {
    const { data: winner, error } = await this.supabase
      .from("draw_winners")
      .select("*")
      .eq("draw_id", drawId)
      .eq("user_id", userId)
      .eq("claim_status", "pending")
      .single();

    if (error || !winner) {
      throw new Error("No pending prize found");
    }

    if (new Date(winner.expires_at) < new Date()) {
      await this.supabase
        .from("draw_winners")
        .update({ claim_status: "expired" })
        .eq("id", winner.id);
      throw new Error("Prize claim has expired");
    }

    await this.supabase
      .from("draw_winners")
      .update({
        claim_status: "claimed",
        claimed_at: new Date().toISOString(),
      })
      .eq("id", winner.id);
  }

  private async awardPoints(
    userId: string,
    points: number,
    source: string,
  ): Promise<void> {
    await this.supabase.rpc("award_points", {
      p_user_id: userId,
      p_points: points,
      p_source: source,
    });
  }

  // Helper method to queue email notifications
  private async queueEmailNotification(
    email: string,
    userName: string,
    draw: any,
    rank: number,
    claimUrl: string,
    expiresAt: Date,
  ): Promise<void> {
    const subject =
      rank === 1
        ? `🎉 Congratulations! You won ${draw.name}!`
        : `🎉 You're a winner in ${draw.name}!`;

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .prize { font-size: 24px; font-weight: bold; color: #8B5CF6; margin: 20px 0; }
        .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
        .expiry { color: #ef4444; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${rank === 1 ? "🎉 Grand Prize Winner! 🎉" : "🏆 Runner Up! 🏆"}</h1>
        </div>
        <div class="content">
          <h2>Congratulations, ${userName}!</h2>
          <p>Great news! You've been selected as ${rank === 1 ? "the grand prize winner" : `a runner-up`} of <strong>${draw.name}</strong>.</p>
          <div class="prize">🏆 ${draw.prize_name} 🏆</div>
          <p>To claim your prize, click the button below:</p>
          <div style="text-align: center;">
            <a href="${claimUrl}" class="button">Claim My Prize</a>
          </div>
          <p class="expiry">⚠️ This claim link expires on ${expiresAt.toLocaleDateString()}.</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Your Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    // Queue email in your email_queue table
    await this.supabase.from("email_queue").insert({
      to_email: email,
      to_name: userName,
      subject,
      html_content: emailHtml,
      text_content: `Congratulations ${userName}! You won ${draw.prize_name} in ${draw.name}. Claim your prize here: ${claimUrl}`,
      metadata: { type: "draw_win", draw_id: draw.id, winner_rank: rank },
      scheduled_for: new Date().toISOString(),
    });
  }

  // Add reminder notifications
  async sendDrawReminders(drawId: string): Promise<void> {
    const { data: draw } = await this.supabase
      .from("draws")
      .select("*")
      .eq("id", drawId)
      .single();

    if (!draw || draw.status !== "open") return;

    const drawTime = new Date(draw.draw_time);
    const hoursUntilDraw = (drawTime.getTime() - Date.now()) / (1000 * 60 * 60);

    // Send reminder if draw is within 24 hours
    if (hoursUntilDraw <= 24 && hoursUntilDraw > 0) {
      // Use the RPC function to get participants with their total entries
      const { data: participants, error } = await this.supabase.rpc(
        "get_draw_participants_with_entries",
        {
          draw_id_param: drawId,
        },
      );

      if (error) {
        console.error("Error fetching participants:", error);
        return;
      }

      for (const participant of participants || []) {
        await this.supabase.rpc("create_notification", {
          p_user_id: participant.user_id,
          p_type: "draw_reminder",
          p_title: `⏰ ${draw.name} drawing soon!`,
          p_message: `The draw for ${draw.name} happens in ${Math.round(hoursUntilDraw)} hours. You have ${participant.total_entries} entries. Good luck!`,
          p_metadata: {
            draw_id: drawId,
            draw_name: draw.name,
            draw_time: draw.draw_time,
            user_entries: participant.total_entries,
          },
        });
      }
    }
  }
}
