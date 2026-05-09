// src/types/deals.ts

export interface Deal {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    
    deal_type: 'discount' | 'bogo' | 'free_gift' | 'mystery' | 'flash_sale' | 'daily_deal';
    
    product_id: string | null;
    variant_id: string | null;
    category_id: string | null;
    applies_to_all: boolean;
    
    discount_type: 'percentage' | 'fixed' | null;
    discount_value: number | null;
    deal_price: number | null;
    
    bogo_config: BogoConfig | null;
    free_gift_config: FreeGiftConfig | null;
    mystery_config: MysteryConfig | null;
    
    total_quantity: number | null;
    remaining_quantity: number | null;
    per_user_limit: number;
    
    starts_at: string;
    ends_at: string;
    
    urgency_levels: UrgencyLevel[];
    
    status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'cancelled';
    
    featured_image_url: string | null;
    banner_color: string;
    show_countdown: boolean;
    show_stock_counter: boolean;
    show_claim_ticker: boolean;
    
    bonus_points_per_purchase: number;
    points_required_for_early_access: number | null;
    points_to_revive: number | null;
    revive_duration_minutes: number;
}

export interface BogoConfig {
    buy_quantity: number;
    get_quantity: number;
    get_discount_percent: number;
    applies_to_same_product?: boolean;
}

export interface FreeGiftConfig {
    gift_product_id: string;
    gift_product_name?: string;
    min_purchase_amount: number;
    max_gifts_per_user?: number;
}

export interface MysteryConfig {
    hidden_product_id: string;
    hidden_product_name?: string;
    hidden_price: number;
    reveal_on_purchase: boolean;
    reveal_at_checkout?: boolean;
}

export interface UrgencyLevel {
    threshold_minutes: number;
    color: 'green' | 'yellow' | 'red';
    message: string;
}

export interface DealClaim {
    id: string;
    deal_id: string;
    user_id: string;
    order_id: string;
    quantity: number;
    price_paid: number;
    savings_amount: number;
    claimed_at: string;
    was_revived: boolean;
}

export interface DealStatus {
    is_active: boolean;
    time_remaining_ms: number;
    time_remaining_formatted: string;
    urgency_level: UrgencyLevel;
    stock_remaining: number | null;
    stock_percentage: number;
    can_claim: boolean;
    user_claims_count: number;
    remaining_user_claims: number;
    can_revive: boolean;
    revive_cost_points: number | null;
}