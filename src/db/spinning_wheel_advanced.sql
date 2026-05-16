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

-- Drop the existing foreign key constraint
ALTER TABLE spin_attempts 
DROP CONSTRAINT IF EXISTS spin_attempts_user_id_fkey;

-- Add new foreign key to public.users
ALTER TABLE spin_attempts 
ADD CONSTRAINT spin_attempts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4. Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_spin_attempts_user_id 
ON spin_attempts(user_id);

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

-- Function to get user allocation
CREATE OR REPLACE FUNCTION get_user_allocation(
  p_user_id UUID,
  p_game_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_week_start DATE := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  v_allocation RECORD;
  v_game RECORD;
  v_result JSON;
BEGIN
  -- Get or create allocation record
  SELECT * INTO v_allocation
  FROM user_spin_allocations
  WHERE user_id = p_user_id 
    AND game_id = p_game_id 
    AND date = v_today;
  
  IF NOT FOUND THEN
    v_allocation := ROW(
      p_user_id, p_game_id, v_today, 
      0, 0, 0, NULL
    )::user_spin_allocations;
  END IF;
  
  -- Get game limits
  SELECT free_spins_per_day, free_spins_per_week, free_spins_total, points_per_paid_spin
  INTO v_game
  FROM spin_games
  WHERE id = p_game_id;
  
  -- Build JSON response
  SELECT json_build_object(
    'spins_used_today', COALESCE(v_allocation.spins_used_today, 0),
    'spins_used_this_week', COALESCE(v_allocation.spins_used_this_week, 0),
    'spins_used_total', COALESCE(v_allocation.spins_used_total, 0),
    'free_spins_remaining_today', GREATEST(0, v_game.free_spins_per_day - COALESCE(v_allocation.spins_used_today, 0)),
    'free_spins_remaining_week', GREATEST(0, v_game.free_spins_per_week - COALESCE(v_allocation.spins_used_this_week, 0)),
    'free_spins_remaining_total', GREATEST(0, v_game.free_spins_total - COALESCE(v_allocation.spins_used_total, 0)),
    'points_required_for_paid', v_game.points_per_paid_spin,
    'can_spin_free', GREATEST(0, v_game.free_spins_total - COALESCE(v_allocation.spins_used_total, 0)) > 0
                     AND GREATEST(0, v_game.free_spins_per_day - COALESCE(v_allocation.spins_used_today, 0)) > 0
                     AND GREATEST(0, v_game.free_spins_per_week - COALESCE(v_allocation.spins_used_this_week, 0)) > 0,
    'can_spin_paid', true  -- Will be checked in the spin function
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Create or replace the get_user_allocation function to handle missing users
CREATE OR REPLACE FUNCTION get_user_allocation(
  p_user_id UUID,
  p_game_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_week_start DATE := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  v_allocation RECORD;
  v_game RECORD;
  v_result JSON;
BEGIN
  -- Get or create allocation record
  SELECT * INTO v_allocation
  FROM user_spin_allocations
  WHERE user_id = p_user_id 
    AND game_id = p_game_id 
    AND date = v_today;
  
  -- If no allocation exists, create default values
  IF NOT FOUND THEN
    v_allocation := ROW(
      p_user_id, p_game_id, v_today, 
      0, 0, 0, NULL
    )::user_spin_allocations;
  END IF;
  
  -- Get game limits
  SELECT free_spins_per_day, free_spins_per_week, free_spins_total, points_per_paid_spin
  INTO v_game
  FROM spin_games
  WHERE id = p_game_id;
  
  -- Build JSON response
  SELECT json_build_object(
    'spins_used_today', COALESCE(v_allocation.spins_used_today, 0),
    'spins_used_this_week', COALESCE(v_allocation.spins_used_this_week, 0),
    'spins_used_total', COALESCE(v_allocation.spins_used_total, 0),
    'free_spins_remaining_today', GREATEST(0, COALESCE(v_game.free_spins_per_day, 0) - COALESCE(v_allocation.spins_used_today, 0)),
    'free_spins_remaining_week', GREATEST(0, COALESCE(v_game.free_spins_per_week, 0) - COALESCE(v_allocation.spins_used_this_week, 0)),
    'free_spins_remaining_total', GREATEST(0, COALESCE(v_game.free_spins_total, 0) - COALESCE(v_allocation.spins_used_total, 0)),
    'points_required_for_paid', COALESCE(v_game.points_per_paid_spin, 0),
    'can_spin_free', GREATEST(0, COALESCE(v_game.free_spins_total, 0) - COALESCE(v_allocation.spins_used_total, 0)) > 0
                     AND GREATEST(0, COALESCE(v_game.free_spins_per_day, 0) - COALESCE(v_allocation.spins_used_today, 0)) > 0
                     AND GREATEST(0, COALESCE(v_game.free_spins_per_week, 0) - COALESCE(v_allocation.spins_used_this_week, 0)) > 0,
    'can_spin_paid', true
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Main spin function - FIXED VERSION
CREATE OR REPLACE FUNCTION perform_spin(
  p_game_id UUID,
  p_spin_type TEXT  -- 'free', 'points', 'purchase', 'bonus'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_game RECORD;
  v_allocation RECORD;
  v_today DATE := CURRENT_DATE;
  v_selected_prize JSONB;
  v_points_awarded INT := 0;
  v_points_spent INT := 0;
  v_prize_display TEXT;
  v_attempt_id UUID;
  v_result JSON;
  v_user_points INT;
  v_random FLOAT;
  v_cumulative FLOAT := 0;
  v_prize_index INT := 0;
  v_prize_config JSONB;
  v_num_prizes INT;
BEGIN
  -- Get current user from auth
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get game details
  SELECT * INTO v_game
  FROM spin_games
  WHERE id = p_game_id AND is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW());
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found or not active';
  END IF;
  
  -- Check single prize not claimed
  IF v_game.is_single_prize AND v_game.single_prize_claimed THEN
    RAISE EXCEPTION 'Grand prize already claimed';
  END IF;
  
  -- Get or create allocation record
  SELECT * INTO v_allocation
  FROM user_spin_allocations
  WHERE user_id = v_user_id AND game_id = p_game_id AND date = v_today;
  
  IF NOT FOUND THEN
    INSERT INTO user_spin_allocations (user_id, game_id, date, spins_used_today, spins_used_this_week, spins_used_total)
    VALUES (v_user_id, p_game_id, v_today, 0, 0, 0)
    RETURNING * INTO v_allocation;
  END IF;
  
  -- Check spin eligibility
  IF p_spin_type = 'free' THEN
    IF v_game.free_spins_total <= v_allocation.spins_used_total THEN
      RAISE EXCEPTION 'No free spins remaining (total limit)';
    END IF;
    IF v_game.free_spins_per_day <= v_allocation.spins_used_today THEN
      RAISE EXCEPTION 'No free spins remaining (daily limit)';
    END IF;
    IF v_game.free_spins_per_week <= v_allocation.spins_used_this_week THEN
      RAISE EXCEPTION 'No free spins remaining (weekly limit)';
    END IF;
  ELSIF p_spin_type = 'points' THEN
    -- Get user points balance
    SELECT points INTO v_user_points
    FROM loyalty_points
    WHERE user_id = v_user_id;
    
    IF v_user_points IS NULL OR v_user_points < v_game.points_per_paid_spin THEN
      RAISE EXCEPTION 'Insufficient points. Need % points', v_game.points_per_paid_spin;
    END IF;
    
    v_points_spent := v_game.points_per_paid_spin;
    
    -- Deduct points
    UPDATE loyalty_points
    SET points = points - v_points_spent,
        updated_at = NOW()
    WHERE user_id = v_user_id;
  END IF;
  
  -- FIXED: Select prize based on probability using jsonb_array_length
  v_prize_config := v_game.prize_config;
  v_num_prizes := jsonb_array_length(v_prize_config);
  v_random := RANDOM() * 100;
  
  FOR i IN 0..v_num_prizes - 1 LOOP
    v_cumulative := v_cumulative + (v_prize_config->i->>'probability')::FLOAT;
    IF v_random <= v_cumulative THEN
      v_prize_index := i;
      EXIT;
    END IF;
  END LOOP;
  
  v_selected_prize := v_prize_config->v_prize_index;
  
  -- Award prize based on type
  CASE v_selected_prize->>'type'
    WHEN 'points' THEN
      v_points_awarded := (v_selected_prize->>'value')::INT;
      v_prize_display := v_points_awarded || ' points';
      
      -- Award points
      INSERT INTO loyalty_points (user_id, points, tier)
      VALUES (v_user_id, v_points_awarded, 'bronze')
      ON CONFLICT (user_id) 
      DO UPDATE SET points = loyalty_points.points + v_points_awarded,
                    updated_at = NOW();
                    
    WHEN 'discount' THEN
      v_prize_display := (v_selected_prize->>'value') || '% off';
      
    WHEN 'free_shipping' THEN
      v_prize_display := 'Free Shipping';
      
    WHEN 'product' THEN
      v_prize_display := 'Free ' || (v_selected_prize->>'value');
      
    WHEN 'bundle' THEN
      v_prize_display := 'Free ' || (v_selected_prize->>'value') || ' Bundle';
  END CASE;
  
  -- Record spin attempt
  INSERT INTO spin_attempts (
    game_id, user_id, spin_type, prize_type, prize_value,
    points_awarded, points_spent, segment_index, landed_at
  ) VALUES (
    p_game_id, v_user_id, p_spin_type, 
    v_selected_prize->>'type', 
    v_selected_prize->>'value',
    v_points_awarded, v_points_spent, v_prize_index, NOW()
  )
  RETURNING id INTO v_attempt_id;
  
  -- Update allocation
  UPDATE user_spin_allocations
  SET spins_used_today = spins_used_today + 1,
      spins_used_this_week = spins_used_this_week + 1,
      spins_used_total = spins_used_total + 1,
      last_spin_at = NOW()
  WHERE user_id = v_user_id AND game_id = p_game_id AND date = v_today;
  
  -- Update single prize if claimed
  IF v_game.is_single_prize AND p_spin_type != 'points' THEN
    UPDATE spin_games
    SET single_prize_claimed = true,
        single_prize_winner_id = v_user_id
    WHERE id = p_game_id;
  END IF;
  
  -- Add to live ticker for big wins
  IF v_points_awarded >= 100 OR v_selected_prize->>'type' IN ('product', 'bundle') THEN
    INSERT INTO spin_live_ticker (game_id, user_name, prize_text)
    SELECT p_game_id, COALESCE(full_name, 'Customer'), v_prize_display
    FROM users
    WHERE id = v_user_id;
  END IF;
  
  -- Return result
  SELECT json_build_object(
    'id', v_attempt_id,
    'prize_type', v_selected_prize->>'type',
    'prize_value', v_selected_prize->>'value',
    'prize_display', v_prize_display,
    'points_awarded', v_points_awarded,
    'points_spent', v_points_spent,
    'segment_index', v_prize_index
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Create a database function to get participant stats efficiently
-- Returns default stats even when no data exists
CREATE OR REPLACE FUNCTION get_game_participant_stats(p_game_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_participants BIGINT;
  v_total_spins BIGINT;
BEGIN
  -- Get total unique participants
  SELECT COUNT(DISTINCT user_id) INTO v_total_participants
  FROM spin_attempts 
  WHERE game_id = p_game_id;
  
  -- Get total spins
  SELECT COUNT(*) INTO v_total_spins
  FROM spin_attempts 
  WHERE game_id = p_game_id;
  
  -- Return JSON with defaults (0 if NULL)
  RETURN json_build_object(
    'total_participants', COALESCE(v_total_participants, 0),
    'total_spins', COALESCE(v_total_spins, 0)
  );
END;
$$;

-- Create a function to get all participants with their stats
-- Returns empty array when no data exists
CREATE OR REPLACE FUNCTION get_game_participants(p_game_id UUID, p_limit INT DEFAULT 50)
RETURNS TABLE(
  id UUID,
  name TEXT,
  avatar TEXT,
  first_spin_at TIMESTAMPTZ,
  spin_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH participant_stats AS (
    SELECT 
      u.id,
      COALESCE(u.full_name, 'Anonymous') as name,
      UPPER(LEFT(COALESCE(u.full_name, '?'), 1)) as avatar,
      MIN(sa.created_at) as first_spin_at,
      COUNT(*) as spin_count
    FROM spin_attempts sa
    INNER JOIN users u ON sa.user_id = u.id
    WHERE sa.game_id = p_game_id
    GROUP BY u.id, u.full_name
    ORDER BY spin_count DESC, first_spin_at DESC
    LIMIT p_limit
  )
  SELECT 
    ps.id,
    ps.name,
    ps.avatar,
    ps.first_spin_at,
    ps.spin_count
  FROM participant_stats ps;
  
  -- If no results, this will return an empty set (not NULL)
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION perform_spin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_allocation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_spin_state(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_game_participant_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_game_participants(UUID, INT) TO authenticated;