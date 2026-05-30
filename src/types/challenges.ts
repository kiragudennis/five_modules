// src/types/challenges.ts

export interface Challenge {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  challenge_type:
    | "referral"
    | "purchase"
    | "share"
    | "streak"
    | "team"
    | "combo"
    | "social"
    | "trivia";
  scoring_config: ScoringConfig;
  prize_tiers: PrizeTier[];
  starts_at: string;
  ends_at: string;
  status: "draft" | "active" | "paused" | "ended" | "archived";
  allow_teams: boolean;
  max_team_size: number;
  min_team_size: number;
  allow_team_switching: boolean;
  allowed_team_categories:
    | "{competitive,casual,newbie_friendly,high_rollers,balanced}"
    | [];
  streak_reset_on_miss: boolean;
  streak_grace_days: number;
  require_active_status?: boolean;
  tiebreaker_type?: "score" | "duration" | "random";
  streak_action_type?: "daily_login" | "daily_purchase" | "custom";

  cover_image_url: string | null;
  theme_color: string;
  show_leaderboard: boolean;
  show_ticker: boolean;
  participation_points: number;
  created_at: string;

  updated_at: string;
  created_by?: string;
}

export interface ScoringConfig {
  // Referral challenge
  points_per_referral?: number;
  min_referrals?: number;
  bonus_for_top_referrer?: number;

  // Purchase challenge
  points_per_ksh?: number;
  min_spend?: number;
  bonus_at_thresholds?: Array<{ threshold: number; bonus_points: number }>;
  double_points_hours?: number[]; // e.g. [12, 18] for double points from 12pm-1pm and 6pm-7pm

  // Streak challenge
  days_required?: number;
  points_per_day?: number;
  bonus_at_streak?: Array<{ streak: number; bonus: number }>;
  bonus_milestones?: Record<number, number>;

  // Team challenge
  team_size_limit?: number;
  points_per_member_action?: number;
  leader_bonus_multiplier?: number;
  small_team_category?: number;

  // Combo challenge
  weights?: {
    referral: number;
    purchase: number;
    share: number;
    streak?: number;
  };
  combo_multiplier?: number;

  // Share challenge
  points_per_share?: number;
  required_platforms?: ("facebook" | "twitter" | "instagram" | "whatsapp")[];
  platform_bonus?: { [platform: string]: number };

  // Social challenge
  points_per_hashtag?: number;
  bonus_for_verified?: number;

  // Others
  product_id: string | null;
  challenge_duration: string | null;
  new_team_category: string | null;
  target_hashtag: string | null;
  custom_action_description: string | null;
}

export interface PrizeTier {
  rank: number;
  prize_type:
    | "points"
    | "discount"
    | "free_shipping"
    | "product"
    | "bundle"
    | "badge";
  prize_value: string | number;
  badge?: string;
  description?: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  team_id: string | null;
  current_score: number;
  current_rank: number | null;
  joined_at: string;
  last_action_at: string | null;
  current_streak: number;
  best_streak: number;
}

export interface ChallengeTeam {
  id: string;
  challenge_id: string;
  team_leader_id: string;
  team_name: string;
  team_code: string;
  current_score: number;
  member_count: number;
  current_rank: number | null;
  is_private: boolean | null;
  team_category:
    | "competitive"
    | "casual"
    | "newbie_friendly"
    | "high_rollers"
    | "balanced";
}

export interface TrackedUser {
  user_id: string;
  full_name: string;
  current_score: number;
  current_rank: number;
  points_needed_to_overtake: number;
  avatar_url?: string;
}

export interface TeamProfile {
  team: {
    id: string;
    team_name: string;
    team_description: string;
    team_avatar_url: string;
    team_code: string;
    current_score: number;
    member_count: number;
    total_team_spending: number;
    is_recruiting: boolean;
    team_category: string;
    tags: string[];
    created_at: string;
  };
  leader: {
    id: string;
    full_name: string;
    total_orders: number;
    total_spent: number;
  };
  members: Array<{
    user_id: string;
    full_name: string;
    status: string;
    total_orders: number;
    total_spent: number;
    joined_at: string;
  }>;
  achievements: Array<{
    achievement_type: string;
    achieved_at: string;
  }>;
  recent_spending: number;
  avg_member_spend: number;
}

export interface RecruitProfile {
  user_id: string;
  full_name: string;
  email: string;
  status: string;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  account_age_days: number;
  last_order_date: string;
  is_seeking_team: boolean;
  preferred_role: string;
  bio: string;
  current_team: string | null;
}
