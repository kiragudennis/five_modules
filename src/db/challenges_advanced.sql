-- db/challenges_advanced.sql

-- Challenges table (extends basic challenges)
CREATE TABLE IF NOT EXISTS challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    
    -- Challenge type
    challenge_type text NOT NULL CHECK (challenge_type IN (
        'referral', 'purchase', 'share', 'streak', 'team', 'combo', 'social'
    )),
    
    -- Scoring configuration
    scoring_config jsonb NOT NULL DEFAULT '{}'::jsonb,
    -- Examples:
    -- referral: {"points_per_referral": 100, "min_referrals": 5}
    -- purchase: {"points_per_ksh": 1, "min_spend": 1000}
    -- streak: {"days_required": 7, "points_per_day": 50}
    -- team: {"team_size_limit": 5, "points_per_member_action": 50}
    -- combo: {"weights": {"referral": 2, "purchase": 1, "share": 1.5}}
    
    -- Prize tiers (1st, 2nd, 3rd, participation)
    prize_tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
    -- Example: [{"rank": 1, "prize_type": "points", "prize_value": 5000, "badge": "champion"},
    --          {"rank": 2, "prize_type": "points", "prize_value": 2500},
    --          {"rank": 3, "prize_type": "discount", "prize_value": 20}]
    
    -- Timing
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended', 'archived')),
    
    -- Team settings (if team challenge)
    allow_teams boolean DEFAULT false,
    max_team_size integer DEFAULT 5,
    allow_team_switching boolean DEFAULT false,
    
    -- Streak settings
    streak_reset_on_miss boolean DEFAULT true,
    streak_grace_days integer DEFAULT 0,
    
    -- Display settings
    cover_image_url text,
    theme_color text DEFAULT '#3B82F6',
    show_leaderboard boolean DEFAULT true,
    show_ticker boolean DEFAULT true,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Challenge participants
CREATE TABLE IF NOT EXISTS challenge_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id uuid, -- optional, if team challenge
    
    current_score integer DEFAULT 0,
    current_rank integer,
    joined_at timestamptz DEFAULT now(),
    last_action_at timestamptz,
    
    -- Streak tracking
    current_streak integer DEFAULT 0,
    best_streak integer DEFAULT 0,
    last_streak_date date,
    
    -- Tracking metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    
    UNIQUE(challenge_id, user_id)
);

-- Challenge actions (every qualifying action)
CREATE TABLE IF NOT EXISTS challenge_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id uuid,
    
    action_type text NOT NULL CHECK (action_type IN (
        'referral_sent', 'referral_completed', 'purchase_made', 'share_posted',
        'streak_day_completed', 'team_joined', 'social_hashtag', 'daily_login'
    )),
    
    points_awarded integer NOT NULL,
    action_value numeric,
    action_metadata jsonb DEFAULT '{}'::jsonb,
    
    created_at timestamptz DEFAULT now()
);

-- Teams (for team challenges)
CREATE TABLE IF NOT EXISTS challenge_teams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
    team_leader_id uuid REFERENCES auth.users(id),
    team_name text NOT NULL,
    team_code text UNIQUE,
    
    current_score integer DEFAULT 0,
    member_count integer DEFAULT 1,
    current_rank integer,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- User tracking (Catch Them feature)
CREATE TABLE IF NOT EXISTS challenge_tracking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
    tracker_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    tracked_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(challenge_id, tracker_user_id, tracked_user_id)
);

-- Live ticker queue
CREATE TABLE IF NOT EXISTS challenge_live_ticker (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
    user_name text,
    team_name text,
    action_text text,
    points_awarded integer,
    created_at timestamptz DEFAULT now()
);

-- Challenge leaderboard snapshots (for historical tracking)
CREATE TABLE IF NOT EXISTS challenge_leaderboard_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
    leaderboard_data jsonb NOT NULL,
    snapshot_type text CHECK (snapshot_type IN ('final', 'hourly', 'daily')),
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_challenges_status_dates ON challenges(status, starts_at, ends_at);
CREATE INDEX idx_challenge_participants_score ON challenge_participants(challenge_id, current_score DESC);
CREATE INDEX idx_challenge_actions_user ON challenge_actions(challenge_id, user_id, created_at);
CREATE INDEX idx_challenge_actions_created ON challenge_actions(created_at DESC);
CREATE INDEX idx_challenge_teams_score ON challenge_teams(challenge_id, current_score DESC);
CREATE INDEX idx_challenge_tracking_tracker ON challenge_tracking(tracker_user_id, challenge_id);
CREATE INDEX idx_challenge_live_ticker_challenge ON challenge_live_ticker(challenge_id, created_at DESC);

-- Increment team score
CREATE OR REPLACE FUNCTION increment_team_score(
    p_team_id uuid,
    p_points integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE challenge_teams
    SET current_score = current_score + p_points,
        updated_at = NOW()
    WHERE id = p_team_id;
END;
$$;

-- Recalculate all ranks for a challenge
CREATE OR REPLACE FUNCTION recalculate_challenge_ranks(
    p_challenge_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update individual participant ranks
    UPDATE challenge_participants
    SET current_rank = ranked.rank
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY current_score DESC) as rank
        FROM challenge_participants
        WHERE challenge_id = p_challenge_id
    ) ranked
    WHERE challenge_participants.id = ranked.id;
    
    -- Update team ranks if teams exist
    UPDATE challenge_teams
    SET current_rank = ranked.rank
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY current_score DESC) as rank
        FROM challenge_teams
        WHERE challenge_id = p_challenge_id
    ) ranked
    WHERE challenge_teams.id = ranked.id;
END;
$$;

-- Auto-end expired challenges (run via cron)
CREATE OR REPLACE FUNCTION auto_end_expired_challenges()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE challenges
    SET status = 'ended'
    WHERE status = 'active'
    AND ends_at < NOW();
    
    -- Recalculate final ranks for ended challenges
    PERFORM recalculate_challenge_ranks(id)
    FROM challenges
    WHERE status = 'ended'
    AND updated_at < NOW() - INTERVAL '1 hour';
END;
$$;