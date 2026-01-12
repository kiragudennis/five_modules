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
CREATE OR REPLACE FUNCTION public.validate_coupon(
  coupon_code text,
  order_amount numeric,
  customer_email text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  coupon_record coupons%ROWTYPE;
  discount_amount numeric;
  max_discount numeric;
  is_valid boolean := true;
  message text := 'Coupon applied successfully';
BEGIN
  -- Get coupon details
  SELECT * INTO coupon_record 
  FROM coupons 
  WHERE code = coupon_code 
    AND is_active = true 
    AND valid_from <= NOW() 
    AND valid_until >= NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'Invalid or expired coupon code'
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
  IF order_amount < coupon_record.min_order_amount THEN
    RETURN json_build_object(
      'valid', false,
      'message', format('Minimum order amount is KES %s', coupon_record.min_order_amount)
    );
  END IF;
  
  -- Check single use per customer
  IF coupon_record.single_use_per_customer AND customer_email IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM coupon_redemptions cr
      JOIN orders o ON cr.order_id = o.id
      WHERE cr.coupon_id = coupon_record.id
        AND o.shipping_info->>'email' = customer_email
    ) THEN
      RETURN json_build_object(
        'valid', false,
        'message', 'This coupon has already been used by this customer'
      );
    END IF;
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
  
  RETURN json_build_object(
    'valid', true,
    'coupon', json_build_object(
      'id', coupon_record.id,
      'code', coupon_record.code,
      'discount_type', coupon_record.discount_type,
      'discount_value', coupon_record.discount_value,
      'discount_amount', discount_amount,
      'max_discount', coupon_record.max_discount_amount,
      'min_order_amount', coupon_record.min_order_amount
    ),
    'message', message
  );
END;
$$;

-- Function to apply coupon to order
CREATE OR REPLACE FUNCTION public.apply_coupon_to_order(
  order_uuid uuid,
  coupon_code text,
  customer_email text DEFAULT NULL
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
  
  -- Validate coupon
  validation_result := public.validate_coupon(
    coupon_code, 
    order_record.total, 
    customer_email
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
  
  -- Calculate final total
  final_total := order_record.total - discount_amount;
  
  -- Update order with coupon
  UPDATE orders 
  SET 
    total = final_total,
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{coupon}',
      jsonb_build_object(
        'code', coupon_code,
        'discount_amount', discount_amount,
        'original_total', order_record.total
      )
    )
  WHERE id = order_uuid;
  
  -- Record redemption
  INSERT INTO coupon_redemptions (
    coupon_id,
    order_id,
    customer_id,
    discount_applied
  ) VALUES (
    coupon_id,
    order_uuid,
    customer_email,
    discount_amount
  ) RETURNING id INTO redemption_id;
  
  -- Increment coupon usage count
  UPDATE coupons 
  SET used_count = used_count + 1 
  WHERE id = coupon_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Coupon applied successfully',
    'discount_amount', discount_amount,
    'final_total', final_total,
    'redemption_id', redemption_id
  );
END;
$$;

