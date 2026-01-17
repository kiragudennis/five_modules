-- Coupons table
CREATE TABLE coupons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value numeric(10, 2) NOT NULL,
    min_order_amount numeric(10, 2) DEFAULT 0,
    max_discount_amount numeric(10, 2),
    valid_from timestamptz DEFAULT now(),
    valid_until timestamptz,
    usage_limit integer,
    used_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    applicable_categories text[] DEFAULT '{}',
    excluded_products text[] DEFAULT '{}',
    single_use_per_customer boolean DEFAULT false,
    description text,
    created_at timestamptz DEFAULT now()
);

-- Coupon usage tracking
CREATE TABLE coupon_redemptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id uuid REFERENCES coupons(id) ON DELETE CASCADE,
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    customer_id text,
    discount_applied numeric(10, 2) NOT NULL,
    redeemed_at timestamptz DEFAULT now()
);

-- Function to validate coupon at checkout
-- Function to validate coupon at checkout (Updated for new schema)
-- Drop and recreate the validate_coupon function with explicit column names
-- Drop and recreate the validate_coupon function without currency reference
DROP FUNCTION IF EXISTS public.validate_coupon(text, numeric, text);

CREATE OR REPLACE FUNCTION public.validate_coupon(
  coupon_code text,
  order_amount numeric,
  customer_email_param text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  coupon_record coupons%ROWTYPE;
  discount_amount numeric;
  is_valid boolean := true;
  message text := 'Coupon applied successfully';
BEGIN
  -- Get coupon details
  SELECT * INTO coupon_record 
  FROM coupons 
  WHERE code = coupon_code 
    AND is_active = true 
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW());
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'Invalid or expired coupon code'
    );
  END IF;
  
  -- Check if coupon is active
  IF NOT coupon_record.is_active THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'This coupon is no longer active'
    );
  END IF;
  
  -- Check usage limit
  IF coupon_record.usage_limit IS NOT NULL 
    AND coupon_record.used_count >= coupon_record.usage_limit THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'Coupon usage limit reached'
    );
  END IF;
  
  -- Check minimum order amount
  IF coupon_record.min_order_amount > 0 
    AND order_amount < coupon_record.min_order_amount THEN
    RETURN json_build_object(
      'valid', false,
      'message', format('Minimum order amount is KES %s', coupon_record.min_order_amount)
    );
  END IF;
  
  -- Check single use per customer
  IF coupon_record.single_use_per_customer AND customer_email_param IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM coupon_redemptions cr
      JOIN orders o ON cr.order_id = o.id
      WHERE cr.coupon_id = coupon_record.id
        AND o.customer_email = customer_email_param
        AND o.status NOT IN ('cancelled', 'refunded')
    ) THEN
      RETURN json_build_object(
        'valid', false,
        'message', 'This coupon has already been used by this customer'
      );
    END IF;
  END IF;
  
  -- Check if coupon is restricted to specific products
  IF coupon_record.applicable_categories IS NOT NULL 
    AND array_length(coupon_record.applicable_categories, 1) > 0 THEN
    -- This would require additional logic if you implement product restrictions
    -- For now, we'll assume it's valid
    NULL;
  END IF;
  
  -- Calculate discount
  IF coupon_record.discount_type = 'percentage' THEN
    discount_amount := (order_amount * coupon_record.discount_value / 100);
    IF coupon_record.max_discount_amount IS NOT NULL 
      AND discount_amount > coupon_record.max_discount_amount THEN
      discount_amount := coupon_record.max_discount_amount;
    END IF;
  ELSE
    discount_amount := coupon_record.discount_value;
  END IF;
  
  -- Ensure discount doesn't exceed order amount
  IF discount_amount > order_amount THEN
    discount_amount := order_amount;
  END IF;
  
  -- Round to 2 decimal places
  discount_amount := ROUND(discount_amount, 2);
  
  RETURN json_build_object(
    'valid', true,
    'coupon', json_build_object(
      'id', coupon_record.id,
      'code', coupon_record.code,
      'discount_type', coupon_record.discount_type,
      'discount_value', coupon_record.discount_value,
      'discount_amount', discount_amount,
      'max_discount_amount', coupon_record.max_discount_amount,
      'min_order_amount', coupon_record.min_order_amount,
      'single_use_per_customer', coupon_record.single_use_per_customer
    ),
    'message', message
  );
END;
$$;

-- Function to apply coupon to order
-- Function to apply coupon to order (Updated for new schema)
-- Drop and recreate apply_coupon_to_order function
-- Drop and recreate apply_coupon_to_order function
DROP FUNCTION IF EXISTS public.apply_coupon_to_order(uuid, text, text);

CREATE OR REPLACE FUNCTION public.apply_coupon_to_order(
  order_uuid uuid,
  coupon_code text,
  customer_email_param text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record orders%ROWTYPE;
  validation_result json;
  coupon_id uuid;
  discount_amount numeric;
  final_total numeric;
  redemption_id uuid;
BEGIN
  -- Get order details
  SELECT * INTO order_record FROM orders WHERE id = order_uuid;
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Order not found'
    );
  END IF;
  
  -- Check if order already has a coupon
  IF order_record.coupon_code IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Order already has a coupon applied'
    );
  END IF;
  
  -- Check if order is eligible for coupon (not cancelled)
  IF order_record.status = 'cancelled' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Cannot apply coupon to cancelled order'
    );
  END IF;
  
  -- Use customer_email from order if not provided
  IF customer_email_param IS NULL THEN
    customer_email_param := order_record.customer_email;
  END IF;
  
  -- Validate coupon
  validation_result := public.validate_coupon(
    coupon_code, 
    order_record.total_amount, 
    customer_email_param
  );
  
  IF (validation_result->>'valid')::boolean = false THEN
    RETURN json_build_object(
      'success', false,
      'message', validation_result->>'message'
    );
  END IF;
  
  -- Extract coupon info
  coupon_id := (validation_result->'coupon'->>'id')::uuid;
  discount_amount := (validation_result->'coupon'->>'discount_amount')::numeric;
  
  -- Calculate final total (ensuring it doesn't go negative)
  final_total := GREATEST(0, order_record.total_amount - discount_amount);
  
  -- Update order with coupon
  UPDATE orders 
  SET 
    coupon_code = coupon_code,
    coupon_discount = discount_amount,
    total_amount = final_total,
    coupon_data = jsonb_build_object(
      'applied_at', NOW(),
      'discount_amount', discount_amount,
      'original_total', order_record.total_amount,
      'coupon_details', validation_result->'coupon'
    ),
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{coupon_applied}',
      jsonb_build_object(
        'coupon_code', coupon_code,
        'discount_amount', discount_amount,
        'applied_at', NOW(),
        'applied_by', CASE 
          WHEN auth.uid() IS NOT NULL THEN 'user:' || auth.uid()::text
          ELSE 'system'
        END
      )
    ),
    updated_at = NOW()
  WHERE id = order_uuid;
  
  -- Record redemption (update your coupon_redemptions table if needed)
  -- First, check if the table has the new columns
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coupon_redemptions' 
    AND column_name = 'customer_email'
  ) THEN
    -- Insert with new columns
    INSERT INTO coupon_redemptions (
      coupon_id,
      order_id,
      customer_id,
      customer_email,
      discount_applied,
      order_total_before,
      order_total_after
    ) VALUES (
      coupon_id,
      order_uuid,
      COALESCE(order_record.user_id::text, 'guest'),
      customer_email_param,
      discount_amount,
      order_record.total_amount,
      final_total
    ) RETURNING id INTO redemption_id;
  ELSE
    -- Insert without new columns (backward compatible)
    INSERT INTO coupon_redemptions (
      coupon_id,
      order_id,
      customer_id,
      discount_applied
    ) VALUES (
      coupon_id,
      order_uuid,
      COALESCE(order_record.user_id::text, 'guest'),
      discount_amount
    ) RETURNING id INTO redemption_id;
  END IF;
  
  -- Increment coupon usage count
  UPDATE coupons 
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE id = coupon_id;
  
  -- Get updated order to return
  SELECT * INTO order_record FROM orders WHERE id = order_uuid;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Coupon applied successfully',
    'order_id', order_uuid,
    'coupon_code', coupon_code,
    'discount_amount', discount_amount,
    'original_total', order_record.total_amount + discount_amount,
    'final_total', final_total,
    'currency', order_record.currency,
    'redemption_id', redemption_id,
    'coupon_data', validation_result->'coupon'
  );
END;
$$;

-- Drop and recreate validate_coupon_only function
DROP FUNCTION IF EXISTS public.validate_coupon_only(text, numeric, text);

CREATE OR REPLACE FUNCTION public.validate_coupon_only(
  coupon_code text,
  order_amount numeric,
  customer_email_param text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simply call the existing validate_coupon function
  RETURN public.validate_coupon(coupon_code, order_amount, customer_email_param);
END;
$$;

-- Function to remove coupon from order
CREATE OR REPLACE FUNCTION public.remove_coupon_from_order(
  order_uuid uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record orders%ROWTYPE;
  discount_amount numeric;
  original_total numeric;
BEGIN
  -- Get order details
  SELECT * INTO order_record FROM orders WHERE id = order_uuid;
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Order not found'
    );
  END IF;
  
  -- Check if order has a coupon
  IF order_record.coupon_code IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No coupon applied to this order'
    );
  END IF;
  
  discount_amount := order_record.coupon_discount;
  original_total := order_record.total_amount + discount_amount;
  
  -- Update order to remove coupon
  UPDATE orders 
  SET 
    coupon_code = NULL,
    coupon_discount = 0,
    total_amount = original_total,
    coupon_data = NULL,
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{coupon_removed}',
      jsonb_build_object(
        'removed_at', NOW(),
        'removed_by', CASE 
          WHEN auth.uid() IS NOT NULL THEN 'user:' || auth.uid()::text
          ELSE 'system'
        END,
        'discount_amount', discount_amount
      )
    ),
    updated_at = NOW()
  WHERE id = order_uuid;
  
  -- Decrement coupon usage count
  IF order_record.coupon_code IS NOT NULL THEN
    UPDATE coupons 
    SET used_count = GREATEST(0, used_count - 1),
        updated_at = NOW()
    WHERE code = order_record.coupon_code;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Coupon removed successfully',
    'order_id', order_uuid,
    'removed_coupon', order_record.coupon_code,
    'discount_removed', discount_amount,
    'new_total', original_total,
    'currency', order_record.currency
  );
END;
$$;

CREATE POLICY "Admin full access to coupons"
ON coupons
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "Public can view active coupons"
ON coupons
FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  AND valid_from <= now()
  AND (valid_until IS NULL OR valid_until >= now())
);

CREATE POLICY "Admin full access to coupon redemptions"
ON coupon_redemptions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
  )
);
