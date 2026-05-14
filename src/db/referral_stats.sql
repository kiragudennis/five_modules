-- db/referrer_stats.sql (NEW - adds traffic source tracking alongside existing referrals)

-- Traffic source tracking (for marketing attribution)
CREATE TABLE IF NOT EXISTS referrer_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('social', 'search', 'direct', 'email', 'affiliate', 'qr_code', 'advertisement')),
  referrer_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  session_id uuid,
  first_click_at timestamptz DEFAULT NOW(),
  last_click_at timestamptz DEFAULT NOW(),
  total_clicks integer DEFAULT 0,
  total_conversions integer DEFAULT 0,
  total_revenue numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(source, utm_campaign, utm_source)
);

-- Track click from traffic source
CREATE OR REPLACE FUNCTION track_referrer_click(
  p_source text,
  p_source_type text,
  p_referrer_url text DEFAULT NULL,
  p_utm_source text DEFAULT NULL,
  p_utm_medium text DEFAULT NULL,
  p_utm_campaign text DEFAULT NULL,
  p_utm_term text DEFAULT NULL,
  p_utm_content text DEFAULT NULL,
  p_session_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stat_id uuid;
BEGIN
  INSERT INTO referrer_stats (
    source, source_type, referrer_url, utm_source, utm_medium, utm_campaign,
    utm_term, utm_content, session_id, total_clicks, last_click_at
  )
  VALUES (
    p_source, p_source_type, p_referrer_url, p_utm_source, p_utm_medium, p_utm_campaign,
    p_utm_term, p_utm_content, p_session_id, 1, NOW()
  )
  ON CONFLICT (source, utm_campaign, utm_source) DO UPDATE
  SET 
    total_clicks = referrer_stats.total_clicks + 1,
    last_click_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_stat_id;
  
  RETURN v_stat_id;
END;
$$;

-- Track conversion from traffic source
CREATE OR REPLACE FUNCTION track_referrer_conversion(
  p_stat_id uuid,
  p_conversion_amount numeric,
  p_referred_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE referrer_stats
  SET 
    total_conversions = total_conversions + 1,
    total_revenue = total_revenue + p_conversion_amount,
    updated_at = NOW()
  WHERE id = p_stat_id;
  
  -- Also record in your existing referrals table if this is a user referral
  IF p_referred_user_id IS NOT NULL THEN
    INSERT INTO referrals (
      referrer_id, referred_user_id, referral_code, status, completed_at
    )
    VALUES (
      (SELECT referrer_id FROM user_sessions WHERE session_id = (SELECT session_id FROM referrer_stats WHERE id = p_stat_id)),
      p_referred_user_id,
      gen_random_uuid()::text,
      'completed',
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;