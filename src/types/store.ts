import z from "zod";

export type ProductType = "physical" | "digital" | "affiliate";
export type ProductStatus = "draft" | "published";
export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled";

export interface Product {
  id: string;
  name: string;
  title: string;
  description: string;
  slug: string;
  price: number;
  originalPrice: number;
  images: string[];
  sku: string;
  stock: number;
  weight: number;
  category: string;
  currency: string;
  tags: string[];
  featured: boolean;
  metadata: { [key: string]: string } | null;
  rating: number;
  reviewsCount: number;
  isDealOfTheDay: boolean;
  has_wholesale: boolean;
  wholesale_min_quantity: number;
  wholesale_price: number;
  videoUrl?: string | null;
  wattage?: number | null;
  voltage?: string;
  colorTemperature?: string;
  lumens?: number | null;
  warrantyMonths?: number;
  batteryCapacity?: string;
  solarPanelWattage?: number | null;
  dimensions?: string;
  ipRating?: string;
  dealOfTheDay?: boolean;
  bestSeller?: boolean;
  energySaving?: boolean;
  installationType?: string;
  referral_points?: number;
  has_varieties: boolean;
  varieties?: Variaty[];
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  used_count?: number;
  is_active: boolean;
  applicable_categories: string[];
  excluded_products: string[];
  single_use_per_customer: boolean;
  description?: string;
  created_at: string;
  coupon_redemptions?: { count: number }[];
}

export interface ApiResponse {
  products: Product[];
  coupons: Coupon[];
}

// Add this to your types file
export interface TrackingOrder {
  id: string;
  order_number: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shipping_address: {
    address: string;
    city: string;
    county: string;
    postal_code?: string;
    country: string;
  };
  total: number;
  currency: string;
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "completed";
  payment_status:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "refunded";
  payment_method: string;
  tracking_number: string | null;
  estimated_delivery: string | null;
  shipping_method: string;
  shipping_cost: number;
  created_at: string;
  items_count: number;
  items_quantity: number;
  wholesale_applied: boolean;
  installation_required: boolean;
  coupon_applied: boolean;
}

export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  type: ProductType;
  status: ProductStatus;
  stock_quantity?: number;
  affiliate_url?: string | null;
  thumbnail_url?: string | null;
  digital_file_url?: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  currency: string;
  sku: string | null;
  stock_quantity: number | null;
  is_default: boolean;
  thumbnail_url: string | null;
  digital_file_url: string | null;
  affiliate_url: string | null;
  is_active: boolean;
  weight: number | null;
  weight_unit: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  metadata: Record<string, string> | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  creator_id: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  stripe_session_id: string | null;
  shipping_address: ShippingAddress | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  currency: string;
  created_at: string;
}

export interface ShippingAddress {
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface CartItem {
  product: Product;
  variant?: Variaty;
  quantity: number;
  metadata?: {
    [key: string]: any;
  };
}

export interface LoyaltyTransaction {
  date: string;
  type: string;
  points: number;
  description: string;
  order_number: string | null;
}

export interface LoyaltyData {
  points: number;
  tier: string;
  tierDetails: {
    name: string;
    pointsPerShilling: number;
    discountPercentage: number;
    freeShippingThreshold: number | null;
    prioritySupport: boolean;
    birthdayBonusPoints: number;
  };
  nextTier: {
    name: string;
    minPoints: number;
    pointsNeeded: number;
    discountPercentage: number;
  } | null;
  recentTransactions: LoyaltyTransaction[];
  pointsValue: number;
  totalEarned: number;
  totalRedeemed: number;
}

export interface Bundle {
  id: string;
  name: string;
  description: string;
  slug: string;
  image_url: string | null;
  banner_url: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  bundle_price: number | null;
  products: Array<{
    product_id: string;
    quantity: number;
    required: boolean;
  }>;
  min_tier_required: string | null;
  points_required: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  total_purchases_allowed: number | null;
  max_purchases_per_user: number | null;
  current_purchases: number;
  featured: boolean;
  badge_text: string | null;
  badge_color: string | null;
  terms_conditions: string | null;
  created_at: string;
}

export interface BundleProduct {
  product_id: string;
  quantity: number;
  required: boolean;
}

export interface MistryBundle {
  id: string;
  name: string;
  description: string;
  slug: string;
  image_url: string | null;
  banner_url: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  bundle_price: number | null;
  products: BundleProduct[];
  min_tier_required: string | null;
  points_required: number;
  status: "draft" | "active" | "inactive" | "expired";
  start_date: string | null;
  end_date: string | null;
  max_purchases_per_user: number | null;
  total_purchases_allowed: number | null;
  current_purchases: number;
  featured: boolean;
  badge_text: string | null;
  badge_color: string | null;
  terms_conditions: string | null;
  created_by: string;
  created_at: string;
}

export type ShippingZone = "NAIROBI" | "KENYA" | "INTERNATIONAL";

export interface ShippingOptions {
  zone: ShippingZone;
  weightKg?: number;
}

export interface ShippingCalculationResult {
  shippingCost: number;
  orderTotal: number;
  totalWeight: number;
}

export const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Please enter a valid phone number."),
  address: z.string().min(5, "Address must be at least 5 characters."),
  city: z.string().min(2, "City must be at least 2 characters."),
  county: z.string().min(2, "County must be at least 2 characters."),
  postalCode: z.string().min(5, "Postal code must be at least 5 characters."),
  country: z.string().min(2, "Country must be at least 2 characters."),
  shippingMethod: z.enum(["standard", "express", "pickup"], {
    message: "Please select a shipping method.",
  }),
  paymentMethod: z.enum(["paypal", "mpesa"], {
    message: "Please select a payment method.",
  }),
  couponCode: z.string().optional(),
  loyaltyRedemptionCode: z.string().optional(),
  installationRequired: z.boolean().default(false),
  specialInstructions: z.string().optional(),
});

export const productVarietySchema = z.object({
  id: z.string().optional(),
  product_id: z.string(),
  name: z.string().min(1, "Variety name is required"),
  sku: z.string().min(1, "SKU is required"),
  price: z.number().min(0, "Price must be positive"),
  original_price: z.number().min(0).optional().nullable(),
  wholesale_price: z.number().min(0).optional().nullable(),
  wholesale_min_quantity: z.number().min(0).optional().nullable(),
  stock: z.number().int().min(0, "Stock must be 0 or greater"),
  images: z.array(z.string()).default([]),
  attributes: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .default({}),
  is_default: z.boolean().default(false),
});

export type Variaty = z.infer<typeof productVarietySchema>;

export type VarietyAttributes = {
  wattage?: number;
  colorTemp?: string;
  // Add other possible attributes here
  [key: string]: string | number | boolean | undefined;
};

// Product schema for lighting products
export const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters."),
  title: z.string().min(10, "Product title must be at least 10 characters."),
  sku: z.string().min(2, "SKU must be at least 2 characters."),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters."),
  slug: z.string().min(3, "Slug must be at least 3 characters."),
  images: z.array(z.string()).optional(),
  videoUrl: z.string().optional().nullable(),
  price: z.preprocess(
    (val) => (val === "" || val === null ? undefined : Number(val)),
    z.number().min(0, "Price must be a positive number."),
  ),
  originalPrice: z.preprocess(
    (val) => (val === "" || val === null ? undefined : Number(val)),
    z.number().min(0, "Original price must be a positive number."),
  ),
  stock: z.preprocess(
    (val) => (val === "" || val === null ? undefined : Number(val)),
    z.number().int().min(0, "Stock must be a non-negative integer."),
  ),
  category: z.string().min(1, "Please select a category."),
  voltage: z.string().optional().default("220-240V"),
  colorTemperature: z.string().optional(),
  lumens: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    return Number(val);
  }, z.number().min(0, "Lumens must be a positive number.").optional().default(0)),
  warrantyMonths: z
    .preprocess(
      (val) => (val === "" || val === null ? undefined : Number(val)),
      z.number().int().min(0, "Warranty must be a positive number."),
    )
    .default(24),
  batteryCapacity: z.string().optional(),
  wattage: z.preprocess((val) => {
    // Handle empty string, null, or undefined
    if (val === "" || val === null || val === undefined) {
      return 0; // or return null if you want it to be truly optional
    }
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }, z.number().min(0, "Wattage must be a positive number.").optional()),

  solarPanelWattage: z.preprocess((val) => {
    // Handle empty string, null, or undefined
    if (val === "" || val === null || val === undefined) {
      return 0; // or return null if you want it to be truly optional
    }
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }, z.number().min(0, "Solar panel wattage must be a positive number.").optional()),
  dimensions: z.string().optional(),
  ipRating: z.string().optional(),
  currency: z.string(),
  tags: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
  dealOfTheDay: z.boolean().optional().default(false),
  bestSeller: z.boolean().optional().default(false),
  energySaving: z.boolean().optional().default(false),
  weight: z
    .preprocess(
      (val) => {
        if (val === "" || val === null) return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : Number(num.toFixed(2));
      },
      z.number().min(0, "Weight must be a non-negative number."),
    )
    .optional()
    .default(0),
  installationType: z.string().optional().default("DIY"),
  has_wholesale: z.boolean().default(false),
  referral_points: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    return Number(val);
  }, z.number().min(0).optional().default(0)),
  wholesale_price: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    return Number(val);
  }, z.number().min(0).optional().default(0)),
  wholesale_min_quantity: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    return Number(val);
  }, z.number().min(0).optional().default(0)),
  has_varieties: z.boolean().default(false),
});
