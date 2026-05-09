// src/types/spinning-wheel.ts

export interface SpinGame {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    game_type: 'standard' | 'vip' | 'new_customer' | 'weekend' | 'flash';
    
    eligible_tiers: string[];
    min_points_required: number;
    requires_purchase_count: number;
    new_customer_only: boolean;
    
    free_spins_per_day: number;
    free_spins_per_week: number;
    free_spins_total: number;
    points_per_paid_spin: number;
    
    prize_config: PrizeSegment[];
    
    is_single_prize: boolean;
    single_prize_claimed: boolean;
    single_prize_winner_id: string | null;
    
    starts_at: string | null;
    ends_at: string | null;
    is_active: boolean;
    
    live_theme: string;
    show_confetti: boolean;
    play_sounds: boolean;
  }
  
  export interface PrizeSegment {
    label: string;
    type: 'points' | 'discount' | 'free_shipping' | 'product' | 'bundle';
    value: string | number;
    color: string;
    probability: number; // 0-100, sum should be 100
    icon?: string;
  }
  
  export interface SpinAttempt {
    id: string;
    game_id: string;
    user_id: string;
    spin_type: 'free' | 'points' | 'purchase' | 'bonus';
    prize_type: string;
    prize_value: string;
    points_awarded: number;
    points_spent: number;
    segment_index: number;
    landed_at: string;
  }
  
  export interface UserSpinAllocation {
    spins_used_today: number;
    spins_used_this_week: number;
    spins_used_total: number;
    free_spins_remaining_today: number;
    free_spins_remaining_week: number;
    free_spins_remaining_total: number;
    can_spin_free: boolean;
    can_spin_paid: boolean;
    points_required_for_paid: number;
  }