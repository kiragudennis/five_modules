-- db/draws_advanced.sql

-- Draws table
CREATE TABLE draws (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    
    -- Prize configuration
    prize_name text NOT NULL,
    prize_description text,
    prize_image_url text,
    prize_value numeric(10,2),
    
    -- Entry configuration
    entry_config jsonb NOT NULL DEFAULT '{}'::jsonb,
    -- Examples:
    -- {"purchase": {"min_amount": 1000, "entries_per_ksh": 1}}
    -- {"referral": {"entries_per_referral": 5}}
    -- {"social_share": {"entries_per_share": 2}}
    -- {"live_stream": {"entries_per_email": 1}}
    -- {"loyalty_tier": {"bronze": 1, "silver": 2, "gold": 5, "platinum": 10}}
    
    -- Total entry limit (null = unlimited)
    max_entries_total integer,
    max_entries_per_user integer,
    
    -- Timing
    entry_starts_at timestamptz NOT NULL,
    entry_ends_at timestamptz NOT NULL,
    draw_time timestamptz NOT NULL,
    
    -- Status
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'drawing', 'completed', 'cancelled')),
    
    -- Winner management
    winner_id uuid,
    winner_announced_at timestamptz,
    winner_claimed_at timestamptz,
    winner_claim_expires_at timestamptz,
    consolation_points_awarded boolean DEFAULT false,
    
    -- Display settings
    theme_color text DEFAULT '#8B5CF6',
    show_entry_ticker boolean DEFAULT true,
    show_leaderboard boolean DEFAULT false,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Draw entries
CREATE TABLE IF NOT EXISTS draw_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id uuid REFERENCES draws(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    
    entry_count integer NOT NULL DEFAULT 1,
    entry_method text NOT NULL CHECK (entry_method IN ('purchase', 'referral', 'social_share', 'live_stream_entry', 'loyalty_bonus', 'manual')),
    
    -- Metadata for tracking
    source_id text, -- order_id, referral_id, etc.
    metadata jsonb DEFAULT '{}'::jsonb,
    
    created_at timestamptz DEFAULT now()
);

-- Draw entry tickets (individual entries for fair random selection)
CREATE TABLE IF NOT EXISTS draw_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id uuid REFERENCES draws(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_id uuid REFERENCES draw_entries(id) ON DELETE CASCADE,
    ticket_number integer,
    
    is_winner boolean DEFAULT false,
    winner_rank integer,
    
    created_at timestamptz DEFAULT now()
);

-- Live ticker queue
CREATE TABLE IF NOT EXISTS draw_live_ticker (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id uuid REFERENCES draws(id) ON DELETE CASCADE,
    user_name text,
    entry_count integer,
    entry_method text,
    created_at timestamptz DEFAULT now()
);

-- Winner claim tracking
CREATE TABLE IF NOT EXISTS draw_winners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id uuid REFERENCES draws(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    winner_rank integer NOT NULL,
    prize_name text,
    prize_value numeric(10,2),
    
    claim_status text NOT NULL DEFAULT 'pending' CHECK (claim_status IN ('pending', 'claimed', 'expired')),
    claimed_at timestamptz,
    expires_at timestamptz,
    
    notified_at timestamptz,
    notified_method text, -- email, sms, push
    
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_draws_status_dates ON draws(status, entry_starts_at, entry_ends_at);
CREATE INDEX idx_draw_entries_draw_user ON draw_entries(draw_id, user_id);
CREATE INDEX idx_draw_tickets_draw ON draw_tickets(draw_id, is_winner);
CREATE INDEX idx_draw_tickets_user ON draw_tickets(draw_id, user_id);
CREATE INDEX idx_draw_live_ticker_draw ON draw_live_ticker(draw_id, created_at DESC);
CREATE INDEX idx_draw_winners_draw ON draw_winners(draw_id);
CREATE INDEX idx_draw_winners_claim ON draw_winners(claim_status, expires_at);