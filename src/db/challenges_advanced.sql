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

-- Add streak-specific columns to challenges table
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS require_active_status BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tiebreaker_type TEXT DEFAULT 'score' CHECK (tiebreaker_type IN ('score', 'duration', 'random')),
ADD COLUMN IF NOT EXISTS streak_action_type TEXT DEFAULT 'daily_login' CHECK (streak_action_type IN ('daily_login', 'daily_purchase', 'custom'));

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

-- Social share submissions table for admin review
CREATE TABLE IF NOT EXISTS challenge_social_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Submission details
    post_url TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'instagram', 'tiktok', 'linkedin', 'youtube', 'other')),
    hashtag TEXT NOT NULL,
    caption TEXT,
    screenshot_url TEXT,
    
    -- Verification
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    reviewer_id UUID REFERENCES users(id),
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    
    -- Points
    points_awarded INTEGER DEFAULT 0,
    bonus_points INTEGER DEFAULT 0,
    
    -- Metadata
    submission_metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_social_submissions_challenge ON challenge_social_submissions(challenge_id, status);
CREATE INDEX idx_social_submissions_user ON challenge_social_submissions(user_id, challenge_id);
CREATE INDEX idx_social_submissions_pending ON challenge_social_submissions(status) WHERE status = 'pending';
CREATE INDEX idx_social_submissions_platform ON challenge_social_submissions(platform);

-- Enable RLS
ALTER TABLE challenge_social_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own submissions" ON challenge_social_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions" ON challenge_social_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all submissions" ON challenge_social_submissions
    FOR ALL USING (public.is_admin());

-- Function to process approved social submission
CREATE OR REPLACE FUNCTION process_social_submission_approval(
    p_submission_id UUID,
    p_reviewer_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_bonus_points INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_submission challenge_social_submissions%ROWTYPE;
    v_challenge challenges%ROWTYPE;
    v_participant challenge_participants%ROWTYPE;
    v_points_to_award INTEGER;
    v_bonus_points INTEGER;
BEGIN
    -- Get submission
    SELECT * INTO v_submission
    FROM challenge_social_submissions
    WHERE id = p_submission_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Submission not found');
    END IF;
    
    IF v_submission.status != 'pending' THEN
        RETURN json_build_object('success', false, 'error', 'Submission already processed');
    END IF;
    
    -- Get challenge details
    SELECT * INTO v_challenge
    FROM challenges
    WHERE id = v_submission.challenge_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Challenge not found');
    END IF;
    
    -- Calculate points
    v_points_to_award := COALESCE(v_challenge.scoring_config->>'points_per_hashtag', '75')::INTEGER;
    v_bonus_points := COALESCE(p_bonus_points, v_challenge.scoring_config->>'bonus_for_verified', '25')::INTEGER;
    
    -- Get or create participant
    SELECT * INTO v_participant
    FROM challenge_participants
    WHERE challenge_id = v_submission.challenge_id
    AND user_id = v_submission.user_id;
    
    IF NOT FOUND THEN
        -- Auto-join if not already participating
        INSERT INTO challenge_participants (challenge_id, user_id, current_score)
        VALUES (v_submission.challenge_id, v_submission.user_id, v_points_to_award + v_bonus_points)
        RETURNING * INTO v_participant;
    ELSE
        -- Update existing participant
        UPDATE challenge_participants
        SET current_score = current_score + v_points_to_award + v_bonus_points,
            last_action_at = NOW()
        WHERE id = v_participant.id;
    END IF;
    
    -- Record action
    INSERT INTO challenge_actions (
        challenge_id,
        user_id,
        action_type,
        points_awarded,
        action_metadata
    ) VALUES (
        v_submission.challenge_id,
        v_submission.user_id,
        'social_hashtag',
        v_points_to_award + v_bonus_points,
        jsonb_build_object(
            'submission_id', v_submission.id,
            'platform', v_submission.platform,
            'post_url', v_submission.post_url,
            'bonus_points', v_bonus_points,
            'review_notes', p_notes
        )
    );
    
    -- Add to live ticker
    INSERT INTO challenge_live_ticker (
        challenge_id,
        user_name,
        action_text,
        points_awarded
    )
    SELECT
        v_submission.challenge_id,
        u.full_name,
        'Shared on ' || v_submission.platform || ' with #' || v_submission.hashtag || ' ✅',
        v_points_to_award + v_bonus_points
    FROM users u
    WHERE u.id = v_submission.user_id;
    
    -- Update submission status
    UPDATE challenge_social_submissions
    SET status = 'approved',
        reviewer_id = p_reviewer_id,
        review_notes = p_notes,
        points_awarded = v_points_to_award,
        bonus_points = v_bonus_points,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_submission_id;
    
    -- Award loyalty points if configured
    IF v_points_to_award + v_bonus_points > 0 THEN
        INSERT INTO loyalty_points (user_id, points, points_earned)
        VALUES (v_submission.user_id, v_points_to_award + v_bonus_points, v_points_to_award + v_bonus_points)
        ON CONFLICT (user_id) DO UPDATE
        SET points = loyalty_points.points + v_points_to_award + v_bonus_points,
            points_earned = loyalty_points.points_earned + v_points_to_award + v_bonus_points,
            updated_at = NOW();
    END IF;
    
    -- Recalculate ranks
    PERFORM recalculate_challenge_ranks(v_submission.challenge_id);
    
    RETURN json_build_object(
        'success', true,
        'points_awarded', v_points_to_award + v_bonus_points,
        'submission_id', v_submission.id,
        'challenge_id', v_submission.challenge_id
    );
END;
$$;

-- Function to reject submission
CREATE OR REPLACE FUNCTION reject_social_submission(
    p_submission_id UUID,
    p_reviewer_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_submission challenge_social_submissions%ROWTYPE;
BEGIN
    -- Get submission
    SELECT * INTO v_submission
    FROM challenge_social_submissions
    WHERE id = p_submission_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Submission not found');
    END IF;
    
    -- Update submission status
    UPDATE challenge_social_submissions
    SET status = 'rejected',
        reviewer_id = p_reviewer_id,
        review_notes = p_notes,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_submission_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Submission rejected',
        'submission_id', v_submission.id
    );
END;
$$;

-- Enhanced team system for challenges

-- Team invitations/requests table
CREATE TABLE IF NOT EXISTS challenge_team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    team_id UUID REFERENCES challenge_teams(id) ON DELETE CASCADE,
    
    -- Who is sending/requesting
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Type of invitation
    invitation_type TEXT NOT NULL CHECK (invitation_type IN ('team_invite', 'join_request', 'open_invitation')),
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
    
    -- Message
    message TEXT,
    
    -- Response tracking
    responded_at TIMESTAMPTZ,
    response_message TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate pending invitations
    UNIQUE(challenge_id, sender_id, recipient_id, status)
);

-- Team recruitment profile - what members show to potential teams
CREATE TABLE IF NOT EXISTS challenge_team_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Recruitment status
    is_seeking_team BOOLEAN DEFAULT TRUE,
    is_open_to_invites BOOLEAN DEFAULT TRUE,
    
    -- What they're looking for
    preferred_role TEXT CHECK (preferred_role IN ('spender', 'supporter', 'strategist', 'any')),
    min_team_spend_target NUMERIC,
    
    -- Their stats snapshot (cached for discovery)
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    avg_order_value NUMERIC DEFAULT 0,
    last_order_date TIMESTAMPTZ,
    account_age_days INTEGER DEFAULT 0,
    
    -- Bio/message
    bio TEXT,
    
    -- Availability
    available_from TIMESTAMPTZ,
    available_until TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(challenge_id, user_id)
);

-- Team chat/messages for coordination
CREATE TABLE IF NOT EXISTS challenge_team_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    team_id UUID REFERENCES challenge_teams(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'achievement', 'reminder')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team spending tracking
CREATE TABLE IF NOT EXISTS challenge_team_spending (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    team_id UUID REFERENCES challenge_teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    
    amount_spent NUMERIC NOT NULL,
    points_contributed INTEGER DEFAULT 0,
    
    spending_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team achievements/badges
CREATE TABLE IF NOT EXISTS challenge_team_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    team_id UUID REFERENCES challenge_teams(id) ON DELETE CASCADE,
    
    achievement_type TEXT NOT NULL CHECK (achievement_type IN (
        'first_member', 'team_full', 'first_purchase', 'spending_milestone',
        'streak_3_days', 'streak_7_days', 'all_members_active', 'top_team_weekly'
    )),
    
    achievement_data JSONB DEFAULT '{}'::jsonb,
    achieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_team_invitations_challenge ON challenge_team_invitations(challenge_id, status);
CREATE INDEX idx_team_invitations_recipient ON challenge_team_invitations(recipient_id, status);
CREATE INDEX idx_team_profiles_seeking ON challenge_team_profiles(challenge_id, is_seeking_team) WHERE is_seeking_team = TRUE;
CREATE INDEX idx_team_spending_team ON challenge_team_spending(team_id, spending_date);
CREATE INDEX idx_team_spending_challenge ON challenge_team_spending(challenge_id, spending_date);

-- Enable RLS
ALTER TABLE challenge_team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_team_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_team_spending ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_team_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view team invitations" ON challenge_team_invitations
    FOR SELECT USING (auth.uid() IN (sender_id, recipient_id) OR public.is_admin());

CREATE POLICY "Users can send invitations" ON challenge_team_invitations
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their invitations" ON challenge_team_invitations
    FOR UPDATE USING (auth.uid() IN (sender_id, recipient_id));

CREATE POLICY "Users can view team profiles" ON challenge_team_profiles
    FOR SELECT USING (true); -- Public discovery

CREATE POLICY "Users can manage their profile" ON challenge_team_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Team members can view messages" ON challenge_team_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM challenge_participants cp
            WHERE cp.challenge_id = challenge_team_messages.challenge_id
            AND cp.user_id = auth.uid()
            AND cp.team_id = challenge_team_messages.team_id
        )
    );

CREATE POLICY "Team members can send messages" ON challenge_team_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM challenge_participants cp
            WHERE cp.challenge_id = challenge_team_messages.challenge_id
            AND cp.user_id = auth.uid()
            AND cp.team_id = challenge_team_messages.team_id
        )
    );

-- Functions for team management

-- Function to process team spending (called when order is completed)
CREATE OR REPLACE FUNCTION process_team_spending(
    p_order_id UUID,
    p_user_id UUID,
    p_amount NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_team_record RECORD;
    v_challenge RECORD;
    v_points_earned INTEGER;
BEGIN
    -- Find user's active team in any active challenge
    SELECT 
        ct.id as team_id,
        ct.challenge_id,
        c.scoring_config,
        cp.id as participant_id
    INTO v_team_record
    FROM challenge_participants cp
    JOIN challenge_teams ct ON ct.id = cp.team_id
    JOIN challenges c ON c.id = ct.challenge_id
    WHERE cp.user_id = p_user_id
    AND c.status = 'active'
    AND c.starts_at <= NOW()
    AND c.ends_at >= NOW()
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'No active team found');
    END IF;
    
    -- Record team spending
    INSERT INTO challenge_team_spending (
        challenge_id,
        team_id,
        user_id,
        order_id,
        amount_spent,
        points_contributed
    ) VALUES (
        v_team_record.challenge_id,
        v_team_record.team_id,
        p_user_id,
        p_order_id,
        p_amount,
        FLOOR(p_amount * COALESCE((v_team_record.scoring_config->>'points_per_member_action')::INTEGER, 1))
    );
    
    -- Update team score
    UPDATE challenge_teams
    SET current_score = current_score + FLOOR(p_amount * COALESCE((v_team_record.scoring_config->>'points_per_member_action')::INTEGER, 1)),
        updated_at = NOW()
    WHERE id = v_team_record.team_id;
    
    -- Update participant score
    UPDATE challenge_participants
    SET current_score = current_score + FLOOR(p_amount * COALESCE((v_team_record.scoring_config->>'points_per_member_action')::INTEGER, 1)),
        last_action_at = NOW()
    WHERE id = v_team_record.participant_id;
    
    -- Recalculate ranks
    PERFORM recalculate_challenge_ranks(v_team_record.challenge_id);
    
    -- Add to live ticker
    INSERT INTO challenge_live_ticker (
        challenge_id,
        team_name,
        user_name,
        action_text,
        points_awarded
    )
    SELECT
        v_team_record.challenge_id,
        ct.team_name,
        u.full_name,
        'Made a purchase of KSH ' || p_amount::TEXT,
        FLOOR(p_amount * COALESCE((v_team_record.scoring_config->>'points_per_member_action')::INTEGER, 1))
    FROM challenge_teams ct
    JOIN users u ON u.id = p_user_id
    WHERE ct.id = v_team_record.team_id;
    
    -- Check for team achievements
    PERFORM check_team_achievements(v_team_record.team_id, v_team_record.challenge_id);
    
    RETURN json_build_object(
        'success', true,
        'team_id', v_team_record.team_id,
        'points_earned', FLOOR(p_amount * COALESCE((v_team_record.scoring_config->>'points_per_member_action')::INTEGER, 1))
    );
END;
$$;

-- Function to check and award team achievements
CREATE OR REPLACE FUNCTION check_team_achievements(
    p_team_id UUID,
    p_challenge_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_team challenge_teams%ROWTYPE;
    v_member_count INTEGER;
    v_total_spent NUMERIC;
    v_active_members INTEGER;
BEGIN
    -- Get team info
    SELECT * INTO v_team FROM challenge_teams WHERE id = p_team_id;
    
    -- Count members
    SELECT COUNT(*) INTO v_member_count
    FROM challenge_participants
    WHERE team_id = p_team_id;
    
    -- Get total spending
    SELECT COALESCE(SUM(amount_spent), 0) INTO v_total_spent
    FROM challenge_team_spending
    WHERE team_id = p_team_id;
    
    -- Get active members count
    SELECT COUNT(DISTINCT user_id) INTO v_active_members
    FROM challenge_team_spending
    WHERE team_id = p_team_id
    AND spending_date >= NOW() - INTERVAL '7 days';
    
    -- Check and award achievements
    IF v_member_count >= 1 AND NOT EXISTS (
        SELECT 1 FROM challenge_team_achievements 
        WHERE team_id = p_team_id AND achievement_type = 'first_member'
    ) THEN
        INSERT INTO challenge_team_achievements (challenge_id, team_id, achievement_type)
        VALUES (p_challenge_id, p_team_id, 'first_member');
    END IF;
    
    IF v_member_count >= 5 AND NOT EXISTS (
        SELECT 1 FROM challenge_team_achievements 
        WHERE team_id = p_team_id AND achievement_type = 'team_full'
    ) THEN
        INSERT INTO challenge_team_achievements (challenge_id, team_id, achievement_type)
        VALUES (p_challenge_id, p_team_id, 'team_full');
    END IF;
    
    IF v_total_spent >= 10000 AND NOT EXISTS (
        SELECT 1 FROM challenge_team_achievements 
        WHERE team_id = p_team_id AND achievement_type = 'spending_milestone'
    ) THEN
        INSERT INTO challenge_team_achievements (challenge_id, team_id, achievement_type, achievement_data)
        VALUES (p_challenge_id, p_team_id, 'spending_milestone', jsonb_build_object('amount', v_total_spent));
    END IF;
    
    IF v_active_members = v_member_count AND v_member_count > 0 AND NOT EXISTS (
        SELECT 1 FROM challenge_team_achievements 
        WHERE team_id = p_team_id AND achievement_type = 'all_members_active'
    ) THEN
        INSERT INTO challenge_team_achievements (challenge_id, team_id, achievement_type)
        VALUES (p_challenge_id, p_team_id, 'all_members_active');
    END IF;
END;
$$;

-- Update the challenge_teams table to include more metadata
ALTER TABLE challenge_teams
ADD COLUMN IF NOT EXISTS team_description TEXT,
ADD COLUMN IF NOT EXISTS team_avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_recruiting BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS min_spend_requirement NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_team_spending NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_category TEXT CHECK (team_category IN ('competitive', 'casual', 'newbie_friendly', 'high_rollers', 'balanced')),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add any missing team-related columns to challenges table
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS min_team_size INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS allowed_team_categories TEXT[] DEFAULT '{competitive,casual,newbie_friendly,high_rollers,balanced}';

-- Update the challenge_teams table
ALTER TABLE challenge_teams
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- Create team categories enum if needed
DO $$ BEGIN
    CREATE TYPE team_category AS ENUM ('competitive', 'casual', 'newbie_friendly', 'high_rollers', 'balanced');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add category column if not exists
ALTER TABLE challenge_teams 
ALTER COLUMN team_category TYPE team_category USING team_category::team_category;

-- Function to process purchase challenge when order is completed
CREATE OR REPLACE FUNCTION process_purchase_challenge(
    p_order_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order orders%ROWTYPE;
    v_challenge RECORD;
    v_participant RECORD;
    v_order_item RECORD;
    v_challenge_product_id UUID;
    v_total_units INTEGER;
    v_points_to_award INTEGER;
    v_existing_participant BOOLEAN;
    v_result JSON;
    v_processed_challenges INTEGER := 0;
BEGIN
    -- Get order details
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id;
    
    -- Check if order is processing
    IF NOT FOUND OR v_order.status != 'processing' OR v_order.payment_status != 'completed' THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Order not found or not processing'
        );
    END IF;
    
    -- Find all active purchase challenges
    FOR v_challenge IN 
        SELECT 
            c.*,
            c.scoring_config->>'product_id' as target_product_id,
            (c.scoring_config->>'points_per_unit')::INTEGER as points_per_unit,
            (c.scoring_config->>'bonus_points_for_leader')::INTEGER as bonus_points
        FROM challenges c
        WHERE c.challenge_type = 'purchase'
        AND c.status = 'active'
        AND c.starts_at <= NOW()
        AND c.ends_at >= NOW()
    LOOP
        -- Check if challenge has a target product specified
        IF v_challenge.target_product_id IS NULL THEN
            CONTINUE; -- Skip if no product specified
        END IF;
        
        v_challenge_product_id := v_challenge.target_product_id::UUID;
        
        -- Check if this product is in the order
        SELECT 
            oi.product_id,
            SUM(oi.quantity) as total_qty
        INTO v_order_item
        FROM order_items oi
        WHERE oi.order_id = p_order_id
        AND oi.product_id = v_challenge_product_id
        GROUP BY oi.product_id;
        
        -- If challenge product found in order
        IF FOUND AND v_order_item.total_qty > 0 THEN
            v_total_units := v_order_item.total_qty;
            
            -- Calculate points (points per unit * quantity)
            v_points_to_award := COALESCE(v_challenge.points_per_unit, 10) * v_total_units;
            
            -- Check if user is already participating
            SELECT * INTO v_participant
            FROM challenge_participants
            WHERE challenge_id = v_challenge.id
            AND user_id = v_order.user_id;
            
            IF FOUND THEN
                -- Update existing participant
                UPDATE challenge_participants
                SET 
                    current_score = current_score + v_points_to_award,
                    last_action_at = NOW(),
                    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                        'total_units_purchased', 
                        COALESCE((metadata->>'total_units_purchased')::INTEGER, 0) + v_total_units,
                        'last_purchase_date', NOW()::TEXT,
                        'last_order_id', p_order_id::TEXT
                    )
                WHERE id = v_participant.id;
            ELSE
                -- Create new participant
                INSERT INTO challenge_participants (
                    challenge_id,
                    user_id,
                    current_score,
                    last_action_at,
                    metadata
                ) VALUES (
                    v_challenge.id,
                    v_order.user_id,
                    v_points_to_award,
                    NOW(),
                    jsonb_build_object(
                        'total_units_purchased', v_total_units,
                        'last_purchase_date', NOW()::TEXT,
                        'last_order_id', p_order_id::TEXT,
                        'auto_joined', true
                    )
                );
            END IF;
            
            -- Record the action
            INSERT INTO challenge_actions (
                challenge_id,
                user_id,
                action_type,
                points_awarded,
                action_value,
                action_metadata
            ) VALUES (
                v_challenge.id,
                v_order.user_id,
                'purchase_made',
                v_points_to_award,
                v_total_units,
                jsonb_build_object(
                    'order_id', p_order_id,
                    'product_id', v_challenge_product_id,
                    'units_purchased', v_total_units,
                    'order_number', v_order.order_number,
                    'points_per_unit', COALESCE(v_challenge.points_per_unit, 10)
                )
            );
            
            -- Add to live ticker
            INSERT INTO challenge_live_ticker (
                challenge_id,
                user_name,
                action_text,
                points_awarded
            )
            SELECT
                v_challenge.id,
                u.full_name,
                'Purchased ' || v_total_units || ' unit(s) of challenge product! 🛍️',
                v_points_to_award
            FROM users u
            WHERE u.id = v_order.user_id;
            
            -- Check if user is now in top 3 and award bonus
            WITH ranked_participants AS (
                SELECT 
                    cp.user_id,
                    cp.current_score,
                    ROW_NUMBER() OVER (ORDER BY cp.current_score DESC) as rank
                FROM challenge_participants cp
                WHERE cp.challenge_id = v_challenge.id
            )
            SELECT 
                rank INTO v_existing_participant
            FROM ranked_participants
            WHERE user_id = v_order.user_id
            AND rank <= 3;
            
            -- If in top 3 and bonus configured, add bonus points
            IF v_existing_participant AND COALESCE(v_challenge.bonus_points, 0) > 0 THEN
                -- Check if bonus already awarded for this position
                IF NOT EXISTS (
                    SELECT 1 FROM challenge_actions
                    WHERE challenge_id = v_challenge.id
                    AND user_id = v_order.user_id
                    AND action_type = 'bonus_top_rank'
                    AND action_metadata->>'order_id' = p_order_id::TEXT
                ) THEN
                    UPDATE challenge_participants
                    SET current_score = current_score + v_challenge.bonus_points
                    WHERE challenge_id = v_challenge.id
                    AND user_id = v_order.user_id;
                    
                    INSERT INTO challenge_actions (
                        challenge_id,
                        user_id,
                        action_type,
                        points_awarded,
                        action_metadata
                    ) VALUES (
                        v_challenge.id,
                        v_order.user_id,
                        'bonus_top_rank',
                        v_challenge.bonus_points,
                        jsonb_build_object(
                            'order_id', p_order_id,
                            'reason', 'Top 3 position bonus'
                        )
                    );
                END IF;
            END IF;
            
            -- Recalculate ranks
            PERFORM recalculate_challenge_ranks(v_challenge.id);
            
            v_processed_challenges := v_processed_challenges + 1;
        END IF;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'challenges_processed', v_processed_challenges,
        'message', 'Processed ' || v_processed_challenges || ' purchase challenge(s)'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to get purchase challenge leaderboard with units info
CREATE OR REPLACE FUNCTION get_purchase_challenge_leaderboard(
    p_challenge_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    current_score INTEGER,
    total_units INTEGER,
    current_rank INTEGER,
    last_purchase_date TIMESTAMPTZ,
    points_to_next INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH ranked AS (
        SELECT 
            cp.user_id,
            u.full_name,
            u.email,
            cp.current_score,
            COALESCE((cp.metadata->>'total_units_purchased')::INTEGER, 0) as total_units,
            ROW_NUMBER() OVER (ORDER BY cp.current_score DESC) as current_rank,
            (cp.metadata->>'last_purchase_date')::TIMESTAMPTZ as last_purchase_date
        FROM challenge_participants cp
        JOIN users u ON u.id = cp.user_id
        WHERE cp.challenge_id = p_challenge_id
    )
    SELECT 
        r.user_id,
        r.full_name,
        r.email,
        r.current_score,
        r.total_units,
        r.current_rank::INTEGER,
        r.last_purchase_date,
        CASE 
            WHEN r.current_rank = 1 THEN 0
            ELSE (
                SELECT r2.current_score - r.current_score
                FROM ranked r2
                WHERE r2.current_rank = r.current_rank - 1
            )
        END as points_to_next
    FROM ranked r
    ORDER BY r.current_rank
    LIMIT p_limit;
END;
$$;

-- Trigger function to auto-process purchase challenges on order paid
CREATE OR REPLACE FUNCTION trigger_purchase_challenge_on_order_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only process when status changes to paid
    IF NEW.status = 'completed' AND NEW.payment_status = 'paid' 
       AND (OLD.status != 'completed' OR OLD.payment_status != 'completed') THEN
        PERFORM process_purchase_challenge(NEW.id);
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS order_completed_purchase_challenge ON orders;
CREATE TRIGGER order_completed_purchase_challenge
    AFTER UPDATE OF status, payment_status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_purchase_challenge_on_order_complete();

-- Record streak from the cooking (frontend tracking);
-- Add this RPC function to your database
CREATE OR REPLACE FUNCTION update_user_activity(
    p_user_id UUID,
    p_duration_seconds INTEGER,
    p_session_seconds INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_total INTEGER;
    v_metadata JSONB;
BEGIN
    -- Get current metadata
    SELECT metadata INTO v_metadata
    FROM users
    WHERE id = p_user_id;
    
    IF v_metadata IS NULL THEN
        v_metadata := '{}'::jsonb;
    END IF;
    
    v_current_total := COALESCE((v_metadata->>'total_site_seconds')::INTEGER, 0);
    
    -- Update with merged metadata
    UPDATE users
    SET 
        metadata = v_metadata || jsonb_build_object(
            'last_activity', NOW()::TEXT,
            'total_site_seconds', v_current_total + p_duration_seconds,
            'last_session_seconds', p_session_seconds,
            'last_session_end', NOW()::TEXT
        ),
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$;

-- RPC to check and update streak
CREATE OR REPLACE FUNCTION check_and_update_streak(
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_streak_record RECORD;
    v_challenge RECORD;
    v_last_date DATE;
    v_today DATE := CURRENT_DATE;
    v_new_streak INTEGER;
    v_points_awarded INTEGER := 0;
    v_should_update BOOLEAN;
    v_results JSONB := '[]'::jsonb;
    v_result JSONB;
    v_user_status TEXT;
    v_today_orders INTEGER;
BEGIN
    -- Get user status
    SELECT status INTO v_user_status FROM users WHERE id = p_user_id;
    
    -- Find all active streak challenges this user participates in
    FOR v_streak_record IN 
        SELECT 
            cp.id AS participant_id,
            cp.challenge_id,
            cp.current_streak,
            cp.last_streak_date,
            cp.current_score,
            cp.best_streak,
            c.scoring_config,
            c.streak_reset_on_miss,
            c.streak_grace_days,
            c.require_active_status,
            c.streak_action_type
        FROM challenge_participants cp
        JOIN challenges c ON c.id = cp.challenge_id
        WHERE cp.user_id = p_user_id
        AND c.challenge_type = 'streak'
        AND c.status = 'active'
        AND c.starts_at <= NOW()
        AND c.ends_at >= NOW()
    LOOP
        -- Check active status requirement
        IF v_streak_record.require_active_status AND v_user_status != 'active' THEN
            CONTINUE;
        END IF;
        
        v_last_date := v_streak_record.last_streak_date;
        
        -- Already checked today?
        IF v_last_date = v_today THEN
            CONTINUE;
        END IF;
        
        v_new_streak := COALESCE(v_streak_record.current_streak, 0);
        v_should_update := FALSE;
        v_points_awarded := 0;
        
        -- Determine action
        IF v_streak_record.streak_action_type = 'daily_login' THEN
            v_should_update := TRUE;
            v_new_streak := v_new_streak + 1;
        ELSIF v_streak_record.streak_action_type = 'daily_purchase' THEN
            SELECT COUNT(*) INTO v_today_orders
            FROM orders
            WHERE user_id = p_user_id
            AND payment_status = 'completed'
            AND created_at::DATE = v_today;
            
            IF v_today_orders > 0 THEN
                v_should_update := TRUE;
                v_new_streak := v_new_streak + 1;
            END IF;
        END IF;
        
        -- Check missed day / grace period
        IF NOT v_should_update AND v_last_date IS NOT NULL THEN
            IF v_today - v_last_date > COALESCE(v_streak_record.streak_grace_days, 0) + 1 THEN
                IF COALESCE(v_streak_record.streak_reset_on_miss, TRUE) THEN
                    v_new_streak := 0;
                    v_should_update := TRUE;
                END IF;
            ELSIF v_today - v_last_date = 1 THEN
                v_should_update := TRUE;
                v_new_streak := v_new_streak + 1;
            END IF;
        END IF;
        
        -- Update if needed
        IF v_should_update THEN
            v_points_awarded := COALESCE((v_streak_record.scoring_config->>'points_per_day')::INTEGER, 50);
            
            -- Milestone bonuses
            IF v_streak_record.scoring_config->'bonus_milestones' ? v_new_streak::TEXT THEN
                v_points_awarded := v_points_awarded + 
                    COALESCE((v_streak_record.scoring_config->'bonus_milestones'->>v_new_streak::TEXT)::INTEGER, 0);
            END IF;
            
            -- Update participant
            UPDATE challenge_participants
            SET current_streak = v_new_streak,
                last_streak_date = v_today,
                current_score = current_score + v_points_awarded,
                best_streak = GREATEST(best_streak, v_new_streak),
                last_action_at = NOW()
            WHERE id = v_streak_record.participant_id;
            
            -- Record action
            INSERT INTO challenge_actions (
                challenge_id, user_id, action_type, points_awarded, action_metadata
            ) VALUES (
                v_streak_record.challenge_id, p_user_id, 'streak_day_completed', 
                v_points_awarded,
                jsonb_build_object('streak_day', v_new_streak, 'streak_type', v_streak_record.streak_action_type)
            );
            
            -- Live ticker
            INSERT INTO challenge_live_ticker (
                challenge_id, user_name, action_text, points_awarded
            )
            SELECT 
                v_streak_record.challenge_id,
                COALESCE(full_name, 'Anonymous'),
                'Maintained ' || v_new_streak::TEXT || '-day streak! 🔥',
                v_points_awarded
            FROM users WHERE id = p_user_id;
            
            -- Recalculate ranks
            PERFORM recalculate_challenge_ranks(v_streak_record.challenge_id);
            
            v_result := jsonb_build_object(
                'challenge_id', v_streak_record.challenge_id,
                'streak_day', v_new_streak,
                'points_awarded', v_points_awarded
            );
            v_results := v_results || v_result;
        END IF;
    END LOOP;
    
    RETURN json_build_object('success', true, 'results', v_results);
END;
$$;

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