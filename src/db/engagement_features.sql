-- migrations/20250217_adding_engagement_features.sql

-- Only add missing fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS last_spin_date DATE,
ADD COLUMN IF NOT EXISTS spins_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS available_spin_tokens INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- Add source tracking to your existing coupons table
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS source_type VARCHAR(50), -- 'spin', 'challenge', 'reward', 'manual'
ADD COLUMN IF NOT EXISTS source_id UUID, -- ID of source record (spin_results.id, etc.)
ADD COLUMN IF NOT EXISTS user_specific UUID REFERENCES users(id), -- For user-specific coupons
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for source tracking
CREATE INDEX IF NOT EXISTS idx_coupons_source ON coupons(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_coupons_user_specific ON coupons(user_specific);

-- MISTRY BUNDLES
CREATE TABLE IF NOT EXISTS mistry_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    image_url TEXT,
    banner_url TEXT,
    discount_type VARCHAR(50) CHECK (discount_type IN ('percentage', 'fixed')) NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    bundle_price DECIMAL(10, 2), -- If null, calculated from products
    products JSONB NOT NULL, -- [{product_id: uuid, quantity: int, required: boolean}]
    min_tier_required VARCHAR(50) REFERENCES loyalty_tiers(tier), -- Minimum tier to access
    points_required INTEGER DEFAULT 0, -- Loyalty points required (0 for none)
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'expired')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    max_purchases_per_user INTEGER,
    total_purchases_allowed INTEGER,
    current_purchases INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    badge_text VARCHAR(100),
    badge_color VARCHAR(50),
    terms_conditions TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mistry_bundles_status ON mistry_bundles(status);

-- Bundle purchases tracking
CREATE TABLE IF NOT EXISTS bundle_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID REFERENCES mistry_bundles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    price_paid DECIMAL(10, 2),
    savings_amount DECIMAL(10, 2),
    points_used INTEGER DEFAULT 0, -- Loyalty points used
    loyalty_transaction_id UUID REFERENCES loyalty_transactions(id), -- Link to points used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bundle_purchases_user ON bundle_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_bundle_purchases_bundle ON bundle_purchases(bundle_id);

-- SPIN GAMES
CREATE TABLE IF NOT EXISTS spin_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'daily' CHECK (type IN ('daily', 'weekly', 'special')),
    free_spins_per_day INTEGER DEFAULT 1,
    points_per_spin INTEGER DEFAULT 100,
    max_spins_per_day INTEGER DEFAULT 3,
    wheel_config JSONB NOT NULL, -- [{label: string, value: string, type: string, quantity: int, probability: float, color: string}]
    segment_colors JSONB DEFAULT '["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"]',
    rules TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spin_games_active ON spin_games(is_active);

-- User spins tracking
CREATE TABLE IF NOT EXISTS user_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES spin_games(id) ON DELETE CASCADE,
    spin_date DATE DEFAULT CURRENT_DATE,
    spins_used INTEGER DEFAULT 1,
    points_used INTEGER DEFAULT 0,
    loyalty_transaction_id UUID REFERENCES loyalty_transactions(id), -- Link to points used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_id, spin_date)
);

-- Spin results (winnings)
CREATE TABLE IF NOT EXISTS spin_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES spin_games(id) ON DELETE CASCADE,
    spin_id UUID REFERENCES user_spins(id) ON DELETE CASCADE,
    segment_index INTEGER NOT NULL,
    prize_type VARCHAR(50) CHECK (prize_type IN ('points', 'discount', 'product', 'free_shipping', 'bundle_access', 'nothing')),
    prize_value TEXT, -- Points amount, discount %, product ID, etc.
    prize_details JSONB,
    loyalty_points_awarded INTEGER DEFAULT 0, -- If prize is points
    loyalty_transaction_id UUID REFERENCES loyalty_transactions(id), -- Link to points awarded
    is_claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_spins_user_date ON user_spins(user_id, spin_date);
CREATE INDEX IF NOT EXISTS idx_spin_results_user ON spin_results(user_id);
CREATE INDEX IF NOT EXISTS idx_spin_results_claimed ON spin_results(is_claimed);

-- CHALLENGES
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) CHECK (type IN ('referral', 'purchase', 'review', 'social', 'custom')),
    trigger_event VARCHAR(100), -- 'user_signup', 'first_purchase', 'review_submitted', etc.
    requirements JSONB, -- {min_purchase_amount: 1000, product_category: 'solar', etc.}
    reward_points INTEGER DEFAULT 0, -- Loyalty points to award
    reward_tier_upgrade VARCHAR(50) REFERENCES loyalty_tiers(tier), -- Tier upgrade if any
    reward_details JSONB,
    max_rewards_per_user INTEGER,
    max_total_rewards INTEGER,
    current_rewards_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    badge_image_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User challenge progress
CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    status VARCHAR(50) CHECK (status IN ('in_progress', 'completed', 'reward_claimed', 'expired')),
    progress INTEGER DEFAULT 0,
    target INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    reward_claimed_at TIMESTAMP WITH TIME ZONE,
    loyalty_points_awarded INTEGER DEFAULT 0,
    loyalty_transaction_id UUID REFERENCES loyalty_transactions(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_email VARCHAR(255),
    referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    referral_code VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'joined', 'completed', 'expired')),
    reward_points INTEGER DEFAULT 100, -- Points to award when completed
    reward_tier VARCHAR(50) REFERENCES loyalty_tiers(tier), -- Optional tier upgrade
    completed_at TIMESTAMP WITH TIME ZONE,
    loyalty_transaction_id UUID REFERENCES loyalty_transactions(id), -- Link to points awarded
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- REWARDS (Anniversary, Milestone)
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) CHECK (type IN ('anniversary', 'birthday', 'milestone', 'vip', 'welcome')),
    trigger_type VARCHAR(50) CHECK (trigger_type IN ('account_age_days', 'order_count', 'total_spent', 'tier_reached', 'date_based')),
    trigger_value INTEGER, -- Days, order count, amount threshold
    reward_points INTEGER DEFAULT 0, -- Loyalty points to award
    reward_tier_upgrade VARCHAR(50) REFERENCES loyalty_tiers(tier),
    reward_details JSONB,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_interval VARCHAR(50), -- 'yearly', 'monthly'
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_status ON rewards(is_active);

-- User rewards claimed
CREATE TABLE IF NOT EXISTS user_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
    milestone_date DATE,
    loyalty_points_awarded INTEGER DEFAULT 0,
    loyalty_transaction_id UUID REFERENCES loyalty_transactions(id),
    reward_claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, reward_id, milestone_date)
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_claimed ON user_rewards(reward_claimed);

-- Enable RLS
ALTER TABLE mistry_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Users can view active bundles" ON mistry_bundles
    FOR SELECT USING (status = 'active' AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));

CREATE POLICY "Admins can manage bundles" ON mistry_bundles
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Users can view active spin games" ON spin_games
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage spin games" ON spin_games
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Users can view active user spins" ON user_spins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user spins" ON user_spins
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Users can view their spin results" ON spin_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage spin results" ON spin_results
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Users can view active challenges" ON challenges
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage challenges" ON challenges
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Users can view their challenge progress" ON user_challenges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user challenges" ON user_challenges
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Users can view their referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Admins can manage referrals" ON referrals
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Users can view active rewards" ON rewards
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage rewards" ON rewards
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Users can view their rewards" ON user_rewards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user rewards" ON user_rewards
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Function to award points from spin
CREATE OR REPLACE FUNCTION award_spin_points(
    p_user_id UUID,
    p_game_id UUID,
    p_points INTEGER,
    p_description TEXT DEFAULT 'Points won from spin game'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_loyalty_record RECORD;
    v_transaction_id UUID;
    v_result JSONB;
BEGIN
    -- Update loyalty points using your existing structure
    UPDATE loyalty_points
    SET 
        points = points + p_points,
        points_earned = points_earned + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO v_loyalty_record;
    
    -- Create loyalty transaction
    INSERT INTO loyalty_transactions (
        user_id,
        points_change,
        current_points,
        transaction_type,
        description,
        metadata
    ) VALUES (
        p_user_id,
        p_points,
        v_loyalty_record.points,
        'earned',
        p_description,
        jsonb_build_object(
            'source_type', 'spin_game',
            'source_id', p_game_id
        )
    ) RETURNING id INTO v_transaction_id;
    
    -- Update tier if needed
    UPDATE loyalty_points lp
    SET tier = (
        SELECT tier 
        FROM loyalty_tiers 
        WHERE min_points <= lp.points
        ORDER BY min_points DESC 
        LIMIT 1
    )
    WHERE user_id = p_user_id;
    
    v_result := jsonb_build_object(
        'success', true,
        'points_awarded', p_points,
        'new_balance', v_loyalty_record.points,
        'transaction_id', v_transaction_id
    );
    
    RETURN v_result;
END;
$$;

-- Function to create coupon from spin win
CREATE OR REPLACE FUNCTION create_coupon_from_spin(
    p_user_id UUID,
    p_game_id UUID,
    p_discount_type TEXT,
    p_discount_value NUMERIC,
    p_valid_days INTEGER DEFAULT 30
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_coupon_id UUID;
    v_user_email TEXT;
    v_coupon_code TEXT;
BEGIN
    -- Get user email
    SELECT email INTO v_user_email FROM users WHERE id = p_user_id;
    
    -- Generate unique coupon code
    v_coupon_code := 'SPIN-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));
    
    -- Ensure code is unique
    WHILE EXISTS (SELECT 1 FROM coupons WHERE code = v_coupon_code) LOOP
        v_coupon_code := 'SPIN-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));
    END LOOP;
    
    -- Insert into your existing coupons table
    INSERT INTO coupons (
        code,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount_amount,
        valid_from,
        valid_until,
        usage_limit,
        used_count,
        is_active,
        single_use_per_customer,
        description,
        source_type,
        source_id,
        user_specific,
        metadata
    ) VALUES (
        v_coupon_code,
        p_discount_type,
        p_discount_value,
        1000, -- Minimum order amount (configurable)
        CASE WHEN p_discount_type = 'percentage' THEN 5000 ELSE NULL END, -- Max discount for percentage
        NOW(),
        NOW() + (p_valid_days || ' days')::INTERVAL,
        1, -- Single use
        0,
        true,
        true, -- Single use per customer
        'Prize from Spin Game',
        'spin',
        p_game_id,
        p_user_id,
        jsonb_build_object(
            'game_id', p_game_id,
            'created_at', NOW()
        )
    ) RETURNING id INTO v_coupon_id;
    
    RETURN v_coupon_id;
END;
$$;

-- Function to award referral points
CREATE OR REPLACE FUNCTION award_referral_points(
    p_referral_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_referral referrals%ROWTYPE;
    v_loyalty_record RECORD;
    v_transaction_id UUID;
    v_points INTEGER;
    v_result JSONB;
BEGIN
    -- Get referral details
    SELECT * INTO v_referral
    FROM referrals
    WHERE id = p_referral_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Referral not found');
    END IF;
    
    IF v_referral.status != 'joined' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Referral not ready for reward');
    END IF;
    
    v_points := COALESCE(v_referral.reward_points, 100);
    
    -- Update loyalty points
    UPDATE loyalty_points
    SET 
        points = points + v_points,
        points_earned = points_earned + v_points,
        updated_at = NOW()
    WHERE user_id = v_referral.referrer_id
    RETURNING * INTO v_loyalty_record;
    
    -- Create loyalty transaction
    INSERT INTO loyalty_transactions (
        user_id,
        points_change,
        current_points,
        transaction_type,
        description,
        metadata
    ) VALUES (
        v_referral.referrer_id,
        v_points,
        v_loyalty_record.points,
        'earned',
        'Referral points for new customer',
        jsonb_build_object(
            'source_type', 'referral',
            'source_id', p_referral_id,
            'referred_user_id', v_referral.referred_user_id
        )
    ) RETURNING id INTO v_transaction_id;
    
    -- Update referral record
    UPDATE referrals
    SET 
        status = 'completed',
        completed_at = NOW(),
        loyalty_transaction_id = v_transaction_id,
        updated_at = NOW()
    WHERE id = p_referral_id;
    
    -- Update tier if needed
    UPDATE loyalty_points lp
    SET tier = (
        SELECT tier 
        FROM loyalty_tiers 
        WHERE min_points <= lp.points
        ORDER BY min_points DESC 
        LIMIT 1
    )
    WHERE user_id = v_referral.referrer_id;
    
    v_result := jsonb_build_object(
        'success', true,
        'points_awarded', v_points,
        'new_balance', v_loyalty_record.points,
        'transaction_id', v_transaction_id
    );
    
    RETURN v_result;
END;
$$;

-- Function to create coupon from challenge completion
CREATE OR REPLACE FUNCTION create_coupon_from_challenge(
    p_user_id UUID,
    p_challenge_id UUID,
    p_discount_type TEXT,
    p_discount_value NUMERIC,
    p_description TEXT,
    p_valid_days INTEGER DEFAULT 30
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_coupon_id UUID;
    v_user_email TEXT;
    v_coupon_code TEXT;
BEGIN
    -- Get user email
    SELECT email INTO v_user_email FROM users WHERE id = p_user_id;
    
    -- Generate unique coupon code
    v_coupon_code := 'CHALLENGE-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));
    
    -- Ensure code is unique
    WHILE EXISTS (SELECT 1 FROM coupons WHERE code = v_coupon_code) LOOP
        v_coupon_code := 'CHALLENGE-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));
    END LOOP;
    
    -- Insert into your existing coupons table
    INSERT INTO coupons (
        code,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount_amount,
        valid_from,
        valid_until,
        usage_limit,
        used_count,
        is_active,
        single_use_per_customer,
        description,
        source_type,
        source_id,
        user_specific,
        metadata
    ) VALUES (
        v_coupon_code,
        p_discount_type,
        p_discount_value,
        0, -- No minimum for challenge rewards
        NULL,
        NOW(),
        NOW() + (p_valid_days || ' days')::INTERVAL,
        1,
        0,
        true,
        true,
        p_description,
        'challenge',
        p_challenge_id,
        p_user_id,
        jsonb_build_object(
            'challenge_id', p_challenge_id,
            'created_at', NOW()
        )
    ) RETURNING id INTO v_coupon_id;
    
    RETURN v_coupon_id;
END;
$$;

-- Function to create anniversary reward coupon
CREATE OR REPLACE FUNCTION create_anniversary_coupon(
    p_user_id UUID,
    p_reward_id UUID,
    p_discount_type TEXT DEFAULT 'percentage',
    p_discount_value NUMERIC DEFAULT 10,
    p_description TEXT DEFAULT 'Anniversary Gift',
    p_valid_days INTEGER DEFAULT 30
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_coupon_id UUID;
    v_user_email TEXT;
    v_coupon_code TEXT;
    v_user_name TEXT;
BEGIN
    -- Get user details
    SELECT email, full_name INTO v_user_email, v_user_name 
    FROM users WHERE id = p_user_id;
    
    -- Generate unique coupon code
    v_coupon_code := 'ANNIV-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 4));
    
    -- Ensure code is unique
    WHILE EXISTS (SELECT 1 FROM coupons WHERE code = v_coupon_code) LOOP
        v_coupon_code := 'ANNIV-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 4));
    END LOOP;
    
    -- Insert into your existing coupons table
    INSERT INTO coupons (
        code,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount_amount,
        valid_from,
        valid_until,
        usage_limit,
        used_count,
        is_active,
        single_use_per_customer,
        description,
        source_type,
        source_id,
        user_specific,
        metadata
    ) VALUES (
        v_coupon_code,
        p_discount_type,
        p_discount_value,
        0,
        NULL,
        NOW(),
        NOW() + (p_valid_days || ' days')::INTERVAL,
        1,
        0,
        true,
        true,
        p_description || ' for ' || COALESCE(v_user_name, 'Customer'),
        'reward',
        p_reward_id,
        p_user_id,
        jsonb_build_object(
            'reward_id', p_reward_id,
            'anniversary_year', EXTRACT(YEAR FROM NOW()),
            'created_at', NOW()
        )
    ) RETURNING id INTO v_coupon_id;
    
    RETURN v_coupon_id;
END;
$$;

-- Updated function to record spin with coupon generation
CREATE OR REPLACE FUNCTION record_spin(
    p_user_id UUID,
    p_game_id UUID,
    p_used_points INTEGER,
    p_segment_index INTEGER,
    p_prize_type VARCHAR,
    p_prize_value TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_spin_id UUID;
    v_result_id UUID;
    v_game spin_games%ROWTYPE;
    v_coupon_id UUID;
    v_response JSONB;
    v_loyalty_points INTEGER;
    v_current_points INTEGER;
BEGIN
    -- Get game details
    SELECT * INTO v_game FROM spin_games WHERE id = p_game_id;
    
    -- Get user's current loyalty points
    SELECT points INTO v_current_points 
    FROM loyalty_points 
    WHERE user_id = p_user_id;
    
    -- Record spin usage
    IF p_used_points = 0 THEN
        -- Free spin
        INSERT INTO user_spins (user_id, game_id, spin_date, spins_used)
        VALUES (p_user_id, p_game_id, CURRENT_DATE, 1)
        ON CONFLICT (user_id, game_id, spin_date) 
        DO UPDATE SET spins_used = user_spins.spins_used + 1
        RETURNING id INTO v_spin_id;
        
        -- Update user's daily spin count
        UPDATE users 
        SET spins_today = COALESCE(spins_today, 0) + 1,
            last_spin_date = CURRENT_DATE
        WHERE id = p_user_id;
    ELSE
        -- Paid spin (using loyalty points)
        -- Deduct points using your existing loyalty system
        UPDATE loyalty_points 
        SET points = points - p_used_points,
            points_redeemed = points_redeemed + p_used_points,
            updated_at = NOW()
        WHERE user_id = p_user_id
        RETURNING points INTO v_current_points;
        
        -- Record transaction
        INSERT INTO loyalty_transactions (
            user_id,
            points_change,
            current_points,
            transaction_type,
            description,
            metadata
        ) VALUES (
            p_user_id,
            -p_used_points,
            v_current_points,
            'redeemed',
            'Points used for spin game',
            jsonb_build_object('game_id', p_game_id)
        );
        
        INSERT INTO user_spins (user_id, game_id, spin_date, spins_used, points_used)
        VALUES (p_user_id, p_game_id, CURRENT_DATE, 1, p_used_points)
        RETURNING id INTO v_spin_id;
    END IF;

    -- Handle prize based on type
    IF p_prize_type = 'discount' THEN
        -- Create coupon using your existing coupons table
        v_coupon_id := create_coupon_from_spin(
            p_user_id,
            p_game_id,
            'percentage',
            p_prize_value::NUMERIC,
            30
        );
    ELSIF p_prize_type = 'points' THEN
        -- Award points using your existing loyalty system
        v_loyalty_points := p_prize_value::INTEGER;
        
        UPDATE loyalty_points 
        SET points = points + v_loyalty_points,
            points_earned = points_earned + v_loyalty_points,
            updated_at = NOW()
        WHERE user_id = p_user_id
        RETURNING points INTO v_current_points;
        
        -- Record transaction
        INSERT INTO loyalty_transactions (
            user_id,
            points_change,
            current_points,
            transaction_type,
            description,
            metadata
        ) VALUES (
            p_user_id,
            v_loyalty_points,
            v_current_points,
            'earned',
            'Points won from spin game',
            jsonb_build_object('game_id', p_game_id)
        );
    END IF;

    -- Record spin result
    INSERT INTO spin_results (
        user_id,
        game_id,
        spin_id,
        segment_index,
        prize_type,
        prize_value,
        coupon_id,
        loyalty_points_awarded,
        expires_at
    ) VALUES (
        p_user_id,
        p_game_id,
        v_spin_id,
        p_segment_index,
        p_prize_type,
        p_prize_value,
        v_coupon_id,
        CASE WHEN p_prize_type = 'points' THEN p_prize_value::INTEGER ELSE 0 END,
        CASE 
            WHEN p_prize_type = 'discount' THEN NOW() + INTERVAL '30 days'
            ELSE NULL
        END
    ) RETURNING id INTO v_result_id;

    -- Build response
    v_response := jsonb_build_object(
        'success', true,
        'spin_id', v_spin_id,
        'result_id', v_result_id,
        'prize_type', p_prize_type,
        'prize_value', p_prize_value
    );
    
    IF v_coupon_id IS NOT NULL THEN
        -- Get coupon code
        v_response := v_response || jsonb_build_object(
            'coupon_id', v_coupon_id,
            'coupon_code', (SELECT code FROM coupons WHERE id = v_coupon_id)
        );
    END IF;
    
    IF v_loyalty_points > 0 THEN
        v_response := v_response || jsonb_build_object(
            'points_awarded', v_loyalty_points,
            'new_points_balance', v_current_points
        );
    END IF;

    RETURN v_response;
END;
$$;

-- Function to get all active coupons for a user
CREATE OR REPLACE FUNCTION get_user_active_coupons(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_coupons JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', c.id,
                'code', c.code,
                'discount_type', c.discount_type,
                'discount_value', c.discount_value,
                'min_order_amount', c.min_order_amount,
                'max_discount_amount', c.max_discount_amount,
                'description', c.description,
                'valid_until', c.valid_until,
                'source_type', c.source_type,
                'days_remaining', EXTRACT(DAY FROM (c.valid_until - NOW())),
                'metadata', c.metadata
            ) ORDER BY c.valid_until ASC
        ),
        '[]'::jsonb
    ) INTO v_coupons
    FROM coupons c
    WHERE c.user_specific = p_user_id
      AND c.is_active = true
      AND c.valid_from <= NOW()
      AND c.valid_until >= NOW()
      AND (c.usage_limit IS NULL OR c.used_count < c.usage_limit);
    
    RETURN jsonb_build_object(
        'success', true,
        'coupons', v_coupons,
        'count', jsonb_array_length(v_coupons)
    );
END;
$$;

-- Function to check and award birthday rewards (using created_at)
CREATE OR REPLACE FUNCTION check_and_award_birthday_rewards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_reward rewards%ROWTYPE;
    v_tier loyalty_tiers%ROWTYPE;
    v_coupon_id UUID;
    v_birthday_year INTEGER;
BEGIN
    -- Get active birthday reward config
    SELECT * INTO v_reward
    FROM rewards
    WHERE type = 'birthday'
      AND is_active = true
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    v_birthday_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Find users with birthday today (using created_at)
    FOR v_user IN 
        SELECT u.id, u.created_at, u.email, u.full_name, lp.tier, lp.points
        FROM users u
        JOIN loyalty_points lp ON u.id = lp.user_id
        WHERE 
            EXTRACT(MONTH FROM u.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(DAY FROM u.created_at) = EXTRACT(DAY FROM CURRENT_DATE)
            AND NOT EXISTS (
                SELECT 1 FROM user_rewards ur
                WHERE ur.user_id = u.id
                AND ur.reward_id = v_reward.id
                AND EXTRACT(YEAR FROM ur.claimed_at) = v_birthday_year
            )
    LOOP
        -- Get tier details for bonus
        SELECT * INTO v_tier
        FROM loyalty_tiers
        WHERE tier = v_user.tier;
        
        -- Award points (base points + tier bonus)
        UPDATE loyalty_points
        SET 
            points = points + v_reward.reward_points + COALESCE(v_tier.birthday_bonus_points, 0),
            points_earned = points_earned + v_reward.reward_points + COALESCE(v_tier.birthday_bonus_points, 0),
            updated_at = NOW()
        WHERE user_id = v_user.id
        RETURNING points INTO v_user.points;
        
        -- Record transaction
        INSERT INTO loyalty_transactions (
            user_id,
            points_change,
            current_points,
            transaction_type,
            description,
            metadata
        ) VALUES (
            v_user.id,
            v_reward.reward_points + COALESCE(v_tier.birthday_bonus_points, 0),
            v_user.points,
            'earned',
            'Birthday gift - ' || v_birthday_year,
            jsonb_build_object('tier', v_user.tier, 'bonus', v_tier.birthday_bonus_points)
        );
        
        -- Create birthday coupon if reward type is coupon
        IF v_reward.reward_details IS NOT NULL AND v_reward.reward_details->>'coupon' IS NOT NULL THEN
            v_coupon_id := create_anniversary_coupon(
                v_user.id,
                v_reward.id,
                (v_reward.reward_details->>'discount_type')::TEXT,
                (v_reward.reward_details->>'discount_value')::NUMERIC,
                'Happy Birthday!',
                30
            );
        END IF;
        
        -- Record reward
        INSERT INTO user_rewards (
            user_id,
            reward_id,
            milestone_date,
            loyalty_points_awarded,
            coupon_id,
            claimed_at,
            metadata
        ) VALUES (
            v_user.id,
            v_reward.id,
            CURRENT_DATE,
            v_reward.reward_points + COALESCE(v_tier.birthday_bonus_points, 0),
            v_coupon_id,
            NOW(),
            jsonb_build_object(
                'year', v_birthday_year,
                'tier_bonus', v_tier.birthday_bonus_points,
                'email_sent', false
            )
        );
    END LOOP;
END;
$$;

-- Function to get user engagement summary
-- Update get_user_engagement_summary to include recent spin results
CREATE OR REPLACE FUNCTION get_user_engagement_summary(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_bundle_count INTEGER;
    v_user_tier TEXT;
    v_spins_today INTEGER;
    v_spin_game JSONB;
    v_active_challenges INTEGER;
    v_birthday_reward BOOLEAN;
    v_available_bundles JSONB;
    v_loyalty_points INTEGER;
    v_recent_spin_results JSONB;
    v_user_record RECORD;
BEGIN
    -- Get user's loyalty points and tier
    SELECT lp.points, lp.tier INTO v_loyalty_points, v_user_tier
    FROM loyalty_points lp
    WHERE lp.user_id = p_user_id;
    
    -- Get available bundles for user (based on tier and points)
    SELECT COUNT(*) INTO v_bundle_count
    FROM mistry_bundles mb
    WHERE mb.status = 'active'
      AND (mb.start_date IS NULL OR mb.start_date <= NOW())
      AND (mb.end_date IS NULL OR mb.end_date >= NOW())
      AND (mb.min_tier_required IS NULL OR mb.min_tier_required <= v_user_tier)
      AND (mb.points_required = 0 OR mb.points_required <= v_loyalty_points);
    
    -- Get featured/available bundles
    SELECT JSONB_AGG(
        JSONB_BUILD_OBJECT(
            'id', mb.id,
            'name', mb.name,
            'slug', mb.slug,
            'image_url', mb.image_url,
            'badge_text', mb.badge_text,
            'badge_color', mb.badge_color,
            'discount_type', mb.discount_type,
            'discount_value', mb.discount_value,
            'points_required', mb.points_required,
            'featured', mb.featured
        ) ORDER BY mb.featured DESC, mb.created_at DESC
        LIMIT 5
    ) INTO v_available_bundles
    FROM mistry_bundles mb
    WHERE mb.status = 'active'
      AND (mb.start_date IS NULL OR mb.start_date <= NOW())
      AND (mb.end_date IS NULL OR mb.end_date >= NOW())
      AND (mb.min_tier_required IS NULL OR mb.min_tier_required <= v_user_tier)
      AND (mb.points_required = 0 OR mb.points_required <= v_loyalty_points);
    
    -- Get today's spin count
    SELECT COALESCE(spins_used, 0) INTO v_spins_today
    FROM user_spins
    WHERE user_id = p_user_id
      AND spin_date = CURRENT_DATE;
    
    -- Get active spin game
    SELECT JSONB_BUILD_OBJECT(
        'id', sg.id,
        'name', sg.name,
        'free_spins_per_day', sg.free_spins_per_day,
        'points_per_spin', sg.points_per_spin,
        'is_active', sg.is_active
    ) INTO v_spin_game
    FROM spin_games sg
    WHERE sg.is_active = true
      AND (sg.start_date IS NULL OR sg.start_date <= NOW())
      AND (sg.end_date IS NULL OR sg.end_date >= NOW())
    LIMIT 1;
    
    -- Get recent spin results (last 5)
    SELECT JSONB_AGG(
        JSONB_BUILD_OBJECT(
            'id', sr.id,
            'prize_type', sr.prize_type,
            'prize_value', sr.prize_value,
            'loyalty_points_awarded', sr.loyalty_points_awarded,
            'is_claimed', sr.is_claimed,
            'created_at', sr.created_at,
            'coupon', CASE WHEN c.id IS NOT NULL THEN
                JSONB_BUILD_OBJECT(
                    'code', c.code,
                    'discount_type', c.discount_type,
                    'discount_value', c.discount_value
                )
            ELSE NULL END
        ) ORDER BY sr.created_at DESC
        LIMIT 5
    ) INTO v_recent_spin_results
    FROM spin_results sr
    LEFT JOIN coupons c ON sr.coupon_id = c.id
    WHERE sr.user_id = p_user_id;
    
    -- Get active challenges count
    SELECT COUNT(*) INTO v_active_challenges
    FROM user_challenges uc
    JOIN challenges c ON uc.challenge_id = c.id
    WHERE uc.user_id = p_user_id
      AND uc.status = 'in_progress'
      AND c.is_active = true;
    
    -- Check if birthday reward is available (based on created_at)
    SELECT EXISTS (
        SELECT 1
        FROM users u
        LEFT JOIN user_rewards ur ON ur.user_id = u.id 
            AND ur.reward_id IN (SELECT id FROM rewards WHERE type = 'birthday')
            AND EXTRACT(YEAR FROM ur.claimed_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        WHERE u.id = p_user_id
          AND EXTRACT(MONTH FROM u.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(DAY FROM u.created_at) = EXTRACT(DAY FROM CURRENT_DATE)
          AND ur.id IS NULL
    ) INTO v_birthday_reward;
    
    -- Build result
    v_result := JSONB_BUILD_OBJECT(
        'success', true,
        'bundle_count', COALESCE(v_bundle_count, 0),
        'available_bundles', COALESCE(v_available_bundles, '[]'::JSONB),
        'user_tier', v_user_tier,
        'loyalty_points', COALESCE(v_loyalty_points, 0),
        'spins_today', COALESCE(v_spins_today, 0),
        'spin_game', v_spin_game,
        'recent_spin_results', COALESCE(v_recent_spin_results, '[]'::JSONB),
        'active_challenges', COALESCE(v_active_challenges, 0),
        'birthday_reward_available', COALESCE(v_birthday_reward, false),
        'anniversary_days', EXTRACT(DAY FROM (CURRENT_DATE - (SELECT created_at FROM users WHERE id = p_user_id)))::INTEGER
    );
    
    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    RETURN JSONB_BUILD_OBJECT(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Create specific function for incrementing bundle purchases
CREATE OR REPLACE FUNCTION increment_mistry_bundle(bundle_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bundle RECORD;
  v_result JSONB;
BEGIN
  -- Get current bundle data and lock row
  SELECT * INTO v_bundle
  FROM mistry_bundles
  WHERE id = bundle_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bundle not found'
    );
  END IF;
  
  -- Check if total purchases allowed would be exceeded
  IF v_bundle.total_purchases_allowed IS NOT NULL 
     AND v_bundle.current_purchases >= v_bundle.total_purchases_allowed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bundle purchase limit reached',
      'current_purchases', v_bundle.current_purchases,
      'total_allowed', v_bundle.total_purchases_allowed
    );
  END IF;
  
  -- Increment the purchase count
  UPDATE mistry_bundles
  SET 
    current_purchases = COALESCE(current_purchases, 0) + 1,
    updated_at = NOW()
  WHERE id = bundle_id
  RETURNING * INTO v_bundle;
  
  -- Return success response
  v_result := jsonb_build_object(
    'success', true,
    'bundle_id', bundle_id,
    'current_purchases', v_bundle.current_purchases,
    'total_allowed', v_bundle.total_purchases_allowed,
    'message', 'Bundle purchase count incremented successfully'
  );
  
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;