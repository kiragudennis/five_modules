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

-- version 2.0:
-- drop all old tables if they exist
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS challenge_participants CASCADE;
DROP TABLE IF EXISTS challenge_actions CASCADE;
DROP TABLE IF EXISTS challenge_teams CASCADE;
DROP TABLE IF EXISTS challenge_tracking CASCADE;
DROP TABLE IF EXISTS challenge_live_ticker CASCADE;
DROP TABLE IF EXISTS challenge_leaderboard_snapshots CASCADE;


-- Unified challenges table (merging v1 and v2)
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Challenge type (all advanced types)
    challenge_type TEXT NOT NULL CHECK (challenge_type IN (
        'referral', 'purchase', 'share', 'streak', 'team', 'combo', 'social'
    )),
    
    -- Scoring configuration (JSON for flexibility)
    scoring_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Examples:
    -- referral: {"points_per_referral": 100, "bonus_for_top_referrer": 500}
    -- purchase: {"points_per_ksh": 1, "min_spend": 1000, "double_points_hours": [18, 22]}
    -- streak: {"days_required": 7, "points_per_day": 50, "bonus_at_milestones": [3,7,14]}
    -- team: {"team_size_limit": 5, "points_per_member_action": 50, "bonus_for_complete_team": 200}
    -- combo: {"weights": {"referral": 2, "purchase": 1, "share": 1.5}, "combo_multiplier": 1.5}
    -- social: {"points_per_hashtag": 50, "requires_verification": true}
    
    -- Prize tiers (1st, 2nd, 3rd, participation)
    prize_tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Timing
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended', 'archived')),
    
    -- Team settings
    allow_teams BOOLEAN DEFAULT FALSE,
    max_team_size INTEGER DEFAULT 5,
    allow_team_switching BOOLEAN DEFAULT FALSE,
    
    -- Streak settings
    streak_reset_on_miss BOOLEAN DEFAULT TRUE,
    streak_grace_days INTEGER DEFAULT 0,
    
    -- Display settings
    cover_image_url TEXT,
    theme_color TEXT DEFAULT '#3B82F6',
    show_leaderboard BOOLEAN DEFAULT TRUE,
    show_ticker BOOLEAN DEFAULT TRUE,
    
    -- Rewards
    participation_points INTEGER DEFAULT 0,  -- Points for all participants
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Challenge participants (tracking individual progress)
CREATE TABLE IF NOT EXISTS challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID,
    
    current_score INTEGER DEFAULT 0,
    current_rank INTEGER,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_action_at TIMESTAMPTZ,
    
    -- Streak tracking
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    last_streak_date DATE,
    
    -- "Catch Them" tracking
    tracking_user_id UUID,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(challenge_id, user_id)
);

-- Challenge actions (every qualifying action)
CREATE TABLE IF NOT EXISTS challenge_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID,
    
    action_type TEXT NOT NULL CHECK (action_type IN (
        'referral_sent', 'referral_completed', 'purchase_made', 'share_posted',
        'streak_day_completed', 'team_joined', 'social_hashtag', 'daily_login'
    )),
    
    points_awarded INTEGER NOT NULL,
    action_value NUMERIC,
    action_metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE IF NOT EXISTS challenge_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    team_leader_id UUID REFERENCES users(id),
    team_name TEXT NOT NULL,
    team_code TEXT UNIQUE,
    
    current_score INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 1,
    current_rank INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- "Catch Them" tracking
CREATE TABLE IF NOT EXISTS challenge_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    tracker_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tracked_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(challenge_id, tracker_user_id, tracked_user_id)
);

-- Live ticker
CREATE TABLE IF NOT EXISTS challenge_live_ticker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_name TEXT,
    team_name TEXT,
    action_text TEXT,
    points_awarded INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard snapshots (for historical tracking)
CREATE TABLE IF NOT EXISTS challenge_leaderboard_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    leaderboard_data JSONB NOT NULL,
    snapshot_type TEXT CHECK (snapshot_type IN ('final', 'hourly', 'daily')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_challenges_status_dates ON challenges(status, starts_at, ends_at);
CREATE INDEX idx_challenge_participants_score ON challenge_participants(challenge_id, current_score DESC);
CREATE INDEX idx_challenge_actions_user ON challenge_actions(challenge_id, user_id, created_at);
CREATE INDEX idx_challenge_actions_created ON challenge_actions(created_at DESC);
CREATE INDEX idx_challenge_teams_score ON challenge_teams(challenge_id, current_score DESC);
CREATE INDEX idx_challenge_tracking_tracker ON challenge_tracking(tracker_user_id, challenge_id);
CREATE INDEX idx_challenge_live_ticker_challenge ON challenge_live_ticker(challenge_id, created_at DESC);

-- Enable real-time
ALTER TABLE challenges REPLICA IDENTITY FULL;
ALTER TABLE challenge_participants REPLICA IDENTITY FULL;
ALTER TABLE challenge_actions REPLICA IDENTITY FULL;
ALTER TABLE challenge_live_ticker REPLICA IDENTITY FULL;

-- RLS Policies
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_live_ticker ENABLE ROW LEVEL SECURITY;
purchases_count

-- Policies
CREATE POLICY "Anyone can view active challenges" ON challenges
    FOR SELECT USING (status = 'active' AND starts_at <= NOW() AND ends_at >= NOW());

CREATE POLICY "Users can view own participation" ON challenge_participants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view challenge actions" ON challenge_actions
    FOR SELECT USING (true);

-- Admin can manage USING (public.is_admin());
CREATE POLICY "Admins can manage challenges" ON challenges
    FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage participants" ON challenge_participants
    FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage actions" ON challenge_actions
    FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage teams" ON challenge_teams
    FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage tracking" ON challenge_tracking
    FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage live ticker" ON challenge_live_ticker
    FOR ALL USING (public.is_admin());

-- Functions
CREATE OR REPLACE FUNCTION recalculate_challenge_ranks(p_challenge_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update individual participant ranks
    UPDATE challenge_participants
    SET current_rank = ranked.rank
    FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY current_score DESC) as rank
        FROM challenge_participants
        WHERE challenge_id = p_challenge_id
    ) ranked
    WHERE challenge_participants.id = ranked.id;
    
    -- Update team ranks if applicable
    UPDATE challenge_teams
    SET current_rank = ranked.rank
    FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY current_score DESC) as rank
        FROM challenge_teams
        WHERE challenge_id = p_challenge_id
    ) ranked
    WHERE challenge_teams.id = ranked.id;
END;
$$;