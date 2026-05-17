import { Product } from "./store";

export interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bundle_type:
    | "mystery"
    | "curated"
    | "build_own"
    | "tiered"
    | "subscription"
    | "bonus_points";
  base_price: number;
  discounted_price: number | null;
  discount_type: "percentage" | "fixed" | null;
  discount_value: number | null;
  savings_percentage: number;
  products: {
    type: string;
    items?: Array<{
      product_id: string;
      quantity: number;
      display_order?: number;
      required?: boolean;
    }>;
    product_pool?: string[];
    quantity?: number;
    min_value?: number;
    max_value?: number;
    categories?: string[];
    min_items?: number;
    max_items?: number;
    interval?: string;
    commitment_months?: number;
    points_per_bundle?: number;
  };
  min_items_to_select: number;
  max_items_to_select: number;
  eligible_categories: string[];
  eligible_product_ids: string[];
  tier_config: any;
  subscription_interval: "weekly" | "monthly" | "quarterly" | null;
  subscription_duration_months: number | null;
  is_mystery: boolean;
  mystery_reveal_mode: "manual" | "after_purchase" | "immediate";
  is_mystery_revealed: boolean;
  mystery_revealed_at: string | null;
  mystery_products: any;
  mystrey_min_value: number | null;
  bonus_points: number;
  eligible_tiers: string[];
  points_required: number;
  total_available: number | null;
  remaining_count: number | null;
  max_per_customer: number;
  current_purchases: number;
  is_live_exclusive: boolean;
  live_session_id: string | null;
  is_stream_active: boolean;
  live_stock_total: number | null;
  live_stock_claimed: number;
  image_url: string | null;
  cover_image_url: string | null;
  gallery_images: string[];
  theme_color: string;
  featured: boolean;
  badge_text: string | null;
  badge_color: string | null;
  status: "draft" | "active" | "inactive" | "expired" | "archived";
  starts_at: string | null;
  ends_at: string | null;
  terms_conditions: string | null;
  created_at: string;
  updated_at: string;
}

export interface BundlePurchase {
  id: string;
  bundle_id: string;
  user_id: string;
  quantity: number;
  selected_items: any[];
  applied_tier: any;
  original_price: number;
  discount_amount: number;
  final_price: number;
  points_used: number;
  points_awarded: number;
  status: "pending" | "completed" | "cancelled" | "refunded";
  created_at: string;
}

export interface BundleFormData {
  id: string;
  name: string;
  slug: string;
  description: string;
  bundle_type: string;
  base_price: number;
  discounted_price: number | null;
  discount_type: "percentage" | "fixed" | null;
  discount_value: number | null;
  bonus_points: number;
  points_required: number;
  eligible_tiers: string[];
  total_available: number | null;
  max_per_customer: number;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  image_url: string;
  cover_image_url: string;
  badge_text: string;
  badge_color: string;
  featured: boolean;
  is_live_exclusive: boolean;
  is_stream_active: boolean;
  terms_conditions: string;
  // Type-specific fields
  products: any[];
  min_items_to_select: number;
  max_items_to_select: number;
  eligible_categories: string[];
  eligible_product_ids: string[];
  tier_config: any[];
  subscription_interval: string;
  subscription_duration_months: number | null;
  is_mystery: boolean;
  mystery_reveal_mode: string;
  mystery_products: any;
  mystery_min_value: number | null;
  current_purchases: number;
  created_by: string;
}

export interface LivePurchase {
  id: string;
  user_name: string;
  quantity: number;
  final_price: number;
  created_at: string;
}

export interface LiveStats {
  viewers: number;
  purchases: number;
  total_sold: number;
  remaining_stock: number;
  stock_percentage: number;
}
