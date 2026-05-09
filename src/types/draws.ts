// src/types/draws.ts

export interface Draw {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    prize_name: string;
    prize_description: string | null;
    prize_image_url: string | null;
    prize_value: number | null;
    
    entry_config: EntryConfig;
    max_entries_total: number | null;
    max_entries_per_user: number | null;
    
    entry_starts_at: string;
    entry_ends_at: string;
    draw_time: string;
    
    status: 'draft' | 'open' | 'closed' | 'drawing' | 'completed' | 'cancelled';
    
    winner_id: string | null;
    winner_announced_at: string | null;
    winner_claimed_at: string | null;
    winner_claim_expires_at: string | null;
    consolation_points_awarded: boolean;
    
    theme_color: string;
    show_entry_ticker: boolean;
    show_leaderboard: boolean;
}

export interface EntryConfig {
    // Purchase-based entries
    purchase?: {
        min_amount: number;
        entries_per_ksh: number;
        bonus_at_thresholds?: Array<{ threshold: number; bonus_entries: number }>;
    };
    
    // Referral-based entries
    referral?: {
        entries_per_referral: number;
        bonus_for_first_referral?: number;
    };
    
    // Social share entries
    social_share?: {
        entries_per_share: number;
        platforms: ('facebook' | 'twitter' | 'instagram' | 'whatsapp')[];
        max_entries_per_day?: number;
    };
    
    // Live stream entries
    live_stream?: {
        entries_per_email: number;
        require_email_verification?: boolean;
    };
    
    // Loyalty tier bonuses
    loyalty_tier?: {
        bronze: number;
        silver: number;
        gold: number;
        platinum: number;
    };
}

export interface DrawEntry {
    id: string;
    draw_id: string;
    user_id: string;
    entry_count: number;
    entry_method: string;
    source_id: string | null;
    created_at: string;
}

export interface DrawTicket {
    id: string;
    draw_id: string;
    user_id: string;
    ticket_number: number;
    is_winner: boolean;
    winner_rank: number | null;
}

export interface UserDrawStatus {
    total_entries: number;
    remaining_entries_allowed: number | null;
    entry_methods_used: Record<string, number>;
    can_enter_purchase: boolean;
    can_enter_referral: boolean;
    can_enter_social: boolean;
    can_enter_live: boolean;
}