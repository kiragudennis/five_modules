-- Create loyalty_points table to track customer points
CREATE TABLE loyalty_points (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) NOT NULL,
    points integer NOT NULL DEFAULT 0,
    points_earned integer NOT NULL DEFAULT 0,
    points_redeemed integer NOT NULL DEFAULT 0,
    points_expiring_soon integer DEFAULT 0,
    last_activity_at timestamptz,
    tier text DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Create loyalty_transactions table to track point movements
CREATE TABLE loyalty_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) NOT NULL,
    order_id uuid REFERENCES orders(id),
    points_change integer NOT NULL,
    points_balance integer NOT NULL,
    transaction_type text NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted', 'bonus')),
    description text NOT NULL,
    metadata jsonb,
    expires_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Create loyalty_tiers table to define point tiers and benefits
CREATE TABLE loyalty_tiers (
    tier text PRIMARY KEY CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    min_points integer NOT NULL,
    max_points integer,
    points_per_shilling numeric(5,2) NOT NULL, -- Points earned per KES spent
    discount_percentage numeric(5,2) DEFAULT 0,
    free_shipping_threshold numeric(10,2),
    priority_support boolean DEFAULT false,
    birthday_bonus_points integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Insert default loyalty tiers
INSERT INTO loyalty_tiers (tier, min_points, points_per_shilling, discount_percentage, free_shipping_threshold, priority_support, birthday_bonus_points) VALUES
('bronze', 0, 1.0, 0, null, false, 100),
('silver', 1000, 1.5, 5, 5000, false, 250),
('gold', 5000, 2.0, 10, 3000, true, 500),
('platinum', 15000, 2.5, 15, 0, true, 1000);

-- Add order_number and tracking_url to orders table for customer tracking
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS estimated_delivery timestamptz,
ADD COLUMN IF NOT EXISTS loyalty_points_earned integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_points_redeemed integer DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_order_id ON loyalty_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Function to award loyalty points after order completion
CREATE OR REPLACE FUNCTION award_loyalty_points()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    user_tier loyalty_tiers%ROWTYPE;
    points_to_award integer;
    current_points integer;
    new_tier text;
BEGIN
    -- Only award points when order is marked as completed and paid
    IF NEW.status = 'completed' AND NEW.payment_status = 'paid' 
       AND (OLD.status != 'completed' OR OLD.payment_status != 'paid') THEN
        
        -- Get user's current tier
        SELECT lt.* INTO user_tier
        FROM loyalty_points lp
        JOIN loyalty_tiers lt ON lp.tier = lt.tier
        WHERE lp.user_id = NEW.user_id;
        
        -- If user has no loyalty record, create one
        IF NOT FOUND THEN
            INSERT INTO loyalty_points (user_id, tier)
            VALUES (NEW.user_id, 'bronze')
            ON CONFLICT (user_id) DO NOTHING;
            
            SELECT * INTO user_tier FROM loyalty_tiers WHERE tier = 'bronze';
        END IF;
        
        -- Calculate points (points per KES spent)
        points_to_award := FLOOR(NEW.total_amount * user_tier.points_per_shilling);
        
        -- Update loyalty points
        INSERT INTO loyalty_points (user_id, points, points_earned, last_activity_at)
        VALUES (NEW.user_id, points_to_award, points_to_award, NOW())
        ON CONFLICT (user_id) DO UPDATE
        SET 
            points = loyalty_points.points + EXCLUDED.points,
            points_earned = loyalty_points.points_earned + EXCLUDED.points_earned,
            last_activity_at = EXCLUDED.last_activity_at,
            updated_at = NOW()
        RETURNING points INTO current_points;
        
        -- Record transaction
        INSERT INTO loyalty_transactions (
            user_id, 
            order_id, 
            points_change, 
            points_balance, 
            transaction_type, 
            description,
            expires_at
        ) VALUES (
            NEW.user_id,
            NEW.id,
            points_to_award,
            current_points,
            'earned',
            'Points earned for order #' || NEW.order_number,
            NOW() + INTERVAL '365 days' -- Points expire in 1 year
        );
        
        -- Update order with points earned
        NEW.loyalty_points_earned := points_to_award;
        
        -- Check and update tier
        SELECT tier INTO new_tier
        FROM loyalty_tiers
        WHERE min_points <= current_points
        ORDER BY min_points DESC
        LIMIT 1;
        
        UPDATE loyalty_points
        SET tier = new_tier, updated_at = NOW()
        WHERE user_id = NEW.user_id AND tier != new_tier;
        
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER orders_award_points
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION award_loyalty_points();

-- Function to redeem loyalty points
CREATE OR REPLACE FUNCTION redeem_loyalty_points(
    p_user_id uuid,
    p_points_to_redeem integer,
    p_order_id uuid DEFAULT NULL,
    p_description text DEFAULT 'Points redemption'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance integer;
    new_balance integer;
    result json;
BEGIN
    -- Get current balance
    SELECT points INTO current_balance
    FROM loyalty_points
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No loyalty account found'
        );
    END IF;
    
    IF current_balance < p_points_to_redeem THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Insufficient points'
        );
    END IF;
    
    -- Update points
    UPDATE loyalty_points
    SET 
        points = points - p_points_to_redeem,
        points_redeemed = points_redeemed + p_points_to_redeem,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING points INTO new_balance;
    
    -- Record transaction
    INSERT INTO loyalty_transactions (
        user_id, 
        order_id, 
        points_change, 
        points_balance, 
        transaction_type, 
        description
    ) VALUES (
        p_user_id,
        p_order_id,
        -p_points_to_redeem,
        new_balance,
        'redeemed',
        p_description
    );
    
    RETURN json_build_object(
        'success', true,
        'points_redeemed', p_points_to_redeem,
        'new_balance', new_balance,
        'discount_amount', (p_points_to_redeem / 10.0) -- 1 point = 0.10 KES
    );
END;
$$;

-- Function to get user loyalty summary
CREATE OR REPLACE FUNCTION get_user_loyalty_summary(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    loyalty_record RECORD;
    user_tier loyalty_tiers%ROWTYPE;
    next_tier loyalty_tiers%ROWTYPE;
    points_to_next_tier integer;
    recent_transactions json;
    result json;
BEGIN
    -- Get loyalty points
    SELECT * INTO loyalty_record
    FROM loyalty_points
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- Create default record
        INSERT INTO loyalty_points (user_id, tier)
        VALUES (p_user_id, 'bronze')
        RETURNING * INTO loyalty_record;
    END IF;
    
    -- Get current tier details
    SELECT * INTO user_tier
    FROM loyalty_tiers
    WHERE tier = loyalty_record.tier;
    
    -- Get next tier
    SELECT * INTO next_tier
    FROM loyalty_tiers
    WHERE min_points > user_tier.min_points
    ORDER BY min_points
    LIMIT 1;
    
    -- Calculate points to next tier
    IF next_tier.tier IS NOT NULL THEN
        points_to_next_tier := GREATEST(next_tier.min_points - loyalty_record.points, 0);
    ELSE
        points_to_next_tier := 0;
    END IF;
    
    -- Get recent transactions
    SELECT COALESCE(json_agg(
        json_build_object(
            'date', created_at,
            'type', transaction_type,
            'points', points_change,
            'description', description,
            'order_number', (
                SELECT order_number 
                FROM orders 
                WHERE id = loyalty_transactions.order_id
            )
        )
        ORDER BY created_at DESC
        LIMIT 10
    ), '[]'::json) INTO recent_transactions
    FROM loyalty_transactions
    WHERE user_id = p_user_id;
    
    -- Build result
    result := json_build_object(
        'points', loyalty_record.points,
        'tier', loyalty_record.tier,
        'tierDetails', json_build_object(
            'name', user_tier.tier,
            'pointsPerShilling', user_tier.points_per_shilling,
            'discountPercentage', user_tier.discount_percentage,
            'freeShippingThreshold', user_tier.free_shipping_threshold,
            'prioritySupport', user_tier.priority_support,
            'birthdayBonusPoints', user_tier.birthday_bonus_points
        ),
        'nextTier', CASE WHEN next_tier.tier IS NOT NULL THEN
            json_build_object(
                'name', next_tier.tier,
                'minPoints', next_tier.min_points,
                'pointsNeeded', points_to_next_tier,
                'discountPercentage', next_tier.discount_percentage
            )
        ELSE NULL END,
        'recentTransactions', recent_transactions,
        'pointsValue', (loyalty_record.points / 10.0), -- 1 point = 0.10 KES
        'totalEarned', loyalty_record.points_earned,
        'totalRedeemed', loyalty_record.points_redeemed
    );
    
    RETURN result;
END;
$$;