-- 1. Create custom types for the RPC parameters
DROP TYPE IF EXISTS public.cart_item_input CASCADE;
CREATE TYPE public.cart_item_input AS (
  product_id UUID,
  quantity INTEGER
);

-- 2. Create the secure RPC function to handle order creation
CREATE OR REPLACE FUNCTION public.crear_pedido_publico(
  p_order_type VARCHAR,
  p_customer_name VARCHAR,
  p_customer_phone VARCHAR,
  p_delivery_address TEXT,
  p_delivery_notes TEXT,
  p_items cart_item_input[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This runs the function with the privileges of the creator (bypassing RLS)
AS $$
DECLARE
  v_sale_id UUID;
  v_total_amount DECIMAL(10,2) := 0;
  v_item cart_item_input;
  v_product_price DECIMAL(10,2);
  v_product_name VARCHAR;
  v_delivery_fee DECIMAL(10,2) := 0;
BEGIN
  -- Validate basic inputs
  IF p_items IS NULL OR array_length(p_items, 1) = 0 THEN
    RAISE EXCEPTION 'El pedido debe tener al menos un producto.';
  END IF;

  IF p_order_type NOT IN ('local', 'delivery') THEN
    RAISE EXCEPTION 'Tipo de pedido no válido.';
  END IF;

  -- Add delivery fee if applicable
  IF p_order_type = 'delivery' THEN
    v_delivery_fee := 5000; -- Fixed delivery fee for now
  END IF;

  -- First, calculate the true total by fetching real prices from the database
  FOREACH v_item IN ARRAY p_items
  LOOP
    SELECT price, name INTO v_product_price, v_product_name
    FROM public.products
    WHERE id = v_item.product_id AND active = true AND show_in_web = true;

    IF v_product_price IS NULL THEN
      RAISE EXCEPTION 'Producto no encontrado o inactivo: %', v_item.product_id;
    END IF;

    v_total_amount := v_total_amount + (v_product_price * v_item.quantity);
  END LOOP;

  -- Add delivery fee to total
  v_total_amount := v_total_amount + v_delivery_fee;

  -- Create the sale record
  INSERT INTO public.sales (
    total_amount,
    status,
    order_type,
    customer_name,
    customer_phone,
    delivery_address,
    delivery_notes
  ) VALUES (
    v_total_amount,
    'pending_approval',
    p_order_type,
    p_customer_name,
    p_customer_phone,
    p_delivery_address,
    p_delivery_notes
  ) RETURNING id INTO v_sale_id;

  -- Insert all items with their real names and prices
  FOREACH v_item IN ARRAY p_items
  LOOP
    SELECT price, name INTO v_product_price, v_product_name
    FROM public.products
    WHERE id = v_item.product_id;

    INSERT INTO public.sale_items (
      sale_id,
      hotdog_type,
      quantity,
      unit_price,
      total_price
    ) VALUES (
      v_sale_id,
      v_product_name,
      v_item.quantity,
      v_product_price,
      v_product_price * v_item.quantity
    );
  END LOOP;

  RETURN v_sale_id;
END;
$$;

-- 3. Re-enable strict RLS on sales and sale_items
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Clean up old public policies
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON public.sales;
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON public.sale_items;

-- Ensure staff can still do their job natively
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.sales;
CREATE POLICY "Enable insert for authenticated users only" ON public.sales
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.sale_items;
CREATE POLICY "Enable insert for authenticated users only" ON public.sale_items
  FOR INSERT TO authenticated
  WITH CHECK (true);
