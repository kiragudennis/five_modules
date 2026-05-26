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

-- Add auto_redraw_days max_redraws and draw_group_id
ALTER TABLE draws ADD COLUMN IF NOT EXISTS auto_redraw_days integer DEFAULT 7;
ALTER TABLE draws ADD COLUMN IF NOT EXISTS max_redraws integer DEFAULT 1;
ALTER TABLE draws ADD COLUMN IF NOT EXISTS draw_group_id uuid REFERENCES draw_groups(id) ON DELETE SET NULL;
ALTER TABLE draws ADD COLUMN IF NOT EXISTS consolation_points_amount integer DEFAULT 50;
-- Enhanced draws table with advanced features
ALTER TABLE draws ADD COLUMN IF NOT EXISTS redraw_count INTEGER DEFAULT 0;
ALTER TABLE draws ADD COLUMN IF NOT EXISTS winner_announcement_text TEXT;
-- Add entry calculation configuration to draws
ALTER TABLE draws ADD COLUMN IF NOT EXISTS entry_calculation JSONB DEFAULT '{
  "purchase": {
    "enabled": true,
    "entries_per_ksh": 0.05,
    "min_purchase": 1000,
    "max_entries_per_order": 5000
  },
  "referral": {
    "enabled": true,
    "entries_per_referral": 100,
    "bonus_for_first_referral": 50
  },
  "social_share": {
    "enabled": true,
    "entries_per_share": 10
  },
  "live_stream": {
    "enabled": true,
    "entries_per_entry": 5
  }
}'::jsonb;

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

-- Add claim tracking to draw_winners table
ALTER TABLE draw_winners 
ADD COLUMN IF NOT EXISTS claim_details JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_city TEXT,
ADD COLUMN IF NOT EXISTS shipping_county TEXT,
ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
ADD COLUMN IF NOT EXISTS shipping_phone TEXT,
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_expected_by TIMESTAMPTZ;

-- Create claim verification tokens
CREATE TABLE IF NOT EXISTS draw_claim_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to generate claim token
CREATE OR REPLACE FUNCTION generate_claim_token(p_draw_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token TEXT;
BEGIN
    v_token := encode(gen_random_bytes(32), 'base64');
    v_token := replace(v_token, '/', '_');
    v_token := replace(v_token, '+', '-');
    v_token := substring(v_token, 1, 32);
    
    INSERT INTO draw_claim_tokens (draw_id, user_id, token, expires_at)
    VALUES (p_draw_id, p_user_id, v_token, NOW() + INTERVAL '7 days');
    
    RETURN v_token;
END;
$$;

-- Indexes
CREATE INDEX idx_draws_status_dates ON draws(status, entry_starts_at, entry_ends_at);
CREATE INDEX idx_draw_entries_draw_user ON draw_entries(draw_id, user_id);
CREATE INDEX idx_draw_tickets_draw ON draw_tickets(draw_id, is_winner);
CREATE INDEX idx_draw_tickets_user ON draw_tickets(draw_id, user_id);
CREATE INDEX idx_draw_live_ticker_draw ON draw_live_ticker(draw_id, created_at DESC);
CREATE INDEX idx_draw_winners_draw ON draw_winners(draw_id);
CREATE INDEX idx_draw_winners_claim ON draw_winners(claim_status, expires_at);

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
-- Add columns to track draw entries from this order
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS draw_entries_awarded INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS draw_id UUID REFERENCES draws(id),
ADD COLUMN IF NOT EXISTS draw_entry_details JSONB DEFAULT '{}'::jsonb;

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

-- Create RPC function to get all draws with aggregated stats
-- Create RPC function to get all draws with aggregated stats
CREATE OR REPLACE FUNCTION get_draws_with_stats(
  p_group_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  prize_name TEXT,
  prize_description TEXT,
  prize_image_url TEXT,
  prize_value NUMERIC,
  entry_config JSONB,
  max_entries_total INTEGER,
  max_entries_per_user INTEGER,
  entry_starts_at TIMESTAMPTZ,
  entry_ends_at TIMESTAMPTZ,
  draw_time TIMESTAMPTZ,
  status TEXT,
  winner_id UUID,
  winner_announced_at TIMESTAMPTZ,
  winner_claim_expires_at TIMESTAMPTZ,
  consolation_points_awarded BOOLEAN,
  theme_color TEXT,
  show_entry_ticker BOOLEAN,
  show_leaderboard BOOLEAN,
  created_at TIMESTAMPTZ,
  draw_group_id UUID,
  consolation_points_amount INTEGER,
  auto_redraw_days INTEGER,
  redraw_count INTEGER,
  max_redraws INTEGER,
  winner_announcement_text TEXT,
  total_entries BIGINT,
  total_participants BIGINT,
  total_winners BIGINT,
  total_claimed_winners BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.slug,
    d.description,
    d.prize_name,
    d.prize_description,
    d.prize_image_url,
    d.prize_value,
    d.entry_config,
    d.max_entries_total,
    d.max_entries_per_user,
    d.entry_starts_at,
    d.entry_ends_at,
    d.draw_time,
    d.status,
    d.winner_id,
    d.winner_announced_at,
    d.winner_claim_expires_at,
    COALESCE(d.consolation_points_awarded, false) as consolation_points_awarded,
    d.theme_color,
    COALESCE(d.show_entry_ticker, true) as show_entry_ticker,
    COALESCE(d.show_leaderboard, false) as show_leaderboard,
    d.created_at,
    d.draw_group_id,
    COALESCE(d.consolation_points_amount, 0) as consolation_points_amount,
    COALESCE(d.auto_redraw_days, 7) as auto_redraw_days,
    COALESCE(d.redraw_count, 0) as redraw_count,
    COALESCE(d.max_redraws, 1) as max_redraws,
    d.winner_announcement_text,
    COALESCE((SELECT COUNT(*)::BIGINT FROM draw_entries de WHERE de.draw_id = d.id), 0) as total_entries,
    COALESCE((SELECT COUNT(DISTINCT de.user_id)::BIGINT FROM draw_entries de WHERE de.draw_id = d.id), 0) as total_participants,
    COALESCE((SELECT COUNT(*)::BIGINT FROM draw_winners dw WHERE dw.draw_id = d.id), 0) as total_winners,
    COALESCE((SELECT COUNT(*)::BIGINT FROM draw_winners dw WHERE dw.draw_id = d.id AND dw.claim_status = 'claimed'), 0) as total_claimed_winners
  FROM draws d
  WHERE (p_group_id IS NULL OR d.draw_group_id = p_group_id)
  ORDER BY d.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_draws_with_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_draws_with_stats(UUID) TO anon;

-- Function to award draw entries based on purchase
-- Function to award draw entries based on purchase (Updated with order tracking)
CREATE OR REPLACE FUNCTION award_draw_entries_on_purchase(
  p_order_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_user_id UUID;
  v_draw RECORD;
  v_entry_count INTEGER := 0;
  v_entries_awarded INTEGER := 0;
  v_result JSON;
BEGIN
  -- Get order details
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id AND payment_status = 'completed';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Order not found or not paid');
  END IF;
  
  -- Skip if draw entries already awarded for this order
  IF v_order.draw_entries_awarded > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Draw entries already awarded', 'already_awarded', true);
  END IF;
  
  v_user_id := v_order.user_id;
  
  -- Find the best draw for this user
  -- Priority: Draws the user has already entered, then draws closing soonest
  SELECT d.* INTO v_draw
  FROM draws d
  WHERE d.status = 'open'
    AND d.entry_starts_at <= NOW()
    AND d.entry_ends_at >= NOW()
    AND (d.entry_calculation->'purchase'->>'enabled')::boolean = true
  ORDER BY 
    CASE WHEN EXISTS (
      SELECT 1 FROM draw_entries de WHERE de.draw_id = d.id AND de.user_id = v_user_id
    ) THEN 1 ELSE 2 END,
    d.entry_ends_at ASC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'No active draws accepting purchase entries');
  END IF;
  
  -- Calculate entries based on order amount
  v_entry_count := FLOOR(
    v_order.total_amount * (v_draw.entry_calculation->'purchase'->>'entries_per_ksh')::numeric
  );
  
  -- Apply minimum purchase requirement
  IF v_order.total_amount < (v_draw.entry_calculation->'purchase'->>'min_purchase')::numeric THEN
    RETURN json_build_object('success', false, 'error', 'Order amount below minimum threshold');
  END IF;
  
  -- Apply max entries per order
  v_entry_count := LEAST(
    v_entry_count,
    (v_draw.entry_calculation->'purchase'->>'max_entries_per_order')::integer
  );
  
  IF v_entry_count <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Entry count too low');
  END IF;
  
  -- Add entries to draw
  INSERT INTO draw_entries (draw_id, user_id, entry_count, entry_method, source_id, metadata)
  VALUES (v_draw.id, v_user_id, v_entry_count, 'purchase', p_order_id::text, jsonb_build_object(
    'order_id', p_order_id,
    'order_amount', v_order.total_amount,
    'order_number', v_order.order_number,
    'awarded_at', NOW()
  ));
  
  -- Create individual tickets
  FOR i IN 1..v_entry_count LOOP
    INSERT INTO draw_tickets (draw_id, user_id, entry_id, ticket_number)
    VALUES (v_draw.id, v_user_id, currval('draw_entries_id_seq'), i);
  END LOOP;
  
  -- Add to live ticker
  INSERT INTO draw_live_ticker (draw_id, user_name, entry_count, entry_method)
  SELECT v_draw.id, COALESCE(u.full_name, 'Customer'), v_entry_count, 'purchase'
  FROM users u WHERE u.id = v_user_id;
  
  v_entries_awarded := v_entry_count;
  
  -- Update order with draw entry information
  UPDATE orders
  SET 
    draw_entries_awarded = v_entries_awarded,
    draw_id = v_draw.id,
    draw_entry_details = jsonb_build_object(
      'draw_name', v_draw.name,
      'entries_awarded', v_entries_awarded,
      'calculation', jsonb_build_object(
        'order_amount', v_order.total_amount,
        'entries_per_ksh', (v_draw.entry_calculation->'purchase'->>'entries_per_ksh')::numeric,
        'min_purchase', (v_draw.entry_calculation->'purchase'->>'min_purchase')::numeric,
        'max_entries', (v_draw.entry_calculation->'purchase'->>'max_entries_per_order')::integer
      ),
      'awarded_at', NOW()
    ),
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{draw_entries}',
      jsonb_build_object(
        'draw_id', v_draw.id,
        'draw_name', v_draw.name,
        'entries_awarded', v_entries_awarded,
        'awarded_at', NOW()
      )
    )
  WHERE id = p_order_id;
  
  RETURN json_build_object(
    'success', true,
    'draw_id', v_draw.id,
    'draw_name', v_draw.name,
    'entries_awarded', v_entries_awarded,
    'order_id', p_order_id,
    'order_number', v_order.order_number
  );
END;
$$;

-- Function to award draw entries on referral conversion
CREATE OR REPLACE FUNCTION award_draw_entries_on_referral(
  p_referral_id UUID,
  p_conversion_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referral RECORD;
  v_draw RECORD;
  v_entry_count INTEGER := 0;
  v_entries_awarded INTEGER := 0;
BEGIN
  -- Get referral details
  SELECT * INTO v_referral
  FROM referrals
  WHERE id = p_referral_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Referral not found');
  END IF;
  
  -- Find the best draw for the referrer
  SELECT d.* INTO v_draw
  FROM draws d
  WHERE d.status = 'open'
    AND d.entry_starts_at <= NOW()
    AND d.entry_ends_at >= NOW()
    AND (d.entry_calculation->'referral'->>'enabled')::boolean = true
  ORDER BY d.entry_ends_at ASC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'No active draws accepting referral entries');
  END IF;
  
  -- Calculate entries based on referral type
  IF p_conversion_type = 'signup' THEN
    v_entry_count := (v_draw.entry_calculation->'referral'->>'entries_per_referral')::integer;
    
    -- Bonus for first referral
    SELECT COUNT(*) INTO v_entry_count
    FROM referrals r
    WHERE r.referrer_id = v_referral.referrer_id
      AND r.status = 'completed'
      AND r.id != p_referral_id;
    
    IF v_entry_count = 0 THEN
      v_entry_count := v_entry_count + (v_draw.entry_calculation->'referral'->>'bonus_for_first_referral')::integer;
    END IF;
    
  ELSIF p_conversion_type = 'first_purchase' THEN
    v_entry_count := (v_draw.entry_calculation->'referral'->>'entries_per_purchase')::integer;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid conversion type');
  END IF;
  
  IF v_entry_count <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Entry count too low');
  END IF;
  
  -- Add entries to draw for referrer
  INSERT INTO draw_entries (draw_id, user_id, entry_count, entry_method, source_id, metadata)
  VALUES (v_draw.id, v_referral.referrer_id, v_entry_count, 'referral', p_referral_id::text, jsonb_build_object(
    'referral_id', p_referral_id,
    'conversion_type', p_conversion_type,
    'referred_user_id', v_referral.referred_user_id
  ));
  
  -- Create individual tickets
  FOR i IN 1..v_entry_count LOOP
    INSERT INTO draw_tickets (draw_id, user_id, entry_id, ticket_number)
    VALUES (v_draw.id, v_referral.referrer_id, currval('draw_entries_id_seq'), i);
  END LOOP;
  
  -- Add to live ticker
  INSERT INTO draw_live_ticker (draw_id, user_name, entry_count, entry_method)
  SELECT v_draw.id, COALESCE(u.full_name, 'Customer'), v_entry_count, 'referral'
  FROM users u WHERE u.id = v_referral.referrer_id;
  
  -- Update referral record
  UPDATE referrals
  SET draw_entries_awarded = TRUE,
      draw_entries_count = v_entry_count,
      draw_id = v_draw.id
  WHERE id = p_referral_id;
  
  v_entries_awarded := v_entry_count;
  
  RETURN json_build_object(
    'success', true,
    'draw_id', v_draw.id,
    'draw_name', v_draw.name,
    'entries_awarded', v_entries_awarded
  );
END;
$$;

-- Trigger on orders when payment completes
CREATE OR REPLACE FUNCTION trigger_award_draw_entries_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS DISTINCT FROM 'completed') THEN
    PERFORM award_draw_entries_on_purchase(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_award_draw_entries
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_award_draw_entries_on_order();

-- Trigger on referrals when they complete
CREATE OR REPLACE FUNCTION trigger_award_draw_entries_on_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    PERFORM award_draw_entries_on_referral(NEW.id, NEW.conversion_type);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_award_draw_referral_entries
  AFTER UPDATE ON referrals
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION trigger_award_draw_entries_on_referral();

-- RPC function to award live stream entry to authenticated user
CREATE OR REPLACE FUNCTION award_live_stream_entry(p_draw_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_draw RECORD;
  v_entry_count INTEGER;
  v_has_entry BOOLEAN;
  v_entry_id UUID;
BEGIN
  -- Get current authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get draw configuration
  SELECT * INTO v_draw
  FROM draws
  WHERE id = p_draw_id 
    AND status = 'open'
    AND entry_starts_at <= NOW()
    AND entry_ends_at >= NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Draw not open for entries');
  END IF;
  
  -- Check if user already received live stream entry for this draw
  SELECT EXISTS(
    SELECT 1 FROM draw_entries 
    WHERE draw_id = p_draw_id 
      AND user_id = v_user_id 
      AND entry_method = 'live_stream_entry'
  ) INTO v_has_entry;
  
  IF v_has_entry THEN
    RETURN json_build_object('success', false, 'error', 'Live stream entry already awarded');
  END IF;
  
  -- Get entry count from config
  v_entry_count := COALESCE((v_draw.entry_config->'live_stream'->>'entries_per_email')::INTEGER, 5);
  
  -- Add entry to draw
  INSERT INTO draw_entries (draw_id, user_id, entry_count, entry_method, metadata)
  VALUES (p_draw_id, v_user_id, v_entry_count, 'live_stream_entry', jsonb_build_object(
    'awarded_at', NOW(),
    'source', 'live_broadcast'
  ))
  RETURNING id INTO v_entry_id;
  
  -- Create tickets
  FOR i IN 1..v_entry_count LOOP
    INSERT INTO draw_tickets (draw_id, user_id, entry_id, ticket_number)
    VALUES (p_draw_id, v_user_id, v_entry_id, i);
  END LOOP;
  
  -- Add to live ticker
  INSERT INTO draw_live_ticker (draw_id, user_name, entry_count, entry_method)
  SELECT p_draw_id, COALESCE(full_name, 'Customer'), v_entry_count, 'live_stream_entry'
  FROM users WHERE id = v_user_id;
  
  RETURN json_build_object(
    'success', true,
    'entries_awarded', v_entry_count,
    'message', 'Live stream entry awarded!'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION award_live_stream_entry(UUID) TO authenticated;

-- Create a view to show customers their draw entry history
-- Drop and recreate the view with winner information
DROP VIEW IF EXISTS customer_draw_entry_history;

CREATE OR REPLACE VIEW customer_draw_entry_history AS
SELECT 
  o.id as order_id,
  o.order_number,
  o.created_at as order_date,
  o.total_amount,
  o.draw_entries_awarded,
  o.draw_id,
  d.name as draw_name,
  d.draw_time,
  d.prize_name,
  d.status as draw_status,
  o.draw_entry_details,
  -- Check if user won this draw
  EXISTS (
    SELECT 1 FROM draw_winners dw 
    WHERE dw.draw_id = o.draw_id 
      AND dw.user_id = o.user_id 
      AND dw.winner_rank = 1
  ) as is_winner,
  -- Get winner rank if they won
  (
    SELECT winner_rank FROM draw_winners dw 
    WHERE dw.draw_id = o.draw_id 
      AND dw.user_id = o.user_id 
      AND dw.winner_rank = 1
    LIMIT 1
  ) as winner_rank,
  -- Get claim status if they won
  (
    SELECT claim_status FROM draw_winners dw 
    WHERE dw.draw_id = o.draw_id 
      AND dw.user_id = o.user_id 
      AND dw.winner_rank = 1
    LIMIT 1
  ) as winner_claim_status
FROM orders o
LEFT JOIN draws d ON o.draw_id = d.id
WHERE o.draw_entries_awarded > 0
  AND o.user_id = auth.uid()
ORDER BY o.created_at DESC;

-- Create a view for user's draw statistics
CREATE OR REPLACE VIEW user_draw_stats AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT de.draw_id) as total_draws_entered,
  SUM(de.entry_count) as total_entries,
  COUNT(DISTINCT dw.id) as total_wins,
  SUM(CASE WHEN dw.claim_status = 'claimed' THEN 1 ELSE 0 END) as claimed_wins,
  SUM(CASE WHEN dw.claim_status = 'pending' THEN 1 ELSE 0 END) as pending_wins,
  MAX(de.created_at) as last_entry_at
FROM users u
LEFT JOIN draw_entries de ON u.id = de.user_id
LEFT JOIN draw_winners dw ON u.id = dw.user_id AND dw.winner_rank = 1
GROUP BY u.id;