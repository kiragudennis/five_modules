// src/lib/services/challenges-service.ts

import { createClient } from "@/lib/supabase/server";
import {
  Challenge,
  ChallengeParticipant,
  ChallengeTeam,
  TrackedUser,
  ScoringConfig,
} from "@/types/challenges";
import { PointsService } from "./points-service";
import { SupabaseClient } from "@supabase/supabase-js";

export class ChallengesService {
  private supabase = createClient();

  /**
   * Get or create Supabase client (async for server components)
   */
  private async getSupabase(): Promise<SupabaseClient> {
    if (!this.supabase) {
      this.supabase = await createClient();
    }
    return this.supabase instanceof SupabaseClient
      ? this.supabase
      : createClient();
  }

  /**
   * Get all active challenges for a user
   */
  async getActiveChallenges(userId: string): Promise<Challenge[]> {
    const supabase = await this.getSupabase();
    const now = new Date().toISOString();

    const { data: challenges, error } = await supabase
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
      const { data: participant } = await supabase
        .from("challenge_participants")
        .select("id")
        .eq("challenge_id", challenge.id)
        .eq("user_id", userId)
        .maybeSingle();

      // If not joined, they can join
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
    const supabase = await this.getSupabase();

    const { data: participants, error } = await supabase
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
    const supabase = await this.getSupabase();

    // Check if challenge is active
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("status, starts_at, ends_at, allow_teams, max_team_size")
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
    const { data: existing } = await supabase
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
      const { data: team, error: teamError } = await supabase
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

      await supabase
        .from("challenge_teams")
        .update({ member_count: team.member_count + 1 })
        .eq("id", teamId);
    }

    // Join challenge
    await supabase.from("challenge_participants").insert({
      challenge_id: challengeId,
      user_id: userId,
      team_id: teamId || null,
      current_score: 0,
      joined_at: now.toISOString(),
    });

    // Add to live ticker
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    await supabase.from("challenge_live_ticker").insert({
      challenge_id: challengeId,
      user_name: profile?.full_name || "Someone",
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
    const supabase = await this.getSupabase();

    // Get challenge and participant using a different approach since nested select can be tricky
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (challengeError) throw challengeError;

    // Get participant separately
    const { data: participant, error: participantError } = await supabase
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

    // Award points using static PointsService.award
    if (pointsAwarded > 0) {
      await PointsService.award(
        supabase,
        userId,
        pointsAwarded,
        "challenge_action",
        challengeId,
        `Challenge ${challenge.name} - ${actionType}`,
      );
    }

    // Record action
    await supabase.from("challenge_actions").insert({
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

    await supabase
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
      await supabase.rpc("increment_team_score", {
        p_team_id: participant.team_id,
        p_points: pointsAwarded,
      });
    }

    // Add to live ticker
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    const { data: team } = participant.team_id
      ? await supabase
          .from("challenge_teams")
          .select("team_name")
          .eq("id", participant.team_id)
          .single()
      : { data: null };

    await supabase.from("challenge_live_ticker").insert({
      challenge_id: challengeId,
      user_name: profile?.full_name || "Someone",
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
          return config.points_per_referral || 100;
        }
        break;

      case "purchase":
        if (actionType === "purchase_made" && actionValue) {
          const points = Math.floor(actionValue * (config.points_per_ksh || 1));

          // Bonus at thresholds
          if (config.bonus_at_thresholds) {
            for (const threshold of config.bonus_at_thresholds) {
              if (actionValue >= threshold.threshold) {
                return points + threshold.bonus_points;
              }
            }
          }
          return points;
        }
        break;

      case "share":
        if (actionType === "share_posted") {
          return config.points_per_share || 50;
        }
        break;

      case "streak":
        if (actionType === "daily_login") {
          return config.points_per_day || 50;
        }
        break;

      case "combo":
        const weight =
          config.weights?.[actionType as keyof typeof config.weights] || 1;
        return Math.floor((actionValue || 100) * weight);

      case "social":
        if (actionType === "social_hashtag") {
          return config.points_per_share || 75;
        }
        break;
    }

    return 0;
  }

  /**
   * Get leaderboard for a challenge
   */
  async getLeaderboard(
    challengeId: string,
    limit: number = 50,
    teamMode: boolean = false,
  ): Promise<any[]> {
    const supabase = await this.getSupabase();

    if (teamMode) {
      const { data } = await supabase
        .from("challenge_teams")
        .select("*")
        .eq("challenge_id", challengeId)
        .order("current_score", { ascending: false })
        .limit(limit);
      return data || [];
    }

    const { data } = await supabase
      .from("challenge_participants")
      .select("*, profiles(full_name, avatar_url)")
      .eq("challenge_id", challengeId)
      .order("current_score", { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Get user's position in leaderboard
   */
  async getUserRank(
    challengeId: string,
    userId: string,
  ): Promise<{ rank: number; score: number }> {
    const supabase = await this.getSupabase();

    const { data: participants } = await supabase
      .from("challenge_participants")
      .select("user_id, current_score")
      .eq("challenge_id", challengeId)
      .order("current_score", { ascending: false });

    const userIndex = (participants || []).findIndex(
      (p) => p.user_id === userId,
    );

    if (userIndex === -1) {
      return { rank: 0, score: 0 };
    }

    return {
      rank: userIndex + 1,
      score: (participants && participants[userIndex].current_score) || 0,
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
    const supabase = await this.getSupabase();

    // Check if tracking already exists
    const { data: existing } = await supabase
      .from("challenge_tracking")
      .select("id")
      .eq("challenge_id", challengeId)
      .eq("tracker_user_id", trackerUserId)
      .eq("tracked_user_id", trackedUserId)
      .maybeSingle();

    if (!existing) {
      await supabase.from("challenge_tracking").insert({
        challenge_id: challengeId,
        tracker_user_id: trackerUserId,
        tracked_user_id: trackedUserId,
      });
    }
  }

  /**
   * Get tracked competitor status
   */
  async getTrackedCompetitor(
    challengeId: string,
    trackerUserId: string,
  ): Promise<TrackedUser | null> {
    const supabase = await this.getSupabase();

    const { data: tracking } = await supabase
      .from("challenge_tracking")
      .select("tracked_user_id")
      .eq("challenge_id", challengeId)
      .eq("tracker_user_id", trackerUserId)
      .maybeSingle();

    if (!tracking) return null;

    // Get competitor's current position and score
    const { data: competitor } = await supabase
      .from("challenge_participants")
      .select("current_score, profiles(full_name, avatar_url)")
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
      full_name: competitor?.profiles?.[0]?.full_name || "Competitor",
      current_score: competitor?.current_score || 0,
      current_rank: competitorRank.rank,
      points_needed_to_overtake: Math.max(
        0,
        (competitor?.current_score || 0) - trackerRank.score + 1,
      ),
      avatar_url: competitor?.profiles?.[0]?.avatar_url || null,
    };
  }

  /**
   * Create a team (for team challenges)
   */
  async createTeam(
    challengeId: string,
    teamLeaderId: string,
    teamName: string,
  ): Promise<ChallengeTeam> {
    const supabase = await this.getSupabase();

    // Generate unique team code
    const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: team, error } = await supabase
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
    const supabase = await this.getSupabase();

    const { data: team, error } = await supabase
      .from("challenge_teams")
      .select("*")
      .eq("team_code", teamCode.toUpperCase())
      .single();

    if (error || !team) throw new Error("Team not found");

    await this.joinChallenge(team.challenge_id, userId, team.id);
  }

  /**
   * Get live ticker items
   */
  async getLiveTicker(challengeId: string, limit: number = 30) {
    const supabase = await this.getSupabase();

    const { data } = await supabase
      .from("challenge_live_ticker")
      .select("*")
      .eq("challenge_id", challengeId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Admin: Force recalculate all ranks
   */
  private async recalculateRanks(challengeId: string): Promise<void> {
    const supabase = await this.getSupabase();

    await supabase.rpc("recalculate_challenge_ranks", {
      p_challenge_id: challengeId,
    });
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
