-- Update the RPC to remove the hardcoded delivery fee
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
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id UUID;
  v_total_amount DECIMAL(10,2) := 0;
  v_item cart_item_input;
  v_product_price DECIMAL(10,2);
  v_product_name VARCHAR;
BEGIN
  -- Validate basic inputs
  IF p_items IS NULL OR array_length(p_items, 1) = 0 THEN
    RAISE EXCEPTION 'El pedido debe tener al menos un producto.';
  END IF;

  IF p_order_type NOT IN ('local', 'delivery') THEN
    RAISE EXCEPTION 'Tipo de pedido no válido.';
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