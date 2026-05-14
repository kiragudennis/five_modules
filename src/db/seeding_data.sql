-- db/seed.sql
-- Complete seed data for all tables

-- ============================================
-- 1. STORE SETTINGS
-- ============================================

INSERT INTO store_settings (id, referral_settings, loyalty_settings, gamification_settings, email_settings, updated_at)
VALUES (1, 
  '{
    "points_per_referral": 100,
    "bonus_points_for_first_referral": 50,
    "referrals_for_tier_upgrade": 5,
    "auto_approve_days": 7,
    "tier_upgrade": "silver"
  }'::jsonb,
  '{
    "points_per_ksh": 10,
    "min_redeem_points": 100,
    "tiers": {
      "bronze": {"min_points": 0, "discount": 0},
      "silver": {"min_points": 1000, "discount": 5},
      "gold": {"min_points": 5000, "discount": 10},
      "platinum": {"min_points": 10000, "discount": 15}
    }
  }'::jsonb,
  '{
    "spin": {"free_spins_per_day": 1, "points_per_spin": 50},
    "challenges": {"default_points": 100},
    "draws": {"entry_points": 10}
  }'::jsonb,
  '{
    "from_email": "hello@combinekenya.com",
    "from_name": "Combine Kenya",
    "smtp_host": null,
    "smtp_port": null
  }'::jsonb,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  referral_settings = EXCLUDED.referral_settings,
  loyalty_settings = EXCLUDED.loyalty_settings,
  gamification_settings = EXCLUDED.gamification_settings,
  email_settings = EXCLUDED.email_settings,
  updated_at = NOW();

-- ============================================
-- 2. PRODUCTS (for bundles and deals)
-- ============================================

-- Insert sample products
INSERT INTO products (id, title, description, price, original_price, currency, stock, images, category, tags, featured, is_deal_of_the_day, rating, reviews_count, slug, status, created_at)
VALUES 
  (gen_random_uuid(), 'Premium LED Bulb 9W', 'Energy saving LED bulb with 800 lumens', 250, 350, 'KES', 500, '["/images/products/led-bulb-1.jpg"]', 'led-bulbs', ARRAY['energy-saving', 'led'], true, false, 4.5, 128, 'premium-led-bulb-9w', 'active', NOW() - INTERVAL '30 days'),
  (gen_random_uuid(), 'Solar Security Light', 'Motion sensor solar security light with remote', 3500, 4500, 'KES', 150, '["/images/products/solar-light-1.jpg"]', 'solar-lights', ARRAY['solar', 'security'], true, true, 4.8, 89, 'solar-security-light', 'active', NOW() - INTERVAL '25 days'),
  (gen_random_uuid(), 'Smart WiFi Bulb', 'RGB color changing smart bulb', 1200, 1800, 'KES', 200, '["/images/products/smart-bulb.jpg"]', 'led-bulbs', ARRAY['smart', 'wifi'], true, false, 4.6, 234, 'smart-wifi-bulb', 'active', NOW() - INTERVAL '20 days'),
  (gen_random_uuid(), 'Garden Solar Lights', 'Set of 6 solar powered garden lights', 2800, 3999, 'KES', 80, '["/images/products/garden-lights.jpg"]', 'solar-lights', ARRAY['garden', 'outdoor'], false, true, 4.7, 156, 'garden-solar-lights', 'active', NOW() - INTERVAL '15 days'),
  (gen_random_uuid(), 'Emergency LED Light', 'Rechargeable emergency light', 650, 999, 'KES', 300, '["/images/products/emergency-light.jpg"]', 'led-bulbs', ARRAY['emergency', 'rechargeable'], false, false, 4.4, 67, 'emergency-led-light', 'active', NOW() - INTERVAL '10 days'),
  (gen_random_uuid(), 'Flood Light 50W', 'Outdoor waterproof floodlight', 1800, 2500, 'KES', 120, '["/images/products/floodlight.jpg"]', 'security-lights', ARRAY['waterproof', 'outdoor'], true, false, 4.9, 312, 'flood-light-50w', 'active', NOW() - INTERVAL '5 days');

-- ============================================
-- 3. LOYALTY POINTS (for users)
-- ============================================

-- Get some user IDs or create sample users
DO $$
DECLARE
    user1_id uuid;
    user2_id uuid;
    user3_id uuid;
    user4_id uuid;
    user5_id uuid;
BEGIN
    -- Try to get existing users or create sample ones
    SELECT id INTO user1_id FROM auth.users WHERE email = 'customer1@example.com' LIMIT 1;
    SELECT id INTO user2_id FROM auth.users WHERE email = 'customer2@example.com' LIMIT 1;
    SELECT id INTO user3_id FROM auth.users WHERE email = 'customer3@example.com' LIMIT 1;
    SELECT id INTO user4_id FROM auth.users WHERE email = 'customer4@example.com' LIMIT 1;
    SELECT id INTO user5_id FROM auth.users WHERE email = 'customer5@example.com' LIMIT 1;
    
    -- If no users exist, use placeholder UUIDs (these won't have related data)
    IF user1_id IS NULL THEN user1_id := '11111111-1111-1111-1111-111111111111'::uuid; END IF;
    IF user2_id IS NULL THEN user2_id := '22222222-2222-2222-2222-222222222222'::uuid; END IF;
    IF user3_id IS NULL THEN user3_id := '33333333-3333-3333-3333-333333333333'::uuid; END IF;
    IF user4_id IS NULL THEN user4_id := '44444444-4444-4444-4444-444444444444'::uuid; END IF;
    IF user5_id IS NULL THEN user5_id := '55555555-5555-5555-5555-555555555555'::uuid; END IF;

    -- Insert loyalty points
    INSERT INTO loyalty_points (user_id, points, points_earned, points_redeemed, tier, last_activity_at, created_at)
    VALUES 
        (user1_id, 2500, 3500, 1000, 'silver', NOW() - INTERVAL '1 day', NOW() - INTERVAL '60 days'),
        (user2_id, 7500, 8500, 1000, 'gold', NOW() - INTERVAL '2 days', NOW() - INTERVAL '45 days'),
        (user3_id, 12000, 13000, 1000, 'platinum', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '90 days'),
        (user4_id, 500, 800, 300, 'bronze', NOW() - INTERVAL '5 days', NOW() - INTERVAL '30 days'),
        (user5_id, 3500, 4000, 500, 'silver', NOW() - INTERVAL '3 days', NOW() - INTERVAL '20 days')
    ON CONFLICT (user_id) DO UPDATE SET
        points = EXCLUDED.points,
        points_earned = EXCLUDED.points_earned,
        points_redeemed = EXCLUDED.points_redeemed,
        tier = EXCLUDED.tier,
        last_activity_at = NOW();
END $$;

-- ============================================
-- 4. SPIN GAMES
-- ============================================

INSERT INTO spin_games (id, name, slug, description, game_type, eligible_tiers, min_points_required, free_spins_per_day, free_spins_per_week, free_spins_total, points_per_paid_spin, prize_config, is_single_prize, is_active, starts_at, ends_at, created_at)
VALUES 
  (gen_random_uuid(), 'Daily Spin Challenge', 'daily-spin-challenge', 'Spin daily for amazing prizes!', 'standard', ARRAY['bronze', 'silver', 'gold', 'platinum'], 0, 1, 5, 10, 50, 
   '[{"label": "100 Points", "type": "points", "value": 100, "color": "#FF6B6B", "probability": 30},
     {"label": "50 Points", "type": "points", "value": 50, "color": "#4ECDC4", "probability": 25},
     {"label": "20% Off", "type": "discount", "value": 20, "color": "#45B7D1", "probability": 15},
     {"label": "Free Shipping", "type": "free_shipping", "value": "free", "color": "#96CEB4", "probability": 10},
     {"label": "10% Off", "type": "discount", "value": 10, "color": "#FFEAA7", "probability": 20}]'::jsonb, 
   false, true, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', NOW() - INTERVAL '30 days'),
  
  (gen_random_uuid(), 'VIP Weekend Spins', 'vip-weekend-spins', 'Exclusive spins for VIP members', 'vip', ARRAY['gold', 'platinum'], 0, 3, 10, 20, 30,
   '[{"label": "500 Points", "type": "points", "value": 500, "color": "#FF6B6B", "probability": 20},
     {"label": "iPhone 15", "type": "product", "value": "iPhone 15", "color": "#DDA0DD", "probability": 1},
     {"label": "50% Off", "type": "discount", "value": 50, "color": "#F7DC6F", "probability": 10},
     {"label": "200 Points", "type": "points", "value": 200, "color": "#4ECDC4", "probability": 40},
     {"label": "Mystery Bundle", "type": "bundle", "value": "Mystery Bundle", "color": "#BB8FCE", "probability": 29}]'::jsonb,
   true, true, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', NOW() - INTERVAL '30 days'),

  (gen_random_uuid(), 'New Customer Welcome', 'new-customer-welcome', 'Welcome spins for new customers', 'new_customer', ARRAY['bronze'], 0, 5, 5, 5, 25,
   '[{"label": "150 Points", "type": "points", "value": 150, "color": "#FF6B6B", "probability": 50},
     {"label": "First Purchase Discount", "type": "discount", "value": 30, "color": "#45B7D1", "probability": 30},
     {"label": "Free LED Bulb", "type": "product", "value": "LED Bulb", "color": "#96CEB4", "probability": 20}]'::jsonb,
   false, true, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', NOW() - INTERVAL '30 days');

-- ============================================
-- 5. SPIN ATTEMPTS (Recent activity)
-- ============================================

DO $$
DECLARE
    spin_game1_id uuid;
    spin_game2_id uuid;
    user_ids uuid[] := ARRAY[
        '11111111-1111-1111-1111-111111111111'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid,
        '33333333-3333-3333-3333-333333333333'::uuid,
        '44444444-4444-4444-4444-444444444444'::uuid,
        '55555555-5555-5555-5555-555555555555'::uuid
    ];
    i integer;
    prize_types text[] := ARRAY['points', 'discount', 'free_shipping', 'points', 'discount'];
    prize_values text[] := ARRAY['100', '20', 'free', '50', '10'];
BEGIN
    SELECT id INTO spin_game1_id FROM spin_games WHERE slug = 'daily-spin-challenge' LIMIT 1;
    SELECT id INTO spin_game2_id FROM spin_games WHERE slug = 'vip-weekend-spins' LIMIT 1;
    
    -- Generate spin attempts for the last 24 hours
    FOR i IN 1..50 LOOP
        INSERT INTO spin_attempts (id, game_id, user_id, spin_type, prize_type, prize_value, points_awarded, points_spent, segment_index, landed_at, created_at)
        VALUES (
            gen_random_uuid(),
            spin_game1_id,
            user_ids[1 + (i % array_length(user_ids, 1))],
            CASE WHEN i % 3 = 0 THEN 'points' ELSE 'free' END,
            prize_types[1 + (i % array_length(prize_types, 1))],
            prize_values[1 + (i % array_length(prize_values, 1))],
            CASE WHEN prize_types[1 + (i % array_length(prize_types, 1))] = 'points' THEN CAST(prize_values[1 + (i % array_length(prize_values, 1))] AS integer) ELSE 0 END,
            CASE WHEN i % 3 = 0 THEN 50 ELSE 0 END,
            (i % 8),
            NOW() - (INTERVAL '1 hour' * (i % 24)),
            NOW() - (INTERVAL '1 hour' * (i % 24))
        );
    END LOOP;
    
    -- Some VIP spins
    FOR i IN 1..20 LOOP
        INSERT INTO spin_attempts (id, game_id, user_id, spin_type, prize_type, prize_value, points_awarded, points_spent, segment_index, landed_at, created_at)
        VALUES (
            gen_random_uuid(),
            spin_game2_id,
            user_ids[3 + (i % 2)],
            'free',
            CASE WHEN i = 5 THEN 'product' ELSE 'points' END,
            CASE WHEN i = 5 THEN 'iPhone 15' ELSE '500' END,
            CASE WHEN i = 5 THEN 0 ELSE 500 END,
            0,
            (i % 8),
            NOW() - (INTERVAL '1 hour' * (i % 48)),
            NOW() - (INTERVAL '1 hour' * (i % 48))
        );
    END LOOP;
END $$;

-- ============================================
-- 6. CHALLENGES
-- ============================================

INSERT INTO challenges (id, name, slug, description, challenge_type, scoring_config, prize_tiers, starts_at, ends_at, status, allow_teams, max_team_size, created_at)
VALUES 
  (gen_random_uuid(), 'Referral Challenge - March', 'referral-challenge-march', 'Refer friends and earn big rewards!', 'referral',
   '{"points_per_referral": 100, "min_referrals": 5}'::jsonb,
   '[{"rank": 1, "prize_type": "points", "prize_value": 5000, "badge": "champion"},
     {"rank": 2, "prize_type": "points", "prize_value": 2500},
     {"rank": 3, "prize_type": "discount", "prize_value": 20}]'::jsonb,
   NOW() - INTERVAL '30 days', NOW() + INTERVAL '30 days', 'active', false, 1, NOW() - INTERVAL '30 days'),
  
  (gen_random_uuid(), 'Spring Shopping Spree', 'spring-shopping-spree', 'Spend more, earn more points!', 'purchase',
   '{"points_per_ksh": 2, "min_spend": 5000, "bonus_at_thresholds": [{"threshold": 10000, "bonus_points": 500}, {"threshold": 50000, "bonus_points": 2500}]}'::jsonb,
   '[{"rank": 1, "prize_type": "points", "prize_value": 10000},
     {"rank": 2, "prize_type": "points", "prize_value": 5000},
     {"rank": 3, "prize_type": "points", "prize_value": 2500}]'::jsonb,
   NOW() - INTERVAL '15 days', NOW() + INTERVAL '45 days', 'active', false, 1, NOW() - INTERVAL '15 days'),
  
  (gen_random_uuid(), 'Social Media Champion', 'social-media-champion', 'Share our products on social media', 'share',
   '{"points_per_share": 50, "required_platforms": ["instagram", "facebook"]}'::jsonb,
   '[{"rank": 1, "prize_type": "points", "prize_value": 3000, "badge": "influencer"},
     {"rank": 2, "prize_type": "discount", "prize_value": 25},
     {"rank": 3, "prize_type": "points", "prize_value": 1000}]'::jsonb,
   NOW() - INTERVAL '20 days', NOW() + INTERVAL '40 days', 'active', false, 1, NOW() - INTERVAL '20 days');

-- ============================================
-- 7. CHALLENGE PARTICIPANTS
-- ============================================

DO $$
DECLARE
    challenge_id uuid;
    user_ids uuid[];
BEGIN
    SELECT id INTO challenge_id FROM challenges WHERE slug = 'referral-challenge-march' LIMIT 1;
    user_ids := ARRAY[
        '11111111-1111-1111-1111-111111111111'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid,
        '33333333-3333-3333-3333-333333333333'::uuid,
        '44444444-4444-4444-4444-444444444444'::uuid,
        '55555555-5555-5555-5555-555555555555'::uuid
    ];
    
    INSERT INTO challenge_participants (id, challenge_id, user_id, current_score, current_rank, joined_at, last_action_at)
    VALUES 
        (gen_random_uuid(), challenge_id, user_ids[1], 1250, 1, NOW() - INTERVAL '25 days', NOW() - INTERVAL '1 day'),
        (gen_random_uuid(), challenge_id, user_ids[2], 950, 2, NOW() - INTERVAL '22 days', NOW() - INTERVAL '2 days'),
        (gen_random_uuid(), challenge_id, user_ids[3], 800, 3, NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days'),
        (gen_random_uuid(), challenge_id, user_ids[4], 450, 4, NOW() - INTERVAL '18 days', NOW() - INTERVAL '5 days'),
        (gen_random_uuid(), challenge_id, user_ids[5], 300, 5, NOW() - INTERVAL '15 days', NOW() - INTERVAL '4 days');
END $$;

-- ============================================
-- 8. CHALLENGE ACTIONS (for activity feed)
-- ============================================

DO $$
DECLARE
    challenge_id uuid;
    user_ids uuid[];
    i integer;
BEGIN
    SELECT id INTO challenge_id FROM challenges WHERE slug = 'spring-shopping-spree' LIMIT 1;
    user_ids := ARRAY[
        '11111111-1111-1111-1111-111111111111'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid,
        '33333333-3333-3333-3333-333333333333'::uuid,
        '44444444-4444-4444-4444-444444444444'::uuid,
        '55555555-5555-5555-5555-555555555555'::uuid
    ];
    
    FOR i IN 1..30 LOOP
        INSERT INTO challenge_actions (id, challenge_id, user_id, action_type, points_awarded, action_value, created_at)
        VALUES (
            gen_random_uuid(),
            challenge_id,
            user_ids[1 + (i % array_length(user_ids, 1))],
            'purchase_made',
            floor(random() * 500 + 50)::int,
            floor(random() * 5000 + 1000)::int,
            NOW() - (INTERVAL '1 hour' * i)
        );
    END LOOP;
END $$;

-- ============================================
-- 9. DRAWS
-- ============================================

INSERT INTO draws (id, name, slug, description, prize_name, prize_value, entry_config, entry_starts_at, entry_ends_at, draw_time, status, theme_color, created_at)
VALUES 
  (gen_random_uuid(), 'Weekly Mega Draw', 'weekly-mega-draw', 'Enter for a chance to win big!', 'Samsung 55" Smart TV', 75000,
   '{"purchase": {"min_amount": 1000, "entries_per_ksh": 1}, "referral": {"entries_per_referral": 5}, "social_share": {"entries_per_share": 2}}'::jsonb,
   NOW() - INTERVAL '14 days', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days', 'open', '#8B5CF6', NOW() - INTERVAL '14 days'),
  
  (gen_random_uuid(), 'Flash Draw - Friday', 'flash-draw-friday', 'Limited time entry!', 'Apple AirPods Pro', 35000,
   '{"purchase": {"min_amount": 500, "entries_per_ksh": 2}, "live_stream": {"entries_per_email": 1}}'::jsonb,
   NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 hours', NOW() + INTERVAL '5 hours', 'open', '#EC4899', NOW() - INTERVAL '2 days'),
  
  (gen_random_uuid(), 'Grand Prize Draw', 'grand-prize-draw', 'Our biggest draw yet!', 'Toyota RAV4', 5000000,
   '{"purchase": {"min_amount": 10000, "entries_per_ksh": 1}, "loyalty_tier": {"bronze": 1, "silver": 3, "gold": 10, "platinum": 25}}'::jsonb,
   NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', NOW() + INTERVAL '60 days', 'open', '#F59E0B', NOW() - INTERVAL '30 days');

-- ============================================
-- 10. DRAW ENTRIES
-- ============================================

DO $$
DECLARE
    draw_id uuid;
    user_ids uuid[];
    i integer;
BEGIN
    SELECT id INTO draw_id FROM draws WHERE slug = 'weekly-mega-draw' LIMIT 1;
    user_ids := ARRAY[
        '11111111-1111-1111-1111-111111111111'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid,
        '33333333-3333-3333-3333-333333333333'::uuid,
        '44444444-4444-4444-4444-444444444444'::uuid,
        '55555555-5555-5555-5555-555555555555'::uuid
    ];
    
    FOR i IN 1..100 LOOP
        INSERT INTO draw_entries (id, draw_id, user_id, entry_count, entry_method, created_at)
        VALUES (
            gen_random_uuid(),
            draw_id,
            user_ids[1 + (i % array_length(user_ids, 1))],
            floor(random() * 5 + 1)::int,
            CASE WHEN i % 3 = 0 THEN 'purchase' WHEN i % 5 = 0 THEN 'social_share' ELSE 'referral' END,
            NOW() - (INTERVAL '1 hour' * (i % 168))
        );
    END LOOP;
END $$;

-- ============================================
-- 11. DEALS
-- ============================================

INSERT INTO deals (id, name, slug, description, deal_type, discount_type, discount_value, deal_price, total_quantity, remaining_quantity, per_user_limit, starts_at, ends_at, status, bonus_points_per_purchase, created_at)
VALUES 
  (gen_random_uuid(), 'Monday Madness', 'monday-madness', 'Start your week with savings!', 'flash_sale', 'percentage', 30, NULL, 100, 67, 2, NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days', 'active', 200, NOW() - INTERVAL '1 day'),
  
  (gen_random_uuid(), 'LED Bundle Special', 'led-bundle-special', 'Buy 2 LED bulbs, get 1 free!', 'bogo', NULL, NULL, NULL, 50, 50, 3, NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days', 'active', 150, NOW() - INTERVAL '3 days'),
  
  (gen_random_uuid(), 'Free Gift on Orders', 'free-gift-orders', 'Spend KES 5000 and get a free LED bulb', 'free_gift', NULL, NULL, NULL, 200, 156, 1, NOW() - INTERVAL '10 days', NOW() + INTERVAL '5 days', 'active', 0, NOW() - INTERVAL '10 days'),
  
  (gen_random_uuid(), 'Mystery Box Deal', 'mystery-box-deal', 'What\'s inside? Surprise worth KES 5000+', 'mystery', NULL, NULL, 1999, 30, 12, 1, NOW() - INTERVAL '2 days', NOW() + INTERVAL '1 day', 'active', 300, NOW() - INTERVAL '2 days');

-- ============================================
-- 12. DEAL CLAIMS (Recent activity)
-- ============================================

DO $$
DECLARE
    deal_id uuid;
    user_ids uuid[];
    i integer;
BEGIN
    SELECT id INTO deal_id FROM deals WHERE slug = 'monday-madness' LIMIT 1;
    user_ids := ARRAY[
        '11111111-1111-1111-1111-111111111111'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid,
        '33333333-3333-3333-3333-333333333333'::uuid,
        '44444444-4444-4444-4444-444444444444'::uuid,
        '55555555-5555-5555-5555-555555555555'::uuid
    ];
    
    FOR i IN 1..33 LOOP
        INSERT INTO deal_claims (id, deal_id, user_id, quantity, price_paid, savings_amount, claimed_at)
        VALUES (
            gen_random_uuid(),
            deal_id,
            user_ids[1 + (i % array_length(user_ids, 1))],
            1,
            1750,
            750,
            NOW() - (INTERVAL '1 hour' * i)
        );
    END LOOP;
END $$;

-- ============================================
-- 13. BUNDLES
-- ============================================

INSERT INTO mistry_bundles (id, name, slug, description, products, bundle_price, discount_type, discount_value, status, featured, created_at)
VALUES 
  (gen_random_uuid(), 'Home Lighting Kit', 'home-lighting-kit', 'Complete lighting solution for your home', 
   '[{"product_id": (SELECT id FROM products LIMIT 1 OFFSET 0), "quantity": 5}, {"product_id": (SELECT id FROM products LIMIT 1 OFFSET 1), "quantity": 2}]'::jsonb,
   4500, 'percentage', 25, 'active', true, NOW() - INTERVAL '20 days'),
  
  (gen_random_uuid(), 'Solar Starter Pack', 'solar-starter-pack', 'Everything you need to go solar', 
   '[{"product_id": (SELECT id FROM products LIMIT 1 OFFSET 1), "quantity": 2}, {"product_id": (SELECT id FROM products LIMIT 1 OFFSET 3), "quantity": 1}]'::jsonb,
   8500, 'fixed', 1500, 'active', true, NOW() - INTERVAL '15 days'),
  
  (gen_random_uuid(), 'Security Bundle', 'security-bundle', 'Protect your home with our security lights', 
   '[{"product_id": (SELECT id FROM products LIMIT 1 OFFSET 5), "quantity": 2}, {"product_id": (SELECT id FROM products LIMIT 1 OFFSET 1), "quantity": 1}]'::jsonb,
   5500, 'percentage', 20, 'active', false, NOW() - INTERVAL '10 days');

-- ============================================
-- 14. BUNDLE PURCHASES (Recent activity)
-- ============================================

DO $$
DECLARE
    bundle_id uuid;
    user_ids uuid[];
    i integer;
BEGIN
    SELECT id INTO bundle_id FROM mistry_bundles WHERE slug = 'home-lighting-kit' LIMIT 1;
    user_ids := ARRAY[
        '11111111-1111-1111-1111-111111111111'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid,
        '33333333-3333-3333-3333-333333333333'::uuid,
        '44444444-4444-4444-4444-444444444444'::uuid,
        '55555555-5555-5555-5555-555555555555'::uuid
    ];
    
    FOR i IN 1..45 LOOP
        INSERT INTO bundle_purchases (id, bundle_id, user_id, quantity, price_paid, created_at)
        VALUES (
            gen_random_uuid(),
            bundle_id,
            user_ids[1 + (i % array_length(user_ids, 1))],
            1,
            4500 - (i * 10),
            NOW() - (INTERVAL '1 hour' * i)
        );
    END LOOP;
END $$;

-- ============================================
-- 15. REFERRALS
-- ============================================

DO $$
DECLARE
    user_ids uuid[];
BEGIN
    user_ids := ARRAY[
        '11111111-1111-1111-1111-111111111111'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid,
        '33333333-3333-3333-3333-333333333333'::uuid,
        '44444444-4444-4444-4444-444444444444'::uuid,
        '55555555-5555-5555-5555-555555555555'::uuid
    ];
    
    INSERT INTO referrals (id, referrer_id, referred_email, referred_user_id, referral_code, status, reward_points, completed_at, created_at)
    VALUES 
        (gen_random_uuid(), user_ids[1], 'friend1@example.com', NULL, 'REF' || substr(md5(random()::text), 1, 8), 'pending', 100, NULL, NOW() - INTERVAL '2 days'),
        (gen_random_uuid(), user_ids[1], 'friend2@example.com', user_ids[2], 'REF' || substr(md5(random()::text), 1, 8), 'completed', 100, NOW() - INTERVAL '10 days', NOW() - INTERVAL '15 days'),
        (gen_random_uuid(), user_ids[2], 'friend3@example.com', user_ids[3], 'REF' || substr(md5(random()::text), 1, 8), 'completed', 100, NOW() - INTERVAL '5 days', NOW() - INTERVAL '8 days'),
        (gen_random_uuid(), user_ids[3], 'friend4@example.com', NULL, 'REF' || substr(md5(random()::text), 1, 8), 'joined', 0, NULL, NOW() - INTERVAL '1 day'),
        (gen_random_uuid(), user_ids[3], 'friend5@example.com', user_ids[4], 'REF' || substr(md5(random()::text), 1, 8), 'completed', 100, NOW() - INTERVAL '2 days', NOW() - INTERVAL '7 days'),
        (gen_random_uuid(), user_ids[4], 'friend6@example.com', NULL, 'REF' || substr(md5(random()::text), 1, 8), 'pending', 100, NULL, NOW() - INTERVAL '3 days'),
        (gen_random_uuid(), user_ids[5], 'friend7@example.com', NULL, 'REF' || substr(md5(random()::text), 1, 8), 'expired', 0, NULL, NOW() - INTERVAL '30 days'),
        (gen_random_uuid(), user_ids[2], 'friend8@example.com', user_ids[5], 'REF' || substr(md5(random()::text), 1, 8), 'completed', 100, NOW() - INTERVAL '1 day', NOW() - INTERVAL '14 days');
END $$;

-- ============================================
-- 16. SOCIAL MENTIONS
-- ============================================

INSERT INTO social_mentions (id, platform, username, content, sentiment, sentiment_score, likes_count, shares_count, comments_count, posted_at, created_at)
VALUES 
  (gen_random_uuid(), 'instagram', 'home_decor_lover', 'Just got my new solar lights from @CombineKenya! They look amazing in my garden! 🌟 #solar #home', 'positive', 0.85, 45, 12, 8, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
  (gen_random_uuid(), 'twitter', 'tech_enthusiast', 'The smart bulbs from Combine Kenya are a game changer! Love the RGB features 🎨', 'positive', 0.9, 23, 5, 3, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),
  (gen_random_uuid(), 'facebook', 'Sarah Mwangi', 'Best customer service ever! Highly recommend Combine Kenya for all your lighting needs', 'positive', 0.95, 67, 15, 12, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), 'instagram', 'interior_design_ke', '✨ Lighting inspiration from @CombineKenya. Their LED strips are perfect for accent lighting!', 'positive', 0.8, 189, 34, 23, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), 'twitter', 'kenyan_homeowner', 'Got the security light bundle. Installation was easy and it works perfectly! Highly recommend.', 'positive', 0.88, 12, 3, 2, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), 'facebook', 'James Otieno', 'The referral program is awesome! Just got my points for referring a friend 👍', 'positive', 0.92, 34, 8, 5, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  (gen_random_uuid(), 'instagram', 'solar_energy_ke', 'Switching to solar has never been easier. Thanks @CombineKenya for the quality products! ☀️', 'positive', 0.87, 156, 28, 19, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), 'twitter', 'nairobi_resident', 'Quick delivery and great packaging! Will definitely order again from Combine Kenya', 'positive', 0.91, 8, 2, 1, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  (gen_random_uuid(), 'facebook', 'Mary Wanjiku', 'The spin wheel game is so addictive! Won 500 points yesterday 🎡🎉', 'positive', 0.89, 23, 6, 4, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  (gen_random_uuid(), 'instagram', 'lighting_expert', 'Professional grade lighting at affordable prices. Combine Kenya is my go-to store!', 'positive', 0.93, 234, 45, 31, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days');

-- ============================================
-- 17. LIVE VIEWERS (for engagement stats)
-- ============================================

INSERT INTO live_viewers (module, viewer_count, last_heartbeat, created_at)
VALUES 
  ('spin', 47, NOW() - INTERVAL '30 seconds', NOW()),
  ('challenge', 23, NOW() - INTERVAL '45 seconds', NOW()),
  ('draw', 89, NOW() - INTERVAL '15 seconds', NOW()),
  ('bundle', 12, NOW() - INTERVAL '1 minute', NOW()),
  ('deal', 156, NOW() - INTERVAL '10 seconds', NOW())
ON CONFLICT (module) DO UPDATE SET
  viewer_count = EXCLUDED.viewer_count,
  last_heartbeat = NOW();

-- ============================================
-- 18. REFERRER STATS (Traffic sources)
-- ============================================

INSERT INTO referrer_stats (source, source_type, total_clicks, total_conversions, total_revenue, last_click_at, created_at)
VALUES 
  ('Instagram', 'social', 2345, 189, 445000, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 days'),
  ('Facebook', 'social', 1876, 145, 325000, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 days'),
  ('TikTok', 'social', 1567, 98, 234000, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '30 days'),
  ('Twitter', 'social', 892, 56, 125000, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '30 days'),
  ('Google', 'search', 4321, 432, 987000, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 days'),
  ('Direct', 'direct', 3456, 289, 654000, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 days'),
  ('Email', 'email', 1234, 98, 234000, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '30 days'),
  ('WhatsApp', 'social', 987, 76, 178000, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 days');

-- ============================================
-- 19. ORDERS (for recent activity)
-- ============================================

DO $$
DECLARE
    user_ids uuid[];
    i integer;
BEGIN
    user_ids := ARRAY[
        '11111111-1111-1111-1111-111111111111'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid,
        '33333333-3333-3333-3333-333333333333'::uuid,
        '44444444-4444-4444-4444-444444444444'::uuid,
        '55555555-5555-5555-5555-555555555555'::uuid
    ];
    
    FOR i IN 1..50 LOOP
        INSERT INTO orders (id, order_number, user_id, customer_name, total_amount, status, created_at)
        VALUES (
            gen_random_uuid(),
            'ORD-' || LPAD(i::text, 6, '0'),
            user_ids[1 + (i % array_length(user_ids, 1))],
            'Customer ' || i,
            floor(random() * 10000 + 500)::int,
            CASE WHEN i % 5 = 0 THEN 'pending' WHEN i % 10 = 0 THEN 'cancelled' ELSE 'completed' END,
            NOW() - (INTERVAL '1 hour' * i)
        );
    END LOOP;
END $$;

-- ============================================
-- 20. LOYALTY TRANSACTIONS
-- ============================================

DO $$
DECLARE
    user_ids uuid[];
    i integer;
BEGIN
    user_ids := ARRAY[
        '11111111-1111-1111-1111-111111111111'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid,
        '33333333-3333-3333-3333-333333333333'::uuid,
        '44444444-4444-4444-4444-444444444444'::uuid,
        '55555555-5555-5555-5555-555555555555'::uuid
    ];
    
    FOR i IN 1..100 LOOP
        INSERT INTO loyalty_transactions (id, user_id, points_change, current_points, transaction_type, description, created_at)
        VALUES (
            gen_random_uuid(),
            user_ids[1 + (i % array_length(user_ids, 1))],
            floor(random() * 500 + 50)::int,
            0,
            CASE WHEN i % 3 = 0 THEN 'purchase' WHEN i % 4 = 0 THEN 'referral' WHEN i % 5 = 0 THEN 'spin_win' ELSE 'challenge' END,
            'Earned points from activity',
            NOW() - (INTERVAL '1 hour' * i)
        );
    END LOOP;
END $$;

-- ============================================
-- Final: Refresh materialized views if any
-- ============================================

-- Update statistics
ANALYZE;

-- Output summary
DO $$
DECLARE
    product_count integer;
    spin_count integer;
    challenge_count integer;
    draw_count integer;
    deal_count integer;
    bundle_count integer;
    referral_count integer;
    mention_count integer;
BEGIN
    SELECT COUNT(*) INTO product_count FROM products;
    SELECT COUNT(*) INTO spin_count FROM spin_attempts;
    SELECT COUNT(*) INTO challenge_count FROM challenges;
    SELECT COUNT(*) INTO draw_count FROM draws;
    SELECT COUNT(*) INTO deal_count FROM deals;
    SELECT COUNT(*) INTO bundle_count FROM mistry_bundles;
    SELECT COUNT(*) INTO referral_count FROM referrals;
    SELECT COUNT(*) INTO mention_count FROM social_mentions;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'SEED DATA COMPLETE!';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Products: %', product_count;
    RAISE NOTICE 'Spin Attempts: %', spin_count;
    RAISE NOTICE 'Challenges: %', challenge_count;
    RAISE NOTICE 'Draws: %', draw_count;
    RAISE NOTICE 'Deals: %', deal_count;
    RAISE NOTICE 'Bundles: %', bundle_count;
    RAISE NOTICE 'Referrals: %', referral_count;
    RAISE NOTICE 'Social Mentions: %', mention_count;
    RAISE NOTICE '=========================================';
END $$;