-- Actualización masiva de recetas (gramajes estándar)
-- Productos afectados: Perrita, Perrota, Perrísima, La Gran Perra, La Perra Trifásica, La Super Perra, La Perra Quesuda
-- Valores:
-- Queso: 20g (Excepto Quesuda)
-- Papa Fosforito: 20g
-- Cebolla: 15g
-- Salsas (Mostaza, Tomate, Piña, Tartara, Maiz): 8g c/u

DO $$
DECLARE
    -- IDs de Productos
    p_perrita uuid;
    p_perrota uuid;
    p_perrisima uuid;
    p_gran_perra uuid;
    p_trifasica uuid;
    p_super_perra uuid;
    p_quesuda uuid;
    
    -- IDs de Ingredientes
    i_queso uuid;
    i_papa uuid;
    i_cebolla uuid;
    i_mostaza uuid;
    i_tomate uuid;
    i_pina uuid;
    i_tartara uuid;
    i_salsa_maiz uuid;
    
    -- Arrays de control
    products_with_cheese uuid[];
    products_all uuid[];
BEGIN
    -------------------------------------------------------
    -- 1. OBTENER IDs DE PRODUCTOS
    -------------------------------------------------------
    SELECT id INTO p_perrita FROM products WHERE name ILIKE 'Perrita' LIMIT 1;
    SELECT id INTO p_perrota FROM products WHERE name ILIKE 'Perrota' LIMIT 1;
    SELECT id INTO p_perrisima FROM products WHERE name ILIKE 'Perrísima' OR name ILIKE 'Perrisima' LIMIT 1;
    SELECT id INTO p_gran_perra FROM products WHERE name ILIKE 'La Gran Perra' LIMIT 1;
    SELECT id INTO p_trifasica FROM products WHERE name ILIKE '%Trifásica%' OR name ILIKE '%Trifasica%' LIMIT 1;
    SELECT id INTO p_super_perra FROM products WHERE name ILIKE 'La Super Perra' LIMIT 1;
    SELECT id INTO p_quesuda FROM products WHERE name ILIKE 'La Perra Quesuda' LIMIT 1;

    -- Construir listas
    -- Lista 1: Llevan Queso (Todos menos Quesuda)
    products_with_cheese := ARRAY[p_perrita, p_perrota, p_perrisima, p_gran_perra, p_trifasica, p_super_perra];
    -- Lista 2: Llevan Papa, Cebolla y Salsas (Todos incluyendo Quesuda)
    products_all := products_with_cheese || p_quesuda;
    
    -- Limpiar nulos del array (por seguridad)
    -- (Postgres maneja nulos en array_cat, pero al iterar hay que filtrar)

    -------------------------------------------------------
    -- 2. OBTENER IDs DE INGREDIENTES
    -------------------------------------------------------
    -- Buscamos por coincidencia aproximada pero segura
    SELECT id INTO i_queso FROM inventory_items WHERE name ILIKE '%Queso%' AND name NOT ILIKE '%Salsa%' LIMIT 1;
    SELECT id INTO i_papa FROM inventory_items WHERE name ILIKE '%Papa%' AND name ILIKE '%Fosforito%' LIMIT 1;
    SELECT id INTO i_cebolla FROM inventory_items WHERE name ILIKE 'Cebolla%' LIMIT 1; -- Cebolla o Cebolla Cabezona
    
    -- Salsas
    SELECT id INTO i_mostaza FROM inventory_items WHERE name ILIKE '%Mostaza%' LIMIT 1;
    SELECT id INTO i_tomate FROM inventory_items WHERE name ILIKE '%Tomate%' AND name ILIKE '%Salsa%' LIMIT 1;
    SELECT id INTO i_pina FROM inventory_items WHERE name ILIKE '%Piña%' OR name ILIKE '%Pina%' LIMIT 1;
    SELECT id INTO i_tartara FROM inventory_items WHERE name ILIKE '%Tártara%' OR name ILIKE '%Tartara%' LIMIT 1;
    
    -- Salsa de Maíz: Diferenciar de "Maíz Tierno"
    SELECT id INTO i_salsa_maiz FROM inventory_items WHERE (name ILIKE '%Salsa%' AND (name ILIKE '%Maíz%' OR name ILIKE '%Maiz%')) LIMIT 1;

    -------------------------------------------------------
    -- 3. ACTUALIZAR RECETAS (Borrar e Insertar)
    -------------------------------------------------------
    
    -- A) QUESO (20g)
    IF i_queso IS NOT NULL THEN
        -- Eliminar entradas previas de queso para estos productos
        DELETE FROM product_ingredients 
        WHERE inventory_item_id = i_queso 
        AND product_id = ANY(products_with_cheese);
        
        -- Insertar nueva cantidad
        INSERT INTO product_ingredients (product_id, inventory_item_id, quantity)
        SELECT p_id, i_queso, 20
        FROM unnest(products_with_cheese) AS p_id
        WHERE p_id IS NOT NULL;
        
        RAISE NOTICE 'Actualizado Queso (20g) para productos base';
    ELSE
        RAISE NOTICE 'ALERTA: No se encontró item de inventario para Queso';
    END IF;

    -- B) PAPA FOSFORITO (20g)
    IF i_papa IS NOT NULL THEN
        DELETE FROM product_ingredients WHERE inventory_item_id = i_papa AND product_id = ANY(products_all);
        INSERT INTO product_ingredients (product_id, inventory_item_id, quantity)
        SELECT p_id, i_papa, 20 FROM unnest(products_all) AS p_id WHERE p_id IS NOT NULL;
        RAISE NOTICE 'Actualizado Papa Fosforito (20g)';
    ELSE
        RAISE NOTICE 'ALERTA: No se encontró item para Papa Fosforito';
    END IF;

    -- C) CEBOLLA (15g)
    IF i_cebolla IS NOT NULL THEN
        DELETE FROM product_ingredients WHERE inventory_item_id = i_cebolla AND product_id = ANY(products_all);
        INSERT INTO product_ingredients (product_id, inventory_item_id, quantity)
        SELECT p_id, i_cebolla, 15 FROM unnest(products_all) AS p_id WHERE p_id IS NOT NULL;
        RAISE NOTICE 'Actualizado Cebolla (15g)';
    ELSE
        RAISE NOTICE 'ALERTA: No se encontró item para Cebolla';
    END IF;

    -- D) SALSAS (8g)
    
    -- Mostaza
    IF i_mostaza IS NOT NULL THEN
        DELETE FROM product_ingredients WHERE inventory_item_id = i_mostaza AND product_id = ANY(products_all);
        INSERT INTO product_ingredients (product_id, inventory_item_id, quantity)
        SELECT p_id, i_mostaza, 8 FROM unnest(products_all) AS p_id WHERE p_id IS NOT NULL;
    END IF;

    -- Tomate
    IF i_tomate IS NOT NULL THEN
        DELETE FROM product_ingredients WHERE inventory_item_id = i_tomate AND product_id = ANY(products_all);
        INSERT INTO product_ingredients (product_id, inventory_item_id, quantity)
        SELECT p_id, i_tomate, 8 FROM unnest(products_all) AS p_id WHERE p_id IS NOT NULL;
    END IF;

    -- Piña
    IF i_pina IS NOT NULL THEN
        DELETE FROM product_ingredients WHERE inventory_item_id = i_pina AND product_id = ANY(products_all);
        INSERT INTO product_ingredients (product_id, inventory_item_id, quantity)
        SELECT p_id, i_pina, 8 FROM unnest(products_all) AS p_id WHERE p_id IS NOT NULL;
    END IF;

    -- Tartara
    IF i_tartara IS NOT NULL THEN
        DELETE FROM product_ingredients WHERE inventory_item_id = i_tartara AND product_id = ANY(products_all);
        INSERT INTO product_ingredients (product_id, inventory_item_id, quantity)
        SELECT p_id, i_tartara, 8 FROM unnest(products_all) AS p_id WHERE p_id IS NOT NULL;
    END IF;

    -- Salsa de Maíz
    IF i_salsa_maiz IS NOT NULL THEN
        DELETE FROM product_ingredients WHERE inventory_item_id = i_salsa_maiz AND product_id = ANY(products_all);
        INSERT INTO product_ingredients (product_id, inventory_item_id, quantity)
        SELECT p_id, i_salsa_maiz, 8 FROM unnest(products_all) AS p_id WHERE p_id IS NOT NULL;
        RAISE NOTICE 'Actualizado Salsa de Maíz (8g)';
    ELSE
        RAISE NOTICE 'ALERTA: No se encontró item para Salsa de Maíz. Verifique que exista en inventario.';
    END IF;

END $$;
