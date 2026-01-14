-- Create users table
CREATE TABLE users (
    id uuid primary key,
    email text NOT NULL UNIQUE,
    role text DEFAULT 'customer' NOT NULL,
    metadata jsonb,
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
    created_at timestamptz DEFAULT now()
);

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

-- Update users table with additional fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Kenya',
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS receive_offers BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS receive_newsletter BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);

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

create or replace function public.get_dashboard_data()
returns json
language plpgsql
set search_path = public
security definer
as $$
declare
  result json;
  total_paid_orders bigint;
  total_pending_orders bigint;
  total_orders bigint;
  total_sales numeric;
  conversion_rate numeric;
BEGIN
   -- Check if user is admin
    IF NOT public.verify_admin_access() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

  -- Get total paid orders (all successful statuses)
  SELECT COUNT(*) INTO total_paid_orders
  FROM orders 
  WHERE status IN ('paid', 'completed', 'delivered', 'shipped');
  
  -- Get total pending orders
  SELECT COUNT(*) INTO total_pending_orders
  FROM orders 
  WHERE status = 'pending';
  
  -- Get total orders count
  SELECT COUNT(*) INTO total_orders FROM orders;
  
  -- Get total sales amount (only from paid orders)
  SELECT COALESCE(SUM(total), 0) INTO total_sales
  FROM orders 
  WHERE status IN ('paid', 'completed', 'delivered', 'shipped');
  
  -- Calculate conversion rate: paid / (paid + pending)
  -- This measures what percentage of "active" orders converted
  IF (total_paid_orders + total_pending_orders) > 0 THEN
    conversion_rate := ROUND(
      (total_paid_orders::numeric / (total_paid_orders + total_pending_orders)::numeric) * 100, 
      2
    );
  ELSE
    conversion_rate := 0;
  END IF;

  -- Build the result JSON
  select json_build_object(
    'stats', json_build_object(
      'totalSales', total_sales,
      'totalOrders', total_orders,
      'totalCustomers', (select count(*) from users),
      'totalProducts', (select count(*) from products),
      'pageViews', (select count(*) from page_views),
      'conversionRate', conversion_rate,
      'paidOrders', total_paid_orders,
      'pendingOrders', total_pending_orders
    ),
    'recentOrders', COALESCE((
  select json_agg(
    json_build_object(
      'id', o.id,
      'customer', o.shipping_info->>'firstName' || ' ' || coalesce(o.shipping_info->>'lastName',''),
      'date', o.created_at,
      'total', o.total,
      'status', o.status
    )
    order by o.created_at desc
  )
  from (
    select *
    from orders
    order by created_at desc
    limit 5
  ) o
), '[]'::json)
  )
  into result;

  return result;
END;
$$;

create or replace function public.get_all_orders()
returns json
language plpgsql
set search_path = public
security definer
as $$
declare
  result json;
BEGIN
    -- Check if user is admin
    IF NOT public.verify_admin_access() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    select json_agg(order_data order by order_data->>'date' desc)
    into result
    from (
      select json_build_object(
        'id', o.id,
        'customer', o.shipping_info->>'firstName' || ' ' || coalesce(o.shipping_info->>'lastName',''),
        'email', o.shipping_info->>'email',
        'date', o.created_at,
        'total', o.total,
        'status', o.status,
        'items', count(oi.id)
      ) as order_data
      from orders o
      left join order_items oi on o.id = oi.order_id
      group by o.id, o.shipping_info, o.created_at, o.total, o.status
    ) sub;

    return result;
end;
$$;

create or replace function public.get_order_details(order_uuid uuid)
returns json
language plpgsql
set search_path = public
security definer
as $$
declare
  result json;
begin
  -- Check if user is admin
  if not public.verify_admin_access() then
    raise exception 'Access denied. Admin privileges required.';
  end if;

  select json_build_object(
    'id', o.id,
    'customer', json_build_object(
      'name', o.shipping_info->>'firstName' || ' ' || coalesce(o.shipping_info->>'lastName',''),
      'email', o.shipping_info->>'email',
      'phone', o.shipping_info->>'phone'
    ),
    'date', o.created_at,
    'total', o.total,
    'status', o.status,
    'tracking', o.tracking_number,
    'shipping_address', json_build_object(
      'street', o.shipping_info->>'address',
      'city', o.shipping_info->>'city',
      'state', o.shipping_info->>'state',
      'postal_code', o.shipping_info->>'postalCode',
      'country', o.shipping_info->>'country'
    ),
    'items', (
      select json_agg(
        json_build_object(
          'id', oi.id,
          'title', p.name,
          'sku', p.sku,
          'price', oi.unit_price,
          'quantity', oi.qty
        )
      )
      from order_items oi
      join products p on oi.product_id = p.id
      where oi.order_id = o.id
    ),
    'payment', (
      select json_build_object(
        'method', t.gateway,
        'transaction_id', t.gateway_tx_id,
        'status', t.status,
        'amount', t.amount,
        'phone', t.phone_number
      )
      from transactions t
      where t.order_id = o.id
      order by t.created_at desc
      limit 1
    )
  )
  into result
  from orders o
  where o.id = order_uuid;

  return result;
end;
$$;

-- Function: get_analytics(time_period text)
create or replace function public.get_analytics(time_period text)
returns jsonb
language plpgsql
set search_path = public
security definer
as $$
declare
    start_date timestamptz;
    sales jsonb;
    visits jsonb;
    category jsonb;
    stats jsonb;
    total_orders bigint;
    total_page_views bigint;
    total_sales numeric;
begin
   -- Check if user is admin
    if not public.verify_admin_access() then
        raise exception 'Access denied. Admin privileges required.';
    end if;

    -- Determine the start date based on the time period
    start_date := case time_period
        when '7d' then now() - interval '7 days'
        when '30d' then now() - interval '30 days'
        when '90d' then now() - interval '90 days'
        when '1y' then now() - interval '1 year'
        else '1970-01-01'::timestamptz
    end;

    -- Get totals
    select count(*), coalesce(sum(total), 0) into total_orders, total_sales
    from orders
    where created_at >= start_date;

    select count(*) into total_page_views
    from page_views
    where created_at >= start_date;

    -- Sales by month
    select coalesce(jsonb_agg(jsonb_build_object(
        'name', month,
        'sales', sales_value
    )), '[]'::jsonb)
    into sales
    from (
        select to_char(created_at, 'Mon') as month,
               sum(total) as sales_value
        from orders
        where created_at >= start_date
        group by to_char(created_at, 'Mon')
    ) t;

    -- Page views by month
    select coalesce(jsonb_agg(jsonb_build_object(
        'name', month,
        'visits', visits_count
    )), '[]'::jsonb)
    into visits
    from (
        select to_char(created_at, 'Mon') as month,
               count(*) as visits_count
        from page_views
        where created_at >= start_date
        group by to_char(created_at, 'Mon')
    ) t;

    -- Product category distribution
select coalesce(jsonb_agg(jsonb_build_object(
    'name', category_name,
    'value', qty_sum
)), '[]'::jsonb)
into category
from (
    select p.category as category_name,
           sum(oi.qty) as qty_sum
    from order_items oi
    join products p on p.id = oi.product_id
    join orders o on o.id = oi.order_id
    where o.created_at >= start_date
    group by p.category
) t;

    -- Summary stats
    select jsonb_build_object(
        'totalSales', total_sales,
        'totalOrders', total_orders,
        'totalCustomers', coalesce(count(distinct user_id), 0),
        'totalProducts', (select count(*) from products),
        'pageViews', total_page_views,
        'conversionRate', 
            case 
                when total_page_views > 0 
                then round((total_orders::numeric / total_page_views::numeric) * 100, 1)
                else 0
            end
    )
    into stats
    from orders
    where created_at >= start_date;

    return jsonb_build_object(
        'salesData', sales,
        'visitsData', visits,
        'categoryData', category,
        'stats', stats
    );
end;
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

CREATE POLICY "Allow admin access" ON orders FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON order_items FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON transactions FOR ALL 
USING (public.is_admin());

CREATE POLICY "Allow admin access" ON page_views FOR ALL 
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

-- Note: You will need to create more specific RLS policies based on your application's needs.
-- For example, admins should have broader access, while customers should only be able to see and manage their own data.

-- Update products table with lighting-specific fields
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS wattage INTEGER,
ADD COLUMN IF NOT EXISTS voltage TEXT DEFAULT '220-240V',
ADD COLUMN IF NOT EXISTS color_temperature TEXT,
ADD COLUMN IF NOT EXISTS lumens INTEGER,
ADD COLUMN IF NOT EXISTS warranty_months INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS battery_capacity TEXT,
ADD COLUMN IF NOT EXISTS solar_panel_wattage INTEGER,
ADD COLUMN IF NOT EXISTS dimensions TEXT,
ADD COLUMN IF NOT EXISTS ip_rating TEXT,
ADD COLUMN IF NOT EXISTS deal_of_the_day BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS best_seller BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS energy_saving BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS installation_type TEXT DEFAULT 'DIY';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_deal_of_day ON products(deal_of_the_day) WHERE deal_of_the_day = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON products(best_seller) WHERE best_seller = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_energy_saving ON products(energy_saving) WHERE energy_saving = TRUE;

-- Update metadata column to include additional specs
COMMENT ON COLUMN products.metadata IS 'Additional product specifications in JSON format';