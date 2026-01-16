-- First, clean up if needed
DROP VIEW IF EXISTS order_summaries CASCADE;
DROP TRIGGER IF EXISTS snapshot_product_details_trigger ON order_items;
DROP TRIGGER IF EXISTS update_orders_updated_at_trigger ON orders;
DROP TRIGGER IF EXISTS decrease_stock_on_order_trigger ON orders;
DROP FUNCTION IF EXISTS public.snapshot_product_details() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.decrease_product_stock() CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Create orders table with all new fields
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Generated Order Number (Fixed)
    order_number text UNIQUE,
    
    -- Customer Information (Flattened from shipping_info)
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text NOT NULL,
    
    -- Shipping Information (Structured columns + JSONB for backward compatibility)
    shipping_address text NOT NULL,
    shipping_city text NOT NULL,
    shipping_county text NOT NULL,
    shipping_postal_code text,
    shipping_country text DEFAULT 'Kenya',
    shipping_method text NOT NULL CHECK (shipping_method IN ('standard', 'express', 'pickup')),
    shipping_cost numeric(10,2) DEFAULT 0 CHECK (shipping_cost >= 0),
    estimated_delivery text,
    
    -- Backward compatibility: Keep shipping_info as JSONB
    shipping_info jsonb DEFAULT '{}'::jsonb,
    
    -- Payment Information
    payment_method text NOT NULL CHECK (payment_method IN ('mpesa', 'paypal', 'cash_on_delivery')),
    payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    payment_reference text,
    
    -- Order Totals (Matches pendingOrder structure)
    subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
    wholesale_savings numeric(10,2) DEFAULT 0 CHECK (wholesale_savings >= 0),
    coupon_discount numeric(10,2) DEFAULT 0 CHECK (coupon_discount >= 0),
    installation_cost numeric(10,2) DEFAULT 0 CHECK (installation_cost >= 0),
    shipping_total numeric(10,2) NOT NULL DEFAULT 0 CHECK (shipping_total >= 0),
    total_amount numeric(10,2) NOT NULL CHECK (total_amount >= 0),
    currency text DEFAULT 'KES',
    
    -- Installation Services
    installation_required boolean DEFAULT false,
    installation_service jsonb,
    installation_date date,
    installation_time text CHECK (installation_time IN ('morning', 'afternoon', 'evening')),
    special_instructions text,
    
    -- Coupon Information
    coupon_code text,
    coupon_data jsonb,
    
    -- Order Status
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'completed')),
    
    -- Tracking Information
    tracking_number text,
    
    -- Notes & Metadata
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    paid_at timestamptz,
    shipped_at timestamptz,
    delivered_at timestamptz,
    
    -- Check constraints (Matches pendingOrder calculation)
    CONSTRAINT valid_total CHECK (
        total_amount = subtotal - wholesale_savings - coupon_discount + shipping_total + installation_cost
    )
);

-- Create indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_payment_method ON orders(payment_method);
CREATE INDEX idx_orders_installation_required ON orders(installation_required) WHERE installation_required = true;

CREATE OR REPLACE FUNCTION set_order_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'BTE-' ||
      to_char(NEW.created_at, 'YYYYMM') || '-' ||
      lpad(encode(substring(NEW.id::text from 1 for 8)::bytea, 'hex'), 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_order_number_before_insert
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_order_number();

-- Create order_items table with product snapshot (Matches pendingOrder.items structure)
CREATE TABLE order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES products(id) ON DELETE SET NULL,
    
    -- Product Details (Matches pendingOrder.items fields)
    product_name text NOT NULL,
    product_title text NOT NULL,
    product_sku text,
    product_category text,
    product_image text,
    
    -- Pricing Information (Matches pendingOrder.items)
    unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
    wholesale_price numeric(10,2),
    wholesale_min_quantity integer,
    has_wholesale boolean DEFAULT false,
    applied_price numeric(10,2) NOT NULL CHECK (applied_price >= 0),
    quantity integer NOT NULL CHECK (quantity > 0),
    
    -- Generated total price
    total_price numeric(10,2) GENERATED ALWAYS AS (applied_price * quantity) STORED,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    
    -- Check constraints
    CONSTRAINT valid_wholesale CHECK (
        NOT has_wholesale OR (
            wholesale_price IS NOT NULL AND 
            wholesale_min_quantity IS NOT NULL
        )
    ),
    CONSTRAINT valid_applied_price CHECK (
        applied_price <= unit_price
    )
);

-- Create indexes for order_items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_category ON order_items(product_category);
CREATE INDEX idx_order_items_created_at ON order_items(created_at DESC);
CREATE INDEX idx_order_items_wholesale ON order_items(has_wholesale) WHERE has_wholesale = true;

-- Function to automatically populate product details when inserting order items
CREATE OR REPLACE FUNCTION public.snapshot_product_details()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if product_id is set and we're inserting
    IF NEW.product_id IS NOT NULL AND TG_OP = 'INSERT' THEN
        SELECT 
            p.name,
            p.title,
            p.sku,
            p.category,
            COALESCE(p.images[1], ''),
            p.price,
            p.wholesale_price,
            p.wholesale_min_quantity,
            p.has_wholesale,
            -- Calculate applied price based on wholesale eligibility
            CASE 
                WHEN p.has_wholesale AND NEW.quantity >= COALESCE(p.wholesale_min_quantity, 10)
                THEN COALESCE(p.wholesale_price, p.price)
                ELSE p.price
            END
        INTO 
            NEW.product_name,
            NEW.product_title,
            NEW.product_sku,
            NEW.product_category,
            NEW.product_image,
            NEW.unit_price,
            NEW.wholesale_price,
            NEW.wholesale_min_quantity,
            NEW.has_wholesale,
            NEW.applied_price
        FROM products p
        WHERE p.id = NEW.product_id;
        
        -- Store original product state in metadata
        NEW.metadata = jsonb_build_object(
            'original_price', NEW.unit_price,
            'applied_price', NEW.applied_price,
            'wholesale_applied', NEW.has_wholesale AND NEW.applied_price = NEW.wholesale_price,
            'snapshot_timestamp', now()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrease product stock when order is created
CREATE OR REPLACE FUNCTION public.decrease_product_stock()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- Loop through all order items and decrease stock
    FOR item IN 
        SELECT product_id, quantity 
        FROM order_items 
        WHERE order_id = NEW.id
    LOOP
        UPDATE products 
        SET stock = stock - item.quantity
        WHERE id = item.product_id AND stock >= item.quantity;
        
        -- If stock becomes negative, raise warning (should be handled by application logic)
        IF NOT FOUND THEN
            RAISE WARNING 'Insufficient stock for product %', item.product_id;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to populate shipping_info JSONB from structured columns
CREATE OR REPLACE FUNCTION public.populate_shipping_info()
RETURNS TRIGGER AS $$
BEGIN
    -- Populate shipping_info JSONB for backward compatibility
    NEW.shipping_info = jsonb_build_object(
        'firstName', split_part(NEW.customer_name, ' ', 1),
        'lastName', CASE 
            WHEN split_part(NEW.customer_name, ' ', 2) IS NOT NULL 
            THEN split_part(NEW.customer_name, ' ', 2) 
            ELSE '' 
        END,
        'email', NEW.customer_email,
        'phone', NEW.customer_phone,
        'address', NEW.shipping_address,
        'city', NEW.shipping_city,
        'county', NEW.shipping_county,
        'postalCode', NEW.shipping_postal_code,
        'country', NEW.shipping_country
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER snapshot_product_details_trigger
    BEFORE INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.snapshot_product_details();

CREATE TRIGGER update_orders_updated_at_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER decrease_stock_on_order_trigger
    AFTER INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.status = 'pending' AND NEW.payment_status = 'pending')
    EXECUTE FUNCTION public.decrease_product_stock();

CREATE TRIGGER populate_shipping_info_trigger
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION public.populate_shipping_info();

-- ============ DASHBOARD FUNCTIONS (Updated) ============

-- Function to get dashboard data (Fixed to match new structure)
CREATE OR REPLACE FUNCTION public.get_dashboard_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  total_paid_orders bigint;
  total_pending_orders bigint;
  total_orders bigint;
  total_sales numeric;
  conversion_rate numeric;
  recent_orders_json json;
BEGIN
   -- Check if user is admin
    IF NOT public.verify_admin_access() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

  -- Get total paid orders (all successful statuses)
  SELECT COUNT(*) INTO total_paid_orders
  FROM orders 
  WHERE status IN ('completed', 'delivered', 'shipped') 
     OR payment_status = 'completed';
  
  -- Get total pending orders
  SELECT COUNT(*) INTO total_pending_orders
  FROM orders 
  WHERE status = 'pending' AND payment_status IN ('pending', 'processing');
  
  -- Get total orders count
  SELECT COUNT(*) INTO total_orders FROM orders;
  
  -- Get total sales amount (only from paid/completed orders)
  SELECT COALESCE(SUM(total_amount), 0) INTO total_sales
  FROM orders 
  WHERE status IN ('completed', 'delivered', 'shipped') 
     OR payment_status = 'completed';
  
  -- Calculate conversion rate: paid / (paid + pending)
  IF (total_paid_orders + total_pending_orders) > 0 THEN
    conversion_rate := ROUND(
      (total_paid_orders::numeric / (total_paid_orders + total_pending_orders)::numeric) * 100, 
      2
    );
  ELSE
    conversion_rate := 0;
  END IF;

  -- Get recent orders (fixed to use new structure)
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
      ORDER BY o.created_at DESC
    ),
    '[]'::json
  ) INTO recent_orders_json
  FROM (
    SELECT *
    FROM orders
    ORDER BY created_at DESC
    LIMIT 5
  ) o;

  -- Build the result JSON
  SELECT json_build_object(
    'stats', json_build_object(
      'totalSales', total_sales,
      'totalOrders', total_orders,
      'totalCustomers', (SELECT COUNT(*) FROM users),
      'totalProducts', (SELECT COUNT(*) FROM products),
      'pageViews', COALESCE((SELECT COUNT(*) FROM page_views), 0),
      'conversionRate', conversion_rate,
      'paidOrders', total_paid_orders,
      'pendingOrders', total_pending_orders
    ),
    'recentOrders', recent_orders_json
  )
  INTO result;

  RETURN result;
END;
$$;

-- Function to get all orders (Simplified - uses new structure directly)
CREATE OR REPLACE FUNCTION public.get_all_orders()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
    -- Check if user is admin
    IF NOT public.verify_admin_access() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    SELECT json_agg(order_data ORDER BY order_data->>'date' DESC)
    INTO result
    FROM (
      SELECT json_build_object(
        'id', o.id,
        'orderNumber', o.order_number,
        'customer', o.customer_name,
        'email', o.customer_email,
        'phone', o.customer_phone,
        'date', o.created_at,
        'total', o.total_amount,
        'status', o.status,
        'paymentStatus', o.payment_status,
        'paymentMethod', o.payment_method,
        'items', (
          SELECT COUNT(*) 
          FROM order_items oi 
          WHERE oi.order_id = o.id
        ),
        'wholesaleSavings', o.wholesale_savings,
        'couponDiscount', o.coupon_discount,
        'installationRequired', o.installation_required,
        'shippingMethod', o.shipping_method,
        'city', o.shipping_city
      ) AS order_data
      FROM orders o
    ) sub;

    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Function to get order details (Uses new structure directly)
CREATE OR REPLACE FUNCTION public.get_order_details(order_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Check if user is admin
  IF NOT public.verify_admin_access() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  SELECT json_build_object(
    'id', o.id,
    'orderNumber', o.order_number,
    'customer', json_build_object(
      'name', o.customer_name,
      'email', o.customer_email,
      'phone', o.customer_phone
    ),
    'date', o.created_at,
    'total', o.total_amount,
    'status', o.status,
    'payment', json_build_object(
      'status', o.payment_status,
      'method', o.payment_method,
      'reference', o.payment_reference
    ),
    'tracking', o.tracking_number,
    'shipping', json_build_object(
      'address', o.shipping_address,
      'city', o.shipping_city,
      'county', o.shipping_county,
      'postalCode', o.shipping_postal_code,
      'country', o.shipping_country,
      'method', o.shipping_method,
      'cost', o.shipping_total,
      'estimatedDelivery', o.estimated_delivery
    ),
    'financial', json_build_object(
      'subtotal', o.subtotal,
      'wholesaleSavings', o.wholesale_savings,
      'couponDiscount', o.coupon_discount,
      'installationCost', o.installation_cost,
      'shipping', o.shipping_total,
      'total', o.total_amount,
      'currency', o.currency
    ),
    'installation', CASE 
      WHEN o.installation_required THEN json_build_object(
        'required', true,
        'service', o.installation_service,
        'date', o.installation_date,
        'time', o.installation_time,
        'instructions', o.special_instructions
      )
      ELSE json_build_object('required', false)
    END,
    'coupon', CASE 
      WHEN o.coupon_code IS NOT NULL THEN json_build_object(
        'code', o.coupon_code,
        'discount', o.coupon_discount,
        'data', o.coupon_data
      )
      ELSE NULL
    END,
    'items', (
      SELECT COALESCE(
        json_agg(
          json_build_object(
            'id', oi.id,
            'productId', oi.product_id,
            'title', oi.product_title,
            'sku', oi.product_sku,
            'category', oi.product_category,
            'image', oi.product_image,
            'price', oi.unit_price,
            'appliedPrice', oi.applied_price,
            'wholesalePrice', oi.wholesale_price,
            'hasWholesale', oi.has_wholesale,
            'wholesaleMinQuantity', oi.wholesale_min_quantity,
            'quantity', oi.quantity,
            'total', oi.total_price
          )
        ),
        '[]'::json
      )
      FROM order_items oi
      WHERE oi.order_id = o.id
    ),
    'notes', o.notes,
    'timestamps', json_build_object(
      'created', o.created_at,
      'updated', o.updated_at,
      'paid', o.paid_at,
      'shipped', o.shipped_at,
      'delivered', o.delivered_at
    )
  )
  INTO result
  FROM orders o
  WHERE o.id = order_uuid;

  RETURN result;
END;
$$;

-- Function to get analytics (Fixed column references)
CREATE OR REPLACE FUNCTION public.get_analytics(time_period text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_date timestamptz;
    sales jsonb;
    visits jsonb;
    category jsonb;
    stats jsonb;
    total_orders bigint;
    total_page_views bigint;
    total_sales numeric;
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

    -- Get totals
    SELECT COUNT(*), COALESCE(SUM(total_amount), 0) INTO total_orders, total_sales
    FROM orders
    WHERE created_at >= start_date
      AND status NOT IN ('cancelled');

    SELECT COUNT(*) INTO total_page_views
    FROM page_views
    WHERE created_at >= start_date;

    -- Sales by month
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', month,
        'sales', sales_value
    ) ORDER BY month), '[]'::jsonb)
    INTO sales
    FROM (
        SELECT to_char(created_at, 'Mon') as month,
               SUM(total_amount) as sales_value
        FROM orders
        WHERE created_at >= start_date
          AND status NOT IN ('cancelled')
        GROUP BY to_char(created_at, 'Mon'), date_part('month', created_at)
        ORDER BY date_part('month', created_at)
    ) t;

    -- Page views by month
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', month,
        'visits', visits_count
    ) ORDER BY month), '[]'::jsonb)
    INTO visits
    FROM (
        SELECT to_char(created_at, 'Mon') as month,
               COUNT(*) as visits_count
        FROM page_views
        WHERE created_at >= start_date
        GROUP BY to_char(created_at, 'Mon'), date_part('month', created_at)
        ORDER BY date_part('month', created_at)
    ) t;

    -- Product category distribution
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', category_name,
        'value', qty_sum
    ) ORDER BY qty_sum DESC), '[]'::jsonb)
    INTO category
    FROM (
        SELECT oi.product_category as category_name,
               SUM(oi.quantity) as qty_sum
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.created_at >= start_date
          AND o.status NOT IN ('cancelled')
          AND oi.product_category IS NOT NULL
        GROUP BY oi.product_category
    ) t;

    -- Summary stats
    SELECT jsonb_build_object(
        'totalSales', total_sales,
        'totalOrders', total_orders,
        'totalCustomers', COALESCE(COUNT(DISTINCT user_id), 0),
        'totalProducts', (SELECT COUNT(*) FROM products),
        'pageViews', total_page_views,
        'conversionRate', 
            CASE 
                WHEN total_page_views > 0 
                THEN ROUND((total_orders::numeric / total_page_views::numeric) * 100, 1)
                ELSE 0
            END
    )
    INTO stats
    FROM orders
    WHERE created_at >= start_date
      AND status NOT IN ('cancelled');

    RETURN jsonb_build_object(
        'salesData', sales,
        'visitsData', visits,
        'categoryData', category,
        'stats', stats
    );
END;
$$;

-- RLS Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for order_items (through orders)
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Admin policies
CREATE POLICY "Admins have full access to orders" ON orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Admins have full access to order_items" ON order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'superadmin')
        )
    );

-- Public policies (for guest orders)
CREATE POLICY "Public can insert orders without user_id" ON orders
    FOR INSERT WITH CHECK (user_id IS NULL);

CREATE POLICY "Public can view own orders by email" ON orders
    FOR SELECT USING (
        user_id IS NULL 
        AND customer_email = current_setting('request.jwt.claims', true)::json->>'email'
    );

-- View for quick order summaries
CREATE OR REPLACE VIEW order_summaries AS
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.customer_email,
    o.customer_phone,
    o.shipping_city,
    o.shipping_county,
    o.payment_method,
    o.payment_status,
    o.status,
    o.subtotal,
    o.wholesale_savings,
    o.coupon_discount,
    o.installation_cost,
    o.shipping_total,
    o.total_amount,
    o.currency,
    o.installation_required,
    o.coupon_code,
    o.created_at,
    o.updated_at,
    o.paid_at,
    o.shipped_at,
    o.delivered_at,
    COUNT(oi.id) as item_count,
    SUM(oi.quantity) as total_quantity,
    STRING_AGG(DISTINCT oi.product_category, ', ') as categories
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- Grant access to the view
GRANT SELECT ON order_summaries TO authenticated;

-- Additional helper functions
CREATE OR REPLACE FUNCTION public.get_sales_by_payment_method(start_date timestamptz DEFAULT NULL, end_date timestamptz DEFAULT NULL)
RETURNS TABLE (
    payment_method text,
    order_count bigint,
    total_revenue numeric,
    avg_order_value numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.payment_method,
        COUNT(*) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value
    FROM orders o
    WHERE 
        (start_date IS NULL OR o.created_at >= start_date)
        AND (end_date IS NULL OR o.created_at <= end_date)
        AND o.status NOT IN ('cancelled')
    GROUP BY o.payment_method
    ORDER BY total_revenue DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_installation_stats(start_date timestamptz DEFAULT NULL, end_date timestamptz DEFAULT NULL)
RETURNS TABLE (
    installation_type text,
    order_count bigint,
    total_revenue numeric,
    installation_revenue numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(o.installation_service->>'name', 'No Installation') as installation_type,
        COUNT(*) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(SUM(o.installation_cost), 0) as installation_revenue
    FROM orders o
    WHERE 
        (start_date IS NULL OR o.created_at >= start_date)
        AND (end_date IS NULL OR o.created_at <= end_date)
        AND o.status NOT IN ('cancelled')
    GROUP BY COALESCE(o.installation_service->>'name', 'No Installation')
    ORDER BY order_count DESC;
END;
$$;