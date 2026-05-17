// src/lib/types/student.ts
import { z } from "zod";

export const CustomerSchema = z
  .object({
    id: z.string().optional(),
    email: z.email(),
    metadata: z.any(),
    createdAt: z.string(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    confirmPassword: z.string().optional(),
    role: z.string(),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const signUpSchema = z
  .object({
    fullName: z.string().min(2, { message: "Full name is required" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    phone: z
      .string()
      .min(10, { message: "Please enter a valid phone number" })
      .regex(/^[0-9+\-\s]+$/, { message: "Invalid phone number format" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Must contain at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Must contain at least one number" }),
    confirmPassword: z.string(),
    address: z.string().optional(),
    city: z.string().min(2, { message: "Please enter your city" }),
    postalCode: z.string().optional(),
    businessName: z.string().optional(),
    businessType: z.string().optional(),
    receiveOffers: z.boolean().default(true),
    receiveNewsletter: z.boolean().default(true),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Validation schema
export const validateSignUp = z.object({
  fullName: z.string().min(2),
  email: z.email(),
  phone: z.string().min(10),
  password: z.string().min(8),
  address: z.string().optional(),
  city: z.string().min(2),
  postalCode: z.string().optional(),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  receiveOffers: z.boolean().default(true),
  receiveNewsletter: z.boolean().default(true),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Terms must be accepted",
  }),
  referralCode: z.string().optional(),
});

export type Customer = z.infer<typeof CustomerSchema>;

// Use the same type for ProfileData to avoid inconsistencies
export type Profile = Omit<Customer, "password" | "confirmPassword">;

export interface ProfileData {
  id: string;
  email: string;
  role: string;

  // personal
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  referral_code?: string;

  // business
  business_name?: string;
  business_type?: string;
  business_customer?: boolean;

  // preferences
  receive_offers?: boolean;
  receive_newsletter?: boolean;

  // auth/meta
  email_verified?: boolean;
  last_login?: string | null;

  // raw metadata fallback
  metadata?: {
    city?: string;
    phone?: string;
    full_name?: string;
    business_customer?: boolean;
    [key: string]: any;
  };

  created_at: string;
  updated_at?: string;
  referred_by?: string;
  loyalty?: {
    points: number;
    points_earned: number;
    points_redeemed: number;
    tier: string;
    tier_details: any[];
    last_updated: string;
  } | null;
}

export interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  payment_method: string;
  shipping_method: string;
  items: Array<{
    product_name: string;
    product_image: string;
    quantity: number;
    unit_price: number;
  }>;
}

export interface EngagementSummary {
  bundle_count: number;
  available_bundles: Array<{
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    badge_text: string | null;
    badge_color: string | null;
    discount_type: string;
    discount_value: number;
    points_required: number;
    featured: boolean;
  }>;
  user_tier: string;
  loyalty_points: number;
  spins_today: number;
  spin_game: {
    id: string;
    name: string;
    free_spins_per_day: number;
    points_per_spin: number;
    is_active: boolean;
  } | null;
  recent_spin_results: Array<{
    id: string;
    prize_type: string;
    prize_value: string;
    loyalty_points_awarded: number;
    is_claimed: boolean;
    created_at: string;
    coupon?: {
      code: string;
      discount_type: string;
      discount_value: number;
    } | null;
  }>;
  active_challenges: number;
  birthday_reward_available: boolean;
  anniversary_days: number;
}

export interface SpinGame {
  id: string;
  name: string;
  description: string;
  free_spins_per_day: number;
  points_per_spin: number;
  max_spins_per_day: number;
  wheel_config: Array<{
    label: string;
    value: string;
    type: string;
    quantity: number;
    probability: number;
    color: string;
  }>;
  segment_colors: string[];
  rules: string | null;
  is_active: boolean;
}

export interface SpinResult {
  id: string;
  prize_type: string;
  prize_value: string;
  prize_details: any;
  coupon_id: string | null;
  product_name: string | null;
  coupon?: {
    code: string;
    discount_type: string;
    discount_value: number;
    valid_until: string;
  };
  loyalty_points_awarded: number;
  is_claimed: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: string;
  trigger_event: string;
  requirements: any;
  reward_points: number;
  reward_tier_upgrade: string | null;
  reward_details: any;
  max_rewards_per_user: number | null;
  max_total_rewards: number | null;
  current_rewards_count: number;
  badge_image_url: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface UserChallenge {
  id: string;
  challenge_id: string;
  status: "in_progress" | "completed" | "reward_claimed" | "expired";
  progress: number;
  target: number;
  completed_at: string | null;
  reward_claimed_at: string | null;
  loyalty_points_awarded: number;
  metadata: any;
  challenge: Challenge;
}

export interface MarketingStats {
  bundles: {
    total: number;
    active: number;
    purchases: number;
    revenue: number;
    topBundles: Array<{
      name: string;
      purchases: number;
      revenue: number;
    }>;
  };
  spins: {
    totalGames: number;
    activeGames: number;
    totalSpins: number;
    todaySpins: number;
    prizesAwarded: {
      points: number;
      discounts: number;
      products: number;
    };
    topWinners: Array<{
      user: string;
      prize: string;
      date: string;
    }>;
  };
  challenges: {
    total: number;
    active: number;
    completed: number;
    referrals: {
      total: number;
      completed: number;
      pending: number;
    };
    pointsAwarded: number;
  };
  rewards: {
    total: number;
    active: number;
    awarded: number;
    upcoming: Array<{
      type: string;
      count: number;
      date: string;
    }>;
  };
  loyalty: {
    totalPoints: number;
    pointsEarned: number;
    pointsRedeemed: number;
    tierDistribution: Array<{
      tier: string;
      count: number;
      color: string;
    }>;
  };
}
