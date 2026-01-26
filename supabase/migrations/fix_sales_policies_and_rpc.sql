-- Correcciones de políticas y función RPC agregada

-- Permitir que administradores actualicen cualquier venta (void/refund/cambios de estado)
DROP POLICY IF EXISTS "Admin can update all sales" ON sales;
CREATE POLICY "Admin can update all sales" ON sales
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Función RPC para agregación de ventas por tipo de perro
DROP FUNCTION IF EXISTS get_sales_by_hotdog_type(date, date);
CREATE OR REPLACE FUNCTION get_sales_by_hotdog_type(start_date DATE, end_date DATE)
RETURNS TABLE(hotdog_type TEXT, total NUMERIC, count INTEGER)
LANGUAGE sql
AS $$
  SELECT si.hotdog_type,
         SUM(si.total_price) AS total,
         SUM(si.quantity) AS count
  FROM sale_items si
  JOIN sales s ON s.id = si.sale_id
  WHERE s.created_at::date >= start_date
    AND s.created_at::date <= end_date
  GROUP BY si.hotdog_type
  ORDER BY total DESC;
$$;

