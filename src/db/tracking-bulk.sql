-- Function to get orders for tracking management
CREATE OR REPLACE FUNCTION public.get_tracking_orders()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.verify_admin_access() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', o.id,
        'order_number', o.id, -- Using UUID as order number
        'customer', json_build_object(
          'name', o.shipping_info->>'firstName' || ' ' || COALESCE(o.shipping_info->>'lastName', ''),
          'email', o.shipping_info->>'email',
          'phone', o.shipping_info->>'phone'
        ),
        'shipping_address', json_build_object(
          'city', o.shipping_info->>'city',
          'state', o.shipping_info->>'state',
          'country', o.shipping_info->>'country'
        ),
        'total', o.total,
        'status', o.status,
        'tracking_number', o.tracking_number,
        'estimated_delivery', o.metadata->>'estimated_delivery',
        'shipping_method', COALESCE(o.metadata->>'shipping_method', 'Standard'),
        'created_at', o.created_at,
        'items_count', (SELECT COUNT(*) FROM order_items WHERE order_id = o.id)
      )
      ORDER BY o.created_at DESC
    )
    FROM orders o
    WHERE o.status IN ('paid', 'shipped', 'delivered')
  );
END;
$$;

-- Function for bulk tracking update
CREATE OR REPLACE FUNCTION public.bulk_update_tracking(
  order_ids uuid[],
  tracking_number text,
  status text,
  shipping_method text DEFAULT 'Standard',
  estimated_delivery date DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.verify_admin_access() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Update orders
  UPDATE orders
  SET 
    tracking_number = tracking_number,
    status = status,
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{shipping_info}',
      jsonb_build_object(
        'shipping_method', shipping_method,
        'estimated_delivery', estimated_delivery,
        'tracking_updated_at', NOW(),
        'tracking_updated_by', current_user
      )
    )
  WHERE id = ANY(order_ids);

  -- Record tracking history
  INSERT INTO tracking_history (order_id, tracking_number, status, shipping_method, estimated_delivery)
  SELECT 
    unnest(order_ids),
    tracking_number,
    status,
    shipping_method,
    estimated_delivery;
END;
$$;

-- Function for bulk status update
CREATE OR REPLACE FUNCTION public.bulk_update_order_status(
  order_ids uuid[],
  new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.verify_admin_access() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  UPDATE orders
  SET status = new_status
  WHERE id = ANY(order_ids);

  -- Record status history
  INSERT INTO order_status_history (order_id, status, changed_at)
  SELECT unnest(order_ids), new_status, NOW();
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
CREATE OR REPLACE FUNCTION public.update_notification_sent(
  order_ids uuid[],
  notification_type text,
  sent_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
  WHERE id = ANY(order_ids);
END;
$$;