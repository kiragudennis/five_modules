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
    winner_name text,
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

-- Drop the existing foreign key constraint
ALTER TABLE draw_entries DROP CONSTRAINT IF EXISTS draw_entries_user_id_fkey;

-- Add new foreign key to public.users
ALTER TABLE draw_entries 
ADD CONSTRAINT draw_entries_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

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

-- Enhanced draws table with advanced features
ALTER TABLE draws ADD COLUMN IF NOT EXISTS consolation_points_awarded BOOLEAN DEFAULT false;
ALTER TABLE draws ADD COLUMN IF NOT EXISTS consolation_points_amount INTEGER DEFAULT 50;
ALTER TABLE draws ADD COLUMN IF NOT EXISTS auto_redraw_days INTEGER DEFAULT 7;
ALTER TABLE draws ADD COLUMN IF NOT EXISTS redraw_count INTEGER DEFAULT 0;
ALTER TABLE draws ADD COLUMN IF NOT EXISTS max_redraws INTEGER DEFAULT 1;
ALTER TABLE draws ADD COLUMN IF NOT EXISTS winner_announcement_text TEXT;

-- Create multiple draws support (grouping related draws)
CREATE TABLE draw_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE draws ADD COLUMN draw_group_id UUID REFERENCES draw_groups(id);

-- Enhanced draw entries with more entry methods
ALTER TABLE draw_entries DROP CONSTRAINT IF EXISTS draw_entries_entry_method_check;
ALTER TABLE draw_entries ADD CONSTRAINT draw_entries_entry_method_check 
    CHECK (entry_method IN ('purchase', 'referral', 'social_share', 'live_stream_entry', 'loyalty_bonus', 'manual', 'points_redeem', 'product_review', 'newsletter_signup'));

-- Social share tracking table
CREATE TABLE draw_social_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'instagram', 'whatsapp', 'tiktok')),
    share_url TEXT,
    share_type TEXT CHECK (share_type IN ('product', 'draw', 'referral')),
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(draw_id, user_id, platform, share_type)
);

-- Live stream entry tracking
CREATE TABLE draw_live_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    user_id UUID REFERENCES users(id),
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    is_converted BOOLEAN DEFAULT false
);

-- Draw leaderboard snapshot (for historical tracking)
CREATE TABLE draw_leaderboard_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
    snapshot_data JSONB NOT NULL,
    snapshot_type TEXT CHECK (snapshot_type IN ('hourly', 'daily', 'final')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Draw phase logs (for audit trail)
CREATE TABLE draw_phase_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
    phase_from TEXT,
    phase_to TEXT,
    triggered_by UUID REFERENCES users(id),
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Redraw history
CREATE TABLE draw_redraw_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
    previous_winner_id UUID REFERENCES users(id),
    new_winner_id UUID REFERENCES users(id),
    reason TEXT,
    redrawn_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create draw groups table for managing multiple concurrent draws
CREATE TABLE IF NOT EXISTS draw_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Add draw_group_id to draws table
ALTER TABLE draws ADD COLUMN IF NOT EXISTS draw_group_id UUID REFERENCES draw_groups(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_draw_groups_created ON draw_groups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_draws_group_id ON draws(draw_group_id);

-- Enable real-time for draw_groups
ALTER TABLE draw_groups REPLICA IDENTITY FULL;

-- Add RLS policies
ALTER TABLE draw_groups ENABLE ROW LEVEL SECURITY;

-- Anyone can view draw groups
CREATE POLICY "Anyone can view draw groups" ON draw_groups
    FOR SELECT USING (true);

-- Only admins can modify draw groups
CREATE POLICY "Admins can manage draw groups" ON draw_groups
    FOR ALL USING (public.is_admin());

-- Add sample draw groups (optional)
INSERT INTO draw_groups (name, description) VALUES
    ('Weekly Draws', 'Recurring weekly giveaways every Friday'),
    ('Monthly Grand Draws', 'Big monthly prizes at the end of each month'),
    ('Flash Draws', 'Limited-time draws during live streams')
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX idx_draw_entries_method ON draw_entries(entry_method);
CREATE INDEX idx_draw_entries_created ON draw_entries(created_at DESC);
CREATE INDEX idx_draw_tickets_winner ON draw_tickets(is_winner, winner_rank);
CREATE INDEX idx_draw_live_entries_email ON draw_live_entries(email);
CREATE INDEX idx_draw_social_shares_user ON draw_social_shares(draw_id, user_id);

-- Enable real-time for all draw tables
ALTER TABLE draws REPLICA IDENTITY FULL;
ALTER TABLE draw_entries REPLICA IDENTITY FULL;
ALTER TABLE draw_tickets REPLICA IDENTITY FULL;
ALTER TABLE draw_live_ticker REPLICA IDENTITY FULL;
ALTER TABLE draw_winners REPLICA IDENTITY FULL;

-- RLS policies for draw entries
CREATE POLICY "Users can view their own entries" ON draw_entries
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all entries" ON draw_entries
    FOR ALL USING (public.is_admin());

-- RLS policies for draw tickets
CREATE POLICY "Users can view their own tickets" ON draw_tickets
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all tickets" ON draw_tickets
    FOR ALL USING (public.is_admin());

-- RLS policies for draw winners
CREATE POLICY "Users can view their own winnings" ON draw_winners
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all winnings" ON draw_winners
    FOR ALL USING (public.is_admin());

-- RLS policies for draws
CREATE POLICY "Users can view open draws" ON draws
    FOR SELECT USING (status = 'open' OR public.is_admin());
CREATE POLICY "Admins can manage all draws" ON draws
    FOR ALL USING (public.is_admin());


-- Create a function to get aggregated entries
CREATE OR REPLACE FUNCTION get_draw_participants_with_entries(draw_id_param UUID)
RETURNS TABLE(user_id UUID, total_entries BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.user_id,
    SUM(de.entry_count)::BIGINT as total_entries
  FROM draw_entries de
  WHERE de.draw_id = draw_id_param
  GROUP BY de.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get referral leaderboard
CREATE OR REPLACE FUNCTION get_referral_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  referrer_id UUID,
  full_name TEXT,
  referral_count BIGINT,
  points_earned BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.referrer_id,
    u.full_name::TEXT,
    COUNT(*)::BIGINT as referral_count,
    SUM(r.reward_points)::BIGINT as points_earned
  FROM referrals r
  JOIN users u ON r.referrer_id = u.id
  WHERE r.status = 'completed'
  GROUP BY r.referrer_id, u.full_name
  ORDER BY referral_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;