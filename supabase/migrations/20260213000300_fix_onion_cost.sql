-- Fix onion cost to $5 per gram (more realistic than $500)
-- This fixes the COGS calculation in Dashboard
UPDATE inventory_items 
SET unit_cost = 5 
WHERE name ILIKE '%Cebolla%';
