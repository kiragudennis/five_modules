-- Get comprehensive marketing stats in one efficient call
CREATE OR REPLACE FUNCTION get_marketing_stats(
  p_time_range_start timestamptz DEFAULT NOW() - INTERVAL '7 days',
  p_time_range_end timestamptz DEFAULT NOW()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  v_bundles jsonb;
  v_spins jsonb;
  v_challenges jsonb;
  v_draws jsonb;
  v_deals jsonb;
  v_loyalty jsonb;
  v_user_referrals jsonb;
  v_traffic_sources jsonb;
BEGIN
  -- Bundles stats
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'active', COUNT(*) FILTER (WHERE status = 'active'),
    'purchases', COALESCE(SUM(purchases_count), 0),
    'revenue', COALESCE(SUM(revenue), 0)
  ) INTO v_bundles
  FROM mistry_bundles;

  -- Spins stats
  SELECT jsonb_build_object(
    'total_games', (SELECT COUNT(*) FROM spin_games),
    'active_games', (SELECT COUNT(*) FROM spin_games WHERE is_active = true),
    'total_spins', COUNT(*),
    'today_spins', COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE),
    'prizes_awarded', jsonb_build_object(
      'points', COUNT(*) FILTER (WHERE prize_type = 'points'),
      'discounts', COUNT(*) FILTER (WHERE prize_type = 'discount'),
      'products', COUNT(*) FILTER (WHERE prize_type = 'product')
    )
  ) INTO v_spins
  FROM spin_attempts
  WHERE created_at BETWEEN p_time_range_start AND p_time_range_end;

  -- Challenges stats
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'active', COUNT(*) FILTER (WHERE status = 'active'),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'referrals', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM challenge_actions WHERE action_type = 'referral_completed'),
      'completed', (SELECT COUNT(*) FROM challenge_actions WHERE action_type = 'referral_completed'),
      'pending', 0
    ),
    'points_awarded', COALESCE(SUM(points_awarded), 0)
  ) INTO v_challenges
  FROM challenges;

  -- Draws stats
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'active', COUNT(*) FILTER (WHERE status = 'open'),
    'entries', COALESCE(SUM(entry_count), 0),
    'winners', (SELECT COUNT(*) FROM draw_winners WHERE claim_status = 'claimed'),
    'pending_draws', COUNT(*) FILTER (WHERE status = 'closed' AND draw_time > NOW())
  ) INTO v_draws
  FROM draws;

  -- Deals stats
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'active', COUNT(*) FILTER (WHERE status = 'active' AND ends_at > NOW()),
    'units_sold', COALESCE(SUM(total_quantity - remaining_quantity), 0),
    'revenue', COALESCE(SUM(revenue), 0),
    'expiring_soon', COUNT(*) FILTER (
      WHERE status = 'active' 
      AND ends_at > NOW() 
      AND ends_at < NOW() + INTERVAL '1 day'
    )
  ) INTO v_deals
  FROM deals;

  -- Loyalty stats
  SELECT jsonb_build_object(
    'total_points', COALESCE(SUM(points), 0),
    'points_earned', COALESCE(SUM(points_earned), 0),
    'points_redeemed', COALESCE(SUM(points_redeemed), 0),
    'tier_distribution', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'tier', tier,
          'count', COUNT(*)
        )
      )
      FROM loyalty_points
      GROUP BY tier
    )
  ) INTO v_loyalty
  FROM loyalty_points;

  -- USER REFERRALS (from your existing referrals table)
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'points_awarded', COALESCE(SUM(reward_points) FILTER (WHERE status = 'completed'), 0),
    'top_referrers', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'user_id', referrer_id,
          'referrals_count', COUNT(*),
          'points_earned', SUM(reward_points)
        )
        ORDER BY COUNT(*) DESC
        LIMIT 5
      )
      FROM referrals
      WHERE status = 'completed'
      AND completed_at BETWEEN p_time_range_start AND p_time_range_end
      GROUP BY referrer_id
    )
  ) INTO v_user_referrals
  FROM referrals
  WHERE created_at BETWEEN p_time_range_start AND p_time_range_end;

  -- TRAFFIC SOURCES (from new referrer_stats table)
  SELECT jsonb_agg(
    jsonb_build_object(
      'source', source,
      'type', source_type,
      'clicks', total_clicks,
      'conversions', total_conversions,
      'revenue', total_revenue,
      'conversion_rate', CASE WHEN total_clicks > 0 
        THEN ROUND((total_conversions::numeric / total_clicks) * 100, 2)
        ELSE 0
      END
    )
    ORDER BY total_clicks DESC
    LIMIT 10
  ) INTO v_traffic_sources
  FROM referrer_stats
  WHERE last_click_at BETWEEN p_time_range_start AND p_time_range_end;

  -- Build final result
  result := jsonb_build_object(
    'bundles', v_bundles,
    'spins', v_spins,
    'challenges', v_challenges,
    'draws', v_draws,
    'deals', v_deals,
    'loyalty', v_loyalty,
    'referrals', jsonb_build_object(
      'user_referrals', v_user_referrals,
      'traffic_sources', COALESCE(v_traffic_sources, '[]'::jsonb)
    )
    'time_range', jsonb_build_object(
      'start', p_time_range_start,
      'end', p_time_range_end
    ),
    'generated_at', NOW()
  );

  RETURN result;
END;
$$;

-- Get engagement history for charts
CREATE OR REPLACE FUNCTION get_engagement_history(
  p_hours_back integer DEFAULT 24
)
RETURNS TABLE (
  hour timestamptz,
  spins bigint,
  purchases bigint,
  shares bigint,
  draws_entries bigint,
  deals_claimed bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH hours AS (
    SELECT generate_series(
      date_trunc('hour', NOW() - (p_hours_back || ' hours')::interval),
      date_trunc('hour', NOW()),
      '1 hour'::interval
    ) AS hour
  )
  SELECT 
    h.hour,
    COALESCE(COUNT(DISTINCT sa.id), 0) AS spins,
    COALESCE(COUNT(DISTINCT o.id), 0) AS purchases,
    COALESCE(COUNT(DISTINCT ca.id), 0) AS shares,
    COALESCE(COUNT(DISTINCT de.id), 0) AS draws_entries,
    COALESCE(COUNT(DISTINCT dc.id), 0) AS deals_claimed
  FROM hours h
  LEFT JOIN spin_attempts sa ON date_trunc('hour', sa.created_at) = h.hour
  LEFT JOIN orders o ON date_trunc('hour', o.created_at) = h.hour AND o.status = 'completed'
  LEFT JOIN challenge_actions ca ON date_trunc('hour', ca.created_at) = h.hour AND ca.action_type = 'share_posted'
  LEFT JOIN draw_entries de ON date_trunc('hour', de.created_at) = h.hour
  LEFT JOIN deal_claims dc ON date_trunc('hour', dc.claimed_at) = h.hour
  GROUP BY h.hour
  ORDER BY h.hour;
END;
$$;

-- Get live engagement stats
CREATE OR REPLACE FUNCTION get_live_engagement_stats()
RETURNS TABLE (
  module text,
  active_users integer,
  interactions_per_minute integer,
  social_shares integer,
  live_viewers integer,
  last_event timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Spin Wheel'::text,
    COUNT(DISTINCT sa.user_id) FILTER (WHERE sa.created_at > NOW() - INTERVAL '5 minutes'),
    COUNT(sa.id) FILTER (WHERE sa.created_at > NOW() - INTERVAL '1 minute'),
    COUNT(ca.id) FILTER (WHERE ca.action_type = 'share_posted' AND ca.created_at > NOW() - INTERVAL '1 hour'),
    (SELECT COUNT(*) FROM live_viewers WHERE module = 'spin' AND last_heartbeat > NOW() - INTERVAL '1 minute'),
    MAX(sa.created_at)
  FROM spin_attempts sa
  LEFT JOIN challenge_actions ca ON ca.user_id = sa.user_id
  UNION ALL
  SELECT 
    'Challenges'::text,
    COUNT(DISTINCT cp.user_id) FILTER (WHERE cp.last_action_at > NOW() - INTERVAL '5 minutes'),
    COUNT(ca.id) FILTER (WHERE ca.created_at > NOW() - INTERVAL '1 minute'),
    COUNT(ca.id) FILTER (WHERE ca.action_type = 'share_posted' AND ca.created_at > NOW() - INTERVAL '1 hour'),
    (SELECT COUNT(*) FROM live_viewers WHERE module = 'challenge' AND last_heartbeat > NOW() - INTERVAL '1 minute'),
    MAX(cp.last_action_at)
  FROM challenge_participants cp
  LEFT JOIN challenge_actions ca ON ca.user_id = cp.user_id
  UNION ALL
  SELECT 
    'Lucky Draws'::text,
    COUNT(DISTINCT de.user_id) FILTER (WHERE de.created_at > NOW() - INTERVAL '5 minutes'),
    COUNT(de.id) FILTER (WHERE de.created_at > NOW() - INTERVAL '1 minute'),
    0,
    (SELECT COUNT(*) FROM live_viewers WHERE module = 'draw' AND last_heartbeat > NOW() - INTERVAL '1 minute'),
    MAX(de.created_at)
  FROM draw_entries de;
END;
$$;

-- social_mentions and add_social_mention function are in social_mentions.sql to keep referral_stats.sql
-- focused on traffic source tracking and conversions
CREATE TABLE IF NOT EXISTS social_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('instagram', 'facebook', 'twitter', 'tiktok', 'youtube')),
  mention_id text, -- Original post ID from platform
  username text NOT NULL,
  user_avatar text,
  content text NOT NULL,
  sentiment text DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score numeric(3,2), -- -1.0 to 1.0
  likes_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  media_urls text[],
  posted_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  processed_at timestamptz
);

-- Create mention via API/RPC
CREATE OR REPLACE FUNCTION add_social_mention(
  p_platform text,
  p_username text,
  p_content text,
  p_sentiment text DEFAULT 'neutral',
  p_posted_at timestamptz DEFAULT NOW()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mention_id uuid;
BEGIN
  INSERT INTO social_mentions (
    platform, username, content, sentiment, posted_at
  ) VALUES (
    p_platform, p_username, p_content, p_sentiment, p_posted_at
  )
  RETURNING id INTO v_mention_id;
  
  RETURN v_mention_id;
END;
$$;