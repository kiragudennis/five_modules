// types/sessions.ts
export interface SessionWithUser {
  id: string;
  user_id: string;
  creator_id: string;
  type: string;
  stripe_session_id: string;
  status: "pending" | "completed" | "failed" | "expired";
  total_amount: number;
  currency: string;
  created_at: string;
  completed_at: string | null;
  user_email: string;
  user_username: string | null;
  user_full_name: string | null;
  user_avatar_url: string | null;
  items: any;
}

export interface TransformedSession {
  id: string;
  user_id: string;
  creator_id: string;
  type: string;
  stripe_session_id: string;
  status: "pending" | "completed" | "failed" | "expired";
  total_amount: number;
  currency: string;
  created_at: string;
  completed_at: string | null;
  user: {
    email: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  items: any;
}

export interface SessionsResponse {
  data: TransformedSession[];
  count: number;
}
