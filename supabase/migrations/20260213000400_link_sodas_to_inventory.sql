-- Enlazar productos de venta (Gaseosas) con items de inventario para que descuenten stock y sumen costo
DO $$
DECLARE
    -- Productos de Venta
    p_coca_litro uuid;
    p_coca_personal uuid;
    p_coca_15 uuid;
    
    -- Items de Inventario
    i_coca_litro uuid;
    i_coca_personal uuid;
    i_coca_15 uuid;
BEGIN
    -- 1. Obtener IDs de Productos de Venta
    SELECT id INTO p_coca_litro FROM products WHERE name ILIKE '%CocaCola 1L%' LIMIT 1;
    SELECT id INTO p_coca_personal FROM products WHERE name ILIKE '%CocaCola Personal%' LIMIT 1;
    SELECT id INTO p_coca_15 FROM products WHERE name ILIKE '%CocaCola 1.5L%' LIMIT 1;

    -- 2. Obtener IDs de Items de Inventario
    SELECT id INTO i_coca_litro FROM inventory_items WHERE name ILIKE '%CocaCola 1L%' LIMIT 1;
    SELECT id INTO i_coca_personal FROM inventory_items WHERE name ILIKE '%CocaCola Personal%' LIMIT 1;
    SELECT id INTO i_coca_15 FROM inventory_items WHERE name ILIKE '%CocaCola 1.5L%' LIMIT 1;

    -- 3. Crear relaciones (Ingredientes)
    -- CocaCola 1L
    IF p_coca_litro IS NOT NULL AND i_coca_litro IS NOT NULL THEN
        DELETE FROM product_ingredients WHERE product_id = p_coca_litro AND inventory_item_id = i_coca_litro;
        INSERT INTO product_ingredients (product_id, inventory_item_id, quantity, is_optional)
        VALUES (p_coca_litro, i_coca_litro, 1, false);
        RAISE NOTICE 'Enlazada CocaCola 1L';
    END IF;

    -- CocaCola Personal
    IF p_coca_personal IS NOT NULL AND i_coca_personal IS NOT NULL THEN
        DELETE FROM product_ingredients WHERE product_id = p_coca_personal AND inventory_item_id = i_coca_personal;
        INSERT INTO product_ingredients (product_id, inventory_item_id, quantity, is_optional)
        VALUES (p_coca_personal, i_coca_personal, 1, false);
        RAISE NOTICE 'Enlazada CocaCola Personal';
    END IF;

    -- CocaCola 1.5L
    IF p_coca_15 IS NOT NULL AND i_coca_15 IS NOT NULL THEN
        DELETE FROM product_ingredients WHERE product_id = p_coca_15 AND inventory_item_id = i_coca_15;
        INSERT INTO product_ingredients (product_id, inventory_item_id, quantity, is_optional)
        VALUES (p_coca_15, i_coca_15, 1, false);
        RAISE NOTICE 'Enlazada CocaCola 1.5L';
    END IF;

END $$;
