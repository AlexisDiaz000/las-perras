-- Migration to update recipes based on user feedback
-- Specifically: Remove 'Queso' from 'La Perra Quesuda'

DO $$
DECLARE
    v_product_id uuid;
    v_queso_id uuid;
BEGIN
    -- 1. Get Product ID for 'La Perra Quesuda'
    SELECT id INTO v_product_id FROM products WHERE name = 'La Perra Quesuda';

    -- 2. Get Inventory ID for 'Queso' (taking the first match if multiple, usually 'Queso Costeño' or similar)
    -- Using ILIKE to match 'Queso', 'Queso Mozzarella', etc.
    SELECT id INTO v_queso_id FROM inventory_items WHERE name ILIKE '%Queso%' LIMIT 1;

    -- 3. Remove the ingredient relationship if both exist
    IF v_product_id IS NOT NULL AND v_queso_id IS NOT NULL THEN
        DELETE FROM product_ingredients 
        WHERE product_id = v_product_id AND inventory_item_id = v_queso_id;
        
        RAISE NOTICE 'Removed Queso from La Perra Quesuda recipe';
    END IF;

END $$;
