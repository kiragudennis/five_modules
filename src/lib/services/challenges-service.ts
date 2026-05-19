// src/lib/services/challenges-service.ts (Enhanced Version)

import { SupabaseClient } from "@supabase/supabase-js";
import {
  Challenge,
  ChallengeParticipant,
  ChallengeTeam,
  TrackedUser,
  ScoringConfig,
} from "@/types/challenges";
import { PointsService } from "./points-service";
import { NotificationService } from "./notification-service";

export class ChallengesService {
  private cache = new Map();
  private cacheTimeout = 5000; // 5 seconds
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all active challenges for a user
   */
  async getActiveChallenges(userId: string): Promise<Challenge[]> {
    const now = new Date().toISOString();

    const { data: challenges, error } = await this.supabase
      .from("challenges")
      .select("*")
      .eq("status", "active")
      .lte("starts_at", now)
      .gte("ends_at", now)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Filter challenges user hasn't maxed out on
    const available: Challenge[] = [];

    for (const challenge of challenges || []) {
      const { data: participant } = await this.supabase
        .from("challenge_participants")
        .select("id")
        .eq("challenge_id", challenge.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (!participant) {
        available.push(challenge);
      }
    }

    return available;
  }

  /**
   * Get user's active challenges (joined)
   */
  async getUserChallenges(
    userId: string,
  ): Promise<(Challenge & { participant: ChallengeParticipant })[]> {
    const { data: participants, error } = await this.supabase
      .from("challenge_participants")
      .select("*, challenges(*)")
      .eq("user_id", userId)
      .in("challenges.status", ["active", "paused"]);

    if (error) throw error;

    return (participants || []).map((p: any) => ({
      ...p.challenges,
      participant: p,
    }));
  }

  /**
   * Join a challenge
   */
  async joinChallenge(
    challengeId: string,
    userId: string,
    teamId?: string,
  ): Promise<void> {
    // Check if challenge is active
    const { data: challenge, error: challengeError } = await this.supabase
      .from("challenges")
      .select("status, starts_at, ends_at, allow_teams, max_team_size, name")
      .eq("id", challengeId)
      .single();

    if (challengeError) throw challengeError;

    const now = new Date();
    if (
      challenge.status !== "active" ||
      now < new Date(challenge.starts_at) ||
      now > new Date(challenge.ends_at)
    ) {
      throw new Error("Challenge is not currently active");
    }

    // Check if already joined
    const { data: existing } = await this.supabase
      .from("challenge_participants")
      .select("id")
      .eq("challenge_id", challengeId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      throw new Error("Already joined this challenge");
    }

    // Handle team joining
    if (teamId && challenge.allow_teams) {
      const { data: team, error: teamError } = await this.supabase
        .from("challenge_teams")
        .select("member_count, max_team_size")
        .eq("id", teamId)
        .single();

      if (
        teamError ||
        (challenge.max_team_size &&
          team.member_count >= challenge.max_team_size)
      ) {
        throw new Error("Team is full");
      }

      await this.supabase
        .from("challenge_teams")
        .update({ member_count: team.member_count + 1 })
        .eq("id", teamId);
    }

    // Join challenge
    await this.supabase.from("challenge_participants").insert({
      challenge_id: challengeId,
      user_id: userId,
      team_id: teamId || null,
      current_score: 0,
      joined_at: now.toISOString(),
    });

    // Send notification
    const notificationService = new NotificationService(this.supabase);
    await notificationService.sendInAppNotification(
      userId,
      "challenge_joined",
      `🎯 You've joined ${challenge.name}!`,
      `Start earning points by completing actions. Good luck!`,
      { challenge_id: challengeId, challenge_name: challenge.name },
    );

    // Add to live ticker
    const { data: user } = await this.supabase
      .from("users")
      .select("full_name")
      .eq("id", userId)
      .single();

    await this.supabase.from("challenge_live_ticker").insert({
      challenge_id: challengeId,
      user_name: user?.full_name || "Someone",
      action_text: `joined the challenge`,
      points_awarded: 0,
    });
  }

  /**
   * Record a qualifying action and award points
   */
  async recordAction(
    challengeId: string,
    userId: string,
    actionType: string,
    actionValue?: number,
    metadata?: any,
  ): Promise<{ pointsAwarded: number; newScore: number }> {
    // Get challenge and participant
    const { data: challenge, error: challengeError } = await this.supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (challengeError) throw challengeError;

    const { data: participant, error: participantError } = await this.supabase
      .from("challenge_participants")
      .select("*")
      .eq("challenge_id", challengeId)
      .eq("user_id", userId)
      .single();

    if (participantError || !participant) {
      throw new Error("Not enrolled in this challenge");
    }

    // Calculate points based on challenge type
    let pointsAwarded = await this.calculatePoints(
      challenge,
      actionType,
      actionValue,
      metadata,
      participant.current_streak,
    );

    if (pointsAwarded === 0)
      return { pointsAwarded: 0, newScore: participant.current_score };

    // Apply multiplier for final hour if applicable
    const now = new Date();
    const end = new Date(challenge.ends_at);
    const hoursLeft = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursLeft <= 1 && hoursLeft > 0) {
      pointsAwarded = pointsAwarded * 2;
    }

    // Update streak if applicable
    let newStreak = participant.current_streak;
    let newBestStreak = participant.best_streak;

    if (challenge.challenge_type === "streak") {
      const today = new Date().toISOString().split("T")[0];
      const lastDate = participant.last_streak_date;

      if (!lastDate) {
        newStreak = 1;
      } else {
        const lastDay = new Date(lastDate);
        const daysDiff = Math.floor(
          (new Date().getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysDiff === 1) {
          newStreak = participant.current_streak + 1;
        } else if (daysDiff > 1 && !challenge.streak_reset_on_miss) {
          newStreak = 1;
        } else if (daysDiff > 1 && challenge.streak_reset_on_miss) {
          newStreak = 0;
          pointsAwarded = 0; // No points for broken streak
        }
      }

      newBestStreak = Math.max(newStreak, participant.best_streak);

      // Bonus for streak milestones
      const streakBonus = (
        challenge.scoring_config as any
      )?.bonus_at_streak?.find((b: any) => b.streak === newStreak);
      if (streakBonus) {
        pointsAwarded += streakBonus.bonus;
      }
    }

    // Award points
    if (pointsAwarded > 0) {
      await PointsService.award(
        this.supabase,
        userId,
        pointsAwarded,
        "challenge_action",
        challengeId,
        `Challenge ${challenge.name} - ${actionType}`,
      );
    }

    // Record action
    await this.supabase.from("challenge_actions").insert({
      challenge_id: challengeId,
      user_id: userId,
      team_id: participant.team_id,
      action_type: actionType,
      points_awarded: pointsAwarded,
      action_value: actionValue,
      action_metadata: metadata,
    });

    // Update participant score
    const newScore = participant.current_score + pointsAwarded;

    await this.supabase
      .from("challenge_participants")
      .update({
        current_score: newScore,
        last_action_at: new Date().toISOString(),
        current_streak: newStreak,
        best_streak: newBestStreak,
        last_streak_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", participant.id);

    // Update team score if applicable
    if (participant.team_id) {
      await this.supabase.rpc("increment_team_score", {
        p_team_id: participant.team_id,
        p_points: pointsAwarded,
      });
    }

    // Check if user's rank changed and send notification
    const oldRank = participant.current_rank;
    const { rank: newRank } = await this.getUserRank(challengeId, userId);

    if (oldRank !== newRank && newRank > 0) {
      const notificationService = new NotificationService(this.supabase);
      if (newRank < (oldRank || 999)) {
        notificationService.sendInAppNotification(
          userId,
          "rank_improved",
          `📈 You moved up to #${newRank}!`,
          `You're now rank ${newRank} in ${challenge.name}. Keep going!`,
          {
            challenge_id: challengeId,
            challenge_name: challenge.name,
            old_rank: oldRank,
            new_rank: newRank,
          },
        );
      }
    }

    // Add to live ticker
    const { data: user } = await this.supabase
      .from("users")
      .select("full_name")
      .eq("id", userId)
      .single();

    const { data: team } = participant.team_id
      ? await this.supabase
          .from("challenge_teams")
          .select("team_name")
          .eq("id", participant.team_id)
          .single()
      : { data: null };

    await this.supabase.from("challenge_live_ticker").insert({
      challenge_id: challengeId,
      user_name: user?.full_name || "Someone",
      team_name: team?.team_name,
      action_text: this.getActionText(actionType, actionValue),
      points_awarded: pointsAwarded,
    });

    // Recalculate ranks
    await this.recalculateRanks(challengeId);

    return { pointsAwarded, newScore };
  }

  /**
   * Calculate points based on challenge configuration
   */
  private async calculatePoints(
    challenge: Challenge,
    actionType: string,
    actionValue?: number,
    metadata?: any,
    currentStreak?: number,
  ): Promise<number> {
    const config = challenge.scoring_config as ScoringConfig;

    switch (challenge.challenge_type) {
      case "referral":
        if (actionType === "referral_completed") {
          let points = config.points_per_referral || 100;
          // Bonus for top referrer
          if (config.bonus_for_top_referrer && metadata?.is_top_referrer) {
            points += config.bonus_for_top_referrer;
          }
          return points;
        }
        break;

      case "purchase":
        if (actionType === "purchase_made" && actionValue) {
          let points = Math.floor(actionValue * (config.points_per_ksh || 1));

          // Check if within double points window
          if (config.double_points_hours) {
            const hour = new Date().getHours();
            if (config.double_points_hours.includes(hour)) {
              points = points * 2;
            }
          }

          // Bonus at thresholds
          if (config.bonus_at_thresholds) {
            for (const threshold of config.bonus_at_thresholds) {
              if (actionValue >= threshold.threshold) {
                points += threshold.bonus_points;
              }
            }
          }
          return points;
        }
        break;

      case "share":
        if (actionType === "share_posted") {
          let points = config.points_per_share || 50;
          // Platform bonus
          if (
            metadata?.platform &&
            config.platform_bonus?.[metadata.platform]
          ) {
            points += config.platform_bonus[metadata.platform];
          }
          return points;
        }
        break;

      case "streak":
        if (actionType === "daily_login") {
          return config.points_per_day || 50;
        }
        break;

      case "combo":
        if (actionType) {
          // Type-safe weights access
          const weights = config.weights;
          let weight = 1;

          if (weights) {
            switch (actionType) {
              case "referral":
                weight = weights.referral || 1;
                break;
              case "purchase":
                weight = weights.purchase || 1;
                break;
              case "share":
                weight = weights.share || 1;
                break;
              case "streak":
                weight = weights.streak || 1;
                break;
              default:
                weight = 1;
            }
          }

          const basePoints = (actionValue || 100) * weight;
          // Apply combo multiplier based on consecutive actions
          const comboMultiplier = Math.min(
            2,
            1 + (metadata?.combo_count || 0) * 0.1,
          );
          return Math.floor(
            basePoints * (config.combo_multiplier || 1) * comboMultiplier,
          );
        }
        break;

      case "social":
        if (actionType === "social_hashtag") {
          let points = config.points_per_hashtag || 75;
          // Bonus for verified posts
          if (metadata?.verified) {
            points += config.bonus_for_verified || 25;
          }
          return points;
        }
        break;
    }

    return 0;
  }

  /**
   * Get leaderboard for a challenge with real-time rank changes
   */
  async getLeaderboard(
    challengeId: string,
    limit: number = 50,
    teamMode: boolean = false,
  ): Promise<any[]> {
    const cacheKey = `leaderboard-${challengeId}`;
    const cached = this.cache.get(cacheKey);

    if (
      teamMode &&
      cached &&
      Date.now() - cached.timestamp < this.cacheTimeout
    ) {
      return cached.teams_data;
    } else if (
      !teamMode &&
      cached &&
      Date.now() - cached.timestamp < this.cacheTimeout
    ) {
      return cached.participants_data;
    }

    if (teamMode) {
      const { data: teams } = await this.supabase
        .from("challenge_teams")
        .select("*")
        .eq("challenge_id", challengeId)
        .order("current_score", { ascending: false })
        .limit(limit);

      this.cache.set(cacheKey, {
        teams_data: teams,
        timestamp: Date.now(),
      });
      return teams || [];
    }

    const { data: participants } = await this.supabase
      .from("challenge_participants")
      .select("*, users!user_id(full_name, avatar_url)")
      .eq("challenge_id", challengeId)
      .order("current_score", { ascending: false })
      .limit(limit);

    this.cache.set(cacheKey, {
      participants_data: participants,
      timestamp: Date.now(),
    });

    return participants || [];
  }

  /**
   * Get user's position in leaderboard with points needed to overtake next player
   */
  async getUserRank(
    challengeId: string,
    userId: string,
  ): Promise<{ rank: number; score: number; pointsToNext: number }> {
    const { data: participants } = await this.supabase
      .from("challenge_participants")
      .select("user_id, current_score")
      .eq("challenge_id", challengeId)
      .order("current_score", { ascending: false });

    const userIndex = (participants || []).findIndex(
      (p) => p.user_id === userId,
    );

    if (userIndex === -1) {
      return { rank: 0, score: 0, pointsToNext: 0 };
    }

    const pointsToNext =
      userIndex > 0
        ? Math.max(
            0,
            (participants?.[userIndex - 1]?.current_score || 0) -
              (participants?.[userIndex]?.current_score || 0) +
              1,
          )
        : 0;

    return {
      rank: userIndex + 1,
      score: (participants && participants[userIndex].current_score) || 0,
      pointsToNext,
    };
  }

  /**
   * "Catch Them" feature - track a specific competitor
   */
  async trackCompetitor(
    challengeId: string,
    trackerUserId: string,
    trackedUserId: string,
  ): Promise<void> {
    // Check if tracking already exists
    const { data: existing } = await this.supabase
      .from("challenge_tracking")
      .select("id")
      .eq("challenge_id", challengeId)
      .eq("tracker_user_id", trackerUserId)
      .eq("tracked_user_id", trackedUserId)
      .maybeSingle();

    if (!existing) {
      await this.supabase.from("challenge_tracking").insert({
        challenge_id: challengeId,
        tracker_user_id: trackerUserId,
        tracked_user_id: trackedUserId,
      });
    }
  }

  /**
   * Get tracked competitor status with real-time updates
   */
  async getTrackedCompetitor(
    challengeId: string,
    trackerUserId: string,
  ): Promise<TrackedUser | null> {
    const { data: tracking } = await this.supabase
      .from("challenge_tracking")
      .select("tracked_user_id")
      .eq("challenge_id", challengeId)
      .eq("tracker_user_id", trackerUserId)
      .maybeSingle();

    if (!tracking) return null;

    // Get competitor's current position and score
    const { data: competitor } = await this.supabase
      .from("challenge_participants")
      .select("current_score, users!user_id(full_name, avatar_url)")
      .eq("challenge_id", challengeId)
      .eq("user_id", tracking.tracked_user_id)
      .single();

    const trackerRank = await this.getUserRank(challengeId, trackerUserId);
    const competitorRank = await this.getUserRank(
      challengeId,
      tracking.tracked_user_id,
    );

    return {
      user_id: tracking.tracked_user_id,
      full_name: competitor?.users?.full_name || "Competitor",
      current_score: competitor?.current_score || 0,
      current_rank: competitorRank.rank,
      points_needed_to_overtake: Math.max(
        0,
        (competitor?.current_score || 0) - trackerRank.score + 1,
      ),
      avatar_url: competitor?.users?.avatar_url || null,
    };
  }

  async getLiveTicker(challengeId: string, limit: number = 20): Promise<any> {
    const cacheKey = `ticker-${challengeId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 2000) {
      // 2 second cache for ticker
      return cached.data;
    }

    const { data, error } = await this.supabase
      .from("challenge_live_ticker")
      .select("*")
      .eq("challenge_id", challengeId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    this.cache.set(cacheKey, {
      data: data || [],
      timestamp: Date.now(),
    });

    return data || [];
  }

  /**
   * Create a team (for team challenges)
   */
  async createTeam(
    challengeId: string,
    teamLeaderId: string,
    teamName: string,
  ): Promise<ChallengeTeam> {
    // Generate unique team code
    const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: team, error } = await this.supabase
      .from("challenge_teams")
      .insert({
        challenge_id: challengeId,
        team_leader_id: teamLeaderId,
        team_name: teamName,
        team_code: teamCode,
        member_count: 1,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-join the leader to their team
    await this.joinChallenge(challengeId, teamLeaderId, team.id);

    return team;
  }

  /**
   * Join a team by code
   */
  async joinTeamByCode(teamCode: string, userId: string): Promise<void> {
    const { data: team, error } = await this.supabase
      .from("challenge_teams")
      .select("*")
      .eq("team_code", teamCode.toUpperCase())
      .single();

    if (error || !team) throw new Error("Team not found");

    await this.joinChallenge(team.challenge_id, userId, team.id);
  }

  /**
   * Subscribe to real-time challenge updates
   */
  subscribeToChallengeUpdates(
    challengeId: string,
    callbacks: {
      onLeaderboardUpdate?: (leaderboard: any[]) => void;
      onTickerUpdate?: (ticker: any) => void;
      onRankChange?: (userId: string, oldRank: number, newRank: number) => void;
    },
  ) {
    const channel = this.supabase.channel(`challenge-${challengeId}`);

    // Listen for participant score changes
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "challenge_participants",
        filter: `challenge_id=eq.${challengeId}`,
      },
      async (payload) => {
        if (callbacks.onLeaderboardUpdate) {
          const leaderboard = await this.getLeaderboard(challengeId);
          callbacks.onLeaderboardUpdate(leaderboard);
        }
      },
    );

    // Listen for new ticker items
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "challenge_live_ticker",
        filter: `challenge_id=eq.${challengeId}`,
      },
      (payload) => {
        if (callbacks.onTickerUpdate) {
          callbacks.onTickerUpdate(payload.new);
        }
      },
    );

    channel.subscribe();
    return () => channel.unsubscribe();
  }

  /**
   * Admin: Force recalculate all ranks
   */
  async recalculateRanks(challengeId: string): Promise<void> {
    await this.supabase.rpc("recalculate_challenge_ranks", {
      p_challenge_id: challengeId,
    });
  }

  /**
   * Admin: Manually adjust a participant's score
   */
  async adminAdjustScore(
    challengeId: string,
    userId: string,
    adjustment: number,
    reason: string,
  ): Promise<void> {
    const { data: participant } = await this.supabase
      .from("challenge_participants")
      .select("current_score")
      .eq("challenge_id", challengeId)
      .eq("user_id", userId)
      .single();

    if (!participant) throw new Error("Participant not found");

    const newScore = Math.max(0, participant.current_score + adjustment);

    await this.supabase
      .from("challenge_participants")
      .update({ current_score: newScore })
      .eq("challenge_id", challengeId)
      .eq("user_id", userId);

    // Log the adjustment
    await this.supabase.from("challenge_actions").insert({
      challenge_id: challengeId,
      user_id: userId,
      action_type: "admin_adjustment",
      points_awarded: adjustment,
      action_metadata: { reason, admin: true },
    });

    // Recalculate ranks
    await this.recalculateRanks(challengeId);
  }

  /**
   * Admin: Extend or end challenge
   */
  async adminUpdateChallengeEndTime(
    challengeId: string,
    newEndTime: Date,
  ): Promise<void> {
    await this.supabase
      .from("challenges")
      .update({
        ends_at: newEndTime.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", challengeId);
  }

  private getActionText(actionType: string, actionValue?: number): string {
    switch (actionType) {
      case "referral_completed":
        return "referred a friend";
      case "purchase_made":
        return `spent KES ${actionValue?.toLocaleString()}`;
      case "share_posted":
        return "shared on social media";
      case "daily_login":
        return "completed daily login streak";
      case "social_hashtag":
        return "posted with hashtag";
      default:
        return "earned points";
    }
  }
}
