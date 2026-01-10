-- Vista para items con stock bajo
CREATE OR REPLACE VIEW public.v_inventory_low_stock AS
SELECT id, name, category, unit, current_stock, min_threshold, unit_cost, created_at, updated_at
FROM public.inventory_items
WHERE current_stock <= min_threshold;
