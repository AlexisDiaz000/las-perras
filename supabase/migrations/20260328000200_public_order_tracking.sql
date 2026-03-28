
-- Permitir lectura anónima de un pedido específico si se conoce el ID
CREATE POLICY "Permitir lectura publica de ventas especificas" ON public.sales
  FOR SELECT USING (true);

CREATE POLICY "Permitir lectura publica de items de venta especificos" ON public.sale_items
  FOR SELECT USING (true);
