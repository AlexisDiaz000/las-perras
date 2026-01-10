-- Crear función helper para verificar si el usuario actual es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Evitar recursión en políticas de la tabla users
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
CREATE POLICY "Admin can view all users" ON public.users
  FOR SELECT USING (public.is_admin());

-- Reemplazar chequeos de admin en otras tablas
DROP POLICY IF EXISTS "Only admin can modify inventory" ON public.inventory_items;
CREATE POLICY "Only admin can modify inventory" ON public.inventory_items
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can modify all expenses" ON public.expenses;
CREATE POLICY "Admin can modify all expenses" ON public.expenses
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can create movements" ON public.inventory_movements;
CREATE POLICY "Admin can create movements" ON public.inventory_movements
  FOR INSERT WITH CHECK (public.is_admin());

-- Confirmar emails para usuarios de prueba
UPDATE auth.users SET email_confirmed_at = NOW()
WHERE email IN (
  'admin@lasperras.com',
  'vendedor@lasperras.com',
  'axel.608@hotmail.com'
);
