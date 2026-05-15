-- db/spinning_wheel_advanced.sql

drop table if exists spin_games;

-- Multi-game configuration table
CREATE TABLE spin_games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    game_type text NOT NULL DEFAULT 'standard' CHECK (game_type IN ('standard', 'vip', 'new_customer', 'weekend', 'flash')),
    
    -- Eligibility rules
    eligible_tiers text[] DEFAULT '{}',
    min_points_required integer DEFAULT 0,
    requires_purchase_count integer DEFAULT 0,
    new_customer_only boolean DEFAULT false,
    
    -- Game settings
    free_spins_per_day integer DEFAULT 1,
    free_spins_per_week integer DEFAULT 5,
    free_spins_total integer DEFAULT 3,
    points_per_paid_spin integer DEFAULT 50,
    
    -- Prize configuration (JSONB array)
    prize_config jsonb NOT NULL DEFAULT '[]'::jsonb,
    
    -- Single-prize mode (auto-lock when won)
    is_single_prize boolean DEFAULT false,
    single_prize_claimed boolean DEFAULT false,
    single_prize_winner_id uuid,
    
    -- Timing
    starts_at timestamptz,
    ends_at timestamptz,
    is_active boolean DEFAULT true,
    
    -- Live display settings
    live_theme text DEFAULT 'default',
    show_confetti boolean DEFAULT true,
    play_sounds boolean DEFAULT true,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Track individual spins
CREATE TABLE IF NOT EXISTS spin_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid REFERENCES spin_games(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    
    spin_type text NOT NULL CHECK (spin_type IN ('free', 'points', 'purchase', 'bonus')),
    prize_type text NOT NULL,
    prize_value text,
    points_awarded integer DEFAULT 0,
    points_spent integer DEFAULT 0,
    
    segment_index integer NOT NULL,
    landed_at timestamptz DEFAULT now(),
    
    created_at timestamptz DEFAULT now()
);

-- Track daily/weekly free spin allocations
CREATE TABLE IF NOT EXISTS user_spin_allocations (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id uuid REFERENCES spin_games(id) ON DELETE CASCADE,
    date date DEFAULT CURRENT_DATE,
    spins_used_today integer DEFAULT 0,
    spins_used_this_week integer DEFAULT 0,
    spins_used_total integer DEFAULT 0,
    last_spin_at timestamptz,
    
    PRIMARY KEY (user_id, game_id, date)
);

-- Live ticker queue
CREATE TABLE IF NOT EXISTS spin_live_ticker (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid REFERENCES spin_games(id) ON DELETE CASCADE,
    user_name text,
    prize_text text,
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_spin_attempts_game_user ON spin_attempts(game_id, user_id);
CREATE INDEX idx_spin_attempts_created ON spin_attempts(created_at DESC);
CREATE INDEX idx_spin_games_active ON spin_games(is_active, starts_at, ends_at);
CREATE INDEX idx_spin_live_ticker_game_created ON spin_live_ticker(game_id, created_at DESC);

-- RLS policies
-- spin_games: Admins can manage all, users can view active games
CREATE POLICY "Allow admin access" ON spin_games FOR ALL 
USING (public.is_admin());
CREATE POLICY "Allow users to view active games" ON spin_games FOR SELECT
USING (is_active AND starts_at <= now() AND ends_at >= now());

-- spin_attempts: Users can see their own attempts, admins can see all
CREATE POLICY "Allow admin access" ON spin_attempts FOR ALL
USING (public.is_admin());
CREATE POLICY "Allow users to see their own attempts" ON spin_attempts FOR SELECT
USING (user_id = auth.uid());


CREATE OR REPLACE FUNCTION increment_spin_usage(
  p_user_id uuid,
  p_game_id uuid,
  p_date date
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_spin_allocations (user_id, game_id, date, spins_used_today, spins_used_this_week, spins_used_total)
  VALUES (p_user_id, p_game_id, p_date, 1, 1, 1)
  ON CONFLICT (user_id, game_id, date) DO UPDATE
  SET 
    spins_used_today = user_spin_allocations.spins_used_today + 1,
    spins_used_this_week = user_spin_allocations.spins_used_this_week + 1,
    spins_used_total = user_spin_allocations.spins_used_total + 1,
    last_spin_at = NOW();
END;
$$;