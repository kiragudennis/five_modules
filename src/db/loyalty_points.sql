-- 1. First, create loyalty_tiers table (if not exists)
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    tier text PRIMARY KEY CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    min_points integer NOT NULL,
    points_per_shilling numeric(5,2) NOT NULL DEFAULT 1.0,
    discount_percentage integer NOT NULL DEFAULT 0,
    free_shipping_threshold numeric(10,2),
    priority_support boolean DEFAULT false,
    birthday_bonus_points integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 2. Create loyalty_points table (if not exists)
CREATE TABLE IF NOT EXISTS loyalty_points (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    points integer DEFAULT 0 CHECK (points >= 0),
    points_earned integer DEFAULT 0,
    points_redeemed integer DEFAULT 0,
    tier text DEFAULT 'bronze' REFERENCES loyalty_tiers(tier),
    last_updated timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Get current loyalty profile for all users (for AuthContext)
-- Create a view that joins everything
CREATE OR REPLACE VIEW user_loyalty_profile AS
SELECT 
  u.*,
  lp.points,
  lp.points_earned,
  lp.points_redeemed,
  lp.tier as current_tier,
  lt.min_points,
  lt.points_per_shilling,
  lt.discount_percentage,
  lt.free_shipping_threshold,
  lt.priority_support,
  lt.birthday_bonus_points,
  lp.last_updated as loyalty_last_updated
FROM users u
LEFT JOIN loyalty_points lp ON u.id = lp.user_id
LEFT JOIN loyalty_tiers lt ON lp.tier = lt.tier;

-- 3. Create loyalty_transactions table (if not exists) - THIS IS THE MISSING TABLE
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
    points_change integer NOT NULL,
    current_points integer NOT NULL,
    transaction_type text NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted', 'signup_bonus', 'refunded', 'account_activation')),
    description text NOT NULL,
    expires_at timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- 4. Insert default loyalty tiers (if not already inserted)
INSERT INTO loyalty_tiers (tier, min_points, points_per_shilling, discount_percentage, free_shipping_threshold, priority_support, birthday_bonus_points) 
VALUES
('bronze', 0, 1.0, 0, 5000.00, false, 100),
('silver', 1000, 1.5, 5, 3000.00, false, 200),
('gold', 5000, 2.0, 10, 2000.00, true, 500),
('platinum', 15000, 3.0, 15, 1000.00, true, 1000)
ON CONFLICT (tier) DO NOTHING;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_tier ON loyalty_points(tier);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_order_id ON loyalty_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at DESC);

-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS get_user_loyalty_summary(uuid) CASCADE;

-- Create a single, clean version
CREATE OR REPLACE FUNCTION get_user_loyalty_summary(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    loyalty_record RECORD;
    user_tier RECORD;
    next_tier RECORD;
    points_to_next_tier integer;
    recent_transactions json;
    available_points integer;
    total_earned integer;
    total_redeemed integer;
    result json;
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'User not found'
        );
    END IF;
    
    -- Get loyalty points
    SELECT * INTO loyalty_record
    FROM loyalty_points
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- Create default record
        INSERT INTO loyalty_points (user_id, tier, points, points_earned, points_redeemed)
        VALUES (p_user_id, 'bronze', 0, 0, 0)
        ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
        RETURNING * INTO loyalty_record;
    END IF;
    
    -- Get current tier details
    SELECT * INTO user_tier
    FROM loyalty_tiers
    WHERE tier = loyalty_record.tier;
    
    IF NOT FOUND THEN
        -- Default to bronze tier if not found
        SELECT * INTO user_tier
        FROM loyalty_tiers
        WHERE tier = 'bronze';
    END IF;
    
    -- Get next tier
    SELECT * INTO next_tier
    FROM loyalty_tiers
    WHERE min_points > COALESCE(user_tier.min_points, 0)
    ORDER BY min_points
    LIMIT 1;
    
    -- Calculate points to next tier
    IF next_tier.tier IS NOT NULL THEN
        points_to_next_tier := GREATEST(next_tier.min_points - COALESCE(loyalty_record.points, 0), 0);
    ELSE
        points_to_next_tier := 0;
    END IF;
    
    -- Calculate available points for redemption (only multiples of 100)
    available_points := FLOOR(COALESCE(loyalty_record.points, 0) / 100) * 100;
    
    -- Get recent transactions - FIXED VERSION
    SELECT COALESCE(
        json_agg(
            json_build_object(
                'date', t.created_at,
                'type', t.transaction_type,
                'points', ABS(t.points_change),
                'description', t.description,
                'order_number', o.order_number
            )
        ),
        '[]'::json
    ) INTO recent_transactions
    FROM (
        SELECT *
        FROM loyalty_transactions
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 10
    ) t
    LEFT JOIN orders o ON t.order_id = o.id;
    
    -- Use points_earned and points_redeemed from loyalty_points table
    total_earned := COALESCE(loyalty_record.points_earned, 0);
    total_redeemed := COALESCE(loyalty_record.points_redeemed, 0);
    
    -- Build result
    result := json_build_object(
        'points', COALESCE(loyalty_record.points, 0),
        'availableForRedemption', available_points,
        'redemptionRate', 0.1,
        'maxDiscount', (available_points / 10.0),
        'tier', COALESCE(loyalty_record.tier, 'bronze'),
        'tierDetails', json_build_object(
            'name', COALESCE(user_tier.tier, 'bronze'),
            'pointsPerShilling', COALESCE(user_tier.points_per_shilling, 1.0),
            'discountPercentage', COALESCE(user_tier.discount_percentage, 0),
            'freeShippingThreshold', user_tier.free_shipping_threshold,
            'prioritySupport', COALESCE(user_tier.priority_support, false),
            'birthdayBonusPoints', COALESCE(user_tier.birthday_bonus_points, 0)
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
        'pointsValue', (COALESCE(loyalty_record.points, 0) / 10.0),
        'totalEarned', total_earned,
        'totalRedeemed', total_redeemed,
        'success', true
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information
        RETURN json_build_object(
            'success', false,
            'message', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_loyalty_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_loyalty_summary(uuid) TO anon;

-- 7. Create a simple test function to verify tables exist
CREATE OR REPLACE FUNCTION check_loyalty_tables_exist()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tables_exist boolean;
    result json;
BEGIN
    -- Check if all required tables exist
    SELECT 
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_tiers') AND
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_points') AND
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_transactions')
    INTO tables_exist;
    
    result := json_build_object(
        'tables_exist', tables_exist,
        'loyalty_tiers', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_tiers'),
        'loyalty_points', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_points'),
        'loyalty_transactions', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_transactions')
    );
    
    RETURN result;
END;
$$;

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

-- Create a table to store redeemed loyalty discounts
CREATE TABLE IF NOT EXISTS loyalty_redemptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    points_used integer NOT NULL CHECK (points_used > 0),
    discount_amount numeric(10,2) NOT NULL CHECK (discount_amount > 0),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'refunded', 'expired')),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT unique_order_redemption UNIQUE(order_id)
);

-- Index for better performance
CREATE INDEX idx_loyalty_redemptions_user_id ON loyalty_redemptions(user_id);
CREATE INDEX idx_loyalty_redemptions_order_id ON loyalty_redemptions(order_id);
CREATE INDEX idx_loyalty_redemptions_status ON loyalty_redemptions(status);

-- Add valid_until column if it doesn't exist
ALTER TABLE loyalty_redemptions 
ADD COLUMN IF NOT EXISTS valid_until timestamptz DEFAULT (now() + interval '24 hours');

-- Update existing rows
UPDATE loyalty_redemptions 
SET valid_until = created_at + interval '24 hours'
WHERE valid_until IS NULL;


-- Function to redeem loyalty points for checkout (with order reservation)
CREATE OR REPLACE FUNCTION redeem_loyalty_points_for_checkout(
    p_user_id uuid,
    p_points_to_redeem integer,
    p_description text DEFAULT 'Points redeemed for discount'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    loyalty_record RECORD;
    discount_amount numeric(10,2);
    redemption_code text;
    redemption_id uuid; 
    result json;
BEGIN
    -- Validate input
    IF p_points_to_redeem <= 0 OR p_points_to_redeem % 100 != 0 THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Points must be redeemed in multiples of 100'
        );
    END IF;
    
    -- Get loyalty record
    SELECT * INTO loyalty_record
    FROM loyalty_points
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'No loyalty account found');
    END IF;
    
    -- Check if user has enough points
    IF loyalty_record.points < p_points_to_redeem THEN
        RETURN json_build_object('success', false, 'message', 'Insufficient points');
    END IF;
    
    -- Calculate discount amount (1 point = 0.10 KES)
    discount_amount := p_points_to_redeem / 10.0;
    
    -- Generate unique redemption code
    redemption_code := 'LOYALTY-' || encode(gen_random_bytes(6), 'hex');
    
    -- Create temporary redemption record (will be linked to order later)
    INSERT INTO loyalty_redemptions (
        user_id,
        points_used,
        discount_amount,
        status,
        metadata
    ) VALUES (
        p_user_id,
        p_points_to_redeem,
        discount_amount,
        'pending',
        json_build_object(
            'redemption_code', redemption_code,
            'description', p_description,
            'points_rate', 0.1, -- 1 point = 0.10 KES
            'created_at', now()
        )
    ) RETURNING id INTO redemption_id;
    
    -- Return redemption details for checkout
    result := json_build_object(
        'success', true,
        'redemption_id', redemption_id,
        'redemption_code', redemption_code,
        'points_redeemed', p_points_to_redeem,
        'discount_amount', discount_amount,
        'message', 'Points reserved for checkout. Apply this code during checkout.'
    );
    
    RETURN result;
END;
$$;

-- Updated apply_loyalty_redemption_to_order function with correct column names
CREATE OR REPLACE FUNCTION apply_loyalty_redemption_to_order(
    p_order_id uuid,
    p_redemption_code text,
    p_user_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    redemption_record RECORD;
    order_record RECORD;
    loyalty_record RECORD;
    actual_discount NUMERIC;
    remaining_total NUMERIC;
    points_to_deduct integer;
    points_returned integer;
    discount_ratio numeric;
    result json;
BEGIN
    -- Get redemption record
    SELECT * INTO redemption_record
    FROM loyalty_redemptions
    WHERE metadata->>'redemption_code' = p_redemption_code
      AND status = 'pending'
      AND valid_until > NOW()
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Invalid or expired redemption code'
        );
    END IF;
    
    -- Get order record
    SELECT * INTO order_record
    FROM orders
    WHERE id = p_order_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Order not found'
        );
    END IF;
    
    -- Verify user matches
    IF redemption_record.user_id != order_record.user_id THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Redemption does not belong to order owner'
        );
    END IF;
    
    -- Calculate remaining order total BEFORE loyalty discount
    remaining_total := COALESCE(order_record.subtotal, 0) + 
                       COALESCE(order_record.shipping_total, 0) + 
                       COALESCE(order_record.installation_cost, 0) - 
                       COALESCE(order_record.coupon_discount, 0);
    
    -- Cap discount at remaining total (can't discount below zero)
    actual_discount := LEAST(redemption_record.discount_amount, remaining_total);
    
    -- Get loyalty points
    SELECT * INTO loyalty_record
    FROM loyalty_points
    WHERE user_id = redemption_record.user_id
    FOR UPDATE;
    
    -- Check if still has enough points - FIXED: Use points_used
    IF loyalty_record.points < redemption_record.points_used THEN
        UPDATE loyalty_redemptions
        SET status = 'expired',
            updated_at = now()
        WHERE id = redemption_record.id;
        
        RETURN json_build_object(
            'success', false, 
            'message', format('Insufficient points. Have: %s, Need: %s', loyalty_record.points, redemption_record.points_used)
        );
    END IF;
    
    -- Calculate points to actually deduct (proportional to discount used)
    IF actual_discount < redemption_record.discount_amount THEN
        discount_ratio := actual_discount / redemption_record.discount_amount;
        points_to_deduct := ROUND(redemption_record.points_used * discount_ratio);
        points_returned := redemption_record.points_used - points_to_deduct;
    ELSE
        points_to_deduct := redemption_record.points_used;
        points_returned := 0;
    END IF;
    
    -- Deduct points from loyalty account
    UPDATE loyalty_points
    SET 
        points = points - points_to_deduct,
        points_redeemed = COALESCE(points_redeemed, 0) + points_to_deduct,
        updated_at = now()
    WHERE user_id = redemption_record.user_id
    RETURNING * INTO loyalty_record;
    
    -- Update order with loyalty discount
    UPDATE orders
    SET 
        loyalty_points_used = points_to_deduct,
        loyalty_discount = actual_discount,
        total_amount = GREATEST(0, remaining_total - actual_discount),
        updated_at = now()
    WHERE id = p_order_id
    RETURNING * INTO order_record;
    
    -- Update redemption record
    UPDATE loyalty_redemptions
    SET 
        order_id = p_order_id,
        status = 'applied',
        used_at = now(),
        updated_at = now(),
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'applied_at', now(),
            'order_number', order_record.order_number,
            'original_discount', redemption_record.discount_amount,
            'actual_discount_used', actual_discount,
            'original_points', redemption_record.points_used,
            'points_used', points_to_deduct,
            'points_returned', points_returned,
            'remaining_total', order_record.total_amount
        )
    WHERE id = redemption_record.id;
    
    -- Create loyalty transaction if table exists
    BEGIN
        INSERT INTO loyalty_transactions (
            user_id,
            order_id,
            points_change,
            current_points,
            transaction_type,
            description,
            metadata
        ) VALUES (
            redemption_record.user_id,
            p_order_id,
            -points_to_deduct,
            loyalty_record.points,
            'redeemed',
            CASE 
                WHEN points_returned > 0 
                THEN format('Redeemed %s points (worth KES %s) for order #%s. %s points returned to balance.', 
                           points_to_deduct, actual_discount, order_record.order_number, points_returned)
                ELSE format('Redeemed %s points for KES %s discount on order #%s', 
                           points_to_deduct, actual_discount, order_record.order_number)
            END,
            jsonb_build_object(
                'redemption_id', redemption_record.id,
                'original_discount_amount', redemption_record.discount_amount,
                'actual_discount_used', actual_discount,
                'original_points', redemption_record.points_used,
                'points_used', points_to_deduct,
                'points_returned', points_returned
            )
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create loyalty transaction: %', SQLERRM;
    END;
    
    -- Create notification for partial redemption
    IF points_returned > 0 THEN
        BEGIN
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES (
                redemption_record.user_id,
                'loyalty_partial_redeem',
                'Partial Points Redemption',
                format('You redeemed %s points, but only needed %s points (KES %s) for your order. %s points have been returned to your balance.', 
                       redemption_record.points_used, 
                       points_to_deduct,
                       actual_discount,
                       points_returned),
                jsonb_build_object(
                    'redemption_id', redemption_record.id,
                    'order_id', p_order_id,
                    'order_number', order_record.order_number,
                    'points_requested', redemption_record.points_used,
                    'points_used', points_to_deduct,
                    'points_returned', points_returned,
                    'discount_requested', redemption_record.discount_amount,
                    'discount_used', actual_discount
                )
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create notification: %', SQLERRM;
        END;
    END IF;
    
    result := json_build_object(
        'success', true,
        'discount_amount', actual_discount,
        'points_used', points_to_deduct,
        'points_returned', points_returned,
        'original_discount_requested', redemption_record.discount_amount,
        'original_points_requested', redemption_record.points_used,
        'new_total', order_record.total_amount,
        'was_partial', (points_returned > 0),
        'message', CASE 
            WHEN points_returned > 0 
            THEN format('Used %s points (KES %s) - %s points returned to your balance', 
                       points_to_deduct, actual_discount, points_returned)
            ELSE 'Loyalty discount applied successfully'
        END
    );
    
    RETURN result;
END;
$$;

-- Update the refund function to work with new constraint
CREATE OR REPLACE FUNCTION refund_loyalty_points_for_order(p_order_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    redemption_record RECORD;
    loyalty_record RECORD;
    order_record RECORD;
    result json;
BEGIN
    -- Get redemption record
    SELECT * INTO redemption_record
    FROM loyalty_redemptions
    WHERE order_id = p_order_id
      AND status = 'applied'
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'No loyalty redemption found for this order'
        );
    END IF;
    
    -- Get order record
    SELECT * INTO order_record
    FROM orders
    WHERE id = p_order_id
    FOR UPDATE;
    
    -- Get loyalty record
    SELECT * INTO loyalty_record
    FROM loyalty_points
    WHERE user_id = redemption_record.user_id
    FOR UPDATE;
    
    -- Refund points
    UPDATE loyalty_points
    SET 
        points = points + redemption_record.points_used,
        points_redeemed = points_redeemed - redemption_record.points_used,
        updated_at = now()
    WHERE user_id = redemption_record.user_id
    RETURNING * INTO loyalty_record;
    
    -- Update redemption status
    UPDATE loyalty_redemptions
    SET 
        status = 'refunded',
        updated_at = now(),
        metadata = metadata || jsonb_build_object(
            'refunded_at', now(),
            'refunded_points', redemption_record.points_used,
            'refund_reason', 'order_cancelled'
        )
    WHERE id = redemption_record.id;
    
    -- Remove loyalty discount from order
    UPDATE orders
    SET 
        loyalty_points_used = 0,
        loyalty_discount = 0,
        total_amount = GREATEST(0, (
            subtotal - COALESCE(coupon_discount, 0) + 
            shipping_total + installation_cost
        )),
        updated_at = now()
    WHERE id = p_order_id;
    
    -- Create refund transaction
    INSERT INTO loyalty_transactions (
        user_id,
        order_id,
        points_change,
        current_points,
        transaction_type,
        description,
        metadata
    ) VALUES (
        redemption_record.user_id,
        p_order_id,
        redemption_record.points_used,
        loyalty_record.points,
        'refunded',
        'Points refunded from cancelled order #' || order_record.order_number,
        json_build_object(
            'redemption_id', redemption_record.id,
            'refund_reason', 'order_cancelled'
        )
    );
    
    result := json_build_object(
        'success', true,
        'points_refunded', redemption_record.points_used,
        'message', 'Loyalty points refunded successfully'
    );
    
    RETURN result;
END;
$$;

-- Function to award referral points with all validations
CREATE OR REPLACE FUNCTION award_referral_points_on_order_complete(
  p_order_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_referrer_id uuid;
  v_product_id uuid;
  v_product_name text;
  v_points_to_award integer;
  v_points_per_unit integer;
  v_product_quantity integer;
  v_result json;
BEGIN
  -- Get order details
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id;
  
  -- Check if order exists and is completed
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  IF v_order.payment_status != 'paid' OR v_order.status != 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Order not completed');
  END IF;
  
  -- Check if order has referral
  -- Endpoint already checks but just in case
  IF v_order.referred_by IS NULL OR v_order.referral_product_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No referral data');
  END IF;
  
  v_referrer_id := v_order.referred_by;
  v_product_id := v_order.referral_product_id;
  
  -- 1. Prevent self-referral
  IF v_order.user_id = v_referrer_id THEN
    RETURN json_build_object('success', false, 'error', 'Self-referral not allowed');
  END IF;
  
  -- 2. Check if points already awarded for this order
  IF EXISTS (
    SELECT 1 FROM loyalty_transactions 
    WHERE order_id = p_order_id 
    AND user_id = v_referrer_id 
    AND transaction_type = 'earned'
    AND description LIKE '%Referral points%'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Points already awarded');
  END IF;
  
  -- 3. Check if referrer and referee already have completed transaction for same product
  IF EXISTS (
    SELECT 1 FROM orders o
    WHERE o.user_id = v_order.user_id
    AND o.referred_by = v_referrer_id
    AND o.referral_product_id = v_product_id
    AND o.payment_status = 'completed'
    AND o.status = 'completed'
    AND o.id != p_order_id
    LIMIT 1
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Duplicate referral for same product');
  END IF;
  
  -- 4. Check if referred product is in the order
  SELECT oi.quantity INTO v_product_quantity
  FROM order_items oi
  WHERE oi.order_id = p_order_id
  AND oi.product_id = v_product_id
  LIMIT 1;
  
  IF NOT FOUND OR v_product_quantity IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Referred product not in order');
  END IF;
  
  -- 5. Get product details for points calculation
  SELECT 
    p.referral_points,
    p.name
  INTO 
    v_points_per_unit,
    v_product_name
  FROM products p
  WHERE p.id = v_product_id;
  
  IF NOT FOUND THEN
    -- Use default points if product not found or no referral_points set
    v_points_per_unit := 100;
    v_product_name := 'Product';
  END IF;
  
  -- Use default if null
  IF v_points_per_unit IS NULL THEN
    v_points_per_unit := 100;
  END IF;
  
  -- Calculate total points
  v_points_to_award := v_points_per_unit * v_product_quantity;
  
  -- Minimum 10 points
  IF v_points_to_award < 10 THEN
    v_points_to_award := 10;
  END IF;
  
  -- 6. Award points
  INSERT INTO loyalty_points (user_id, points, points_earned)
  VALUES (v_referrer_id, v_points_to_award, v_points_to_award)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    points = loyalty_points.points + v_points_to_award,
    points_earned = loyalty_points.points_earned + v_points_to_award,
    updated_at = NOW();
  
  -- 7. Record transaction
  INSERT INTO loyalty_transactions (
    user_id, 
    order_id, 
    points_change, 
    current_points, 
    transaction_type, 
    description
  ) VALUES (
    v_referrer_id,
    p_order_id,
    v_points_to_award,
    (SELECT points FROM loyalty_points WHERE user_id = v_referrer_id),
    'earned',
    'Referral points for ' || v_product_name || ' (Order #' || v_order.order_number || ')'
  );
  
  -- 8. Update tier if needed
  UPDATE loyalty_points lp
  SET tier = (
    SELECT tier 
    FROM loyalty_tiers 
    WHERE min_points <= (SELECT points FROM loyalty_points WHERE user_id = v_referrer_id)
    ORDER BY min_points DESC 
    LIMIT 1
  )
  WHERE user_id = v_referrer_id;
  
  RETURN json_build_object(
    'success', true,
    'points_awarded', v_points_to_award,
    'referrer_id', v_referrer_id,
    'product_id', v_product_id,
    'product_name', v_product_name,
    'quantity', v_product_quantity
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to award loyalty points after order completion
-- Drop and recreate the function to handle both points and draw entries
-- Drop and recreate the function to handle points, draw entries, AND account activation
DROP FUNCTION IF EXISTS award_loyalty_points() CASCADE;

CREATE OR REPLACE FUNCTION award_loyalty_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_tier loyalty_tiers%ROWTYPE;
    points_to_award integer;
    current_points integer;
    new_tier text;
    -- Draw entry variables
    v_draw RECORD;
    v_entry_count INTEGER := 0;
    v_entries_awarded INTEGER := 0;
    v_entry_id UUID;
    -- Activation variables
    v_current_status TEXT;
BEGIN

    -- GUARD: Prevent infinite loop from our own UPDATE statements
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    -- Only process when order is marked as completed and paid/completed
    IF NEW.status = 'processing' AND NEW.payment_status = 'completed' 
       AND (OLD.status != 'completed' OR OLD.payment_status != 'refunded') THEN

    -- IF NEW.status = 'completed' AND NEW.payment_status = 'paid' 
    --    AND (OLD.status != 'completed' OR OLD.payment_status != 'completed') THEN

        -- ============================================
        -- PART 1: ACTIVATE USER ACCOUNT (30 days)
        -- ============================================
        -- Any successful paid order activates the account for 30 days
        -- This is critical for streak challenges, team eligibility, and referral completion
        
        SELECT status INTO v_current_status
        FROM users
        WHERE id = NEW.user_id;
        
        -- Set status to 'active' and record the activation expiry
        UPDATE users
        SET 
            status = 'active',
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                'last_activation_date', NOW()::TEXT,
                'activation_expires_at', (NOW() + INTERVAL '30 days')::TEXT,
                'activation_source', 'order_' || NEW.order_number,
                'activation_order_id', NEW.id::TEXT
            ),
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        -- Log the activation event
        INSERT INTO loyalty_transactions (
            user_id, 
            order_id, 
            points_change, 
            current_points,
            transaction_type, 
            description
        ) VALUES (
            NEW.user_id,
            NEW.id,
            0,
            COALESCE((SELECT points FROM loyalty_points WHERE user_id = NEW.user_id), 0),
            'account_activation',
            'Account activated for 30 days via order #' || NEW.order_number
        );
        
        RAISE NOTICE 'User % account activated for 30 days (was: %)', NEW.user_id, v_current_status;
        
        -- ============================================
        -- PART 2: PROCESS SIGNUP REFERRALS
        -- ============================================
        -- If user was referred and status just changed to active,
        -- this will trigger the referral completion
        
        -- Check if user has pending signup referrals
        IF EXISTS (
            SELECT 1 FROM referrals
            WHERE referred_user_id = NEW.user_id
            AND status = 'joined'
            AND conversion_type = 'signup'
        ) THEN
            -- Update pending signup referrals to completed
            UPDATE referrals
            SET 
                status = 'completed',
                completed_at = NOW(),
                updated_at = NOW(),
                reward_points = COALESCE(reward_points, 100)
            WHERE referred_user_id = NEW.user_id
            AND status = 'joined'
            AND conversion_type = 'signup';
            
            -- Process each completed referral through the challenge system
            PERFORM process_referral_challenge_completion(r.id)
            FROM referrals r
            WHERE r.referred_user_id = NEW.user_id
            AND r.status = 'completed'
            AND r.conversion_type = 'signup'
            AND r.completed_at >= NOW() - INTERVAL '1 minute';
            
            RAISE NOTICE 'Signup referrals completed for user %', NEW.user_id;
        END IF;
        
        -- ============================================
        -- PART 3: AWARD LOYALTY POINTS
        -- ============================================
        
        -- Award referral points if this is a referral order
        -- This is same as sign up referral
        IF NEW.referred_by IS NOT NULL THEN
            PERFORM award_referral_points_on_order_complete(NEW.id);
        END IF;
        
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
        INSERT INTO loyalty_points (user_id, points, points_earned, last_updated)
        VALUES (NEW.user_id, points_to_award, points_to_award, NOW())
        ON CONFLICT (user_id) DO UPDATE
        SET 
            points = loyalty_points.points + EXCLUDED.points,
            points_earned = loyalty_points.points_earned + EXCLUDED.points_earned,
            last_updated = EXCLUDED.last_updated,
            updated_at = NOW()
        RETURNING points INTO current_points;
        
        -- Record transaction
        INSERT INTO loyalty_transactions (
            user_id, 
            order_id, 
            points_change, 
            current_points,
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
            NOW() + INTERVAL '365 days'
        );
        
        -- Update order with points earned
        -- Done at the bottom of the draw entry section after awarding entries
        
        -- Check and update tier
        SELECT tier INTO new_tier
        FROM loyalty_tiers
        WHERE min_points <= current_points
        ORDER BY min_points DESC
        LIMIT 1;
        
        UPDATE loyalty_points
        SET tier = new_tier, updated_at = NOW()
        WHERE user_id = NEW.user_id AND tier != new_tier;
        
        -- ============================================
-- PART 4: AWARD DRAW ENTRIES
-- ============================================

-- Skip if draw entries already awarded
IF NEW.draw_entries_awarded > 0 THEN
    RAISE NOTICE 'Draw entries already awarded for order %', NEW.id;
ELSE
    -- Find the best draw for this user
    SELECT d.* INTO v_draw
    FROM draws d
    WHERE d.status = 'open'
      AND d.entry_starts_at <= NOW()
      AND d.entry_ends_at >= NOW()
      AND (d.entry_calculation->'purchase'->>'enabled')::boolean = true
    ORDER BY 
        CASE WHEN EXISTS (
            SELECT 1 FROM draw_entries de WHERE de.draw_id = d.id AND de.user_id = NEW.user_id
        ) THEN 1 ELSE 2 END,
        d.entry_ends_at ASC
    LIMIT 1;
    
    IF FOUND THEN
        -- Calculate entries based on order amount
        v_entry_count := FLOOR(
            NEW.total_amount * (v_draw.entry_calculation->'purchase'->>'entries_per_ksh')::numeric
        );
        
        -- Apply minimum purchase requirement
        IF NEW.total_amount >= (v_draw.entry_calculation->'purchase'->>'min_purchase')::numeric THEN
            -- Apply max entries per order
            v_entry_count := LEAST(
                v_entry_count,
                (v_draw.entry_calculation->'purchase'->>'max_entries_per_order')::integer
            );
            
            IF v_entry_count > 0 THEN
                -- Add entries to draw
                INSERT INTO draw_entries (draw_id, user_id, entry_count, entry_method, source_id, metadata)
                VALUES (v_draw.id, NEW.user_id, v_entry_count, 'purchase', NEW.id::text, jsonb_build_object(
                    'order_id', NEW.id,
                    'order_amount', NEW.total_amount,
                    'order_number', NEW.order_number,
                    'awarded_at', NOW()
                ))
                RETURNING id INTO v_entry_id;
                
                -- Create individual tickets
                FOR i IN 1..v_entry_count LOOP
                    INSERT INTO draw_tickets (draw_id, user_id, entry_id, ticket_number)
                    VALUES (v_draw.id, NEW.user_id, v_entry_id, i);
                END LOOP;
                
                -- Add to live ticker
                INSERT INTO draw_live_ticker (draw_id, user_name, entry_count, entry_method)
                SELECT v_draw.id, COALESCE(u.full_name, 'Customer'), v_entry_count, 'purchase'
                FROM users u WHERE u.id = NEW.user_id;
                
                v_entries_awarded := v_entry_count;
                
                -- ============================================
-- SINGLE ORDER UPDATE AT THE END
-- ============================================
UPDATE orders
SET 
    loyalty_points_earned = points_to_award,
    draw_entries_awarded = CASE WHEN v_entries_awarded > 0 THEN v_entries_awarded ELSE 0 END,
    draw_id = CASE WHEN v_entries_awarded > 0 THEN v_draw.id ELSE NULL END,
    draw_entry_details = CASE WHEN v_entries_awarded > 0 THEN 
        jsonb_build_object(
            'draw_name', v_draw.name,
            'draw_id', v_draw.id,
            'draw_time', v_draw.draw_time,
            'entries_awarded', v_entries_awarded,
            'calculation', jsonb_build_object(
                'order_amount', NEW.total_amount,
                'entries_per_ksh', (v_draw.entry_calculation->'purchase'->>'entries_per_ksh')::numeric,
                'min_purchase', (v_draw.entry_calculation->'purchase'->>'min_purchase')::numeric,
                'max_entries', (v_draw.entry_calculation->'purchase'->>'max_entries_per_order')::integer
            ),
            'awarded_at', NOW()
        )
    ELSE NULL
    END,
    updated_at = NOW()
WHERE id = NEW.id;

RAISE NOTICE 'Order % fully processed: % points, % draw entries', NEW.id, points_to_award, v_entries_awarded;
            END IF;
        END IF;
    ELSE
        RAISE NOTICE 'No active draw found for order %', NEW.id;
    END IF;
END IF;
        
        -- ============================================
        -- PART 5: PROCESS PURCHASE CHALLENGES
        -- ============================================
        -- Check if this order qualifies for any purchase challenges
        PERFORM process_purchase_challenge(NEW.id);
        
        -- ============================================
        -- PART 6: PROCESS TEAM SPENDING
        -- ============================================
        -- If user is in a team, add spending to team total
        PERFORM process_team_spending(
            NEW.id,
            NEW.user_id,
            NEW.total_amount
        );
        
    END IF;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS orders_award_points ON orders;
CREATE TRIGGER orders_award_points
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION award_loyalty_points();


-- Also create a scheduled function to deactivate expired accounts
-- Run this via pg_cron or a scheduled edge function every hour
CREATE OR REPLACE FUNCTION deactivate_expired_accounts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Deactivate users whose 30-day activation has expired
    -- But only if they haven't made another purchase that would extend it
    WITH expired_users AS (
        SELECT u.id
        FROM users u
        WHERE u.status = 'active'
        AND (u.metadata->>'activation_expires_at')::TIMESTAMPTZ < NOW()
        -- Don't deactivate if they have a more recent order
        AND NOT EXISTS (
            SELECT 1 FROM orders o
            WHERE o.user_id = u.id
            AND o.payment_status = 'paid'
            AND o.status = 'completed'
            AND o.updated_at > (u.metadata->>'activation_expires_at')::TIMESTAMPTZ - INTERVAL '30 days'
        )
    )
    UPDATE users u
    SET 
        status = 'inactive',
        metadata = COALESCE(u.metadata, '{}'::jsonb) || jsonb_build_object(
            'deactivated_at', NOW()::TEXT,
            'deactivation_reason', '30-day activation expired'
        ),
        updated_at = NOW()
    FROM expired_users eu
    WHERE u.id = eu.id;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RAISE NOTICE 'Deactivated % expired accounts', v_count;
    
    RETURN v_count;
END;
$$;

-- Keep this function for admin cashbacks and direct redemptions
CREATE OR REPLACE FUNCTION redeem_loyalty_points(
    p_user_id uuid,
    p_points_to_redeem integer,
    p_description text DEFAULT 'Points redemption'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    loyalty_record RECORD;
    discount_amount numeric(10,2);
    transaction_id uuid;
    result json;
BEGIN
    -- Validate input
    IF p_points_to_redeem <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'Points to redeem must be positive');
    END IF;
    
    IF p_points_to_redeem % 100 != 0 THEN
        RETURN json_build_object('success', false, 'message', 'Points must be redeemed in multiples of 100');
    END IF;
    
    -- Get loyalty record
    SELECT * INTO loyalty_record
    FROM loyalty_points
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'No loyalty account found');
    END IF;
    
    -- Check if user has enough points
    IF loyalty_record.points < p_points_to_redeem THEN
        RETURN json_build_object('success', false, 'message', 'Insufficient points');
    END IF;
    
    -- Calculate discount amount (1 point = 0.10 KES)
    discount_amount := p_points_to_redeem / 10.0;
    
    -- Update loyalty points
    UPDATE loyalty_points
    SET 
        points = points - p_points_to_redeem,
        points_redeemed = points_redeemed + p_points_to_redeem,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO loyalty_record;
    
    -- Create transaction record
    INSERT INTO loyalty_transactions (
        user_id,
        points_change,
        current_points,
        transaction_type,
        description,
        metadata
    ) VALUES (
        p_user_id,
        -p_points_to_redeem,
        loyalty_record.points,
        'redeemed',
        p_description,
        json_build_object(
            'discount_amount', discount_amount,
            'points_redeemed', p_points_to_redeem,
            'redemption_type', 'direct'
        )
    ) RETURNING id INTO transaction_id;
    
    result := json_build_object(
        'success', true,
        'message', 'Points redeemed successfully',
        'points_redeemed', p_points_to_redeem,
        'discount_amount', discount_amount,
        'remaining_points', loyalty_record.points,
        'transaction_id', transaction_id,
        'redemption_type', 'direct'
    );
    
    RETURN result;
END;
$$;

-- Function to cancel a pending redemption (if user changes mind)
CREATE OR REPLACE FUNCTION cancel_loyalty_redemption(p_redemption_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    redemption_record RECORD;
    result json;
BEGIN
    -- Get redemption record
    SELECT * INTO redemption_record
    FROM loyalty_redemptions
    WHERE metadata->>'redemption_code' = p_redemption_code
      AND status = 'pending'
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Invalid or already processed redemption code'
        );
    END IF;
    
    -- Update redemption status
    UPDATE loyalty_redemptions
    SET 
        status = 'cancelled',
        updated_at = now(),
        metadata = metadata || jsonb_build_object(
            'cancelled_at', now(),
            'cancelled_by', 'user'
        )
    WHERE id = redemption_record.id;
    
    result := json_build_object(
        'success', true,
        'message', 'Redemption cancelled successfully',
        'points_freed', redemption_record.points_used
    );
    
    RETURN result;
END;
$$;

-- Function to get user's active redemptions
CREATE OR REPLACE FUNCTION get_user_active_redemptions(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    active_redemptions json;
BEGIN
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', id,
            'redemption_code', metadata->>'redemption_code',
            'points_used', points_used,
            'discount_amount', discount_amount,
            'status', status,
            'created_at', created_at,
            'expires_at', metadata->>'expires_at'
        )
    ), '[]'::json) INTO active_redemptions
    FROM loyalty_redemptions
    WHERE user_id = p_user_id
      AND status IN ('pending', 'applied')
      AND (metadata->>'expires_at')::timestamptz > now()
    ORDER BY created_at DESC;
    
    RETURN json_build_object(
        'success', true,
        'active_redemptions', active_redemptions
    );
END;
$$;

-- Create function to deduct loyalty points
CREATE OR REPLACE FUNCTION deduct_loyalty_points(
  p_user_id UUID,
  p_points INT,
  p_source TEXT,
  p_source_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_points INT;
BEGIN
  SELECT points INTO v_current_points FROM loyalty_points WHERE user_id = p_user_id;
  
  UPDATE loyalty_points
  SET points = points - p_points,
      points_redeemed = points_redeemed + p_points,
      updated_at = NOW()
  WHERE user_id = p_user_id;
    
  INSERT INTO loyalty_transactions (user_id, points_change, current_points, transaction_type, source_id)
  VALUES (p_user_id, -p_points, v_current_points - p_points, p_source, p_source_id);
END;
$$;

CREATE POLICY "Allow admin access" ON loyalty_points FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON loyalty_tiers FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON loyalty_transactions FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON loyalty_redemptions FOR ALL 
USING (public.is_admin());
