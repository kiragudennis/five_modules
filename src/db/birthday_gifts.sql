-- Create birthday_gifts table
CREATE TABLE IF NOT EXISTS birthday_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  points_awarded integer NOT NULL,
  year integer NOT NULL,
  sent_at timestamptz DEFAULT now(),
  email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX idx_birthday_gifts_customer_id ON birthday_gifts(customer_id);
CREATE INDEX idx_birthday_gifts_year ON birthday_gifts(year);

-- Function to award birthday points
CREATE OR REPLACE FUNCTION award_birthday_points(
  p_user_id uuid,
  p_points integer,
  p_description text DEFAULT 'Birthday gift'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_points integer;
  v_new_tier text;
  v_result json;
BEGIN

  -- Check if user is admin
    IF NOT public.verify_admin_access() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Check if points were already awarded this year
  IF EXISTS (
    SELECT 1 FROM loyalty_transactions 
    WHERE user_id = p_user_id 
    AND transaction_type = 'earned'
    AND description LIKE '%Birthday gift%'
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Birthday points already awarded this year');
  END IF;
  
  -- Update loyalty points
  INSERT INTO loyalty_points (user_id, points, points_earned)
  VALUES (p_user_id, p_points, p_points)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    points = loyalty_points.points + p_points,
    points_earned = loyalty_points.points_earned + p_points,
    updated_at = NOW()
  RETURNING points INTO v_current_points;
  
  -- Record transaction
  INSERT INTO loyalty_transactions (
    user_id, 
    points_change, 
    current_points, 
    transaction_type, 
    description,
    expires_at
  ) VALUES (
    p_user_id,
    p_points,
    v_current_points,
    'earned',
    p_description || ' ' || EXTRACT(YEAR FROM NOW()),
    NOW() + INTERVAL '365 days'
  );
  
  -- Check and update tier
  SELECT tier INTO v_new_tier
  FROM loyalty_tiers
  WHERE min_points <= v_current_points
  ORDER BY min_points DESC
  LIMIT 1;
  
  UPDATE loyalty_points
  SET tier = v_new_tier, updated_at = NOW()
  WHERE user_id = p_user_id AND tier != v_new_tier;
  
  -- Create birthday gift record
  INSERT INTO birthday_gifts (
    customer_id,
    points_awarded,
    year,
    sent_at,
    email_sent
  ) VALUES (
    p_user_id,
    p_points,
    EXTRACT(YEAR FROM NOW()),
    NOW(),
    true
  );
  
  RETURN json_build_object(
    'success', true,
    'points_awarded', p_points,
    'new_balance', v_current_points,
    'new_tier', v_new_tier
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;