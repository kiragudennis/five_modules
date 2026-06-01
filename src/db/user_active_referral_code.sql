-- ============================================
-- USERS TABLE - Add missing columns for challenge system
-- ============================================

-- Add status column for customer active/inactive tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'inactive' 
CHECK (status IN ('active', 'inactive', 'suspended', 'banned'));

-- Add index for status lookups (used by challenges, teams, streaks)
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_status_active ON users(status) WHERE status = 'active';

-- Add referral_code if not exists (used by referral challenges)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;

-- Generate referral codes for existing users who don't have one
UPDATE users 
SET referral_code = 'REF' || UPPER(SUBSTRING(MD5(id::TEXT || email) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Add metadata columns for tracking
-- Ensure metadata is JSONB with proper defaults
ALTER TABLE users
ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

-- Update metadata for existing users with defaults
UPDATE users
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'total_site_seconds', COALESCE((metadata->>'total_site_seconds')::INTEGER, 0),
    'last_activity', COALESCE(metadata->>'last_activity', NOW()::TEXT),
    'account_created_source', COALESCE(metadata->>'account_created_source', 'legacy')
)
WHERE metadata IS NULL OR metadata = '{}'::jsonb;

-- ============================================
-- FUNCTION: Auto-generate referral code for new users
-- ============================================
CREATE OR REPLACE FUNCTION generate_user_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := 'REF' || UPPER(SUBSTRING(MD5(NEW.id::TEXT || NEW.email) FROM 1 FOR 8));
    END IF;
    
    -- Set default status if not provided
    IF NEW.status IS NULL THEN
        NEW.status := 'inactive';
    END IF;
    
    -- Initialize metadata if null
    IF NEW.metadata IS NULL THEN
        NEW.metadata := '{}'::jsonb;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for new users
DROP TRIGGER IF EXISTS users_before_insert ON users;
CREATE TRIGGER users_before_insert
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION generate_user_referral_code();

-- ============================================
-- FUNCTION: Check if user is active (helper for RLS)
-- ============================================
CREATE OR REPLACE FUNCTION is_user_active(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_status TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    SELECT 
        status,
        (metadata->>'activation_expires_at')::TIMESTAMPTZ
    INTO v_status, v_expires_at
    FROM users
    WHERE id = p_user_id;
    
    -- User must have status = 'active'
    IF v_status != 'active' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if activation has expired
    IF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
        -- Auto-deactivate if expired (lazy cleanup)
        UPDATE users 
        SET status = 'inactive',
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                'deactivated_at', NOW()::TEXT,
                'deactivation_reason', 'Activation expired (checked via is_user_active)'
            ),
            updated_at = NOW()
        WHERE id = p_user_id;
        
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- ============================================
-- FUNCTION: Manually activate user (admin action)
-- ============================================
CREATE OR REPLACE FUNCTION admin_activate_user(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30,
    p_reason TEXT DEFAULT 'Manual activation by admin'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users
    SET 
        status = 'active',
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'last_activation_date', NOW()::TEXT,
            'activation_expires_at', (NOW() + (p_days || ' days')::INTERVAL)::TEXT,
            'activation_source', p_reason,
            'activated_by', 'admin'
        ),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'User activated for ' || p_days || ' days',
        'expires_at', (NOW() + (p_days || ' days')::INTERVAL)
    );
END;
$$;

-- ============================================
-- FUNCTION: Get user activity stats (for team discovery, etc.)
-- ============================================
CREATE OR REPLACE FUNCTION get_user_activity_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_result JSON;
    v_total_orders INTEGER;
    v_total_spent NUMERIC;
    v_last_order_date TIMESTAMPTZ;
    v_account_age_days INTEGER;
    v_status TEXT;
    v_is_active BOOLEAN;
    v_total_site_seconds INTEGER;
BEGIN
    -- Get basic user info
    SELECT 
        u.status,
        (u.metadata->>'total_site_seconds')::INTEGER,
        u.created_at
    INTO v_status, v_total_site_seconds, v_last_order_date
    FROM users u
    WHERE u.id = p_user_id;
    
    -- Get order stats
    SELECT 
        COUNT(*),
        COALESCE(SUM(total_amount), 0),
        MAX(created_at)
    INTO v_total_orders, v_total_spent, v_last_order_date
    FROM orders
    WHERE user_id = p_user_id
    AND payment_status = 'paid'
    AND status = 'completed';
    
    -- Calculate account age
    SELECT EXTRACT(DAY FROM (NOW() - created_at))::INTEGER
    INTO v_account_age_days
    FROM users
    WHERE id = p_user_id;
    
    -- Check if active
    v_is_active := is_user_active(p_user_id);
    
    SELECT json_build_object(
        'user_id', p_user_id,
        'status', v_status,
        'is_active', v_is_active,
        'total_orders', v_total_orders,
        'total_spent', v_total_spent,
        'avg_order_value', CASE WHEN v_total_orders > 0 THEN ROUND(v_total_spent / v_total_orders, 2) ELSE 0 END,
        'last_order_date', v_last_order_date,
        'account_age_days', v_account_age_days,
        'total_site_seconds', COALESCE(v_total_site_seconds, 0)
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- ============================================
-- Update existing users with defaults
-- ============================================

-- Set all existing users to inactive if they have no orders
UPDATE users 
SET status = 'inactive'
WHERE status IS NULL 
AND NOT EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.user_id = users.id 
    AND payment_status = 'paid' 
    AND status = 'completed'
);

-- Activate users who have recent orders (last 30 days)
UPDATE users 
SET 
    status = 'active',
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'last_activation_date', NOW()::TEXT,
        'activation_expires_at', (NOW() + INTERVAL '30 days')::TEXT,
        'activation_source', 'migration_existing_customer'
    )
WHERE (
    status IS NULL 
    OR status = 'inactive'
    OR (
        status = 'active' 
        AND (metadata->>'activation_expires_at')::TIMESTAMPTZ < NOW()
    )
)
AND EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.user_id = users.id 
    AND payment_status = 'paid' 
    AND status = 'completed'
    AND created_at > NOW() - INTERVAL '30 days'
);

-- Log what we did
DO $$
DECLARE
    v_active_count INTEGER;
    v_inactive_count INTEGER;
    v_total_count INTEGER;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE status = 'active'),
        COUNT(*) FILTER (WHERE status = 'inactive'),
        COUNT(*)
    INTO v_active_count, v_inactive_count, v_total_count
    FROM users;
    
    RAISE NOTICE 'User migration complete: % total, % active, % inactive', 
        v_total_count, v_active_count, v_inactive_count;
END;
$$;