-- Habilitar DELETE para administradores o usuarios autenticados
-- para permitir el Hard Reset de la base de datos durante el desarrollo/pruebas.

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON inventory_movements;
CREATE POLICY "Enable delete for authenticated users" ON inventory_movements
  FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON sales;
CREATE POLICY "Enable delete for authenticated users" ON sales
  FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON sale_items;
CREATE POLICY "Enable delete for authenticated users" ON sale_items
  FOR DELETE USING (auth.role() = 'authenticated');
