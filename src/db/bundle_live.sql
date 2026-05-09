-- db/bundle_live.sql
CREATE TABLE IF NOT EXISTS bundle_live_config (
    bundle_id uuid PRIMARY KEY REFERENCES mistry_bundles(id) ON DELETE CASCADE,
    bundle_type text NOT NULL DEFAULT 'mystery' CHECK (bundle_type IN ('mystery', 'tiered', 'build_your_own')),
    mystery_reveal_mode text NOT NULL DEFAULT 'manual' CHECK (mystery_reveal_mode IN ('manual', 'after_purchase')),
    total_value_ksh numeric(10,2),
    is_live_stream_only boolean NOT NULL DEFAULT false,
    is_stream_active boolean NOT NULL DEFAULT false,
    is_mystery_revealed boolean NOT NULL DEFAULT false,
    live_stock_total integer DEFAULT 0,
    live_stock_claimed integer DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bundle_live_stream_state
ON bundle_live_config(is_live_stream_only, is_stream_active);
