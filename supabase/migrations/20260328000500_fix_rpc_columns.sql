
-- Update the RPC function to handle modifiers properly and fix column names
CREATE OR REPLACE FUNCTION crear_pedido_publico(
  p_order_type text,
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address text,
  p_delivery_notes text,
  p_items jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id uuid;
  v_total_amount numeric := 0;
  v_item jsonb;
  v_product_price numeric;
  v_product_name text;
BEGIN
  -- Insertar la cabecera de la venta
  INSERT INTO sales (
    order_type,
    customer_name,
    customer_phone,
    delivery_address,
    delivery_notes,
    status,
    total_amount,
    payment_method
  ) VALUES (
    p_order_type,
    p_customer_name,
    p_customer_phone,
    p_delivery_address,
    p_delivery_notes,
    'pending_approval',
    0, -- Se actualiza despues
    'cash'
  ) RETURNING id INTO v_sale_id;

  -- Procesar cada item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Obtener precio y nombre actual del producto
    SELECT price, name INTO v_product_price, v_product_name
    FROM products
    WHERE id = (v_item->>'product_id')::uuid;

    IF v_product_price IS NULL THEN
      RAISE EXCEPTION 'Producto no encontrado: %', v_item->>'product_id';
    END IF;

    -- Insertar el detalle
    INSERT INTO sale_items (
      sale_id,
      hotdog_type,
      quantity,
      unit_price,
      total_price,
      modifiers
    ) VALUES (
      v_sale_id,
      v_product_name,
      (v_item->>'quantity')::numeric,
      v_product_price,
      v_product_price * (v_item->>'quantity')::numeric,
      CASE WHEN v_item->'modifiers' IS NOT NULL AND jsonb_typeof(v_item->'modifiers') != 'null' 
           THEN v_item->'modifiers' 
           ELSE NULL END
    );

    -- Sumar al total
    v_total_amount := v_total_amount + (v_product_price * (v_item->>'quantity')::numeric);
  END LOOP;

  -- Actualizar el total de la venta
  UPDATE sales SET total_amount = v_total_amount WHERE id = v_sale_id;

  RETURN v_sale_id;
END;
$$;
