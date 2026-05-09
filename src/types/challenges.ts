// src/types/challenges.ts

export interface Challenge {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    challenge_type: 'referral' | 'purchase' | 'share' | 'streak' | 'team' | 'combo' | 'social';
    scoring_config: ScoringConfig;
    prize_tiers: PrizeTier[];
    starts_at: string;
    ends_at: string;
    status: 'draft' | 'active' | 'paused' | 'ended' | 'archived';
    allow_teams: boolean;
    max_team_size: number;
    allow_team_switching: boolean;
    streak_reset_on_miss: boolean;
    streak_grace_days: number;
    cover_image_url: string | null;
    theme_color: string;
    show_leaderboard: boolean;
    show_ticker: boolean;
}

export interface ScoringConfig {
    // Referral challenge
    points_per_referral?: number;
    min_referrals?: number;
    
    // Purchase challenge
    points_per_ksh?: number;
    min_spend?: number;
    bonus_at_thresholds?: Array<{ threshold: number; bonus_points: number }>;
    
    // Streak challenge
    days_required?: number;
    points_per_day?: number;
    bonus_at_streak?: Array<{ streak: number; bonus: number }>;
    
    // Team challenge
    team_size_limit?: number;
    points_per_member_action?: number;
    leader_bonus_multiplier?: number;
    
    // Combo challenge
    weights?: {
        referral: number;
        purchase: number;
        share: number;
        streak?: number;
    };
    
    // Share challenge
    points_per_share?: number;
    required_platforms?: ('facebook' | 'twitter' | 'instagram' | 'whatsapp')[];
}

export interface PrizeTier {
    rank: number;
    prize_type: 'points' | 'discount' | 'free_shipping' | 'product' | 'bundle' | 'badge';
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
}

export interface TrackedUser {
    user_id: string;
    full_name: string;
    current_score: number;
    current_rank: number;
    points_needed_to_overtake: number;
    avatar_url?: string;
}