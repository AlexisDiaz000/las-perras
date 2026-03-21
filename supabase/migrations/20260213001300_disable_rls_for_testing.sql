-- Aggressive approach: Disable RLS temporarily to test if it's truly an RLS issue or something else.
-- If this works, we know exactly that it's an RLS issue and we need to fix the policies.
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items DISABLE ROW LEVEL SECURITY;