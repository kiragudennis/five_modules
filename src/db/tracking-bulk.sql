DROP FUNCTION bulk_update_order_status(uuid[],text);
DROP FUNCTION update_notification_sent(uuid[],text,timestamp with time zone);

-- Update verify_admin_access to accept user_id parameter
CREATE OR REPLACE FUNCTION public.verify_admin_function_access(user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = COALESCE(user_id, auth.uid()) 
        AND role IN ('admin', 'superadmin')
    );
END;
$$;

-- Function to get orders for tracking management
-- Function to get orders for tracking management (Updated for new schema)
CREATE OR REPLACE FUNCTION public.get_tracking_orders()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
BEGIN
  -- Get user ID first
  current_user_id := auth.uid();
  -- Check if user is admin
  IF NOT public.verify_admin_function_access(current_user_id) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', o.id,
        'order_number', o.order_number,
        'customer', json_build_object(
          'name', o.customer_name,
          'email', o.customer_email,
          'phone', o.customer_phone
        ),
        'shipping_address', json_build_object(
          'address', o.shipping_address,
          'city', o.shipping_city,
          'county', o.shipping_county,
          'postal_code', o.shipping_postal_code,
          'country', o.shipping_country
        ),
        'total', o.total_amount,
        'currency', o.currency,
        'status', o.status,
        'payment_status', o.payment_status,
        'payment_method', o.payment_method,
        'tracking_number', o.tracking_number,
        'estimated_delivery', o.estimated_delivery,
        'shipping_method', o.shipping_method,
        'shipping_cost', o.shipping_total,
        'created_at', o.created_at,
        'items_count', (
          SELECT COUNT(*) 
          FROM order_items 
          WHERE order_id = o.id
        ),
        'items_quantity', (
          SELECT SUM(quantity) 
          FROM order_items 
          WHERE order_id = o.id
        ),
        'wholesale_applied', (o.wholesale_savings > 0),
        'installation_required', o.installation_required,
        'coupon_applied', (o.coupon_discount > 0)
      )
      ORDER BY o.created_at DESC
    )
    FROM orders o
    WHERE o.tracking_number IS NOT NULL  -- Only orders WITH tracking numbers
  );
END;
$$;

-- Function for bulk tracking update
-- Function for bulk tracking update (Updated for new schema)
CREATE OR REPLACE FUNCTION public.bulk_update_tracking(
  order_ids uuid[],
  tracking_number text,
  status text DEFAULT 'shipped',
  shipping_method text DEFAULT NULL,
  estimated_delivery text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
  order_record RECORD;
  notification_data json;
  current_user_id uuid;
BEGIN
  -- Get user ID first
  current_user_id := auth.uid();
  -- Check if user is admin
  IF NOT public.verify_admin_function_access(current_user_id) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Update orders
  UPDATE orders
  SET 
    tracking_number = tracking_number,
    status = status,
    shipped_at = CASE 
      WHEN status = 'shipped' AND shipped_at IS NULL THEN NOW()
      ELSE shipped_at
    END,
    shipping_method = COALESCE(shipping_method, shipping_method),
    estimated_delivery = COALESCE(estimated_delivery, estimated_delivery),
    updated_at = NOW(),
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{tracking_updates}',
      COALESCE(metadata->'tracking_updates', '[]'::jsonb) || 
      jsonb_build_array(jsonb_build_object(
        'tracking_number', tracking_number,
        'status', status,
        'shipping_method', shipping_method,
        'estimated_delivery', estimated_delivery,
        'updated_at', NOW(),
        'updated_by', current_user
      ))
    )
  WHERE id = ANY(order_ids)
    AND status IN ('pending', 'processing', 'paid') -- Only update if not already shipped/delivered
  RETURNING COUNT(*) INTO updated_count;

  -- Record tracking history
  INSERT INTO tracking_history (order_id, tracking_number, status, shipping_method, estimated_delivery)
  SELECT 
    unnest(order_ids),
    tracking_number,
    status,
    shipping_method,
    estimated_delivery::date;

  -- Prepare notification data for each updated order
  SELECT json_agg(
    json_build_object(
      'order_id', o.id,
      'order_number', o.order_number,
      'customer_name', o.customer_name,
      'customer_email', o.customer_email,
      'customer_phone', o.customer_phone,
      'tracking_number', tracking_number,
      'status', status,
      'shipping_method', shipping_method,
      'estimated_delivery', estimated_delivery
    )
  ) INTO notification_data
  FROM orders o
  WHERE o.id = ANY(order_ids);

  RETURN json_build_object(
    'success', true,
    'updated_count', updated_count,
    'tracking_number', tracking_number,
    'status', status,
    'notification_data', notification_data
  );
END;
$$;

-- Function for bulk status update
-- Function for bulk status update (Updated for new schema)
CREATE OR REPLACE FUNCTION public.bulk_update_order_status(
  order_ids uuid[],
  new_status text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
  order_record RECORD;
  valid_statuses text[] := ARRAY['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'completed'];
  current_user_id uuid;
BEGIN
  -- Get user ID first
  current_user_id := auth.uid();
  -- Check if user is admin
  IF NOT public.verify_admin_function_access(current_user_id) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Validate status
  IF NOT new_status = ANY(valid_statuses) THEN
    RAISE EXCEPTION 'Invalid status: %', new_status;
  END IF;

  -- Update orders with status-specific timestamps
  UPDATE orders
  SET 
    status = new_status,
    updated_at = NOW(),
    shipped_at = CASE 
      WHEN new_status = 'shipped' AND shipped_at IS NULL THEN NOW()
      ELSE shipped_at
    END,
    delivered_at = CASE 
      WHEN new_status = 'delivered' AND delivered_at IS NULL THEN NOW()
      ELSE delivered_at
    END,
    paid_at = CASE 
      WHEN new_status = 'completed' AND payment_status = 'completed' AND paid_at IS NULL THEN NOW()
      ELSE paid_at
    END,
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{status_updates}',
      COALESCE(metadata->'status_updates', '[]'::jsonb) || 
      jsonb_build_array(jsonb_build_object(
        'from', status,
        'to', new_status,
        'at', NOW(),
        'by', current_user
      ))
    )
  WHERE id = ANY(order_ids)
  RETURNING COUNT(*) INTO updated_count;

  -- Record status history
  INSERT INTO order_status_history (order_id, status, changed_by)
  SELECT unnest(order_ids), new_status, current_user;

  RETURN json_build_object(
    'success', true,
    'updated_count', updated_count,
    'new_status', new_status
  );
END;
$$;

-- Create tracking_history table
CREATE TABLE IF NOT EXISTS tracking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number text NOT NULL,
  status text NOT NULL,
  shipping_method text,
  estimated_delivery date,
  carrier text,
  created_at timestamptz DEFAULT now()
);

-- Create order_status_history table
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_at timestamptz DEFAULT now(),
  changed_by text
);

-- Function to update notification sent status
-- Function to update notification sent status (Updated for new schema)
CREATE OR REPLACE FUNCTION public.update_notification_sent(
  order_ids uuid[],
  notification_type text,
  sent_at timestamptz DEFAULT NOW()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
  current_user_id uuid;
BEGIN
  -- Get user ID first
  current_user_id := auth.uid();
  -- Check if user is admin
  IF NOT public.verify_admin_function_access(current_user_id) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Update orders metadata with notification info
  UPDATE orders
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{notifications}',
    COALESCE(metadata->'notifications', '[]'::jsonb) || 
    jsonb_build_array(jsonb_build_object(
      'type', notification_type,
      'sent_at', sent_at,
      'status', 'sent'
    ))
  )
  WHERE id = ANY(order_ids)
  RETURNING COUNT(*) INTO updated_count;

  RETURN json_build_object(
    'success', true,
    'updated_count', updated_count,
    'notification_type', notification_type
  );
END;
$$;

-- Function to update notification sent status (Updated for new schema)
CREATE OR REPLACE FUNCTION public.update_notification_sent(
  order_ids uuid[],
  notification_type text,
  sent_at timestamptz DEFAULT NOW()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
  current_user_id uuid;
BEGIN
  -- Get user ID first
  current_user_id := auth.uid();
  -- Check if user is admin
  IF NOT public.verify_admin_function_access(current_user_id) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Update orders metadata with notification info
  UPDATE orders
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{notifications}',
    COALESCE(metadata->'notifications', '[]'::jsonb) || 
    jsonb_build_array(jsonb_build_object(
      'type', notification_type,
      'sent_at', sent_at,
      'status', 'sent'
    ))
  )
  WHERE id = ANY(order_ids)
  RETURNING COUNT(*) INTO updated_count;

  RETURN json_build_object(
    'success', true,
    'updated_count', updated_count,
    'notification_type', notification_type
  );
END;
$$;

-- Function to get orders ready for shipping labels
CREATE OR REPLACE FUNCTION public.get_orders_for_shipping()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get user ID first
  current_user_id := auth.uid();
  -- Check if user is admin
  IF NOT public.verify_admin_function_access(current_user_id) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', o.id,
        'order_number', o.order_number,
        'customer_name', o.customer_name,
        'customer_phone', o.customer_phone,
        'shipping_address', o.shipping_address,
        'shipping_city', o.shipping_city,
        'shipping_county', o.shipping_county,
        'shipping_postal_code', o.shipping_postal_code,
        'shipping_country', o.shipping_country,
        'shipping_method', o.shipping_method,
        'items', (
          SELECT json_agg(
            json_build_object(
              'name', oi.product_name,
              'title', oi.product_title,
              'quantity', oi.quantity,
              'weight', COALESCE(oi.metadata->>'weight', '0.5') -- Assuming weight in metadata
            )
          )
          FROM order_items oi
          WHERE oi.order_id = o.id
        ),
        'status', o.status,
        'payment_status', o.payment_status,
        'requires_signature', o.installation_required, -- Installation orders might need signature
        'special_instructions', o.special_instructions,
        'created_at', o.created_at
      )
      ORDER BY 
        CASE o.shipping_method
          WHEN 'express' THEN 1
          WHEN 'standard' THEN 2
          WHEN 'pickup' THEN 3
          ELSE 4
        END,
        o.created_at
    )
    FROM orders o
    WHERE o.status IN ('processing', 'paid')
      AND o.payment_status = 'completed'
      AND o.tracking_number IS NULL -- Only orders without tracking
  );
END;
$$;