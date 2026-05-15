-- Variety enum type
create type variety_type as enum ('wattage, colorTemp, warranty, batteryCapacity, solarPanelWattage', 'dimensions', 'ipRating', 'installationType', 'referralPoints', 'size', 'type');
-- Create users table
CREATE TABLE users (
    id uuid primary key,
    email text NOT NULL UNIQUE,
    role text DEFAULT 'customer' NOT NULL,
    metadata jsonb,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Kenya',
    referral_code TEXT,
    business_name TEXT,
    business_type TEXT,
    receive_offers BOOLEAN DEFAULT TRUE,
    receive_newsletter BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    verification_sent_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    title text NOT NULL,
    images text[] DEFAULT '{}',
    sku text UNIQUE,
    description text,
    slug text unique,
    price numeric(10, 2) NOT NULL,
    originalPrice numeric(10, 2),
    stock integer DEFAULT 0,
    category text,
    currency text NOT NULL,
    weight numeric(10,2) DEFAULT 0,
    tags text[],
    featured boolean DEFAULT false,
    metadata jsonb,
    rating numeric(2,1) DEFAULT 0,
    reviewsCount integer DEFAULT 0,
    isDealOfTheDay boolean DEFAULT false,
    video_url TEXT,
    wattage INTEGER,
    voltage TEXT DEFAULT '220-240V',
    color_temperature TEXT,
    lumens INTEGER,
    warranty_months INTEGER DEFAULT 24,
    battery_capacity TEXT,
    solar_panel_wattage INTEGER,
    dimensions TEXT,
    ip_rating TEXT,
    deal_of_the_day BOOLEAN DEFAULT FALSE,
    best_seller BOOLEAN DEFAULT FALSE,
    energy_saving BOOLEAN DEFAULT FALSE,
    installation_type TEXT DEFAULT 'DIY',
    referral_points INTEGER DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Add has_varieties boolean column to products table
ALTER TABLE products ADD COLUMN has_varieties boolean DEFAULT false;
ALTER TABLE products ADD COLUMN status text DEFAULT 'active' NOT NULL;

-- Product varieties table for products with multiple options
CREATE TABLE product_varieties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    name text NOT NULL, -- e.g., "20W Cool White", "30W Warm White"
    variety_type variety_type NOT NULL, -- e.g., wattage, colorTemp
    variant_value text NOT NULL, -- e.g., "20W", "4000K"
    sku text UNIQUE NOT NULL,
    price numeric(10, 2) NOT NULL,
    original_price numeric(10, 2),
    stock integer DEFAULT 0,
    images text[] DEFAULT '{}',
    is_default boolean DEFAULT false,
    metadata jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_product_varieties_product_id ON product_varieties(product_id);
CREATE INDEX idx_product_varieties_sku ON product_varieties(sku);

-- Create orders table
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id),
    total numeric(10, 2) NOT NULL,
    currency text NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    shipping_info jsonb,
    tracking_number text,
    created_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders(id) NOT NULL,
    product_id uuid REFERENCES products(id) NOT NULL,
    qty integer NOT NULL,
    unit_price numeric(10, 2) NOT NULL
);

-- Create transactions table
CREATE TABLE transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders(id) NOT NULL,
    gateway text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    fees numeric(10, 2),
    gateway_tx_id text,
    status text NOT NULL,
    receipt_number text,
    phone_number text,
    payload jsonb,
    created_at timestamptz DEFAULT now()
);

-- Create page_views table for simple stats
CREATE TABLE page_views (
    id bigserial PRIMARY KEY,
    path text NOT NULL,
    user_id uuid REFERENCES users(id),
    created_at timestamptz DEFAULT now()
);

CREATE POLICY "User can update own profile"
ON users
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);

-- Update products with new wholesale fields
-- Add wholesale pricing columns to products table
ALTER TABLE products ADD COLUMN wholesale_price numeric(10, 2);
ALTER TABLE products ADD COLUMN wholesale_min_quantity integer DEFAULT 10;
ALTER TABLE products ADD COLUMN has_wholesale boolean DEFAULT false;

-- Update trigger to handle new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only insert if email is not null and user doesn't already exist
  IF new.email IS NOT NULL THEN
    INSERT INTO public.users (
      id, 
      email, 
      role, 
      full_name,
      metadata,
      created_at,
      updated_at,
      country
    )
    VALUES (
      new.id, 
      new.email, 
      'customer', 
      COALESCE(new.raw_user_meta_data->>'full_name', ''),
      COALESCE(new.raw_user_meta_data, '{}'::jsonb),
      now(),
      now(),
      'Kenya'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, users.full_name),
      metadata = EXCLUDED.metadata,
      updated_at = now()
    WHERE users.email IS DISTINCT FROM EXCLUDED.email;
  END IF;

  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the auth user creation
    RAISE LOG 'Error in handle_new_user for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Replace the old verify_admin_access function
CREATE OR REPLACE FUNCTION public.verify_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_analytics(time_period text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_date timestamptz;
    end_date timestamptz;
    sales jsonb;
    visits jsonb;
    category jsonb;
    top_products jsonb;
    recent_activity jsonb;
    stats jsonb;
    total_orders bigint;
    total_completed_orders bigint;
    total_page_views bigint;
    total_sales numeric; -- Actual sales from completed orders
    total_all_orders_amount numeric; -- All order amounts (renamed from total_revenue)
    conversion_rate numeric;
BEGIN
    -- Check if user is admin
    IF NOT public.verify_admin_access() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    -- Determine the start date based on the time period
    start_date := CASE time_period
        WHEN '7d' THEN now() - interval '7 days'
        WHEN '30d' THEN now() - interval '30 days'
        WHEN '90d' THEN now() - interval '90 days'
        WHEN '1y' THEN now() - interval '1 year'
        ELSE '1970-01-01'::timestamptz
    END;
    
    end_date := now();

    -- Get total orders and completed orders
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN status = 'completed' AND payment_status = 'paid' THEN 1 END),
        COALESCE(SUM(total_amount), 0),
        COALESCE(SUM(CASE WHEN status = 'completed' AND payment_status = 'paid' THEN total_amount ELSE 0 END), 0)
    INTO total_orders, total_completed_orders, total_all_orders_amount, total_sales
    FROM orders
    WHERE created_at >= start_date AND created_at <= end_date;

    SELECT COUNT(*) INTO total_page_views
    FROM page_views
    WHERE created_at >= start_date AND created_at <= end_date;

    -- Calculate conversion rate (completed orders / page views)
    IF total_page_views > 0 THEN
        conversion_rate := ROUND((total_completed_orders::numeric / total_page_views::numeric) * 100, 1);
    ELSE
        conversion_rate := 0;
    END IF;

    -- Sales by month (actual sales from completed orders)
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'name', month_name,
                'sales', monthly_sales,
                'revenue', monthly_all_orders
            ) ORDER BY month_number
        ), '[]'::jsonb
    ) INTO sales
    FROM (
        SELECT 
            TO_CHAR(created_at, 'Mon') as month_name,
            EXTRACT(MONTH FROM created_at) as month_number,
            SUM(CASE WHEN status = 'completed' AND payment_status = 'paid' THEN total_amount ELSE 0 END) as monthly_sales,
            SUM(total_amount) as monthly_all_orders
        FROM orders
        WHERE created_at >= start_date AND created_at <= end_date
        GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
    ) t;

    -- Page views by month
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'name', month_name,
                'visits', visits_count
            ) ORDER BY month_number
        ), '[]'::jsonb
    ) INTO visits
    FROM (
        SELECT 
            TO_CHAR(created_at, 'Mon') as month_name,
            EXTRACT(MONTH FROM created_at) as month_number,
            COUNT(*) as visits_count
        FROM page_views
        WHERE created_at >= start_date AND created_at <= end_date
        GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
    ) t;

    -- Product category distribution (from completed orders)
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'name', category_name,
                'value', sales_count
            ) ORDER BY sales_count DESC
        ), '[]'::jsonb
    ) INTO category
    FROM (
        SELECT 
            COALESCE(p.category, 'Uncategorized') as category_name,
            SUM(oi.quantity) as sales_count
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE o.created_at >= start_date AND o.created_at <= end_date
            AND o.status = 'completed' 
            AND o.payment_status = 'paid'
        GROUP BY p.category
        HAVING SUM(oi.quantity) > 0
    ) t;

    -- Top products (from completed orders)
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'name', product_name,
                'units', total_units,
                'revenue', product_revenue
            )
        ), '[]'::jsonb
    ) INTO top_products
    FROM (
        SELECT 
            oi.product_name,
            SUM(oi.quantity) as total_units,
            SUM(oi.quantity * oi.unit_price) as product_revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.created_at >= start_date AND o.created_at <= end_date
            AND o.status = 'completed' 
            AND o.payment_status = 'paid'
        GROUP BY oi.product_name
        HAVING SUM(oi.quantity) > 0
        ORDER BY total_units DESC
        LIMIT 5
    ) t;

    -- Recent activity
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'type', activity_type,
                'description', description,
                'timestamp', timestamp,
                'icon', icon
            )
        ), '[]'::jsonb
    ) INTO recent_activity
    FROM (
        SELECT 
            activity_type,
            description,
            timestamp,
            icon
        FROM (
            -- New orders
            SELECT 
                'order' as activity_type,
                'New order #' || order_number || ' from ' || customer_name as description,
                created_at as timestamp,
                'ShoppingBag' as icon
            FROM orders
            WHERE created_at >= start_date
            UNION ALL
            -- New users
            SELECT 
                'user' as activity_type,
                'New customer registered: ' || COALESCE(full_name, email) as description,
                created_at as timestamp,
                'Users' as icon
            FROM users
            WHERE created_at >= start_date
            UNION ALL
            -- Status updates to completed
            SELECT 
                'status' as activity_type,
                'Order #' || order_number || ' completed' as description,
                updated_at as timestamp,
                'TrendingUp' as icon
            FROM orders
            WHERE updated_at >= start_date 
                AND status = 'completed'
                AND updated_at != created_at
            UNION ALL
            -- Payments received
            SELECT 
                'payment' as activity_type,
                'Payment received for order #' || order_number as description,
                o.updated_at as timestamp,
                'DollarSign' as icon
            FROM orders o
            WHERE o.payment_status = 'paid' 
                AND o.updated_at >= start_date
            UNION ALL
            -- Page views
            SELECT 
                'view' as activity_type,
                'Page viewed: ' || path as description,
                created_at as timestamp,
                'Eye' as icon
            FROM page_views
            WHERE created_at >= start_date
        ) all_activity
        ORDER BY timestamp DESC
        LIMIT 5
    ) limited_activity;

    -- Summary stats
    SELECT jsonb_build_object(
        'totalSales', total_sales, -- Actual sales
        'totalRevenue', total_all_orders_amount, -- All orders
        'totalOrders', total_orders,
        'completedOrders', total_completed_orders,
        'totalCustomers', (SELECT COUNT(*) FROM users WHERE created_at >= start_date),
        'totalProducts', (SELECT COUNT(*) FROM products),
        'pageViews', total_page_views,
        'conversionRate', conversion_rate,
        'avgOrderValue', CASE 
            WHEN total_completed_orders > 0 THEN ROUND(total_sales / total_completed_orders, 2)
            ELSE 0
        END
    ) INTO stats;

    RETURN jsonb_build_object(
        'salesData', sales,
        'visitsData', visits,
        'categoryData', category,
        'topProducts', top_products,
        'recentActivity', recent_activity,
        'stats', stats
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    total_paid_orders bigint;
    total_pending_orders bigint;
    total_completed_orders bigint;
    total_orders bigint;
    total_sales numeric; -- Only from completed/paid orders
    total_revenue numeric; -- All orders regardless of status
    today_sales numeric;
    today_orders bigint;
    recent_orders_json json;
    recent_customers_json json;
    avg_order_value numeric;
BEGIN
    -- Check if user is admin
    IF NOT public.verify_admin_access() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    -- Get total paid orders (payment completed)
    SELECT COUNT(*) INTO total_paid_orders
    FROM orders 
    WHERE payment_status = 'paid';
    
    -- Get total completed orders (fulfilled)
    SELECT COUNT(*) INTO total_completed_orders
    FROM orders 
    WHERE status = 'completed';
    
    -- Get total pending orders
    SELECT COUNT(*) INTO total_pending_orders
    FROM orders 
    WHERE status = 'pending' OR payment_status = 'pending';
    
    -- Get total orders count
    SELECT COUNT(*) INTO total_orders FROM orders;
    
    -- Get total sales amount (only from paid AND completed orders)
    SELECT COALESCE(SUM(total_amount), 0) INTO total_sales
    FROM orders 
    WHERE payment_status = 'paid' AND status = 'completed';
    
    -- Get total revenue (all orders regardless of status)
    SELECT COALESCE(SUM(total_amount), 0) INTO total_revenue
    FROM orders;
    
    -- Get today's sales (only from completed orders)
    SELECT 
        COALESCE(SUM(total_amount), 0),
        COUNT(*)
    INTO today_sales, today_orders
    FROM orders 
    WHERE DATE(created_at) = CURRENT_DATE
        AND payment_status = 'paid' 
        AND status = 'completed';
    
    -- Calculate average order value (from completed orders)
    IF total_completed_orders > 0 THEN
        avg_order_value := ROUND(total_sales / total_completed_orders, 2);
    ELSE
        avg_order_value := 0;
    END IF;

    -- Get recent orders
    SELECT COALESCE(
        json_agg(
            json_build_object(
                'id', o.id,
                'orderNumber', o.order_number,
                'customer', o.customer_name,
                'date', o.created_at,
                'total', o.total_amount,
                'status', o.status,
                'paymentStatus', o.payment_status
            )
        ), '[]'::json
    ) INTO recent_orders_json
    FROM (
        SELECT *
        FROM orders
        ORDER BY created_at DESC
        LIMIT 5
    ) o;

    -- Get recent customers
    SELECT COALESCE(
        json_agg(
            json_build_object(
                'id', u.id,
                'name', COALESCE(u.full_name, 'Anonymous'),
                'email', u.email,
                'date', u.created_at,
                'orderCount', (
                    SELECT COUNT(*) 
                    FROM orders 
                    WHERE user_id = u.id
                )
            )
        ), '[]'::json
    ) INTO recent_customers_json
    FROM (
        SELECT *
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
    ) u;

    -- Build the result JSON
    SELECT json_build_object(
        'stats', json_build_object(
            'totalSales', total_sales, -- Actual sales (completed)
            'totalRevenue', total_revenue, -- All order amounts
            'todaySales', today_sales,
            'totalOrders', total_orders,
            'todayOrders', today_orders,
            'paidOrders', total_paid_orders,
            'completedOrders', total_completed_orders,
            'pendingOrders', total_pending_orders,
            'totalCustomers', (SELECT COUNT(*) FROM users),
            'totalProducts', (SELECT COUNT(*) FROM products),
            'pageViews', (SELECT COUNT(*) FROM page_views),
            'avgOrderValue', avg_order_value
        ),
        'recentOrders', recent_orders_json,
        'recentCustomers', recent_customers_json
    )
    INTO result;

    RETURN result;
END;
$$;

-- Drop the trigger first
DROP TRIGGER IF EXISTS cleanup_product_images ON products;

-- Then drop the function
DROP FUNCTION IF EXISTS delete_product_images();

-- Add indexes for performance
CREATE INDEX ON orders (user_id);
CREATE INDEX ON order_items (order_id);
CREATE INDEX ON order_items (product_id);
CREATE INDEX ON transactions (order_id);
CREATE INDEX ON page_views (user_id);
CREATE INDEX ON page_views (path);
create index on products (id);
create index on products (slug);

-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Example: Allow users to see their own orders
CREATE POLICY "Allow individual read access" ON orders FOR SELECT USING (auth.uid() = user_id);

-- Allow users to read their own user data
CREATE POLICY "Allow individual user read access" ON users FOR SELECT USING (auth.uid() = id);

-- Allow users to read order items for their own orders
CREATE POLICY "Allow individual order items read access" ON order_items FOR SELECT USING (
  exists (
    select 1 from orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  )
);

-- 1. Create the admin check sql function
-- Replace the old is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  );
$$;

-- 2. Update all your admin policies
CREATE POLICY "Allow admin access" ON users FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON products FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON product_varieties FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON orders FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON order_items FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON transactions FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON page_views FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON loyalty_points FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON loyalty_tiers FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON loyalty_transactions FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON loyalty_redemptions FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON birthday_gifts FOR ALL 
USING (public.is_admin());

-- Storage bucket RLS using your users.role approach
-- Update storage bucket RLS to use users
CREATE POLICY "Allow admin access to product-images"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'superadmin')
    )
  );

-- Allow public to read product images
CREATE POLICY "Public can view product-images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

-- Product Videos
CREATE POLICY "Allow admin access to product-videos"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'product-videos'
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    bucket_id = 'product-videos'
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'superadmin')
    )
  );

-- Allow public to read product images
CREATE POLICY "Public can view product-videos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-videos');

CREATE POLICY "Users can read transactions for their orders"
ON transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = transactions.order_id
    AND orders.user_id = auth.uid()
  )
);


-- Note: You will need to create more specific RLS policies based on your application's needs.
-- For example, admins should have broader access, while customers should only be able to see and manage their own data.

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_deal_of_day ON products(deal_of_the_day) WHERE deal_of_the_day = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON products(best_seller) WHERE best_seller = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_energy_saving ON products(energy_saving) WHERE energy_saving = TRUE;
-- Add these indexes to your Supabase database
CREATE INDEX idx_products_title ON products USING gin(to_tsvector('english', title));
CREATE INDEX idx_products_tags ON products USING gin(tags);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE FUNCTION products_search_vector_trigger() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_search_vector ON products;
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_trigger();

CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING gin(search_vector);

-- Update metadata column to include additional specs
COMMENT ON COLUMN products.metadata IS 'Additional product specifications in JSON format';