-- db/bundle_live.sql
CREATE TABLE IF NOT EXISTS bundle_live_config (
    bundle_id uuid PRIMARY KEY REFERENCES mistry_bundles(id) ON DELETE CASCADE,
    bundle_type text NOT NULL DEFAULT 'mystery' CHECK (bundle_type IN ('mystery', 'tiered', 'build_your_own')),
    mystery_reveal_mode text NOT NULL DEFAULT 'manual' CHECK (mystery_reveal_mode IN ('manual', 'after_purchase')),
    total_value_ksh numeric(10,2),
    is_live_stream_only boolean NOT NULL DEFAULT false,
    is_stream_active boolean NOT NULL DEFAULT false,
    is_mystery_revealed boolean NOT NULL DEFAULT false,
    live_stock_total integer DEFAULT 0,
    live_stock_claimed integer DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bundle_live_stream_state
ON bundle_live_config(is_live_stream_only, is_stream_active);

-- Unified bundles table (supports all bundle types)
CREATE TABLE bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    
    -- Bundle Type
    bundle_type VARCHAR(50) NOT NULL CHECK (bundle_type IN (
        'mystery',           -- Unknown contents, revealed on stream or after purchase
        'curated',           -- Admin handpicks products
        'build_own',         -- Customer picks from eligible products
        'tiered',            -- Spend more, save more
        'subscription',      -- Weekly/Monthly recurring
        'bonus_points'       -- Points instead of cash discount
    )),
    
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    discounted_price DECIMAL(10,2) CHECK (discounted_price >= 0),
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2),
    savings_percentage INTEGER DEFAULT 0,
    
    -- Products (JSON for flexibility)
    products JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Format for mystery/curated: [{"product_id": "uuid", "quantity": 1, "required": true}]
    -- Format for build_own: [{"product_id": "uuid", "category": "electronics", "is_optional": true}]
    
    -- Build-Your-Own specific
    min_items_to_select INTEGER DEFAULT 1,
    max_items_to_select INTEGER DEFAULT 5,
    eligible_categories TEXT[],
    eligible_product_ids UUID[],
    
    -- Tiered bundle specific
    tier_config JSONB, -- [{"min_items": 2, "discount": 10}, {"min_items": 3, "discount": 15}]
    
    -- Subscription specific
    subscription_interval VARCHAR(20) CHECK (subscription_interval IN ('weekly', 'monthly', 'quarterly')),
    subscription_duration_months INTEGER, -- NULL = until cancelled
    
    -- Mystery bundle specific
    is_mystery BOOLEAN DEFAULT FALSE,
    mystery_reveal_mode VARCHAR(20) DEFAULT 'manual' CHECK (mystery_reveal_mode IN ('manual', 'after_purchase', 'immediate')),
    is_mystery_revealed BOOLEAN DEFAULT FALSE,
    mystery_revealed_at TIMESTAMPTZ,
    mystery_products JSONB, -- Products revealed after mystery is unveiled
    mystery_min_value DECIMAL(10,2), -- Minimum guaranteed value for mystery bundles
    
    -- Bonus points
    bonus_points INTEGER DEFAULT 0,
    
    -- Access control
    eligible_tiers TEXT[], -- ['bronze', 'silver', 'gold', 'platinum']
    points_required INTEGER DEFAULT 0,
    
    -- Inventory & Limits
    total_available INTEGER,
    remaining_count INTEGER,
    max_per_customer INTEGER DEFAULT 1,
    current_purchases INTEGER DEFAULT 0,
    
    -- Live stream integration
    is_live_exclusive BOOLEAN DEFAULT FALSE,
    live_session_id UUID,
    is_stream_active BOOLEAN DEFAULT FALSE,
    live_stock_total INTEGER,
    live_stock_claimed INTEGER DEFAULT 0,
    
    -- Display
    image_url TEXT,
    cover_image_url TEXT,
    gallery_images TEXT[],
    theme_color VARCHAR(20) DEFAULT '#3B82F6',
    featured BOOLEAN DEFAULT FALSE,
    badge_text VARCHAR(100),
    badge_color VARCHAR(50),
    
    -- Status & Timing
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'expired', 'archived')),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    
    -- Terms
    terms_conditions TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_bundles_type ON bundles(bundle_type);
CREATE INDEX idx_bundles_status ON bundles(status);
CREATE INDEX idx_bundles_live ON bundles(is_live_exclusive, is_stream_active);
CREATE INDEX idx_bundles_dates ON bundles(starts_at, ends_at);
CREATE INDEX idx_bundles_featured ON bundles(featured) WHERE featured = true;

-- Drop bundle_purchases if it exists to avoid conflicts
DROP TABLE IF EXISTS bundle_purchases CASCADE;
DROP TABLE IF EXISTS bundle_subscriptions CASCADE;
DROP TABLE IF EXISTS bundle_live_ticker CASCADE;
DROP TABLE IF EXISTS bundle_reveals CASCADE;
DROP TABLE IF EXISTS bundle_live_config CASCADE;
DROP TABLE IF EXISTS mystery_bundles CASCADE;

-- Bundle purchases tracking
CREATE TABLE bundle_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Purchase details
    quantity INTEGER DEFAULT 1,
    selected_items JSONB, -- For build-your-own: which products they chose
    applied_tier JSONB, -- For tiered bundles: which tier was applied
    
    -- Pricing
    original_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    final_price DECIMAL(10,2),
    points_used INTEGER DEFAULT 0,
    points_awarded INTEGER DEFAULT 0,
    
    -- Order linking
    order_id UUID REFERENCES orders(id),
    loyalty_transaction_id UUID REFERENCES loyalty_transactions(id),
    
    -- Subscription linking (if applicable)
    subscription_id UUID,
    is_recurring BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_purchases_user ON bundle_purchases(user_id);
CREATE INDEX idx_purchases_bundle ON bundle_purchases(bundle_id);
CREATE INDEX idx_purchases_status ON bundle_purchases(status);
CREATE INDEX idx_purchases_subscription ON bundle_purchases(subscription_id);
CREATE INDEX idx_bundle_purchases_created ON bundle_purchases(created_at DESC);

-- Bundle subscriptions (for recurring bundles)
CREATE TABLE bundle_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID NOT NULL REFERENCES bundles(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Subscription details
    interval_type VARCHAR(20) NOT NULL CHECK (interval_type IN ('weekly', 'monthly', 'quarterly')),
    next_delivery_date DATE NOT NULL,
    last_delivery_date DATE,
    
    -- Delivery tracking
    delivery_count INTEGER DEFAULT 0,
    max_deliveries INTEGER, -- NULL = unlimited
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user ON bundle_subscriptions(user_id);
CREATE INDEX idx_subscriptions_bundle ON bundle_subscriptions(bundle_id);
CREATE INDEX idx_subscriptions_status ON bundle_subscriptions(status);
CREATE INDEX idx_subscriptions_next_delivery ON bundle_subscriptions(next_delivery_date);

-- Bundle live ticker (real-time feed)
CREATE TABLE bundle_live_ticker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
    user_name VARCHAR(255),
    action VARCHAR(50) NOT NULL CHECK (action IN ('purchased', 'revealed', 'stock_update')),
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_live_ticker_bundle ON bundle_live_ticker(bundle_id);
CREATE INDEX idx_live_ticker_created ON bundle_live_ticker(created_at DESC);

-- Bundle reveal logs (for mystery bundles)
CREATE TABLE bundle_reveals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
    revealed_by UUID REFERENCES users(id),
    revealed_at TIMESTAMPTZ DEFAULT NOW(),
    products JSONB, -- What was revealed
    is_public BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX idx_reveals_bundle ON bundle_reveals(bundle_id);


-- Enable RLS
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_live_ticker ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_reveals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active bundles" ON bundles
    FOR SELECT USING (
        status = 'active' 
        AND (starts_at IS NULL OR starts_at <= NOW()) 
        AND (ends_at IS NULL OR ends_at >= NOW())
    );

CREATE POLICY "Users can view their own purchases" ON bundle_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscriptions" ON bundle_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view live ticker" ON bundle_live_ticker
    FOR SELECT USING (true);

-- Admin roles using FUNCTION public.is_admin()
CREATE POLICY "Admins can manage bundles" ON bundles
    FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage purchases" ON bundle_purchases
    FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage subscriptions" ON bundle_subscriptions
    FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage live ticker" ON bundle_live_ticker
    FOR ALL USING (public.is_admin());


-- Function to update remaining count
CREATE OR REPLACE FUNCTION update_bundle_remaining_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE bundles
    SET remaining_count = remaining_count - NEW.quantity,
        current_purchases = current_purchases + NEW.quantity,
        live_stock_claimed = live_stock_claimed + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.bundle_id;
    
    -- Add to live ticker
    INSERT INTO bundle_live_ticker (bundle_id, user_name, action, message)
    SELECT 
        NEW.bundle_id,
        COALESCE(u.full_name, 'Someone'),
        'purchased',
        NEW.bundle_id || ' purchased'
    FROM users u
    WHERE u.id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for purchases
CREATE TRIGGER trigger_bundle_purchase
    AFTER INSERT ON bundle_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_bundle_remaining_count();

-- Function to check bundle availability
CREATE OR REPLACE FUNCTION check_bundle_availability(p_bundle_id UUID, p_quantity INTEGER DEFAULT 1)
RETURNS TABLE (
    available BOOLEAN,
    remaining INTEGER,
    message TEXT
) LANGUAGE plpgsql AS $$
DECLARE
    v_bundle RECORD;
BEGIN
    SELECT * INTO v_bundle FROM bundles WHERE id = p_bundle_id;
    
    IF v_bundle.status != 'active' THEN
        RETURN QUERY SELECT FALSE, 0, 'Bundle is not active';
        RETURN;
    END IF;
    
    IF v_bundle.starts_at IS NOT NULL AND v_bundle.starts_at > NOW() THEN
        RETURN QUERY SELECT FALSE, 0, 'Bundle has not started yet';
        RETURN;
    END IF;
    
    IF v_bundle.ends_at IS NOT NULL AND v_bundle.ends_at < NOW() THEN
        RETURN QUERY SELECT FALSE, 0, 'Bundle has ended';
        RETURN;
    END IF;
    
    IF v_bundle.remaining_count IS NOT NULL AND v_bundle.remaining_count < p_quantity THEN
        RETURN QUERY SELECT FALSE, COALESCE(v_bundle.remaining_count, 0), 'Insufficient stock';
        RETURN;
    END IF;
    
    RETURN QUERY SELECT TRUE, COALESCE(v_bundle.remaining_count, 999999), 'Available';
END;
$$;

-- Simpler version without similarity function
CREATE OR REPLACE FUNCTION search_products(
  p_search_term TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INT DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  title TEXT,
  price NUMERIC,
  images TEXT[],
  category TEXT,
  stock INT,
  slug TEXT,
  rating NUMERIC,
  reviews_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.title,
    p.price,
    p.images,
    p.category,
    p.stock,
    p.slug,
    COALESCE(p.rating, 0) as rating,
    COALESCE(p.reviewsCount, 0) as reviews_count
  FROM products p
  WHERE p.status = 'active'
    AND (p_category IS NULL OR p.category ILIKE '%' || p_category || '%')
    AND (p_search_term IS NULL 
         OR p.name ILIKE '%' || p_search_term || '%'
         OR p.title ILIKE '%' || p_search_term || '%'
         OR p.sku ILIKE '%' || p_search_term || '%')
  ORDER BY 
    -- Simple relevance: exact matches first, then starts with, then contains
    CASE 
      WHEN p_search_term IS NULL THEN 0
      WHEN p.name ILIKE p_search_term THEN 3
      WHEN p.name ILIKE p_search_term || '%' THEN 2
      WHEN p.name ILIKE '%' || p_search_term || '%' THEN 1
      ELSE 0
    END DESC,
    p.name ASC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_products(TEXT, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_products(TEXT, TEXT, INT) TO anon;

-- Also create a function to get distinct categories
CREATE OR REPLACE FUNCTION get_product_categories()
RETURNS TABLE(category TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.category
  FROM products p
  WHERE p.status = 'active' AND p.category IS NOT NULL AND p.category != ''
  ORDER BY p.category;
END;
$$;

GRANT EXECUTE ON FUNCTION get_product_categories() TO authenticated;
GRANT EXECUTE ON FUNCTION search_products(TEXT, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_products(TEXT, TEXT, INT) TO anon;