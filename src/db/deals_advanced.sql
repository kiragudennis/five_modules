-- db/deals_advanced.sql

-- Advanced deals table (extends basic deals)
CREATE TABLE IF NOT EXISTS deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    
    -- Deal type
    deal_type text NOT NULL CHECK (deal_type IN (
        'discount', 'bogo', 'free_gift', 'mystery', 'flash_sale', 'daily_deal'
    )),
    
    -- Product targeting
    product_id uuid REFERENCES products(id),
    variant_id uuid,
    category_id uuid,
    applies_to_all boolean DEFAULT false,
    
    -- Deal pricing
    discount_type text CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value numeric(10,2),
    deal_price numeric(10,2),
    
    -- BOGO specific
    bogo_config jsonb,
    -- Example: {"buy_quantity": 1, "get_quantity": 1, "get_discount_percent": 100}
    
    -- Free gift specific
    free_gift_config jsonb,
    -- Example: {"gift_product_id": "uuid", "min_purchase_amount": 5000}
    
    -- Mystery deal specific
    mystery_config jsonb,
    -- Example: {"hidden_product_id": "uuid", "hidden_price": 1999, "reveal_on_purchase": false}
    
    -- Inventory limits
    total_quantity integer,
    remaining_quantity integer,
    per_user_limit integer DEFAULT 1,
    
    -- Timing
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    
    -- Urgency settings
    urgency_levels jsonb DEFAULT '[
        {"threshold_minutes": 5, "color": "green", "message": "Plenty of time"},
        {"threshold_minutes": 2, "color": "yellow", "message": "Hurry! Ending soon"},
        {"threshold_minutes": 0, "color": "red", "message": "FINAL MINUTE!"}
    ]'::jsonb,
    
    -- Status
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'ended', 'cancelled')),
    
    -- Display settings
    featured_image_url text,
    banner_color text DEFAULT '#3B82F6',
    show_countdown boolean DEFAULT true,
    show_stock_counter boolean DEFAULT true,
    show_claim_ticker boolean DEFAULT true,
    
    -- Point integration
    bonus_points_per_purchase integer DEFAULT 0,
    points_required_for_early_access integer,
    points_to_revive integer, -- Points to revive a missed deal for X minutes
    revive_duration_minutes integer DEFAULT 10,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Deal claims (purchases made under deal)
CREATE TABLE IF NOT EXISTS deal_claims (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id uuid REFERENCES orders(id),
    
    quantity integer NOT NULL DEFAULT 1,
    price_paid numeric(10,2),
    savings_amount numeric(10,2),
    
    -- Claim metadata
    claimed_at timestamptz DEFAULT now(),
    ip_address inet,
    user_agent text,
    
    -- Revived deal tracking
    was_revived boolean DEFAULT false,
    revived_at timestamptz
);

-- Live claim ticker
CREATE TABLE IF NOT EXISTS deal_live_ticker (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
    user_name text,
    user_location text,
    quantity integer,
    claimed_at timestamptz DEFAULT now()
);

-- Early access queue (points-spenders)
CREATE TABLE IF NOT EXISTS deal_early_access (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    points_spent integer NOT NULL,
    access_granted_at timestamptz DEFAULT now(),
    access_used_at timestamptz
);

-- Revived deals tracking
CREATE TABLE IF NOT EXISTS deal_revivals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    points_spent integer NOT NULL,
    revived_until timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_deals_status_dates ON deals(status, starts_at, ends_at);
CREATE INDEX idx_deals_type ON deals(deal_type);
CREATE INDEX idx_deal_claims_deal ON deal_claims(deal_id, claimed_at);
CREATE INDEX idx_deal_claims_user ON deal_claims(user_id, deal_id);
CREATE INDEX idx_deal_live_ticker_deal ON deal_live_ticker(deal_id, claimed_at DESC);
CREATE INDEX idx_deal_early_access_deal ON deal_early_access(deal_id, access_granted_at);
CREATE INDEX idx_deal_revivals_deal ON deal_revivals(deal_id, revived_until);