-- Completely drop and recreate policies to ensure public inserts work
DROP POLICY IF EXISTS "Vendors can create sales" ON public.sales;
DROP POLICY IF EXISTS "Users can create sale movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Allow anonymous inserts to sales" ON public.sales;
DROP POLICY IF EXISTS "Allow anonymous inserts to sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Vendors can insert sale items for own sales" ON public.sale_items;

-- 1. Sales Policies
CREATE POLICY "Enable insert for authenticated users only" ON public.sales
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable insert for anonymous users" ON public.sales
  FOR INSERT TO anon
  WITH CHECK (true);

-- 2. Sale Items Policies
CREATE POLICY "Enable insert for authenticated users only" ON public.sale_items
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable insert for anonymous users" ON public.sale_items
  FOR INSERT TO anon
  WITH CHECK (true);