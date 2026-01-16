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
  belt_level: string;
  tags: string[];
  featured: boolean;
  metadata: { [key: string]: string } | null;
  rating: number;
  reviewsCount: number;
  isDealOfTheDay: boolean;
  has_wholesale: boolean;
  wholesale_min_quantity: number;
  wholesale_price: number;
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

export interface TrackingOrder {
  id: string;
  order_number: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shipping_address: {
    city: string;
    state: string;
    country: string;
  };
  total: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  tracking_number: string | null;
  estimated_delivery: string | null;
  shipping_method: string;
  created_at: string;
  items_count: number;
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
  variant?: ProductVariant;
  quantity: number;
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
  videoUrl: z.string().optional(),
  price: z.preprocess(
    (val) => (val === "" || val === null ? undefined : Number(val)),
    z.number().min(0, "Price must be a positive number.")
  ),
  originalPrice: z.preprocess(
    (val) => (val === "" || val === null ? undefined : Number(val)),
    z.number().min(0, "Original price must be a positive number.")
  ),
  stock: z.preprocess(
    (val) => (val === "" || val === null ? undefined : Number(val)),
    z.number().int().min(0, "Stock must be a non-negative integer.")
  ),
  category: z.string().min(1, "Please select a category."),
  wattage: z
    .preprocess(
      (val) => (val === "" || val === null ? undefined : Number(val)),
      z.number().min(0, "Wattage must be a positive number.")
    )
    .optional(),
  voltage: z.string().optional().default("220-240V"),
  colorTemperature: z.string().optional(),
  lumens: z
    .preprocess(
      (val) => (val === "" || val === null ? undefined : Number(val)),
      z.number().min(0, "Lumens must be a positive number.")
    )
    .optional(),
  warrantyMonths: z
    .preprocess(
      (val) => (val === "" || val === null ? undefined : Number(val)),
      z.number().int().min(0, "Warranty must be a positive number.")
    )
    .default(24),
  batteryCapacity: z.string().optional(),
  solarPanelWattage: z
    .preprocess(
      (val) => (val === "" || val === null ? undefined : Number(val)),
      z.number().min(0, "Solar panel wattage must be a positive number.")
    )
    .optional(),
  dimensions: z.string().optional(),
  ipRating: z.string().optional(),
  currency: z.string(),
  tags: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
  dealOfTheDay: z.boolean().optional().default(false),
  bestSeller: z.boolean().optional().default(false),
  energySaving: z.boolean().optional().default(false),
  weight: z
    .preprocess((val) => {
      if (val === "" || val === null) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : Number(num.toFixed(2));
    }, z.number().min(0, "Weight must be a non-negative number."))
    .optional()
    .default(0),
  installationType: z.string().optional().default("DIY"),
  has_wholesale: z.boolean().default(false),
  wholesale_price: z.number().min(0).optional(),
  wholesale_min_quantity: z.number().min(1).optional(),
});
