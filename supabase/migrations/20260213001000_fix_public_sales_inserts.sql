-- Allow anonymous users to insert into sales
DROP POLICY IF EXISTS "Allow anonymous inserts to sales" ON public.sales;

CREATE POLICY "Allow anonymous inserts to sales" ON public.sales
  FOR INSERT TO public
  WITH CHECK (true);

-- Allow anonymous users to insert into sale_items
DROP POLICY IF EXISTS "Allow anonymous inserts to sale_items" ON public.sale_items;

CREATE POLICY "Allow anonymous inserts to sale_items" ON public.sale_items
  FOR INSERT TO public
  WITH CHECK (true);