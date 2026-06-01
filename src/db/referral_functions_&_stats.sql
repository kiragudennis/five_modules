-- Main function to process referral challenge when a referral is completed
CREATE OR REPLACE FUNCTION process_referral_challenge_completion(
    p_referral_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_referral referrals%ROWTYPE;
    v_challenge RECORD;
    v_participant RECORD;
    v_referral_count INTEGER;
    v_points_to_award INTEGER;
    v_current_rank INTEGER;
    v_total_referrals INTEGER;
    v_result JSON;
BEGIN
    -- Get referral details
    SELECT * INTO v_referral
    FROM referrals
    WHERE id = p_referral_id;
    
    IF NOT FOUND OR v_referral.status != 'completed' THEN
        RETURN json_build_object('success', false, 'error', 'Referral not found or not completed');
    END IF;
    
    -- Find all active referral challenges that match this referral type
    FOR v_challenge IN 
        SELECT 
            c.*,
            (c.scoring_config->>'points_per_referral')::INTEGER as points_per_referral,
            (c.scoring_config->>'bonus_for_top_referrer')::INTEGER as bonus_for_top_referrer,
            c.scoring_config->>'referral_type' as challenge_referral_type,
            (c.scoring_config->>'min_referrals_to_qualify')::INTEGER as min_referrals
        FROM challenges c
        WHERE c.challenge_type = 'referral'
        AND c.status = 'active'
        AND c.starts_at <= NOW()
        AND c.ends_at >= NOW()
        AND (
            -- Match referral type or accept all
            c.scoring_config->>'referral_type' = v_referral.conversion_type
            OR c.scoring_config->>'referral_type' = 'all'
            OR c.scoring_config->>'referral_type' IS NULL
        )
    LOOP
        -- Count total completed referrals for this user in this challenge period
        SELECT COUNT(*) INTO v_total_referrals
        FROM referrals r
        WHERE r.referrer_id = v_referral.referrer_id
        AND r.status = 'completed'
        AND r.completed_at >= v_challenge.starts_at
        AND r.completed_at <= v_challenge.ends_at
        AND (
            v_challenge.challenge_referral_type = 'all'
            OR v_challenge.challenge_referral_type IS NULL
            OR r.conversion_type = v_challenge.challenge_referral_type
        );
        
        -- Check minimum referrals qualification
        IF v_total_referrals < COALESCE(v_challenge.min_referrals, 0) THEN
            CONTINUE;
        END IF;
        
        -- Calculate points
        v_points_to_award := COALESCE(v_challenge.points_per_referral, 100);
        
        -- Add bonus points for specific achievements
        IF v_total_referrals = 1 THEN
            -- First referral bonus
            v_points_to_award := v_points_to_award + COALESCE((v_challenge.scoring_config->>'first_referral_bonus')::INTEGER, 0);
        END IF;
        
        IF v_total_referrals >= 5 THEN
            -- Power referrer bonus
            v_points_to_award := v_points_to_award + COALESCE((v_challenge.scoring_config->>'power_referrer_bonus')::INTEGER, 0);
        END IF;
        
        -- Get or create participant
        SELECT * INTO v_participant
        FROM challenge_participants
        WHERE challenge_id = v_challenge.id
        AND user_id = v_referral.referrer_id;
        
        IF FOUND THEN
            -- Update existing participant
            UPDATE challenge_participants
            SET 
                current_score = current_score + v_points_to_award,
                last_action_at = NOW(),
                metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                    'total_referrals', v_total_referrals,
                    'last_referral_date', NOW()::TEXT,
                    'last_referral_id', p_referral_id::TEXT,
                    'referral_type', v_challenge.challenge_referral_type
                )
            WHERE id = v_participant.id;
        ELSE
            -- Auto-join challenge
            INSERT INTO challenge_participants (
                challenge_id,
                user_id,
                current_score,
                last_action_at,
                metadata
            ) VALUES (
                v_challenge.id,
                v_referral.referrer_id,
                v_points_to_award,
                NOW(),
                jsonb_build_object(
                    'total_referrals', v_total_referrals,
                    'last_referral_date', NOW()::TEXT,
                    'last_referral_id', p_referral_id::TEXT,
                    'referral_type', v_challenge.challenge_referral_type,
                    'auto_joined', true
                )
            );
        END IF;
        
        -- Record action
        INSERT INTO challenge_actions (
            challenge_id,
            user_id,
            action_type,
            points_awarded,
            action_value,
            action_metadata
        ) VALUES (
            v_challenge.id,
            v_referral.referrer_id,
            'referral_completed',
            v_points_to_award,
            1,
            jsonb_build_object(
                'referral_id', p_referral_id,
                'conversion_type', v_referral.conversion_type,
                'referred_email', v_referral.referred_email,
                'total_referrals', v_total_referrals,
                'conversion_value', v_referral.conversion_value
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
            u.full_name,
            'Referral completed! ' || 
            CASE 
                WHEN v_referral.conversion_type = 'signup' THEN 'New signup activated 🎉'
                WHEN v_referral.conversion_type = 'first_purchase' THEN 'First purchase made 🛍️'
                ELSE 'Conversion achieved ✅'
            END,
            v_points_to_award
        FROM users u
        WHERE u.id = v_referral.referrer_id;
        
        -- Check if user is now in top 3 and award bonus
        WITH ranked AS (
            SELECT 
                cp.user_id,
                ROW_NUMBER() OVER (ORDER BY cp.current_score DESC) as rank
            FROM challenge_participants cp
            WHERE cp.challenge_id = v_challenge.id
        )
        SELECT rank INTO v_current_rank
        FROM ranked
        WHERE user_id = v_referral.referrer_id;
        
        IF v_current_rank <= 3 AND COALESCE(v_challenge.bonus_for_top_referrer, 0) > 0 THEN
            -- Check if top rank bonus not already awarded
            IF NOT EXISTS (
                SELECT 1 FROM challenge_actions
                WHERE challenge_id = v_challenge.id
                AND user_id = v_referral.referrer_id
                AND action_type = 'bonus_top_referrer'
                AND action_metadata->>'referral_id' = p_referral_id::TEXT
            ) THEN
                UPDATE challenge_participants
                SET current_score = current_score + v_challenge.bonus_for_top_referrer
                WHERE challenge_id = v_challenge.id
                AND user_id = v_referral.referrer_id;
                
                INSERT INTO challenge_actions (
                    challenge_id,
                    user_id,
                    action_type,
                    points_awarded,
                    action_metadata
                ) VALUES (
                    v_challenge.id,
                    v_referral.referrer_id,
                    'bonus_top_referrer',
                    v_challenge.bonus_for_top_referrer,
                    jsonb_build_object(
                        'rank', v_current_rank,
                        'referral_id', p_referral_id
                    )
                );
            END IF;
        END IF;
        
        -- Recalculate ranks
        PERFORM recalculate_challenge_ranks(v_challenge.id);
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Referral challenge processed'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to get referral challenge leaderboard
CREATE OR REPLACE FUNCTION get_referral_challenge_leaderboard(
    p_challenge_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    current_score INTEGER,
    total_referrals INTEGER,
    signup_referrals INTEGER,
    purchase_referrals INTEGER,
    current_rank INTEGER,
    last_referral_date TIMESTAMPTZ,
    points_to_next INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH referral_stats AS (
        SELECT 
            cp.user_id,
            u.full_name,
            u.email,
            cp.current_score,
            COALESCE((cp.metadata->>'total_referrals')::INTEGER, 0) as total_referrals,
            COALESCE((cp.metadata->>'signup_referrals')::INTEGER, 0) as signup_referrals,
            COALESCE((cp.metadata->>'purchase_referrals')::INTEGER, 0) as purchase_referrals,
            ROW_NUMBER() OVER (ORDER BY cp.current_score DESC) as current_rank,
            (cp.metadata->>'last_referral_date')::TIMESTAMPTZ as last_referral_date
        FROM challenge_participants cp
        JOIN users u ON u.id = cp.user_id
        WHERE cp.challenge_id = p_challenge_id
    )
    SELECT 
        rs.user_id,
        rs.full_name,
        rs.email,
        rs.current_score,
        rs.total_referrals,
        rs.signup_referrals,
        rs.purchase_referrals,
        rs.current_rank::INTEGER,
        rs.last_referral_date,
        CASE 
            WHEN rs.current_rank = 1 THEN 0
            ELSE (
                SELECT rs2.current_score - rs.current_score
                FROM referral_stats rs2
                WHERE rs2.current_rank = rs.current_rank - 1
            )
        END as points_to_next
    FROM referral_stats rs
    ORDER BY rs.current_rank
    LIMIT p_limit;
END;
$$;

-- Function to get user's referral stats for challenge
CREATE OR REPLACE FUNCTION get_user_referral_challenge_stats(
    p_challenge_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    total_referrals INTEGER,
    signup_referrals INTEGER,
    purchase_referrals INTEGER,
    pending_referrals INTEGER,
    conversion_rate NUMERIC,
    points_earned INTEGER,
    current_rank INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_challenge challenges%ROWTYPE;
    v_total_clicks INTEGER;
    v_total_conversions INTEGER;
BEGIN
    -- Get challenge details
    SELECT * INTO v_challenge
    FROM challenges
    WHERE id = p_challenge_id;
    
    -- Count referrals by type
    SELECT 
        COUNT(*) FILTER (WHERE r.status = 'completed') as completed,
        COUNT(*) FILTER (WHERE r.status = 'completed' AND r.conversion_type = 'signup') as signup,
        COUNT(*) FILTER (WHERE r.status = 'completed' AND r.conversion_type = 'first_purchase') as purchase,
        COUNT(*) FILTER (WHERE r.status IN ('pending', 'joined')) as pending
    INTO 
        v_total_conversions,
        total_referrals, -- This will be reassigned below
        total_referrals, -- This will be reassigned below
        total_referrals  -- This will be reassigned below
    FROM referrals r
    WHERE r.referrer_id = p_user_id
    AND r.created_at >= v_challenge.starts_at
    AND r.created_at <= v_challenge.ends_at;
    
    RETURN QUERY
    SELECT 
        v_total_conversions::INTEGER as total_referrals,
        COALESCE(
            (SELECT COUNT(*) FROM referrals 
             WHERE referrer_id = p_user_id 
             AND status = 'completed' 
             AND conversion_type = 'signup'
             AND created_at >= v_challenge.starts_at
             AND created_at <= v_challenge.ends_at),
            0
        )::INTEGER as signup_referrals,
        COALESCE(
            (SELECT COUNT(*) FROM referrals 
             WHERE referrer_id = p_user_id 
             AND status = 'completed' 
             AND conversion_type = 'first_purchase'
             AND created_at >= v_challenge.starts_at
             AND created_at <= v_challenge.ends_at),
            0
        )::INTEGER as purchase_referrals,
        COALESCE(
            (SELECT COUNT(*) FROM referrals 
             WHERE referrer_id = p_user_id 
             AND status IN ('pending', 'joined')
             AND created_at >= v_challenge.starts_at
             AND created_at <= v_challenge.ends_at),
            0
        )::INTEGER as pending_referrals,
        CASE 
            WHEN v_total_clicks > 0 THEN 
                ROUND((v_total_conversions::NUMERIC / v_total_clicks::NUMERIC) * 100, 1)
            ELSE 0
        END as conversion_rate,
        COALESCE(
            (SELECT current_score FROM challenge_participants 
             WHERE challenge_id = p_challenge_id AND user_id = p_user_id),
            0
        )::INTEGER as points_earned,
        COALESCE(
            (SELECT current_rank FROM challenge_participants 
             WHERE challenge_id = p_challenge_id AND user_id = p_user_id),
            0
        )::INTEGER as current_rank;
END;
$$;

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