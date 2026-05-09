CREATE TABLE IF NOT EXISTS points_config (
    id integer PRIMARY KEY DEFAULT 1,
    points_per_ksh integer NOT NULL DEFAULT 10 CHECK (points_per_ksh > 0),
    min_redeem_points integer NOT NULL DEFAULT 100 CHECK (min_redeem_points > 0),
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO points_config (id, points_per_ksh, min_redeem_points)
VALUES (1, 10, 100)
ON CONFLICT (id) DO NOTHING;
