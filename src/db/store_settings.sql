-- db/store_settings.sql
-- Store settings table (single row, singleton pattern)
CREATE TABLE IF NOT EXISTS store_settings (
    id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    referral_settings jsonb DEFAULT '{
        "points_per_referral": 100,
        "bonus_points_for_first_referral": 50,
        "referrals_for_tier_upgrade": 5,
        "auto_approve_days": 7,
        "tier_upgrade": null
    }'::jsonb,
    loyalty_settings jsonb DEFAULT '{
        "points_per_ksh": 10,
        "min_redeem_points": 100,
        "tiers": {
            "bronze": {"min_points": 0, "discount": 0},
            "silver": {"min_points": 1000, "discount": 5},
            "gold": {"min_points": 5000, "discount": 10},
            "platinum": {"min_points": 10000, "discount": 15}
        }
    }'::jsonb,
    gamification_settings jsonb DEFAULT '{
        "spin": {"free_spins_per_day": 1, "points_per_spin": 50},
        "challenges": {"default_points": 100},
        "draws": {"entry_points": 10}
    }'::jsonb,
    email_settings jsonb DEFAULT '{
        "from_email": "noreply@example.com",
        "from_name": "Store Name",
        "smtp_host": null,
        "smtp_port": null
    }'::jsonb,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- RPC to get referral settings
CREATE OR REPLACE FUNCTION get_referral_settings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_settings jsonb;
BEGIN
    SELECT referral_settings INTO v_settings
    FROM store_settings
    WHERE id = 1;
    
    IF v_settings IS NULL THEN
        -- Return default settings if no row exists
        v_settings = '{
            "points_per_referral": 100,
            "bonus_points_for_first_referral": 50,
            "referrals_for_tier_upgrade": 5,
            "auto_approve_days": 7,
            "tier_upgrade": null
        }'::jsonb;
    END IF;
    
    RETURN v_settings;
END;
$$;

-- RPC to update referral settings
CREATE OR REPLACE FUNCTION update_referral_settings(
    p_settings jsonb,
    p_updated_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO store_settings (id, referral_settings, updated_by, updated_at)
    VALUES (1, p_settings, p_updated_by, now())
    ON CONFLICT (id) DO UPDATE
    SET 
        referral_settings = p_settings,
        updated_by = p_updated_by,
        updated_at = now();
END;
$$;