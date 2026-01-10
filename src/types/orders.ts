export interface Order {
  id: string;
  user_id: string;
  creator_id: string;
  status: "pending" | "paid" | "fulfilled" | "cancelled";
  total_amount: number;
  currency: string;
  stripe_session_id: string | null;
  shipping_address: any;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  purchasable_type: "product" | "variant";
  purchasable_id: string;
  name: string;
  thumbnail_url: string | null;
  unit_price: number;
  currency: string;
  quantity: number;
  metadata: any;
  created_at: string;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export interface RevenueSummary {
  totalRevenue: number;
  pendingRevenue: number;
  completedOrders: number;
  averageOrderValue: number;
}

export interface OrderWithDetails {
  id: string;
  user_id: string;
  creator_id: string;
  status: "pending" | "paid" | "fulfilled" | "cancelled";
  total_amount: number;
  currency: string;
  stripe_session_id: string | null;
  shipping_address: any;
  created_at: string;
  updated_at: string;
  customer: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    social_links?: any;
    email?: string;
  };
  items: Array<{
    id: string;
    purchasable_type: "product" | "variant";
    purchasable_id: string;
    name: string;
    thumbnail_url?: string;
    unit_price: number;
    currency: string;
    quantity: number;
    metadata?: any;
    created_at: string;
  }>;
}

export interface OrderWithCreator {
  id: string;
  user_id: string;
  creator_id: string;
  status: "pending" | "paid" | "fulfilled" | "cancelled";
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  creator_username: string;
  creator_full_name: string | null;
  creator_avatar_url: string | null;
  items: Array<{
    id: string;
    name: string;
    thumbnail_url: string | null;
    unit_price: number;
    quantity: number;
    created_at: string;
  }>;
}

// Transformed type after processing
export interface FanOrder {
  id: string;
  user_id: string;
  creator_id: string;
  status: "pending" | "paid" | "fulfilled" | "cancelled";
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  creator: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  order_items: Array<{
    id: string;
    name: string;
    thumbnail_url: string | null;
    unit_price: number;
    quantity: number;
    created_at: string;
  }>;
}

export interface OrdersResponse {
  data: FanOrder[];
  count: number;
}
